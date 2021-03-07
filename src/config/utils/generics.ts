import { ArrayElement } from '../../utils/generics';

export type ConfigAstNode =
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
  | {
      type: 'array';
      values: ConfigAstNode[];
    };

type ResolveLeafNodeType<
  NodeT extends Extract<ConfigAstNode, { type: 'leaf' }>
> = NodeT extends {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (...args: any[]) => any;
}
  ? ReturnType<NodeT['transform']>
  : NonNullable<NodeT['originalValue']>;

type ConfigEntryType = Record<string, ConfigAstNode>;

export type ResolveConfigAstNode<NodeT extends ConfigAstNode> = {
  leaf: NodeT extends Extract<ConfigAstNode, { type: 'leaf' }>
    ? ResolveLeafNodeType<NodeT>
    : never;
  node: NodeT extends {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    children: Record<string, any>;
  }
    ? {
        [key in keyof NodeT['children']]: ResolveConfigAstNode<
          NodeT['children'][key]
        >;
      }
    : never;
  array: NodeT extends {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    values: Array<any>;
  }
    ? ResolveConfigTypeArray<NodeT['values']>
    : never;
}[NodeT['type']];

type ResolveConfigTypeArray<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ConfigArrayT extends Array<any>,
  ResultT = Array<ResolveConfigAstNode<ArrayElement<ConfigArrayT>>>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
> = ResultT;

type TokenizeKeys<
  KeyString extends string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Result extends Array<any> = []
> = KeyString extends `${infer Key1}.${infer Rest}`
  ? TokenizeKeys<Rest, [...Result, Key1]>
  : [...Result, KeyString];

type NumbersUnionType =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9';
type IsNumericString<
  StringT extends string
> = StringT extends `${infer HeadT}${infer Rest}`
  ? HeadT extends NumbersUnionType
    ? IsNumericString<Rest>
    : false
  : true;

type IsArrayIndex<
  KeyString extends string
> = KeyString extends `[${infer NumberT}]` ? IsNumericString<NumberT> : false;

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
  ConfigT extends ConfigAstNode,
  CurrentKey = Head<KeyArray>,
  Rest = Tail<KeyArray>
> = ConfigT extends Extract<ConfigT, { type: 'leaf' }>
  ? KeyArray extends []
    ? ResolveLeafNodeType<ConfigT>
    : never
  : ConfigT extends Extract<ConfigT, { type: 'node' }>
  ? KeyArray extends []
    ? never
    : ResolvedConfigValueType<
        Cast<Rest, string[]>,
        Cast<
          ConfigT['children'][Cast<CurrentKey, keyof ConfigT['children']>],
          ConfigAstNode
        >
      >
  : ConfigT extends Extract<ConfigT, { type: 'array' }>
  ? KeyArray extends []
    ? never
    : IsArrayIndex<Cast<CurrentKey, string>> extends true
    ? ResolvedConfigValueType<
        Cast<Rest, string[]>,
        ArrayElement<Extract<ConfigT, { type: 'array' }>['values']>
      >
    : never
  : never;

export type GetConfigValueByKeyString<
  KeyString extends string,
  ConfigT extends ConfigAstNode,
  KeyTokens = TokenizeKeys<KeyString>,
  Result = ResolvedConfigValueType<Cast<KeyTokens, string[]>, ConfigT>
> = Result;

export const resolveConfigNode = (
  node: ConfigAstNode,
  parentKeys: string[] = []
): {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any;
  errors: string[];
} => {
  const errors: string[] = [];
  const fullConfigPath = parentKeys.length > 0 ? parentKeys.join('.') : '.';
  switch (node.type) {
    case 'node': {
      const childrenResults = Object.entries(node.children).map(
        ([key, childNode]) =>
          [key, resolveConfigNode(childNode, parentKeys.concat(key))] as const
      );
      errors.push(...childrenResults.map(([, { errors }]) => errors).flat());
      return {
        config: Object.fromEntries(
          childrenResults.map(([key, { config: childConfig }]) => [
            key,
            childConfig
          ])
        ),
        errors
      };
    }
    case 'array': {
      const results = node.values.map((childNode, index) =>
        resolveConfigNode(childNode, parentKeys.concat(`[${index}]`))
      );
      errors.push(...results.map(({ errors }) => errors).flat());
      return {
        config: results.map(({ config }) => config),
        errors
      };
    }
    case 'leaf': {
      if (node.originalValue === undefined || node.originalValue === '') {
        errors.push(`Missing config value for key "${fullConfigPath}"`);
      }
      const currentValue = node.overridenValue ?? node.originalValue;
      let parsedValue;
      try {
        parsedValue = node.transform
          ? node.transform(currentValue.toString(), fullConfigPath)
          : currentValue;
      } catch (e) {
        errors.push(e.toString());
      }
      return {
        config: parsedValue,
        errors
      };
    }
    default:
      errors.push(
        `Encountered invalid node type "${
          // Should just return undefined
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          node && node!.type
        }" at path "${fullConfigPath}"`
      );
      return {
        config: undefined,
        errors
      };
  }
};
