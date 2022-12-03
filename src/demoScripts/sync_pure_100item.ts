import BigDataList10000 from '../../mocks/bigList10000.json';
import { InfinityScrollPropTypes } from '../js/types/InfinityScrollPropTypes'; // import mock data

// TODO: не работает номрально при быстром скролле 10к элементов
const BigJson1 = BigDataList10000.data;

export const SYNC_PURE_100ITEMS_PROPS: InfinityScrollPropTypes = {
  data: BigJson1,
  dataLoadType: 'instant',
  name: 'my scroll list name',
  selectorId: 'SYNC_PURE_100ITEMS',
  listType: 'list',
  listWrapperHeight: '350px',
  templateString: (element: object, listLength?: number): string => `<li  
        aria-setsize="${listLength}" 
        aria-posinset="${element.number + 1}"
        >
            ${element.name} ${element.number + 1}
    </li>`,
};
