import './styles/main.scss';
import './js/scripts';

import BigDataList100 from '../mocks/bigList100.json'; // import mock data

import { InfinityScroll } from './js/infinityScroll';

import { TemplateStringFunction } from './js/types/TemplateStringFunction';

console.log('Entry point');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BigJson1 = BigDataList100.data;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// const BigJson2 = BigDataList10k.data;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// const BigJson3 = BigDataList100k.data;

//
// interface ListData {
//   name: string;
//   number: number;
// }

interface InfinityScrollPropTypes {
  data: object[];
  dataLoadType: 'instant' | 'lazy';
  dataUrl?: URL;
  name: string;
  selectorId: string;
  listType: 'list' | 'table';
  listWrapperHeight: string;
  templateString: TemplateStringFunction;
}

const instantListProps: InfinityScrollPropTypes = {
  data: BigJson1,
  dataLoadType: 'instant',
  name: 'my scroll list name',
  selectorId: 'instantInfinityScrollWrapper',
  listType: 'list',
  listWrapperHeight: '350px',
  templateString: (element: object, listLength?: number): string => `<li 
        class="Demo_infinityScrollList__listItem" 
        aria-setsize="${listLength}" 
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
  listWrapperHeight: '290px',
  templateString: (element: object, listLength?: number): string => `<li 
        class="infinityScrollList__listItem" 
        aria-setsize="${listLength}" 
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
