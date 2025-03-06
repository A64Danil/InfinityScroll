import { InfinityScrollPropTypes } from '../js/types/InfinityScrollPropTypes';

export const REMOTE_LAZY_100ITEMS_TABLE_ISCROLLAPI_PROPS: InfinityScrollPropTypes = {
  data: ({ start, end }): string =>
    `https://restapi.qoobeo.ru/api/v1/companys?start=${start}&end=${end}&isFullSchema=true`,
  selectorId: 'REMOTE_LAZY_100ITEMS_TABLE_ISCROLLAPI',
  forcedListLength: 100,
  listType: 'table',
  tHeadNames: ['id', 'name', 'industry', 'founded', 'size', 'city (state)'],
  templateString: ({ item, listLength, idx }) => `<tr
        class="REMOTE_LAZY_100ITEMS_TABLE_ISCROLLAPI__listItem" 
        >
          <td>${item?.id}</td>
          <td>${item?.name} (${item?.country_code})</td>
          <td>${item?.industry}</td>
          <td>${item?.founded}</td>
          <td>${item?.size}</td>
          <td>${item?.city} (${item?.state})</td>
    </tr>`,
};
