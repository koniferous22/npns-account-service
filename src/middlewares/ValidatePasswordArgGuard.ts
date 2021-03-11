import { compareSync } from 'bcrypt';
import { MiddlewareFn, UnauthorizedError } from 'type-graphql';
import { AccountServiceContext } from '../context';
import { User } from '../entities/User';
import { WrongPasswordError } from '../utils/exceptions';

export const ValidatePasswordArgGuard: MiddlewareFn<AccountServiceContext> = async (
  { args, context },
  next
) => {
  if (!context.user) {
    throw new UnauthorizedError();
  }
  if (!args.password) {
    throw new Error(`Argumment password is missing`);
  }
  const userFromDb = await context.em
    .getRepository(User)
    .findOneOrFail(context.user.data);
  if (!compareSync(args.password, userFromDb.password)) {
    throw new WrongPasswordError();
  }
  return next();
};
