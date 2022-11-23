import './styles/main.scss';
import './js/scripts';

import BigDataList100 from '../mocks/bigList100.json'; // import mock data

import { InfinityScroll } from './js/infinityScroll';

console.log('Entry point');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BigJson1 = BigDataList100.data;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// const BigJson2 = BigDataList10k.data;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// const BigJson3 = BigDataList100k.data;

type TplStringFn = (el: unknown, context: InfinityScroll) => string;

interface ListData {
  name: string;
  number: number;
}

interface InfinityScrollPropTypes {
  data?: Array<ListData>;
  dataLoadType: 'instant' | 'lazy';
  dataUrl?: string;
  name: string;
  selectorId: string;
  listType: 'list' | 'table';
  templateString: TplStringFn;
}

const instantListProps: InfinityScrollPropTypes = {
  data: BigJson1,
  dataLoadType: 'instant',
  name: 'my scroll list name',
  selectorId: 'instantInfinityScrollWrapper',
  listType: 'list',
  templateString: (
    element: unknown,
    parentList?: InfinityScroll
  ): string => `<li 
        class="Demo_infinityScrollList__listItem" 
        aria-setsize="${parentList.LIST_LENGTH}" 
        aria-posinset="${element.number + 1}"
        >
            ${element.name} ${element.number + 1}
    </li>`,
};

const lazyListProps: InfinityScrollPropTypes = {
  data: BigJson1,
  dataLoadType: 'lazy',
  dataUrl: 'https://jsonplaceholder.typicode.com/comments',
  name: 'my scroll list name',
  selectorId: 'lazyInfinityScrollWrapper',
  listType: 'list',
  templateString: (
    element: unknown,
    parentList?: InfinityScroll
  ): string => `<li 
        class="infinityScrollList__listItem" 
        aria-setsize="${parentList.LIST_LENGTH}" 
        aria-posinset="${element.id}"
        >
            ${element.email} ${element.id}
    </li>`,
};

const instantList = document.getElementById(instantListProps.selectorId);
if (instantList !== null) {
  console.log('Instant list Started');
  const myInstantScroll = new InfinityScroll(instantListProps);
}

const lazyList = document.getElementById(lazyListProps.selectorId);

if (lazyList !== null) {
  console.log('Lazy list Started');
  const myLazyScroll = new InfinityScroll(lazyListProps);
}

const StartBtn: HTMLElement | null = document.querySelector<HTMLElement>(
  '#infinityScrollListStartBtn'
);

StartBtn?.addEventListener('click', () => {
  console.log('Nothing happens');
});
