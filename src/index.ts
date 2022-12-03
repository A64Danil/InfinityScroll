import './styles/main.scss';
import './js/scripts';

import BigDataList100 from '../mocks/bigList100.json'; // import mock data

import { InfinityScroll } from './js/infinityScroll';

import { SYNC_SIMPLE_100ITEMS_PROPS } from './demoScripts/sync_simple_100item';
import { ASYNC_SIMPLE_500ITEMS_PROPS } from './demoScripts/async_simple_500item';
import { SYNC_PURE_100ITEMS_PROPS } from './demoScripts/sync_pure_100item';

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

const instantList = document.getElementById(
  SYNC_SIMPLE_100ITEMS_PROPS.selectorId
);
if (instantList !== null) {
  console.log('Instant list Started');
  const myInstantScroll = new InfinityScroll(SYNC_SIMPLE_100ITEMS_PROPS);
}

const lazyList = document.getElementById(
  ASYNC_SIMPLE_500ITEMS_PROPS.selectorId
);

if (lazyList !== null) {
  console.log('Lazy list Started');
  const myLazyScroll = new InfinityScroll(ASYNC_SIMPLE_500ITEMS_PROPS);
}

const pureList = document.getElementById(SYNC_PURE_100ITEMS_PROPS.selectorId);

if (pureList !== null) {
  console.log('Lazy list Started');
  const myLazyScroll = new InfinityScroll(SYNC_PURE_100ITEMS_PROPS);
}

const StartBtn: HTMLElement | null = document.querySelector<HTMLElement>(
  '#infinityScrollListStartBtn'
);

StartBtn?.addEventListener('click', () => {
  console.log('Nothing happens');
});
