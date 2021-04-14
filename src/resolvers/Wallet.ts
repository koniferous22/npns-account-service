import { plainToClass } from 'class-transformer';
import {
  Arg,
  Authorized,
  Ctx,
  Directive,
  FieldResolver,
  ID,
  Mutation,
  Query,
  Resolver,
  Root,
  UseMiddleware
} from 'type-graphql';
import { AccountServiceContext } from '../context';
import { Transaction, TransactionType } from '../entities/Transaction';
import {
  TransactionByWalletIdInput,
  TransactionConnection
} from '../entities/TransactionConnection';
import { User } from '../entities/User';
import { Wallet, WalletType } from '../entities/Wallet';
import { AccountOwnerGuard } from '../middlewares/AccountOwnerGuard';
import { MultiWriteProxyHmacGuard } from '../middlewares/MultiWriteProxyHmacGuard';
import {
  AccountOwnerAccessError,
  NegativeWalletBalanceError
} from '../utils/exceptions';
import {
  MwpAccount_AddBalanceInput,
  MwpAccount_CreateWalletInput
} from '../utils/inputs';
import {
  MwpAccount_AddBalancePayload,
  MwpAccount_AddBalanceRollbackPayload,
  MwpAccount_CreateWalletPayload,
  MwpAccount_CreateWalletRollbackPayload
} from '../utils/payloads';

@Resolver(() => Wallet)
export class WalletResolver {
  @Authorized()
  @UseMiddleware(AccountOwnerGuard)
  @FieldResolver(() => TransactionConnection)
  transactions(
    @Root() root: Wallet,
    @Arg('input') input: TransactionByWalletIdInput,
    @Ctx() ctx: AccountServiceContext
  ) {
    return TransactionConnection.transactionConnection(
      {
        ...input,
        wallets: [root.id]
      },
      ctx
    );
  }

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
  @Mutation(() => MwpAccount_CreateWalletRollbackPayload, {
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

  @Directive('@MwpTransaction')
  @UseMiddleware(MultiWriteProxyHmacGuard)
  @Authorized()
  @Mutation(() => MwpAccount_AddBalancePayload, {
    name: 'mwpAccount_AddBalance'
  })
  async addBalance(
    @Arg('payload') payload: MwpAccount_AddBalanceInput,
    @Arg('digest') digest: string,
    @Ctx() ctx: AccountServiceContext
  ) {
    const walletRepo = ctx.em.getRepository(Wallet);
    const wallet = await walletRepo.findOneOrFail(payload.walletId);
    if ((await wallet.user).id !== ctx.user?.data.id) {
      throw new AccountOwnerAccessError(wallet.id, ctx.user?.data.id);
    }
    const transactionRepo = ctx.em.getRepository(Transaction);
    const transaction = transactionRepo.create({
      wallet,
      transactionType:
        wallet.walletType === WalletType.Monetary
          ? TransactionType.MonetaryReward
          : TransactionType.VirtualReward
    });
    await transactionRepo.save(transaction);
    wallet.balance += payload.amount;
    try {
      await walletRepo.save(wallet);
    } catch (e) {
      await transactionRepo.delete(transaction);
      throw e;
    }
    return plainToClass(MwpAccount_AddBalancePayload, {
      wallet,
      transaction,
      message: `Wallet "${wallet.id}" updated`
    });
  }
  @Directive('@MwpRollback')
  @UseMiddleware(MultiWriteProxyHmacGuard)
  @Authorized()
  @Mutation(() => MwpAccount_AddBalanceRollbackPayload, {
    name: 'mwpAccount_AddBalanceRollback'
  })
  async addBalanceRollback(
    @Arg('payload', () => ID) payload: string,
    @Arg('digest') digest: string,
    @Ctx() ctx: AccountServiceContext
  ) {
    const transactionRepo = ctx.em.getRepository(Transaction);
    const walletRepo = ctx.em.getRepository(Wallet);
    const transactionToDelete = await transactionRepo.findOneOrFail({
      id: payload
    });
    const wallet = await transactionToDelete.wallet;
    const oldBalance = wallet.balance;
    wallet.balance -= transactionToDelete.amount;
    if (wallet.balance < 0) {
      throw new NegativeWalletBalanceError(
        wallet.id,
        wallet.balance,
        transactionToDelete.id
      );
    }
    await walletRepo.save(wallet);
    try {
      await ctx.em.getRepository(Transaction).delete({ id: payload });
    } catch (e) {
      wallet.balance = oldBalance;
      await walletRepo.save(wallet);
      throw e;
    }
    return plainToClass(MwpAccount_AddBalanceRollbackPayload, {
      message: `Transaction "${transactionToDelete.id}" reverted, wallet balance restored`
    });
  }
}
