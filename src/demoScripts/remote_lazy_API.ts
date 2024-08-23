import { InfinityScrollPropTypes } from '../js/types/InfinityScrollPropTypes';

export const REMOTE_LAZY_API_PROPS: InfinityScrollPropTypes = {
  dataLoadPlace: 'remote',
  // dataLoadSpeed: 'lazy',
  dataUrl: (start?: number, end?: number): string =>
    `https://restapi.qoobeo.ru/api/v1/companys?start=${start}&end=${end}`,
  name: 'my scroll list name',
  selectorId: 'REMOTE_LAZY_API',
  // 1 864 000
  forcedListLength: 17154017,
  // forcedListLength: 1000000,
  // maximal value is 33554400px
  // forcedListLength: 5000000, //    padding-bottom: 5.6445e+07px; transform: translate(0px, 3.35538e+07px);
  listType: 'list',
  listWrapperHeight: '290px',
  templateString: (element, listLength) => `<li 
        class="REMOTE_LAZY_API__listItem" >
           ${element?.name}
    </li>`,
};
