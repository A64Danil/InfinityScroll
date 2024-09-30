import { TemplateStringFunction } from './TemplateStringFunction';
import { DataURLType } from './DataURL';
import { XOR } from './utils';

export type InfinityScrollPropTypes = {
  data: object[] | DataURLType;
  selectorId: string;
  listWrapperHeight: string;
  name?: string;
  dataLoadPlace?: 'local' | 'remote';
  dataLoadSpeed?: 'instant' | 'lazy';
  forcedListLength?: number;
  listType?: 'list' | 'table';
  templateString: TemplateStringFunction;
};

// type DataLikeArr = {
//   data: object[];
//   dataUrl?: never;
// };
// type DataLikeUrl = {
//   data?: never;
//   dataUrl: DataURLType;
// };

// export type InfinityScrollPropTypes = XOR<
//   BaseInfinityScrollPropTypes,
//   DataLikeArr,
//   DataLikeUrl
// >;
