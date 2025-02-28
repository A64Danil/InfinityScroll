import { InfinityScrollPropTypes } from '../js/types/InfinityScrollPropTypes';

export const REMOTE_SIMPLE_API_100ITEMS_PROPS: InfinityScrollPropTypes = {
  data: `https://restapi.qoobeo.ru/api/v1/companys?start=5000&end=5100`,
  name: 'my scroll list name',
  selectorId: 'REMOTE_SIMPLE_API_100ITEMS',
  listType: 'list',
  listWrapperHeight: '490px',
  templateString: (element, listLength, elemNum) => `<li 
        class="REMOTE_SIMPLE_API_100ITEMS__listItem" 
        >
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
