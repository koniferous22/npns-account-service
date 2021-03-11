import { classToPlain, plainToClass } from 'class-transformer';
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
import { hashSync, genSaltSync, compareSync, compare } from 'bcrypt';
import { AccountServiceContext } from '../context';
import { PendingOperation, User } from '../entities/User';
import { SignInUserContract, SignUpUserContract } from '../utils/inputTypes';
import {
  CacheCleanupError,
  CacheCreateTokenError,
  NodemailerError,
  PayloadMissingError,
  PendingProfileOperationInProgressError,
  TokenNotFoundError,
  UpdatedWithEqualPasswordError,
  UserAlreadyVerifiedError,
  UserNotFoundError,
  WrongPasswordError,
  WrongPendingOperationError
} from '../utils/exceptions';
import { BasePayload } from './BasePayload';
import { ValidatePasswordArgGuard } from '../middlewares/ValidatePasswordArgGuard';
import {
  FindUserByIdentifierArgs,
  ChangeAliasArgs,
  RequestEmailChangeArgs,
  UpdatePasswordArgs
} from '../utils/args';

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
class ForgotPasswordPayload implements BasePayload {
  message!: string;
}

@ObjectType({ implements: BasePayload })
class RequestEmailChangePayload implements BasePayload {
  message!: string;
}

@ObjectType({ implements: BasePayload })
class ChangeAliasPayload implements BasePayload {
  message!: string;

  @Field(() => User)
  updatedUser!: User;
}

@ObjectType({ implements: BasePayload })
class UpdatePasswordPayload implements BasePayload {
  message!: string;
}

@ObjectType({ implements: BasePayload })
class ConfirmSignUpTokenPayload implements BasePayload {
  message!: string;
}

@ObjectType({ implements: BasePayload })
class ConfirmEmailResetTokenPayload implements BasePayload {
  message!: string;

  @Field(() => User)
  updatedUser!: User;
}

@ObjectType({ implements: BasePayload })
class ValidatePasswordResetTokenPayload implements BasePayload {
  message!: string;
}
@Resolver(() => User)
export class UserResolver {
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
    console.log('newUser.password');
    console.log(newUser.password);
    // STEP 1: save user
    await userRepo.save(newUser);

    // STEP 2: create verificationToken token
    let token: string;
    try {
      token = await ctx.tokenCache.createUserToken(newUser.id);
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
      await ctx.nodemailer.sendMail(newUser.email, 'signUpTemplate', token);
    } catch (e) {
      await userRepo.remove(newUser);
      await ctx.tokenCache.cleanupUserToken(newUser.id);
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
    const userFromToken = ctx.user!.data;
    const user = await ctx.em.getRepository(User).findOneOrFail(userFromToken);
    if (user.pendingOperation !== PendingOperation.SIGN_UP) {
      throw new UserAlreadyVerifiedError(userFromToken.username);
    }
    await ctx.tokenCache.cleanupUserToken(userFromToken.id);

    let token: string;
    try {
      token = await ctx.tokenCache.createUserToken(userFromToken.id);
    } catch (e) {
      throw new CacheCreateTokenError(user.username, PendingOperation.SIGN_UP);
    }

    try {
      await ctx.nodemailer.sendMail(
        userFromToken.email,
        'signUpTemplate',
        token
      );
    } catch (e) {
      await ctx.tokenCache.cleanupUserToken(userFromToken.id);
      throw new NodemailerError(userFromToken.email, 'signUpTemplate');
    }
    return plainToClass(SignUpUserPayload, {
      message: `Confirmation email resent to "${userFromToken.email}"` // ,
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
    if (!compareSync(input.password, user.password)) {
      throw new WrongPasswordError();
    }
    const jwtConfig = ctx.config.getConfig().jwt;
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

  @Mutation(() => ForgotPasswordPayload)
  async forgotPassword(
    @Args() args: FindUserByIdentifierArgs,
    @Ctx() ctx: AccountServiceContext
  ) {
    const user = await ctx.em.findOne(User, {
      where: [
        { username: args.identifier },
        { email: args.identifier },
        { alias: args.identifier }
      ]
    });
    if (!user) {
      throw new UserNotFoundError(args.identifier);
    }

    user.pendingOperation = PendingOperation.FORGOT_PASSWORD;
    await ctx.em.getRepository(User).save(user);

    let token: string;
    try {
      token = await ctx.tokenCache.createUserToken(user.id);
    } catch (e) {
      // rollback user creation
      throw new CacheCreateTokenError(
        args.identifier,
        PendingOperation.FORGOT_PASSWORD
      );
    }
    try {
      await ctx.nodemailer.sendMail(user.email, 'pwdResetTemplate', token);
    } catch (e) {
      await ctx.tokenCache.cleanupUserToken(user.id);
      throw new NodemailerError(user.email, 'pwdResetTemplate');
    }
    return plainToClass(ForgotPasswordPayload, {
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
      await ctx.nodemailer.sendMail(
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
        : `Alias set to "${user.alias}"`,
      updatedUser: user
    });
  }

  @Authorized()
  @UseMiddleware(ValidatePasswordArgGuard)
  @Mutation(() => RequestEmailChangePayload)
  async requestEmailChange(
    @Args() args: RequestEmailChangeArgs,
    @Ctx() ctx: AccountServiceContext
  ) {
    // TODO authorized decorator solves it
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const userFromToken = ctx.user!.data;
    const userRepo = ctx.em.getRepository(User);
    const user = await userRepo.findOneOrFail(userFromToken);
    if (user.pendingOperation) {
      throw new PendingProfileOperationInProgressError(
        user.username,
        user.pendingOperation
      );
    }
    user.pendingOperation = PendingOperation.CHANGE_EMAIL;
    await userRepo.save(user);

    let token: string;
    try {
      token = await ctx.tokenCache.createUserToken(user.id, args.newEmail);
    } catch (e) {
      user.pendingOperation = null;
      await userRepo.save(user);
      throw new CacheCreateTokenError(
        user.username,
        PendingOperation.CHANGE_EMAIL
      );
    }
    try {
      await ctx.nodemailer.sendMail(
        args.newEmail,
        'emailChangeTemplate',
        token
      );
    } catch (e) {
      user.pendingOperation = null;
      await userRepo.save(user);
      await ctx.tokenCache.cleanupUserToken(user.id);
      throw new NodemailerError(args.newEmail, 'emailChangeTemplate');
    }
    return plainToClass(RequestEmailChangePayload, {
      message: `Email change request sent to new user email: "${args.newEmail}"`
    });
  }

  @Authorized()
  @UseMiddleware(ValidatePasswordArgGuard)
  @Mutation(() => UpdatePasswordPayload)
  async updatePassword(
    @Args() args: UpdatePasswordArgs,
    @Ctx() ctx: AccountServiceContext
  ) {
    // TODO authorized decorator solves it
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const userFromToken = ctx.user!.data;
    const userRepo = ctx.em.getRepository(User);
    const user = await userRepo.findOneOrFail(userFromToken);
    if (user.pendingOperation) {
      throw new PendingProfileOperationInProgressError(
        user.username,
        user.pendingOperation
      );
    }
    if (compareSync(args.newPassword, user.password)) {
      throw new UpdatedWithEqualPasswordError(user.username);
    }
    user.password = hashSync(args.newPassword, genSaltSync(8));
    await userRepo.save(user);
    return plainToClass(RequestEmailChangePayload, {
      message: 'Password updated'
    });
  }

  @Mutation(() => ConfirmSignUpTokenPayload)
  async confirmSignUpToken(
    @Arg('token') token: string,
    @Ctx() ctx: AccountServiceContext
  ) {
    const id = await ctx.tokenCache.getCache().get(token);
    if (!id) {
      throw new TokenNotFoundError(token, PendingOperation.SIGN_UP);
    }
    const userRepo = ctx.em.getRepository(User);
    const user = await userRepo.findOneOrFail(id);
    if (user.pendingOperation !== PendingOperation.SIGN_UP) {
      throw new WrongPendingOperationError(
        user.username,
        PendingOperation.SIGN_UP,
        user.pendingOperation
      );
    }
    try {
      // TODO in case when partial cleanup fails, cache will have to rely on expiration times
      await ctx.tokenCache.cleanupUserToken(user.id);
    } catch (e) {
      throw new CacheCleanupError(user.id, PendingOperation.SIGN_UP);
    }
    user.pendingOperation = null;

    console.log('user');
    console.log(user);
    // NOTE can throw exception if error updating
    await userRepo.save(user);
    return plainToClass(ConfirmSignUpTokenPayload, {
      message: `User "${user.username}" verified`
    });
  }

  @Authorized()
  @Mutation(() => ConfirmEmailResetTokenPayload)
  async confirmEmailResetToken(
    @Arg('token') token: string,
    @Ctx() ctx: AccountServiceContext
  ) {
    const tokenCache = ctx.tokenCache.getCache();
    const id = await tokenCache.get(token);
    if (!id) {
      throw new TokenNotFoundError(token, PendingOperation.CHANGE_EMAIL);
    }
    const userRepo = ctx.em.getRepository(User);
    const user = await userRepo.findOneOrFail(id);
    const newEmail = await tokenCache.hget(id.toString(), 'payload');
    if (!newEmail) {
      throw new PayloadMissingError(
        user.username,
        PendingOperation.CHANGE_EMAIL,
        token
      );
    }
    if (user.pendingOperation !== PendingOperation.CHANGE_EMAIL) {
      throw new WrongPendingOperationError(
        user.username,
        PendingOperation.CHANGE_EMAIL,
        user.pendingOperation
      );
    }
    try {
      // TODO in case when partial cleanup fails, cache will have to rely on expiration times
      await ctx.tokenCache.cleanupUserToken(user.id);
    } catch (e) {
      throw new CacheCleanupError(user.id, PendingOperation.SIGN_UP);
    }
    user.pendingOperation = null;
    user.email = newEmail;

    // NOTE can throw exception if error updating
    await userRepo.save(user);
    return plainToClass(ConfirmEmailResetTokenPayload, {
      message: `User "${user.username}" verified`,
      updatedUser: user
    });
  }

  @Mutation(() => ValidatePasswordResetTokenPayload)
  async validatePasswordResetToken(
    @Arg('token') token: string,
    @Ctx() ctx: AccountServiceContext
  ) {
    const id = await ctx.tokenCache.getCache().get(token);
    if (!id) {
      throw new TokenNotFoundError(token, PendingOperation.FORGOT_PASSWORD);
    }
    const userRepo = ctx.em.getRepository(User);
    const user = await userRepo.findOneOrFail(id);
    if (user.pendingOperation !== PendingOperation.FORGOT_PASSWORD) {
      throw new WrongPendingOperationError(
        user.username,
        PendingOperation.FORGOT_PASSWORD,
        user.pendingOperation
      );
    }
    return plainToClass(ValidatePasswordResetTokenPayload, {
      message: `Password reset token "${token}" valid`
    });
  }
}
