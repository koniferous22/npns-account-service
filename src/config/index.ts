import path from 'path';
import {
  resolveConfigNode,
  GetConfigValueByKeyString,
  ResolveConfigAstNode,
  ConfigAstNode
} from './utils/generics';
import {
  getEmail,
  getEndpoint,
  getEnum,
  getNumber,
  getUrl
} from './utils/transformers';

const configWithParser = {
  type: 'node' as const,
  children: {
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
    },
    orm: {
      type: 'array' as const,
      values: [
        {
          type: 'node' as const,
          children: {
            type: {
              type: 'leaf' as const,
              originalValue: process.env.ACCOUNT_DB_TYPE,
              transform: getEnum(['postgres']),
              overridenValue: null as null | string
            },
            host: {
              type: 'leaf' as const,
              originalValue: process.env.ACCOUNT_DB_HOST,
              overridenValue: null as null | string
            },
            port: {
              type: 'leaf' as const,
              originalValue: process.env.ACCOUNT_DB_PORT,
              transform: getNumber,
              overridenValue: null as null | string
            },
            username: {
              type: 'leaf' as const,
              originalValue: process.env.ACCOUNT_DB_USERNAME,
              overridenValue: null as null | string
            },
            password: {
              type: 'leaf' as const,
              originalValue: process.env.ACCOUNT_DB_PASSWORD,
              overridenValue: null as null | string
            },
            database: {
              type: 'leaf' as const,
              originalValue: process.env.ACCOUNT_DB_DATABASE,
              overridenValue: null as null | string
            },
            migrations: {
              type: 'leaf' as const,
              originalValue: [path.join(__dirname, '../migrations/**/*.ts')],
              overridenValue: null as null | string
            },
            entities: {
              type: 'leaf' as const,
              originalValue: [path.join(__dirname, '../entities/**/*.ts')],
              overridenValue: null as null | string
            },
            cli: {
              type: 'node' as const,
              children: {
                migrationsDir: {
                  type: 'leaf' as const,
                  originalValue: 'src/migrations',
                  overridenValue: null as null | string
                },
                entitiesDir: {
                  type: 'leaf' as const,
                  originalValue: 'src/entities',
                  overridenValue: null as null | string
                }
              }
            }
          }
        }
      ]
    }
  }
};

export type ConfigType = ResolveConfigAstNode<typeof configWithParser>;

const resolveConfig: () => ConfigType = () => {
  const { config, errors } = resolveConfigNode(configWithParser);
  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
  return config;
};
let config = resolveConfig();
let settingsChanged = false;

export const getConfig = () => {
  if (settingsChanged) {
    config = resolveConfig();
    settingsChanged = false;
  }
  return config;
};

export function overrideConfig<KeyString extends string>(
  keyString: KeyString,
  newValue: GetConfigValueByKeyString<KeyString, typeof configWithParser>
) {
  const keys = keyString.split('.');
  let current: ConfigAstNode = configWithParser;
  keys.forEach((key) => {
    switch (current.type) {
      case 'node': {
        current = current.children[key];
        break;
      }
      case 'array': {
        const index = parseInt(key, 10);
        current = current.values[index];
        break;
      }
      case 'leaf': {
        throw new Error(`Key string "${keyString}" out of range`);
      }
      default: {
        throw new Error(
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          `Encountered invalid node type: "${current && current!.type}"`
        );
      }
    }
  });
  if (!['leaf'].includes(current.type)) {
    throw new Error(
      `Configuration key '${keyString}' references object and not leaf value`
    );
  }
  // @ts-expect-error Wrong ts inferring because of for-each
  current.overridenValue = newValue.toString();
  settingsChanged = true;
}
