import { MiddlewareFn } from 'type-graphql';
import { AccountServiceContext } from '../context';
import { createHmacDigest } from '../utils/createHmacDigest';
import { InvalidDigestError, MissingDigestError } from '../utils/exceptions';

export const MultiWriteProxyHmacGuard: MiddlewareFn<AccountServiceContext> = async (
  { args, context },
  next
) => {
  if (args.payload) {
    if (!args.digest) {
      throw new MissingDigestError(args.payload);
    }
    const actualDigest = createHmacDigest(
      args.payload,
      context.config.getConfig()
    );
    if (args.digest !== actualDigest) {
      throw new InvalidDigestError(args.payload, args.digest);
    }
  }
  return next();
};
