import { Tedis } from 'tedis';
import { getConnection } from 'typeorm';
import { Config } from './config';
import { User } from './entities/User';
import { Nodemailer } from './external/nodemailer';
import { TokenCacheService } from './external/token-cache';

export type AccountServiceContext = {
  em: ReturnType<ReturnType<typeof getConnection>['createEntityManager']>;
  nodemailer: Nodemailer;
  tokenCache: TokenCacheService;
  user: {
    data: Omit<User, 'password' | 'pendingOperation'>;
  } | null;
  config: Config;
};
