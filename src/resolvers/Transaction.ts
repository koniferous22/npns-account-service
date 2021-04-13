import { plainToClass } from 'class-transformer';
import {
  Arg,
  Authorized,
  Ctx,
  Directive,
  ID,
  Mutation,
  Resolver,
  UseMiddleware
} from 'type-graphql';
import { AccountServiceContext } from '../context';
import { Transaction, TransactionType } from '../entities/Transaction';
import { Wallet } from '../entities/Wallet';
import { MultiWriteProxyHmacGuard } from '../middlewares/MultiWriteProxyHmacGuard';
import { MwpAccount_CreateTransactionInput } from '../utils/inputs';
import {
  MwpAccount_CreateTransactionPayload,
  MwpAccount_CreateTransactionRollbackPayload
} from '../utils/payloads';

@Resolver(() => Transaction)
export class TransactionResolver {
  @Directive('@MwpTransaction')
  @UseMiddleware(MultiWriteProxyHmacGuard)
  @Authorized()
  @Mutation(() => MwpAccount_CreateTransactionPayload, {
    name: 'mwpAccount_CreateTransaction'
  })
  async createWallet(
    @Arg('payload') payload: MwpAccount_CreateTransactionInput,
    @Arg('digest') digest: string,
    @Ctx() ctx: AccountServiceContext
  ) {
    const wallet = await ctx.em
      .getRepository(Wallet)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      .findOneOrFail(payload.walletId);
    const transactionRepo = ctx.em.getRepository(Transaction);
    const createdTransaction = transactionRepo.create({
      transactionType: payload.transactionType,
      amount: payload.amount,
      wallet
    });
    await transactionRepo.save(createdTransaction);
    return plainToClass(MwpAccount_CreateTransactionPayload, {
      createdTransaction: createdTransaction,
      message: `Transaction "${createdTransaction.id}" created`
    });
  }
  @Directive('@MwpRollback')
  @UseMiddleware(MultiWriteProxyHmacGuard)
  @Authorized()
  @Mutation(() => MwpAccount_CreateTransactionPayload, {
    name: 'mwpAccount_CreateTransactionRollback'
  })
  async createWalletRollback(
    @Arg('payload', () => ID) payload: string,
    @Arg('digest') digest: string,
    @Ctx() ctx: AccountServiceContext
  ) {
    const transactionToDelete = await ctx.em
      .getRepository(Transaction)
      .findOneOrFail({ id: payload });
    const wallet = await transactionToDelete.wallet;
    await ctx.em.getRepository(Transaction).delete({ id: payload });
    return plainToClass(MwpAccount_CreateTransactionRollbackPayload, {
      message: `Transaction id: "${transactionToDelete.id}", type: ${
        TransactionType[transactionToDelete.transactionType]
      }, amount: ${transactionToDelete.amount}, walletId: "${wallet.id}"`
    });
  }
}
