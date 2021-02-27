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
import { getConfig } from '../config';
import { AccountServiceContext } from '../context';
import { SignUpUserContract } from '../contracts/SignUpUser';
import { User } from '../entities/User';
import { sendMail } from '../external/nodemailer';

@ObjectType()
class CreateUserPayload {
  @Field()
  message!: string;
  @Field(() => User)
  createdUser!: User;
}

@Resolver(() => User)
export class UserResolver {
  private async createUserToken(cache: Tedis, userId: string) {
    const { verificationToken } = getConfig();
    const token = randomBytes(16).toString('hex');
    await cache.set(userId, token);
    await cache.expire(userId, verificationToken.expirationTime);
    return token;
  }

  @Query(() => User)
  userById(@Arg('id') id: string, @Ctx() ctx: AccountServiceContext) {
    // TODO validate user not found
    return ctx.em.getRepository(User).findOneOrFail({ id });
  }

  @Mutation(() => CreateUserPayload)
  async signUpUser(
    @Arg('input') input: SignUpUserContract,
    @Ctx() ctx: AccountServiceContext
  ) {
    const userRepo = ctx.em.getRepository(User);
    const newUser = userRepo.create(classToPlain(input));
    // STEP 1: save user
    await userRepo.save(newUser);

    // STEP 2: create verificationToken token
    let token: string;
    try {
      token = await this.createUserToken(
        ctx.verificationTokenCache,
        newUser.id
      );
    } catch (e) {
      // rollback user creation
      await userRepo.remove(newUser);
      throw e;
    }
    await ctx.verificationTokenCache.get(newUser.id);

    // STEP 3: send confirmation email
    try {
      await sendMail(newUser.email, 'signUpTemplate', token);
    } catch (e) {
      await userRepo.remove(newUser);
      // TODO redis error over here during cleanup
      await ctx.verificationTokenCache.del(newUser.id);
      throw e;
    }
    return plainToClass(CreateUserPayload, {
      message: `User "${newUser.username}" created`,
      createdUser: newUser
    });
  }
}
