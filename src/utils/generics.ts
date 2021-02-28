export type Await<T> = T extends Promise<infer TT> ? TT : never;
export type ArrayElement<T> = T extends Array<infer TT> ? TT : never;
