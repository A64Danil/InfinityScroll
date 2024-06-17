import { InfinityScrollPropTypes } from '../js/types/InfinityScrollPropTypes';

export const REMOTE_LAZY_API_PROPS_100ITEMS: InfinityScrollPropTypes = {
  dataLoadPlace: 'remote',
  dataLoadSpeed: 'lazy',
  dataUrl: (start?: number, end?: number): string =>
    `https://restapi.qoobeo.ru/api/v1/companys?start=${start}&end=${end}`,
  selectorId: 'REMOTE_LAZY_API_100ITEMS',
  forcedListLength: 100,
  listWrapperHeight: '290px',
  templateString: (element, listLength) => `<li 
        class="REMOTE_LAZY_API__listItem" 
        aria-setsize="${listLength}" 
        aria-posinset="${element?.id}"
        >
           ${element?.name}
    </li>`,
};
