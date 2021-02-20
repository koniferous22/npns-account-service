export type Await<T> = T extends Promise<infer TT> ? TT : never;
