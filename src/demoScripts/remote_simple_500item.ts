import { InfinityScrollPropTypes } from '../js/types/InfinityScrollPropTypes';

export const REMOTE_SIMPLE_500ITEMS_PROPS: InfinityScrollPropTypes = {
  data: 'https://jsonplaceholder.typicode.com/comments',
  selectorId: 'REMOTE_SIMPLE_500ITEM',
  listType: 'list',
  forcedListLength: 410,
  listWrapperHeight: '590px',
  templateString: ({ item, listLength, idx }) => `<li 
        class="REMOTE_SIMPLE_500ITEM_List__listItem" 
        >
            <div class="listItemContainer">
             <p class="header"><em>User:</em> ${item.email} <span>(user.id - ${item.id})</span></p>
             <p class="descr"><em>Text:</em> ${item.body} </p>
           </div>
    </li>`,
};
