import { TemplateStringFunction } from './TemplateStringFunction';
import { DataURLType } from './DataURL';

export interface InfinityScrollPropTypes {
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
