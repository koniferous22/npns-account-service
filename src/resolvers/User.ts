import { classToPlain, plainToClass } from 'class-transformer';
import { randomBytes } from 'crypto';
import { Tedis } from 'tedis';
import {
  Query,
  Arg,
  Resolver,
  Ctx,
  Field,
  Mutation,
  ObjectType,
  Args,
  Authorized,
  UseMiddleware
} from 'type-graphql';
import jwt from 'jsonwebtoken';
import { hashSync, genSaltSync, compare } from 'bcrypt';
import { getConfig } from '../config';
import { AccountServiceContext } from '../context';
import { PendingOperation, User } from '../entities/User';
import { sendMail } from '../external/nodemailer';
import { SignInUserContract, SignUpUserContract } from '../utils/inputTypes';
import {
  CacheCreateTokenError,
  NodemailerError,
  UserAlreadyVerifiedError,
  UserNotFoundError,
  WrongPasswordError
} from '../utils/exceptions';
import { BasePayload } from './BasePayload';
import { ValidatePasswordArgGuard } from '../middlewares/ValidatePasswordArgGuard';
import { FindUserByIdentifierArgs, ChangeAliasArgs } from '../utils/args';

@ObjectType({ implements: BasePayload })
class SignUpUserPayload implements BasePayload {
  message!: string;
  @Field(() => User)
  createdUser!: User;
}

@ObjectType({ implements: BasePayload })
class ResendSignUpTokenPaylod implements BasePayload {
  message!: string;
}

@ObjectType({ implements: BasePayload })
class SignInUserPayload implements BasePayload {
  message!: string;
  @Field()
  token!: string;
  @Field(() => User)
  user!: User;
}

@ObjectType({ implements: BasePayload })
class RequestPasswordResetPayload implements BasePayload {
  message!: string;
}

@ObjectType({ implements: BasePayload })
class RequestEmailChangePayload implements BasePayload {
  message!: string;
}

@ObjectType({ implements: BasePayload })
class ChangeAliasPayload implements BasePayload {
  message!: string;
}

@Resolver(() => User)
export class UserResolver {
  private async createUserToken(
    cache: Tedis,
    userId: string,
    verificationTokenConfig: ReturnType<typeof getConfig>['verificationToken'],
    payload?: string | undefined
  ) {
    const token = randomBytes(16).toString('hex');
    await cache.hmset(
      userId,
      payload
        ? {
            token,
            payload
          }
        : {
            token
          }
    );
    try {
      await cache.set(token, userId);
    } catch (e) {
      await cache.del(userId);
      throw e;
    }
    // await cache.set(userId, token);
    await cache.expire(userId, verificationTokenConfig.expirationTime);
    return token;
  }

  private async cleanupUserToken(cache: Tedis, userId: string) {
    const foundToken = (await cache.hmget(userId, 'token'))[0];
    if (foundToken) {
      await cache.del(foundToken);
    }
    await cache.del(userId);
  }

  @Query(() => User)
  userById(@Arg('id') id: string, @Ctx() ctx: AccountServiceContext) {
    return ctx.em.getRepository(User).findOneOrFail({ id });
  }

  @Query(() => User)
  userByIdentifier(
    @Arg('identifier') identifier: string,
    @Ctx() ctx: AccountServiceContext
  ) {
    return ctx.em.getRepository(User).findOneOrFail({
      where: [{ username: identifier }, { email: identifier }]
    });
  }

  @Mutation(() => SignUpUserPayload)
  async signUpUser(
    @Arg('input') input: SignUpUserContract,
    @Ctx() ctx: AccountServiceContext
  ) {
    const userRepo = ctx.em.getRepository(User);
    const userPlainObj = classToPlain(input);
    const newUser = userRepo.create({
      ...userPlainObj,
      password: hashSync(userPlainObj.password, genSaltSync(8))
    });
    // STEP 1: save user
    await userRepo.save(newUser);

    // STEP 2: create verificationToken token
    let token: string;
    try {
      token = await this.createUserToken(
        ctx.verificationTokenCache,
        newUser.id,
        ctx.config.verificationToken
      );
    } catch (e) {
      // rollback user creation
      await userRepo.remove(newUser);
      throw new CacheCreateTokenError(
        newUser.username,
        PendingOperation.SIGN_UP
      );
    }

    // STEP 3: send confirmation email
    try {
      await sendMail(newUser.email, 'signUpTemplate', token);
    } catch (e) {
      await userRepo.remove(newUser);
      await this.cleanupUserToken(ctx.verificationTokenCache, newUser.id);
      throw new NodemailerError(newUser.email, 'signUpTemplate');
    }
    return plainToClass(SignUpUserPayload, {
      message: `User "${newUser.username}" created`,
      createdUser: newUser
    });
  }

  @Authorized()
  @Mutation(() => ResendSignUpTokenPaylod)
  async resendUserSignUp(@Ctx() ctx: AccountServiceContext) {
    // TODO authorized decorator solves it
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const user = ctx.user!.data;
    if (user.pendingOperation !== PendingOperation.SIGN_UP) {
      throw new UserAlreadyVerifiedError(user.username);
    }
    await this.cleanupUserToken(ctx.verificationTokenCache, user.id);

    let token: string;
    try {
      token = await this.createUserToken(
        ctx.verificationTokenCache,
        user.id,
        ctx.config.verificationToken
      );
    } catch (e) {
      throw new CacheCreateTokenError(user.username, PendingOperation.SIGN_UP);
    }

    try {
      await sendMail(user.email, 'signUpTemplate', token);
    } catch (e) {
      await this.cleanupUserToken(ctx.verificationTokenCache, user.id);
      throw new NodemailerError(user.email, 'signUpTemplate');
    }
    return plainToClass(SignUpUserPayload, {
      message: `Confirmation email resent to "${user.email}"` // ,
      // createdUser: user
    });
  }

  @Mutation(() => SignInUserPayload)
  async signInUser(
    @Arg('input') input: SignInUserContract,
    @Ctx() ctx: AccountServiceContext
  ) {
    const user = await ctx.em.findOne(User, {
      where: [{ username: input.identifier }, { email: input.identifier }]
    });
    if (!user) {
      throw new UserNotFoundError(input.identifier);
    }
    if (!compare(user.password, input.password)) {
      throw new WrongPasswordError();
    }
    const jwtConfig = ctx.config.jwt;
    const token = jwt.sign(
      {
        data: {
          ...user,
          // ! removing sensitive stuff from JWT
          pendingOperation: undefined,
          password: undefined
        }
      },
      // NOTE should be validated by config custom runtime validation
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      jwtConfig.secret!,
      {
        algorithm: jwtConfig.algorithm
      }
    );
    return plainToClass(SignInUserPayload, {
      message: 'Logged in',
      user,
      token
    });
  }

  @Mutation(() => RequestPasswordResetPayload)
  async requestPasswordReset(
    @Args() args: FindUserByIdentifierArgs,
    @Ctx() ctx: AccountServiceContext
  ) {
    const user = await ctx.em.findOne(User, {
      where: [{ username: args.identifier }, { email: args.identifier }]
    });
    if (!user) {
      throw new UserNotFoundError(args.identifier);
    }

    user.pendingOperation = PendingOperation.RESET_PASSWORD;
    await ctx.em.getRepository(User).save(user);

    let token: string;
    try {
      token = await this.createUserToken(
        ctx.verificationTokenCache,
        user.id,
        ctx.config.verificationToken
      );
    } catch (e) {
      // rollback user creation
      throw new CacheCreateTokenError(
        args.identifier,
        PendingOperation.RESET_PASSWORD
      );
    }
    try {
      await sendMail(user.email, 'pwdResetTemplate', token);
    } catch (e) {
      await ctx.verificationTokenCache.del(user.id);
      throw new NodemailerError(user.email, 'pwdResetTemplate');
    }
    return plainToClass(RequestPasswordResetPayload, {
      message: 'Password request reset sent'
    });
  }

  @Authorized()
  @UseMiddleware(ValidatePasswordArgGuard)
  @Mutation(() => ChangeAliasPayload)
  async changeAlias(
    @Args() args: ChangeAliasArgs,
    @Ctx() ctx: AccountServiceContext
  ) {
    const userRepo = ctx.em.getRepository(User);
    // NOTE authorized decorator should solve it
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const user = ctx.user!.data;
    const oldAlias = user.alias;
    user.alias = args.newAlias;
    await userRepo.save(user);
    try {
      await sendMail(
        user.email,
        'notificationUsernameChangedTemplate',
        oldAlias ?? null,
        args.newAlias
      );
    } catch (e) {
      user.alias = oldAlias;
      await userRepo.save(user);
      throw new NodemailerError(
        user.email,
        'notificationUsernameChangedTemplate'
      );
    }
    return plainToClass(ChangeAliasPayload, {
      message: oldAlias
        ? `Alias updated from "${oldAlias}" to "${user.alias}`
        : `Alias set to "${user.alias}"`
    });
  }
}
