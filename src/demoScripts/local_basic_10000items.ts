import BigDataList10000 from '../../mocks/bigList10000.json'; // import mock data
import { InfinityScrollPropTypes } from '../js/types/InfinityScrollPropTypes';

const BigJson1 = BigDataList10000.data;

export const LOCAL_BASIC_10000ITEMS_PROPS: InfinityScrollPropTypes = {
  data: BigJson1,
  selectorId: 'LOCAL_BASIC_10000ITEMS',
  listWrapperHeight: '350px',
  templateString: (element, listLength) => `<li  
        aria-setsize="${listLength}" 
        aria-posinset="${element.number}"
        >
            ${element.name} ${element.number}
    </li>`,
};
