import { InfinityScrollPropTypes } from '../js/types/InfinityScrollPropTypes';

export const REMOTE_SIMPLE_API_100ITEMS_PROPS: InfinityScrollPropTypes = {
  dataLoadPlace: 'remote',
  dataLoadSpeed: 'instant',
  dataUrl: `https://restapi.qoobeo.ru/api/v1/companys?start=1&end=100`,
  name: 'my scroll list name',
  selectorId: 'REMOTE_SIMPLE_API_100ITEMS',
  listType: 'list',
  listWrapperHeight: '290px',
  templateString: (element, listLength, elemNum: number) => `<li 
        class="REMOTE_simple_API_100ITEMS__listItem" 
        >
           ${element?.name} (elemNum - ${elemNum + 1})
    </li>`,
};
