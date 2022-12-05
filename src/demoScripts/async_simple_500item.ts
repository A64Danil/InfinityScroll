import BigDataList100 from '../../mocks/bigList100.json';
import { InfinityScrollPropTypes } from '../js/types/InfinityScrollPropTypes';

const BigJson1 = BigDataList100.data;

export const ASYNC_SIMPLE_500ITEMS_PROPS: InfinityScrollPropTypes = {
  // TODO: data не нжна если loadType - lazy
  data: BigJson1,
  dataLoadType: 'lazy',
  dataUrl: 'https://jsonplaceholder.typicode.com/comments',
  name: 'my scroll list name',
  selectorId: 'lazyInfinityScrollWrapper',
  listType: 'list',
  listWrapperHeight: '290px',
  templateString: (element: object, listLength?: number): string => `<li 
        class="infinityScrollList__listItem" 
        aria-setsize="${listLength}" 
        aria-posinset="${element.id}"
        >
            ${element.email} ${element.id}
    </li>`,
};