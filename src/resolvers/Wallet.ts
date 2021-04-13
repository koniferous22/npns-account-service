import { plainToClass } from 'class-transformer';
import {
  Arg,
  Authorized,
  Ctx,
  Directive,
  ID,
  Mutation,
  Query,
  Resolver,
  UseMiddleware
} from 'type-graphql';
import { AccountServiceContext } from '../context';
import { User } from '../entities/User';
import { Wallet, WalletType } from '../entities/Wallet';
import { AccountOwnerGuard } from '../middlewares/AccountOwnerGuard';
import { MultiWriteProxyHmacGuard } from '../middlewares/MultiWriteProxyHmacGuard';
import { MwpAccount_CreateWalletInput } from '../utils/inputs';
import {
  MwpAccount_CreateWalletPayload,
  MwpAccount_CreateWalletRollbackPayload
} from '../utils/payloads';

@Resolver(() => Wallet)
export class WalletResolver {
  @UseMiddleware(AccountOwnerGuard)
  @Authorized()
  @Query(() => Wallet)
  walletById(@Arg('id') id: string, @Ctx() ctx: AccountServiceContext) {
    return ctx.em.getRepository(Wallet).findOneOrFail({ id });
  }

  @Directive('@MwpTransaction')
  @UseMiddleware(MultiWriteProxyHmacGuard)
  @Authorized()
  @Mutation(() => MwpAccount_CreateWalletPayload, {
    name: 'mwpAccount_CreateWallet'
  })
  async createWallet(
    @Arg('payload') payload: MwpAccount_CreateWalletInput,
    @Arg('digest') digest: string,
    @Ctx() ctx: AccountServiceContext
  ) {
    const user = await ctx.em
      .getRepository(User)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      .findOneOrFail(ctx.user!.data.id);
    const walletRepo = ctx.em.getRepository(Wallet);
    const createdWallet = walletRepo.create({
      ...payload,
      user
    });
    await walletRepo.save(createdWallet);
    return plainToClass(MwpAccount_CreateWalletPayload, {
      createdWallet,
      message: `Wallet "${createdWallet.id}" created`
    });
  }
  @Directive('@MwpRollback')
  @UseMiddleware(MultiWriteProxyHmacGuard)
  @Authorized()
  @Mutation(() => MwpAccount_CreateWalletPayload, {
    name: 'mwpAccount_CreateWalletRollback'
  })
  async createWalletRollback(
    @Arg('payload', () => ID) payload: string,
    @Arg('digest') digest: string,
    @Ctx() ctx: AccountServiceContext
  ) {
    const walletToDelete = await ctx.em
      .getRepository(Wallet)
      .findOneOrFail({ id: payload });
    await ctx.em.getRepository(Wallet).delete({ id: payload });
    return plainToClass(MwpAccount_CreateWalletRollbackPayload, {
      message: `Wallet (${WalletType[walletToDelete.walletType]}) for tag "${
        walletToDelete.tagId
      }" deleted`
    });
  }
}
