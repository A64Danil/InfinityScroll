import './js/scripts';

import BigDataList100 from '../mocks/bigList100.json'; // import mock data

import { InfinityScroll } from './js/infinityScroll';

import { LOCAL_BASIC_10000ITEMS_PROPS } from './demoScripts/local_basic_10000items';
import { LOCAL_SIMPLE_100ITEMS_PROPS } from './demoScripts/local_simple_100item';
import { REMOTE_SIMPLE_500ITEMS_PROPS } from './demoScripts/remote_simple_500item';
import { REMOTE_SIMPLE_API_100ITEMS_PROPS } from './demoScripts/remote_simple_API_100items';
import { REMOTE_LAZY_DUMMYJSON_API_PROPS } from './demoScripts/remote_lazy_dummyjson_API';
import { REMOTE_LAZY_API_PROPS } from './demoScripts/remote_lazy_API';
import { REMOTE_LAZY_100ITEMS_TABLE_ISCROLLAPI_PROPS } from './demoScripts/remote_lazy_100items_table_iscrollAPI';

console.log('Entry point');

(async () => {
  const loadDevStyles =
    process.env.NODE_ENV === 'development'
      ? // @ts-ignore
        () => import('./styles/main.scss')
      : () => Promise.resolve();

  await loadDevStyles();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const BigJson1 = BigDataList100.data;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // const BigJson2 = BigDataList10k.data;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // const BigJson3 = BigDataList100k.data;

  const pureList = document.getElementById(
    LOCAL_BASIC_10000ITEMS_PROPS.selectorId
  );

  if (pureList !== null) {
    console.log('Basic list Started');
    const myLazyScroll = new InfinityScroll(LOCAL_BASIC_10000ITEMS_PROPS);
  }

  const instantList = document.getElementById(
    LOCAL_SIMPLE_100ITEMS_PROPS.selectorId
  );
  if (instantList !== null) {
    console.log('Instant list Started');
    const myInstantScroll = new InfinityScroll(LOCAL_SIMPLE_100ITEMS_PROPS);
  }

  const remoteList = document.getElementById(
    REMOTE_SIMPLE_500ITEMS_PROPS.selectorId
  );

  if (remoteList !== null) {
    console.log('Remote list Started');
    const myLazyScroll = new InfinityScroll(REMOTE_SIMPLE_500ITEMS_PROPS);
  }

  const remoteListApi = document.getElementById(
    REMOTE_SIMPLE_API_100ITEMS_PROPS.selectorId
  );

  if (remoteListApi !== null) {
    console.log('Remote Api_100_items list Started');
    const myLazyScroll = new InfinityScroll(REMOTE_SIMPLE_API_100ITEMS_PROPS);
  }

  const lazyDummyJsonList = document.getElementById(
    REMOTE_LAZY_DUMMYJSON_API_PROPS.selectorId
  );

  if (lazyDummyJsonList !== null) {
    console.log('Lazy DummyJson list Started');
    const myLazyScroll = new InfinityScroll(REMOTE_LAZY_DUMMYJSON_API_PROPS);
  }

  const lazyAPIList = document.getElementById(REMOTE_LAZY_API_PROPS.selectorId);

  if (lazyAPIList !== null) {
    console.log('Lazy API list Started');
    const myLazyAPIScroll = new InfinityScroll(REMOTE_LAZY_API_PROPS);
  }

  const lazyAPIList100 = document.getElementById(
      REMOTE_LAZY_100ITEMS_TABLE_ISCROLLAPI_PROPS.selectorId
  );

  if (lazyAPIList100 !== null) {
    console.log('Lazy API list Started');
    const myLazyAPIScroll100 = new InfinityScroll(
        REMOTE_LAZY_100ITEMS_TABLE_ISCROLLAPI_PROPS
    );
  }

  const StartBtn: HTMLElement | null = document.querySelector<HTMLElement>(
    '#infinityScrollListStartBtn'
  );

  StartBtn?.addEventListener('click', () => {
    console.log('Nothing happens');
  });
})();
