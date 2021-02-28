import { Tedis } from 'tedis';
import { getConnection } from 'typeorm';
import { User } from './entities/User';

export type AccountServiceContext = {
  em: ReturnType<ReturnType<typeof getConnection>['createEntityManager']>;
  verificationTokenCache: Tedis;
  user: Omit<User, 'password'>;
};
