import BigDataList100 from '../../mocks/bigList100.json';
import { InfinityScrollPropTypes } from '../js/types/InfinityScrollPropTypes';

const BigJson1 = BigDataList100.data;

export const REMOTE_SIMPLE_500ITEMS_PROPS: InfinityScrollPropTypes = {
  // TODO: data не нжна если loadType - lazy
  data: BigJson1,
  dataLoadPlace: 'remote',
  dataUrl: 'https://jsonplaceholder.typicode.com/comments',
  name: 'my scroll list name',
  selectorId: 'ASYNC_SIMPLE_500ITEM',
  listType: 'list',
  listWrapperHeight: '290px',
  templateString: (element: object, listLength?: number): string => `<li 
        class="ASYNC_SIMPLE_500ITEM_List__listItem" 
        aria-setsize="${listLength}" 
        aria-posinset="${element.id}"
        >
            ${element.email} ${element.id}
    </li>`,
};
