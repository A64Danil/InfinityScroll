import { InfinityScrollPropTypes } from '../js/types/InfinityScrollPropTypes';

export const REMOTE_LAZY_API_PROPS: InfinityScrollPropTypes = {
  data: ({ start, end }): string =>
    `https://restapi.qoobeo.ru/api/v1/companys?start=${start}&end=${end}`,
  name: 'my scroll list name',
  selectorId: 'REMOTE_LAZY_API',
  forcedListLength: 17154017,
  // forcedListLength: 1000000,
  // maximal value is 33554400px
  // forcedListLength: 5000000, //    padding-bottom: 5.6445e+07px; transform: translate(0px, 3.35538e+07px);
  listType: 'list',
  templateString: (element, listLength, elemNum) => `<li 
        class="REMOTE_LAZY_API__listItem" >
            <div class="contentWrapper">
              <p class="title">
                <em>Company:</em> ${element?.name} 
                <span>(${elemNum})</span>
                </p>
              <p class="desc">
                <em>website:</em> ${element?.website}  <em>(industry: ${element?.industry})</em> 
              </p>
              
            </div>
</li>`,
};
