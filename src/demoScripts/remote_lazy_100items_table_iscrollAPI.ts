import { InfinityScrollPropTypes } from '../js/types/InfinityScrollPropTypes';

export const REMOTE_LAZY_100ITEMS_TABLE_ISCROLLAPI_PROPS: InfinityScrollPropTypes = {
  data: ({ start, end }): string =>
    `https://restapi.qoobeo.ru/api/v1/companys?start=${start}&end=${end}&isFullSchema=true`,
  selectorId: 'REMOTE_LAZY_100ITEMS_TABLE_ISCROLLAPI',
  forcedListLength: 100,
  listType: 'table',
  tHeadNames: ['id', 'name', 'industry', 'founded', 'size', 'city (state)'],
  templateString: (element, listLength, elemNum) => `<tr
        class="REMOTE_LAZY_100ITEMS_TABLE_ISCROLLAPI__listItem" 
        >
          <td>${element?.id}</td>
          <td>${element?.name} (${element?.country_code})</td>
          <td>${element?.industry}</td>
          <td>${element?.founded}</td>
          <td>${element?.size}</td>
          <td>${element?.city} (${element?.state})</td>
    </tr>`,
};
