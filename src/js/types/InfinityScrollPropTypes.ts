import { TemplateStringFunction } from './TemplateStringFunction';
import { DataURLType } from './DataURL';
// import { XOR } from './utils';

export type InfinityScrollPropTypes = {
  data: object[] | DataURLType;
  selectorId: string;
  templateString: TemplateStringFunction;
  listWrapperHeight?: string;
  forcedListLength?: number;
  listType?: 'list' | 'table' | 'div';
  tHeadNames?: string[];
  subDir?: string;
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
