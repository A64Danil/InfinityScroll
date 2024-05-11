import { TemplateStringFunction } from './TemplateStringFunction';
import { DataURLType } from './DataURL';

export interface InfinityScrollPropTypes {
  // TODO: сделать так чтобы был только один параметр - data или dataUrl
  data: object[];
  dataLoadPlace: 'local' | 'remote';
  dataUrl?: DataURLType;
  dataLoadSpeed: 'instant' | 'lazy';
  name: string;
  selectorId: string;
  forcedListLength: number | 'auto';
  listType: 'list' | 'table';
  listWrapperHeight: string;
  templateString: TemplateStringFunction;
}
