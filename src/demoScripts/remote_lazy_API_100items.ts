import { InfinityScrollPropTypes } from '../js/types/InfinityScrollPropTypes';

export const REMOTE_LAZY_API_PROPS_100ITEMS: InfinityScrollPropTypes = {
  data: ({ start, end }): string =>
    `https://restapi.qoobeo.ru/api/v1/companys?start=${start}&end=${end}`,
  selectorId: 'REMOTE_LAZY_API_100ITEMS',
  forcedListLength: 100,
  listWrapperHeight: '290px',
  templateString: (element, listLength, elemNum) => `<li 
        class="REMOTE_LAZY_API__listItem" 
        >
           ${element?.name} (elemNum - ${elemNum})
    </li>`,
};
