import { AccountServiceContext } from '../context';
import { User } from '../entities/User';

export const resolveUserReference = (
  user: Pick<User, 'id'>,
  args: any,
  ctx: AccountServiceContext
) => {
  return ctx.em.getRepository(User).findOneOrFail({ id: user.id });
};
