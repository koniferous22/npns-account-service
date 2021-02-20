import { classToPlain, plainToClass } from 'class-transformer';
import {
  Query,
  Arg,
  Resolver,
  Ctx,
  Field,
  Mutation,
  ObjectType
} from 'type-graphql';
import { AccountServiceContext } from '../context';
import { SignUpUserContract } from '../contracts/SignUpUser';
import { User } from '../entities/User';

@ObjectType()
class CreateUserPayload {
  @Field()
  message!: string;
  @Field(() => User)
  createdUser!: User;
}

@Resolver(() => User)
export class UserResolver {
  @Query(() => User)
  userById(@Arg('id') id: string, @Ctx() ctx: AccountServiceContext) {
    // TODO validate user not found
    return ctx.em.getRepository(User).findOneOrFail({ id });
  }

  @Mutation(() => CreateUserPayload)
  async createUser(
    @Arg('input') input: SignUpUserContract,
    @Ctx() ctx: AccountServiceContext
  ) {
    const userRepo = ctx.em.getRepository(User);
    const newUser = userRepo.create(classToPlain(input));
    await userRepo.save(newUser);
    return plainToClass(CreateUserPayload, {
      message: `User "${newUser.username}" created`,
      createdUser: newUser
    });
  }
}
