import {
  darkGreenLogStyle,
  grayLogStyle,
  greenLogStyle,
} from '../helpers/logStyles';

import type { InfinityScroll } from '../infinityScroll';

import { wait } from '../helpers';

export class DOMTest {
  private vsb: any;

  private fillerHeight: number;

  private scrollElem: HTMLElement;

  private repeats: number;

  private scrollStepSize: number;

  private chunkHeight: number;

  private context: InfinityScroll;

  public run: Record<
    string,
    (delay: number, needToResetState?: boolean) => Promise<void>
  > = {};

  constructor({ context }: { context: InfinityScroll }) {
    this.context = context;
    this.vsb = context.vsb;

    this.fillerHeight = context.vsb.fillerHeight;
    this.scrollElem = context.vsb.elem;
    this.repeats = 33;

    this.scrollStepSize = Math.ceil(this.fillerHeight / this.repeats);
    this.chunkHeight = context.chunk.htmlHeight;

    this.init();
  }

  init() {
    this.createMethods();
  }

  async resetState() {
    console.log('%c || Reset iScoll State ||', grayLogStyle);
    await this.scrollToTopNow();
    await this.scrollDown();
    await this.scrollUp();
    return Promise.resolve();
  }

  scrollUp = () =>
    new Promise<void>((resolve) => {
      const finishTime = this.repeats * 10 + 30;
      for (let i = 0; i < this.repeats; i++) {
        // eslint-disable-next-line @typescript-eslint/no-loop-func
        setTimeout(() => {
          this.vsb.elem.scrollTop -= this.scrollStepSize;
        }, 10 * i);
      }
      setTimeout(() => resolve(), finishTime);
    });

  scrollDown = () =>
    new Promise<void>((resolve) => {
      const finishTime = this.repeats * 10 + 30;
      for (let i = 0; i < this.repeats; i++) {
        // eslint-disable-next-line @typescript-eslint/no-loop-func
        setTimeout(() => {
          this.vsb.elem.scrollTop += this.scrollStepSize;
        }, 10 * i);
      }
      setTimeout(() => resolve(), finishTime);
    });

  scrollToNow = (offset: number) =>
    new Promise((resolve) => {
      this.scrollElem.scrollTop = offset;
      setTimeout(resolve, 0);
    });

  scrollTo = (offset: number, delay = 0) =>
    new Promise<void>((resolve) => {
      setTimeout(async () => {
        await this.scrollToNow(offset);
        resolve();
      }, delay);
    });

  scrollToTop = (delay = 0) => this.scrollTo(0, delay);

  scrollToBottom = (delay = 0) => this.scrollTo(this.fillerHeight, delay);

  scrollToTopNow = () => this.scrollToNow(0);

  scrollToBottomNow = () => this.scrollToNow(this.fillerHeight);

  // eslint-disable-next-line class-methods-use-this
  async testStartSignal(counterValue = 3) {
    for (let i = counterValue; i > 0; i--) {
      setTimeout(() => {
        console.log(`%c ${i}! `, greenLogStyle);
      }, 1000 * (counterValue - i));
    }

    return new Promise((resolve) => {
      setTimeout(resolve, counterValue * 1000);
    });
  }

  createAsyncTestFunction(name: string, fn: () => Promise<void>) {
    const newFn = async (delay = 3, needToResetState = true) => {
      this.context.testResults.currentTestName = name;
      await this.testStartSignal(delay);
      console.log(`%c --- start  fn: ${name}  --- `, greenLogStyle);
      await fn();
      console.log(`%c --- end  fn: ${name}  --- `, greenLogStyle);
      await wait(200);
      if (needToResetState) {
        await this.resetState();
      }

      this.context.testResults.currentTestName = '';
      console.log(`%c --- END TEST: ${name}  --- `, darkGreenLogStyle);
    };

    return newFn;
  }

  createMethods() {
    this.run.testLocalSimple100item = this.createAsyncTestFunction(
      'LocalSimple100item',
      async () => {
        await this.scrollTo(3050, 1000);
        await this.scrollTo(2750, 200);
        await this.scrollToTop(50);
        await this.scrollTo(this.chunkHeight * 1.5, 500);
      }
    );

    this.run.testRemoteSimple500item = this.createAsyncTestFunction(
      'RemoteSimple500item',
      async () => {
        await this.scrollDown();
        await this.scrollUp();
      }
    );

    this.run.testRemoteLazyDummyjsonAPI = this.createAsyncTestFunction(
      'testRemoteLazyDummyjsonAPI',
      async () => {
        await this.scrollToNow(900);
        await this.scrollToBottomNow();
        await this.scrollTo(0, 300);
        await this.scrollTo(this.chunkHeight * 1.5, 300);
        await this.scrollTo(this.fillerHeight - this.chunkHeight * 1.5, 300);
        await this.scrollTo(this.chunkHeight * 3, 300);
        await this.scrollToNow(this.chunkHeight / 2);
        await this.scrollDown();
        await this.scrollToTopNow();
        await this.scrollToNow(this.fillerHeight / 2);
        await this.scrollDown();
        await this.scrollToNow(this.fillerHeight / 2);
        await this.scrollUp();
        console.warn('-------------------');
        await this.scrollToNow(900);
        await this.scrollToBottomNow();
        await this.scrollTo(0, 300);
        this.scrollUp();
        await this.scrollTo(this.chunkHeight * 1.5, 300);
        await this.scrollTo(this.fillerHeight - this.chunkHeight * 1.5, 300);
        await this.scrollDown().then(async () => {
          this.scrollTo(this.chunkHeight * 3, 400);
          this.scrollTo(this.chunkHeight * 5, 800);
          this.scrollTo(this.chunkHeight, 1200);
          this.scrollToNow(this.chunkHeight / 2);
          await this.scrollUp();
          await this.scrollDown();
          await this.scrollUp();
          await this.scrollDown();
          await this.scrollUp();
          await this.scrollDown();
          await this.scrollUp();
          await this.scrollDown();
          await this.scrollUp();
        });
        await this.scrollDown();
        this.scrollToNow(this.fillerHeight / 2);
        this.scrollTo(this.fillerHeight / 2, 1200);
        await this.scrollDown();
        this.scrollToNow(this.fillerHeight / 2);
        await this.scrollUp();
      }
    );

    this.run.smoothUpDownScrollDomTest = this.createAsyncTestFunction(
      'smoothUpDownScrollDomTest',
      async () => {
        await this.scrollDown();
        await this.scrollUp();
        await this.scrollDown();
        await this.scrollUp();
        await this.scrollDown();
        await this.scrollUp();
        await this.scrollDown();
        await this.scrollUp();
        await this.scrollDown();
        await this.scrollUp();
      }
    );

    this.run.fastUpDownScrollDomTest = this.createAsyncTestFunction(
      'fastUpDownScrollDomTest',
      async () => {
        ///
        await this.scrollToBottom();
        await this.scrollToTop(150);
        await this.scrollToBottom(150);
        await this.scrollToTop(150);
        await this.scrollToBottom(150);
        await this.scrollToTop(150);
        await this.scrollToBottom(150);
        await this.scrollToTop(150);
        await this.scrollToBottom(150);
        await this.scrollToTop(150);
        await this.scrollToBottom(150);
        await this.scrollToTop(150);
      }
    );

    this.run.chaoticScrollDomTest = this.createAsyncTestFunction(
      'chaoticScrollDomTest',
      async () => {
        ///
        await this.scrollToNow(900);
        await this.scrollToBottomNow();
        await this.scrollTo(0, 300);
        await this.scrollTo(this.chunkHeight * 1.5, 300);
        await this.scrollTo(this.fillerHeight - this.chunkHeight * 1.5, 300);
        await this.scrollTo(this.chunkHeight * 3, 300);
        await this.scrollToNow(this.chunkHeight / 2);
        await this.scrollDown();
        await this.scrollToTopNow();
        await this.scrollToNow(this.fillerHeight / 2);
        await this.scrollDown();
        await this.scrollToNow(this.fillerHeight / 2);
        await this.scrollUp();
      }
    );

    this.run.asyncChaoticScrollDomTest = this.createAsyncTestFunction(
      'asyncChaoticScrollDomTest',
      async () => {
        await this.scrollToNow(900);
        await this.scrollToBottomNow();
        await this.scrollTo(0, 300);
        this.scrollUp();
        await this.scrollTo(this.chunkHeight * 1.5, 300);
        await this.scrollTo(this.fillerHeight - this.chunkHeight * 1.5, 300);
        await this.scrollDown().then(async () => {
          this.scrollTo(this.chunkHeight * 3, 400);
          this.scrollTo(this.chunkHeight * 5, 800);
          this.scrollTo(this.chunkHeight, 1200);
          this.scrollToNow(this.chunkHeight / 2);
          await this.scrollUp();
          await this.scrollDown();
          await this.scrollUp();
          await this.scrollDown();
          await this.scrollUp();
          await this.scrollDown();
          await this.scrollUp();
          await this.scrollDown();
          await this.scrollUp();
        });
        await this.scrollDown();
        this.scrollToNow(this.fillerHeight / 2);
        this.scrollTo(this.fillerHeight / 2, 1200);
        await this.scrollDown();
        this.scrollToNow(this.fillerHeight / 2);
        await this.scrollUp();
      }
    );
  }
}
