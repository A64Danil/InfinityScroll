import BigDataList100 from '../../mocks/bigList100.json';
import { InfinityScrollPropTypes } from '../js/types/InfinityScrollPropTypes'; // import mock data

const BigJson1 = BigDataList100.data;

export const LOCAL_SIMPLE_100ITEMS_PROPS: InfinityScrollPropTypes = {
  data: BigJson1,
  selectorId: 'LOCAL_SIMPLE_100ITEMS',
  // forcedListLength: 15, // TODO: протестировать с таким количестмо ещё раз и доделать сеттер для this.list.existingSizeInDOM = this.chunk.amount * 4;
  templateString: ({ item, listLength, idx }) => `<li
        class="LOCAL_SIMPLE_100ITEMS_List__listItem" >
            ${item.name} ${item.number} <span>(order number ${idx})</span>
    </li>`,
};
