import { InfinityScroll } from '../infinityScroll';

declare global {
  interface Window {
    iScroll: InfinityScroll[];
  }
}

export {};
