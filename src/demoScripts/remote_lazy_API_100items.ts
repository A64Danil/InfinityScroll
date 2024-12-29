import { InfinityScrollPropTypes } from '../js/types/InfinityScrollPropTypes';

export const REMOTE_LAZY_API_PROPS_100ITEMS: InfinityScrollPropTypes = {
  data: ({ start, end }): string =>
    `https://restapi.qoobeo.ru/api/v1/companys?start=${start}&end=${end}&isFullSchema=true`,
  selectorId: 'REMOTE_LAZY_API_100ITEMS',
  forcedListLength: 100,
  listType: 'table',
  templateString: (element, listLength, elemNum) => `<tr
        class="REMOTE_LAZY_API_100ITEMS__listItem" 
        >
          <td>#${elemNum} - id${element?.id}</td>
          <td>${element?.name} (${element?.country_code})</td>
          <td>${element?.industry}</td>
          <td>${element?.founded}</td>
          <td>${element?.size}</td>
          <td>${element?.city} (${element?.state})</td>
    </tr>`,
};
