import { TemplateStringFunction } from './TemplateStringFunction';

export interface InfinityScrollPropTypes {
  data: object[];
  dataLoadType: 'instant' | 'lazy';
  dataUrl?: URL;
  name: string;
  selectorId: string;
  listType: 'list' | 'table';
  listWrapperHeight: string;
  templateString: TemplateStringFunction;
}
