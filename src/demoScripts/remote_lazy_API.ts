import { InfinityScrollPropTypes } from '../js/types/InfinityScrollPropTypes';

export const REMOTE_LAZY_API_PROPS: InfinityScrollPropTypes = {
  data: ({ start, end }): string =>
    `https://restapi.qoobeo.ru/api/v1/companys?start=${start}&end=${end}`,
  selectorId: 'REMOTE_LAZY_API',
  forcedListLength: 17154017,
  // forcedListLength: 1000000,
  // maximal value is 33554400px
  // forcedListLength: 5000000, //    padding-bottom: 5.6445e+07px; transform: translate(0px, 3.35538e+07px);
  listType: 'list',
  templateString: ({ item, listLength, idx }) => `<li 
        class="REMOTE_LAZY_API__listItem" >
            <div class="contentWrapper">
              <p class="title">
                <em>Company:</em> ${item?.name} 
                <span>(${idx})</span>
                </p>
              <p class="desc">
                <em>website:</em> ${item?.website}  <em>(industry: ${item?.industry})</em> 
              </p>
              
            </div>
</li>`,
};
