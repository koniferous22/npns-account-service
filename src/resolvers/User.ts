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
  ObjectType
} from 'type-graphql';
import jwt from 'jsonwebtoken';
import { hashSync, genSaltSync, compare } from 'bcrypt';
import { getConfig } from '../config';
import { AccountServiceContext } from '../context';
import { SignUpUserContract } from '../contracts/SignUpUser';
import { User } from '../entities/User';
import { sendMail } from '../external/nodemailer';
import { SignInUserContract } from '../contracts/SignInUser';

@ObjectType()
class SignUpUserPayload {
  @Field()
  message!: string;
  @Field(() => User)
  createdUser!: User;
}

@ObjectType()
class SignInUserPayload {
  @Field()
  token!: string;
  @Field(() => User)
  user!: User;
}

@Resolver(() => User)
export class UserResolver {
  private async createUserToken(
    cache: Tedis,
    userId: string,
    verificationTokenConfig: ReturnType<typeof getConfig>['verificationToken']
  ) {
    const token = randomBytes(16).toString('hex');
    await cache.set(userId, token);
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
      throw e;
    }

    // STEP 3: send confirmation email
    try {
      await sendMail(newUser.email, 'signUpTemplate', token);
    } catch (e) {
      await userRepo.remove(newUser);
      // TODO redis error over here during cleanup
      await ctx.verificationTokenCache.del(newUser.id);
      throw e;
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
    // TODO find by email as well, investigate if orm has some 'or' option
    const user = await ctx.em.findOne(User, {
      where: [{ username: input.identifier }, { email: input.identifier }]
    });
    if (!user) {
      throw new Error(
        `User with email/username: "${input.identifier}" not found`
      );
    }
    if (!compare(user.password, input.password)) {
      throw new Error('Attempted login with wrong password');
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
      user,
      token
    });
  }
}
