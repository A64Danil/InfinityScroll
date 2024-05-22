import { InfinityScrollPropTypes } from '../js/types/InfinityScrollPropTypes';

export const REMOTE_LAZY_000ITEMS_PROPS: InfinityScrollPropTypes = {
  dataLoadPlace: 'remote',
  dataLoadSpeed: 'lazy',
  dataUrl: (start?: number, end?: number, page?: number, limit?: number) =>
    // return `http://localhost:3000/data?_page=1&_limit=20`;
    `http://localhost:3000/data?_start=${start}&_end=${end}`,
  name: 'my scroll list name',
  selectorId: 'REMOTE_LAZY_000ITEM',
  forcedListLength: 500,
  listType: 'list',
  listWrapperHeight: '290px',
  templateString: (element: object, listLength?: number): string => `<li 
        class="REMOTE_LAZY_000ITEM_List__listItem big" 
        aria-setsize="${listLength}" 
        aria-posinset="${element?.number}"
        >
            ${element?.number} ${element?.name}
    </li>`,
};
