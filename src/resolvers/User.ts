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
  ArgsType,
  Args
} from 'type-graphql';
import jwt from 'jsonwebtoken';
import { hashSync, genSaltSync, compare } from 'bcrypt';
import { IsString } from 'class-validator';
import { getConfig } from '../config';
import { AccountServiceContext } from '../context';
import { PendingOperation, User } from '../entities/User';
import { sendMail } from '../external/nodemailer';
import { SignInUserContract, SignUpUserContract } from '../utils/contracts';
import {
  CacheCreateTokenError,
  NodemailerError,
  UserNotFoundError,
  WrongPasswordError
} from '../utils/exceptions';
import { BasePayload } from './BasePayload';

@ObjectType({ implements: BasePayload })
class SignUpUserPayload implements BasePayload {
  message!: string;
  @Field(() => User)
  createdUser!: User;
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
class ResetPasswordPayload implements BasePayload {
  message!: string;
}

@ArgsType()
class FindUserByIdentifierInput {
  @Field()
  @IsString()
  identifier!: string;
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
    // await cache.set(userId, token);
    await cache.expire(userId, verificationTokenConfig.expirationTime);
    return token;
  }

  @Query(() => User)
  userById(@Arg('id') id: string, @Ctx() ctx: AccountServiceContext) {
    // TODO validate user not found
    return ctx.em.getRepository(User).findOneOrFail({ id });
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
      // TODO redis error over here during cleanup
      await ctx.verificationTokenCache.del(newUser.id);
      throw new NodemailerError(newUser.email, 'signUpTemplate');
    }
    return plainToClass(SignUpUserPayload, {
      message: `User "${newUser.username}" created`,
      createdUser: newUser
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

  @Mutation(() => ResetPasswordPayload)
  async requestPasswordReset(
    @Args() args: FindUserByIdentifierInput,
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
    return plainToClass(ResetPasswordPayload, {
      message: 'Password request reset sent'
    });
  }
}
