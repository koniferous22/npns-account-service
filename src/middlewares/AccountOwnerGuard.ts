import { MiddlewareFn, UnauthorizedError } from 'type-graphql';
import { AccountServiceContext } from '../context';
import { User } from '../entities/User';
import { AccountOwnerAccessError } from '../utils/exceptions';

export const AccountOwnerGuard: MiddlewareFn<AccountServiceContext> = async (
  { root, context, info },
  next
) => {
  if (root instanceof User) {
    if (!context.user) {
      throw new UnauthorizedError();
    }
    if (context.user.data.id !== root.id) {
      throw new AccountOwnerAccessError(info.path.key.toString());
    }
  }
  return next();
};
