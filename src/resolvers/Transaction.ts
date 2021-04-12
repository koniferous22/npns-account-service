import {
  Arg,
  Ctx,
  Directive,
  Query,
  Resolver,
  UseMiddleware
} from 'type-graphql';
import { AccountServiceContext } from '../context';
import { Transaction } from '../entities/Transaction';
import { MultiWriteProxyHmacGuard } from '../middlewares/MultiWriteProxyHmacGuard';

@Resolver(() => Transaction)
export class TransactionResolver {
  @Directive('@MwpTransaction')
  @UseMiddleware(MultiWriteProxyHmacGuard)
  @Query(() => Transaction)
  createTransaction(@Arg('id') id: string, @Ctx() ctx: AccountServiceContext) {
    return ctx.em.getRepository(Transaction).findOneOrFail({ id });
  }

  @Directive('@MwpTransaction')
  @UseMiddleware(MultiWriteProxyHmacGuard)
  @Query(() => Transaction)
  removeTransaction(@Arg('id') id: string, @Ctx() ctx: AccountServiceContext) {
    return ctx.em.getRepository(Transaction).findOneOrFail({ id });
  }
}
