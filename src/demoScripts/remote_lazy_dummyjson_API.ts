import { InfinityScrollPropTypes } from '../js/types/InfinityScrollPropTypes';

export const REMOTE_LAZY_DUMMYJSON_API_PROPS: InfinityScrollPropTypes = {
  data: ({ start, end, page, limit }) =>
    `https://dummyjson.com/products?limit=${limit}&skip=${start}`,
  selectorId: 'REMOTE_LAZY_DUMMYJSON_API',
  subDir: 'products',
  templateString: (element, listLength) => `<li 
        class="REMOTE_LAZY_DUMMYJSON_API_List__listItem big" 
        >
            ${element?.id} ${element?.title}
    </li>`,
};
