import { randomBytes } from 'crypto';
import { Tedis } from 'tedis';
import { Config } from '../../config';

export class TokenCacheService {
  private _config: Config = Config.getInstance();
  private _cache: Tedis;

  private initializeCache() {
    return new Tedis(this._config.getConfig().verificationToken.cache);
  }
  constructor() {
    this._cache = this.initializeCache();
  }

  async createUserToken(userId: string, payload?: string | undefined) {
    const token = randomBytes(16).toString('hex');
    await this._cache.hmset(
      userId,
      payload
        ? {
            token,
            payload
          }
        : {
            token
          }
    );
    try {
      await this._cache.set(token, userId);
    } catch (e) {
      await this._cache.del(userId);
      throw e;
    }
    // await this._cache.set(userId, token);
    await this._cache.expire(
      userId,
      this._config.getConfig().verificationToken.expirationTime
    );
    return token;
  }
  async cleanupUserToken(userId: string) {
    const foundToken = (await this._cache.hmget(userId, 'token'))[0];
    if (foundToken) {
      await this._cache.del(foundToken);
    }
    await this._cache.del(userId);
  }
}
