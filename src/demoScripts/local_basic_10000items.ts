import BigDataList10000 from '../../mocks/bigList10000.json'; // import mock data
import { InfinityScrollPropTypes } from '../js/types/InfinityScrollPropTypes';

const BigJson1 = BigDataList10000.data;

export const LOCAL_BASIC_10000ITEMS_PROPS: InfinityScrollPropTypes = {
  data: BigJson1,
  selectorId: 'LOCAL_BASIC_10000ITEMS',
  listWrapperHeight: '350px', // because this list hasn't css-styles
  // forcedListLength: 1200,
  templateString: ({ item, idx }) => `<li>
            ${item.name} ${item.number} - ${idx}
    </li>`,
};
