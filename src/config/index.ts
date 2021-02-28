import {
  resolveConfigEntry,
  GetConfigValueByKeyString,
  ConfigEntryType,
  ResolveConfigType,
  GetObjectValues
} from './utils/generics';
import {
  getEmail,
  getEndpoint,
  getEnum,
  getNumber,
  getUrl
} from './utils/transformers';

const configWithParser = {
  port: {
    type: 'leaf' as const,
    originalValue: process.env.PORT,
    transform: getNumber,
    overridenValue: null as null | string
  },
  graphqlPath: {
    type: 'leaf' as const,
    originalValue: process.env.GRAPHQL_PATH,
    transform: getEndpoint,
    overridenValue: null as null | string
  },
  jwt: {
    type: 'node' as const,
    children: {
      secret: {
        type: 'leaf' as const,
        originalValue: process.env.JWT_SECRET,
        overridenValue: null as null | string
      },
      algorithm: {
        type: 'leaf' as const,
        originalValue: process.env.JWT_ALGORITHM,
        transform: getEnum(['HS256']),
        overridenValue: null as null | string
      }
    }
  },
  accountNotificationSenderEmail: {
    type: 'leaf' as const,
    originalValue: process.env.NOTIFICATION_SENDER_EMAIL,
    transform: getEmail,
    overridenValue: null as null | string
  },
  webAppAddress: {
    type: 'leaf' as const,
    originalValue: process.env.WEB_APP_ADDRESS,
    transform: getUrl,
    overridenValue: null as null | string
  },
  nodemailer: {
    type: 'node' as const,
    children: {
      host: {
        type: 'leaf' as const,
        originalValue: process.env.NODEMAILER_HOST,
        overridenValue: null as null | string
      },
      port: {
        type: 'leaf' as const,
        originalValue: process.env.NODEMAILER_PORT,
        transform: getNumber,
        overridenValue: null as null | string
      },
      auth: {
        type: 'node' as const,
        children: {
          user: {
            type: 'leaf' as const,
            originalValue: process.env.NODEMAILER_USER,
            overridenValue: null as null | string
          },
          pass: {
            type: 'leaf' as const,
            originalValue: process.env.NODEMAILER_PASSWORD,
            overridenValue: null as null | string
          }
        }
      }
    }
  },
  verificationToken: {
    type: 'node' as const,
    children: {
      cache: {
        type: 'node' as const,
        children: {
          host: {
            type: 'leaf' as const,
            originalValue: process.env.VERIFICATION_TOKEN_CACHE_HOST,
            overridenValue: null as null | string
          },
          port: {
            type: 'leaf' as const,
            originalValue: process.env.VERIFICATION_TOKEN_CACHE_PORT,
            transform: getNumber,
            overridenValue: null as null | string
          },
          password: {
            type: 'leaf' as const,
            originalValue: process.env.VERIFICATION_TOKEN_CACHE_PASSWORD,
            overridenValue: null as null | string
          }
        }
      },
      expirationTime: {
        type: 'leaf' as const,
        originalValue: process.env.VERIFICATION_TOKEN_EXPIRATION_TIME,
        transform: getNumber,
        overridenValue: null as null | string
      }
    }
  }
};

export type ConfigType = ResolveConfigType<typeof configWithParser>;

const resolveConfig: () => ConfigType = () =>
  resolveConfigEntry(configWithParser);

let config = resolveConfig();
let settingsChanged = false;

export const getConfig = () => {
  if (settingsChanged) {
    config = resolveConfig();
    settingsChanged = false;
  }
  return config;
};

// TODO promisify
export function overrideConfig<KeyString extends string>(
  keyString: KeyString,
  newValue: GetConfigValueByKeyString<KeyString, typeof configWithParser>,
  cb?: () => void
) {
  const keys = keyString.split('.');
  let current: GetObjectValues<ConfigEntryType> = {
    type: 'node',
    children: configWithParser
  };
  keys.forEach((key) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(key in current) || !(('children' in (current as any)[key]) as any)) {
      throw new Error(`Configuration key '${keyString}' does not exist`);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    current = (current as any)[key].children;
  });
  if (!['leaf'].includes(current.type)) {
    throw new Error(
      `Configuration key '${keyString}' references object and not leaf value`
    );
  }
  // @ts-expect-error Wrong ts inferring because of for-each
  current.overridenValue = newValue;
  settingsChanged = true;
  if (cb) {
    cb();
  }
}
