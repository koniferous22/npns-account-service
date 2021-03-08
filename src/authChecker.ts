import { AuthChecker } from 'type-graphql';
import { AccountServiceContext } from './context';
import { User } from './entities/User';

export const authChecker: AuthChecker<AccountServiceContext> = async ({
  context
}) => {
  if (!context.user) {
    return false;
  }
  const userFromDb = await context.em.findOne(User, context.user.data);
  return Boolean(userFromDb);
  // TODO when roles are implemented as user field
  // user.roles.some((role) => roles.includes(role))
};
