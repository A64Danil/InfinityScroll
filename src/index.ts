import './js/scripts';

import BigDataList100 from '../mocks/bigList100.json'; // import mock data

import { InfinityScroll } from './js/infinityScroll';
import { InfinityScrollProps } from './js/types/InfinityScrollPropTypes';

import { LOCAL_BASIC_10000ITEMS_PROPS } from './demoScripts/local_basic_10000items';
import { LOCAL_SIMPLE_100ITEMS_PROPS } from './demoScripts/local_simple_100item';
import { REMOTE_SIMPLE_500ITEMS_PROPS } from './demoScripts/remote_simple_500item';
import { REMOTE_SIMPLE_API_100ITEMS_PROPS } from './demoScripts/remote_simple_API_100items';
import { REMOTE_SIMPLE_15ITEMS_DUMMYJSON_API_PROPS } from './demoScripts/remote_simple_15items_dummyjson_API';
import { REMOTE_LAZY_DUMMYJSON_API_PROPS } from './demoScripts/remote_lazy_dummyjson_API';
import { REMOTE_LAZY_API_PROPS } from './demoScripts/remote_lazy_API';
import { REMOTE_LAZY_100ITEMS_TABLE_ISCROLLAPI_PROPS } from './demoScripts/remote_lazy_100items_table_iscrollAPI';
import { REMOTE_LAZY_5KK_ITEMS_TABLE_ISCROLLAPI_PROPS } from './demoScripts/remote_lazy_5kk_items_table_iscrollAPI';

console.log('Entry point');

(async () => {
  const loadDevStyles =
    process.env.NODE_ENV === 'development'
      ? // @ts-ignore
        () => import('./styles/main.scss')
      : () => Promise.resolve();

  await loadDevStyles();

  window.iScroll = [] as InfinityScroll[];

  const listElements = [
    LOCAL_BASIC_10000ITEMS_PROPS,
    LOCAL_SIMPLE_100ITEMS_PROPS,
    REMOTE_SIMPLE_500ITEMS_PROPS,
    REMOTE_SIMPLE_API_100ITEMS_PROPS,
    REMOTE_SIMPLE_15ITEMS_DUMMYJSON_API_PROPS,
    REMOTE_LAZY_DUMMYJSON_API_PROPS,
    REMOTE_LAZY_API_PROPS,
    REMOTE_LAZY_100ITEMS_TABLE_ISCROLLAPI_PROPS,
    REMOTE_LAZY_5KK_ITEMS_TABLE_ISCROLLAPI_PROPS,
  ].map((props) => {
    const el = document.getElementById(props.selectorId);
    if (el !== null) {
      return {
        props,
        instance: new InfinityScroll(props),
      };
    }
    return null;
  }).filter(Boolean);


  const allInstancePromises = listElements.map(({ props, instance }: { props: InfinityScrollProps ; instance: InfinityScroll }) => {
    const name = props.selectorId.replaceAll('_', ' ').toLowerCase();

    return instance.status.whenReady()
        .then(() => {
          console.log(`"${name}" list is ready!`);
          console.log("Status is " + instance.status.is);
          window.iScroll.push(instance);
          return {instance, success: true, error: null}
        })
        .catch(error => ({ instance, success: false, error }))

  });

  Promise.allSettled(allInstancePromises).then(results => {
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success));

    console.log('---------------');
    console.log(`All instances processed! Success: ${successful.length}, Failed: ${failed.length}`);
    console.log('Successful instances:', successful.map(r => r.value?.instance));
    console.log('Failed instances:', failed.map(r => r.value?.instance || r.reason));
  });

  const StartBtn: HTMLElement | null = document.querySelector<HTMLElement>(
    '#infinityScrollListStartBtn'
  );

  StartBtn?.addEventListener('click', () => {
    console.log('Nothing happens');
  });
})();
