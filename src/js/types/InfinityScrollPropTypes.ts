import { TemplateStringFunction } from './TemplateStringFunction';
import { DataURLType } from './DataURL';
import { XOR } from './utils';

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

type DataLikeArr = {
  data: object[];
  dataUrl?: never;
};
type DataLikeUrl = {
  data?: never;
  dataUrl: DataURLType;
};

export type InfinityScrollPropTypes = XOR<
  BaseInfinityScrollPropTypes,
  DataLikeArr,
  DataLikeUrl
>;
