import { InfinityScrollPropTypes } from '../js/types/InfinityScrollPropTypes';

export const REMOTE_SIMPLE_500ITEMS_PROPS: InfinityScrollPropTypes = {
  dataLoadPlace: 'remote',
  dataLoadSpeed: 'instant',
  dataUrl: 'https://jsonplaceholder.typicode.com/comments',
  name: 'my REMOTE_SIMPLE_500ITEMS',
  selectorId: 'REMOTE_SIMPLE_500ITEM',
  listType: 'list',
  listWrapperHeight: '290px',
  templateString: (element: object, listLength?: number): string => `<li 
        class="REMOTE_SIMPLE_500ITEM_List__listItem" 
        aria-setsize="${listLength}" 
        aria-posinset="${element.id}"
        >
            ${element.email} ${element.id}
    </li>`,
};
