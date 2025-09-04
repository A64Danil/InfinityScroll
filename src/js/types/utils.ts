export type XOR<BaseT, A, B> = (BaseT & A) | (BaseT & B);

export type NumRange = [number, number];

export type Rec = Record<string, unknown>;

export enum Status {
  Initial = 'initialization',
  Loading = 'loading data',
  Ready = 'ready',
  Error = 'error',
}

export type DataWithCacheFlag = {
  isFromCache: boolean;
  value: Rec[];
};
