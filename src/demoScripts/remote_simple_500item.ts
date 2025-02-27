import { InfinityScrollPropTypes } from '../js/types/InfinityScrollPropTypes';

export const REMOTE_SIMPLE_500ITEMS_PROPS: InfinityScrollPropTypes = {
  data: 'https://jsonplaceholder.typicode.com/comments',
  selectorId: 'REMOTE_SIMPLE_500ITEM',
  listType: 'list',
  listWrapperHeight: '590px',
  templateString: (element, listLength, elemNum) => `<li 
        class="REMOTE_SIMPLE_500ITEM_List__listItem" 
        >
            <div class="listItemContainer">
             <p class="header"><em>User:</em> ${element.email} <span>(user.id - ${element.id})</span></p>
             <p class="descr"><em>Text:</em> ${element.body} </p>
           </div>
    </li>`,
};
