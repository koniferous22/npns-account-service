import { getManager } from 'typeorm';
import { User } from '../entities/User';

// NOTE this resolver doesn't work for some reason without context injecting, so getManager() call is a workaround
export const resolveUserReference = (user: Pick<User, 'id'>) => {
  return getManager().getRepository(User).findOneOrFail({ id: user.id });
};
