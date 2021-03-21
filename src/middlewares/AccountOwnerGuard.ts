import { MiddlewareFn, UnauthorizedError } from 'type-graphql';
import { AccountServiceContext } from '../context';
import { Activity } from '../entities/Activity';
import { Transaction } from '../entities/Transaction';
import { User } from '../entities/User';
import { Wallet } from '../entities/Wallet';
import {
  AccountOwnerAccessError,
  UserNotFoundError
} from '../utils/exceptions';

export const AccountOwnerGuard: MiddlewareFn<AccountServiceContext> = async (
  { root, context, info },
  next
) => {
  if (!context.user) {
    throw new UnauthorizedError();
  }
  let user: User | null = null;
  if (root instanceof User) {
    user = root;
  }
  if (root instanceof Wallet || root instanceof Activity) {
    user = await root.user;
  }
  if (root instanceof Transaction) {
    const wallet = await root.wallet;
    user = await wallet.user;
  }
  if (!user) {
    // NOTE should only happen in bad application of middleware
    throw new UserNotFoundError();
  }
  if (context.user.data.id !== user.id) {
    throw new AccountOwnerAccessError(info.path.key.toString());
  }
  return next();
};
