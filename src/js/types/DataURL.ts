import { DataUrlFunction } from './DataUrlFunction';

// type DataURLType = URL | DataUrlFunction;
export type DataURLType = URL | ReturnType<typeof DataUrlFunction>;
