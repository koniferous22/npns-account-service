export type ConfigEntryType = Record<
  string,
  | {
      type: 'leaf';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      originalValue: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transform?: (val: string, key: string) => any;
      overridenValue: null | string;
    }
  | {
      type: 'node';
      children: ConfigEntryType;
    }
>;

export type ResolveConfigType<
  ConfigT extends ConfigEntryType,
  ResultT = {
    [key in keyof ConfigT]: {
      leaf: ConfigT[key] extends {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        originalValue: any;
      }
        ? ConfigT[key] extends {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            transform: (...args: any[]) => any;
          }
          ? ReturnType<ConfigT[key]['transform']>
          : NonNullable<ConfigT[key]['originalValue']>
        : never;
      node: ConfigT[key] extends {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        children: Record<string, any>;
      }
        ? ResolveConfigType<ConfigT[key]['children']>
        : never;
    }[ConfigT[key]['type']];
  }
> = ResultT;

type TokenizeKeys<
  KeyString extends string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Result extends Array<any> = []
> = KeyString extends `${infer Key1}.${infer Rest}`
  ? TokenizeKeys<Rest, [...Result, Key1]>
  : [...Result, KeyString];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Head<T extends any[]> = T extends [any, ...any[]] ? T[0] : never;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Tail<T extends any[]> = T extends [any, ...infer TT] ? TT : never;
type Cast<X, Y> = X extends Y ? X : Y;

export type GetObjectValues<T> = T extends Record<string, infer Values>
  ? Values
  : never;

type ResolvedConfigValueType<
  KeyArray extends Array<string>,
  ConfigT extends ConfigEntryType,
  CurrentKey = Head<KeyArray>,
  Rest = Tail<KeyArray>
> = CurrentKey extends keyof ConfigT
  ? ConfigT[CurrentKey] extends Extract<
      GetObjectValues<ConfigEntryType>,
      { type: 'leaf' }
    >
    ? Rest extends []
      ? ReturnType<
          Cast<
            ConfigT[CurrentKey],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { transform: (...args: any[]) => any }
          >['transform']
        >
      : never
    : ConfigT[CurrentKey]['type'] extends 'node'
    ? Rest extends []
      ? never
      : ResolvedConfigValueType<
          Cast<Rest, string[]>,
          Cast<ConfigT[CurrentKey], { children: ConfigEntryType }>['children']
        >
    : never
  : never;

export type GetConfigValueByKeyString<
  KeyString extends string,
  ConfigT extends ConfigEntryType,
  KeyTokens = TokenizeKeys<KeyString>,
  Result = ResolvedConfigValueType<Cast<KeyTokens, string[]>, ConfigT>
> = Result;

export const resolveConfigEntry = (
  config: ConfigEntryType,
  parentKey: null | string = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any =>
  Object.fromEntries(
    Object.entries(config).map(([key, { type, ...rest }]) => {
      switch (type) {
        case 'node': {
          if (!('children' in rest)) {
            // Just fixing typescript code like this
            throw new Error("Missing key 'children' in the config");
          }
          return [key, resolveConfigEntry(rest.children)];
        }
        case 'leaf': {
          if (!('overridenValue' in rest)) {
            // Just fixing typescript code like this
            throw new Error("Missing key 'transform' in the config");
          }
          if (rest.originalValue === undefined || rest.originalValue === '') {
            throw new Error(
              `Missing config value for key "${
                parentKey ? `${parentKey}.${key}` : key
              }"`
            );
          }
          const currentValue = rest.overridenValue ?? rest.originalValue;
          return [
            key,
            rest.transform
              ? rest.transform(currentValue.toString(), key)
              : currentValue
          ];
        }
      }
    })
  );
