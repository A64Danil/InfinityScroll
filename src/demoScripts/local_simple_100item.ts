import BigDataList100 from '../../mocks/bigList100.json';
import { InfinityScrollPropTypes } from '../js/types/InfinityScrollPropTypes'; // import mock data

const BigJson1 = BigDataList100.data;

export const LOCAL_SIMPLE_100ITEMS_PROPS: InfinityScrollPropTypes = {
  data: BigJson1,
  dataLoadPlace: 'local',
  dataLoadSpeed: 'instant',
  name: 'my scroll list name',
  selectorId: 'LOCAL_SIMPLE_100ITEMS',
  listType: 'list',
  listWrapperHeight: '350px',
  templateString: (element: object, listLength?: number): string => `<li 
        class="LOCAL_SIMPLE_100ITEMS_List__listItem" 
        aria-setsize="${listLength}" 
        aria-posinset="${element.number + 1}"
        >
            ${element.name} ${element.number + 1}
    </li>`,
};
