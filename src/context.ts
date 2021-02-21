import { Tedis } from 'tedis';
import { getConnection } from 'typeorm';

export type AccountServiceContext = {
  em: ReturnType<ReturnType<typeof getConnection>['createEntityManager']>;
  verificationTokenCache: Tedis;
};
