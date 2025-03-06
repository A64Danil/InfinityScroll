import { InfinityScrollPropTypes } from '../js/types/InfinityScrollPropTypes';

export const REMOTE_SIMPLE_API_100ITEMS_PROPS: InfinityScrollPropTypes = {
  data: `https://restapi.qoobeo.ru/api/v1/companys?start=5000&end=5100`,
  selectorId: 'REMOTE_SIMPLE_API_100ITEMS',
  listType: 'list',
  listWrapperHeight: '490px',
  templateString: ({ item, listLength, idx }) => `<li 
        class="REMOTE_SIMPLE_API_100ITEMS__listItem" 
        >
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
