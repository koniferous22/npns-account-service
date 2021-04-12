import { createHmac } from 'crypto';
import { Config } from '../config';

export const createHmacDigest = (
  payload: unknown,
  config: ReturnType<Config['getConfig']>
) => {
  const { secret, algorithm } = config.multiWriteProxyHmac;
  const hmac = createHmac(algorithm, secret);
  hmac.update(typeof payload === 'string' ? payload : JSON.stringify(payload));
  return hmac.digest().toString('hex');
};
