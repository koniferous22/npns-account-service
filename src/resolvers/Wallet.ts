import { Arg, Ctx, Query, Resolver } from 'type-graphql';
import { AccountServiceContext } from '../context';
import { Wallet } from '../entities/Wallet';

@Resolver(() => Wallet)
export class WalletResolver {
  @Query(() => Wallet)
  walletById(@Arg('id') id: string, @Ctx() ctx: AccountServiceContext) {
    return ctx.em.getRepository(Wallet).findOneOrFail({ id });
  }
}
