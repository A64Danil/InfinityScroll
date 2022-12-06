import BigDataList10000 from '../../mocks/bigList10000.json';
import { InfinityScrollPropTypes } from '../js/types/InfinityScrollPropTypes'; // import mock data

const BigJson1 = BigDataList10000.data;

export const SYNC_PURE_100ITEMS_PROPS: InfinityScrollPropTypes = {
  data: BigJson1,
  dataLoadPlace: 'local',
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
