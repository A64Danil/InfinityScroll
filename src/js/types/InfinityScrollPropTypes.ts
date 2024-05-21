import { TemplateStringFunction } from './TemplateStringFunction';
import { DataURLType } from './DataURL';

// type Xor<BaseType, A, B> = (BaseType & A) | (BaseType & B);
//
// export type InfinityScroll = Xor
// <
//     BaseInfinityScrollPropType,
//     { data: object[]; },
// { dataUrl: DataURLType; }
// >;

type BaseInfinityScrollPropTypes = {
  selectorId: string;
  listWrapperHeight: string;
  name?: string;
  dataLoadPlace?: 'local' | 'remote';
  dataLoadSpeed?: 'instant' | 'lazy';
  forcedListLength?: number | 'auto';
  listType?: 'list' | 'table';
  templateString: TemplateStringFunction;
};

type InfinityScrollDataPropTypes = BaseInfinityScrollPropTypes & {
  data: object[];
};
type InfinityScrollDataUrlPropTypes = BaseInfinityScrollPropTypes & {
  dataUrl: DataURLType;
};

export type InfinityScroll =
  | InfinityScrollDataPropTypes
  | InfinityScrollDataUrlPropTypes;
