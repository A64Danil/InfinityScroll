import { InfinityScrollPropTypes } from '../js/types/InfinityScrollPropTypes';

export const REMOTE_LAZY_000ITEMS_PROPS: InfinityScrollPropTypes = {
  // data: 'https://dummyjson.com/products',
  data: ({
    start,
    end,
    page,
    limit = 10,
    // offset,
  }) =>
    // `https://jsonplaceholder.typicode.com/comments?_start=${start}&_end=${end}`,
    `https://dummyjson.com/products?limit=${limit}&skip=${start}`,
  // `https://dummyjson.com/products?limit=10&skip=10`,
  name: 'my scroll list name',
  selectorId: 'REMOTE_LAZY_000ITEM',
  // forcedListLength: 500,
  // forcedListLength: 194,
  subDir: 'products',
  listType: 'list',
  listWrapperHeight: '290px',
  templateString: (element, listLength) => `<li 
        class="REMOTE_LAZY_000ITEM_List__listItem big" 
        >
            ${element?.id} ${element?.title}
    </li>`,
};
