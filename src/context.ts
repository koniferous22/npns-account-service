import { Tedis } from 'tedis';
import { getConnection } from 'typeorm';
import { getConfig } from './config';
import { User } from './entities/User';

export type AccountServiceContext = {
  em: ReturnType<ReturnType<typeof getConnection>['createEntityManager']>;
  verificationTokenCache: Tedis;
  user: {
    data: Omit<User, 'password'>;
  } | null;
  config: ReturnType<typeof getConfig>;
};
