import BigDataList100 from '../../mocks/bigList100.json';
import { InfinityScrollPropTypes } from '../js/types/InfinityScrollPropTypes';

const BigJson1 = BigDataList100.data;

export const REMOTE_LAZY_000ITEMS_PROPS: InfinityScrollPropTypes = {
  // TODO: data не нжна если loadType - lazy
  data: BigJson1,
  dataLoadPlace: 'remote',
  dataUrl: 'https://jsonplaceholder.typicode.com/comments',
  dataLoadSpeed: 'lazy',
  name: 'my scroll list name',
  selectorId: 'REMOTE_LAZY_000ITEM',
  listType: 'list',
  listWrapperHeight: '290px',
  templateString: (element: object, listLength?: number): string => `<li 
        class="REMOTE_LAZY_000ITEM_List__listItem" 
        aria-setsize="${listLength}" 
        aria-posinset="${element.id}"
        >
            ${element.email} ${element.id}
    </li>`,
};
