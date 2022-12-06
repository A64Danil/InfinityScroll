import { TemplateStringFunction } from './TemplateStringFunction';

export interface InfinityScrollPropTypes {
  data: object[];
  dataLoadPlace: 'local' | 'remote';
  dataUrl?: URL;
  dataLoadSpeed?: 'instant' | 'lazy';
  name: string;
  selectorId: string;
  listType: 'list' | 'table';
  listWrapperHeight: string;
  templateString: TemplateStringFunction;
}
