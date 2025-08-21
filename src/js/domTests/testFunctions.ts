import { darkGreenLogStyle, greenLogStyle } from '../helpers/logStyles';
// TODO: move to helpers?
const wait = (time = 0) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(), time);
  });

export class DOMTest {
  private vsb: any;

  private fillerHeight: number;

  private scrollElem: HTMLElement;

  private repeats: number;

  private scrollStepSize: number;

  private chunkHeight: number;

  constructor({ vsb, chunk }: { vsb: any; chunk: any }) {
    this.vsb = vsb;

    this.fillerHeight = vsb.fillerHeight;
    this.scrollElem = vsb.elem;
    this.repeats = 33;

    this.scrollStepSize = Math.ceil(this.fillerHeight / this.repeats);
    this.chunkHeight = chunk.htmlHeight;
  }
}

const scrollUp = () =>
  new Promise((resolve) => {
    const finishTime = repeats * 10 + 30;
    for (let i = 0; i < repeats; i++) {
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      setTimeout(() => {
        this.vsb.elem.scrollTop -= scrollStepSize;
      }, 10 * i);
    }
    setTimeout(() => resolve(), finishTime);
  });

const scrollDown = () =>
  new Promise((resolve) => {
    const finishTime = repeats * 10 + 30;
    for (let i = 0; i < repeats; i++) {
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      setTimeout(() => {
        this.vsb.elem.scrollTop += scrollStepSize;
      }, 10 * i);
    }
    setTimeout(() => resolve(), finishTime);
  });

const scrollToNow = (offset: number) =>
  new Promise((resolve) => {
    scrollElem.scrollTop = offset;
    setTimeout(resolve, 0);
  });

const scrollTo = (offset: number, delay = 0) =>
  new Promise<void>((resolve) => {
    setTimeout(async () => {
      await scrollToNow(offset);
      resolve();
    }, delay);
  });

const scrollToTop = (delay = 0) => scrollTo(0, delay);
const scrollToBottom = (delay = 0) => scrollTo(fillerHeight, delay);

const scrollToTopNow = () => scrollToNow(0);
const scrollToBottomNow = () => scrollToNow(fillerHeight);

async function testStartSignal(counterValue = 3) {
  for (let i = counterValue; i > 0; i--) {
    setTimeout(() => {
      console.log(`%c ${i}! `, greenLogStyle);
    }, 1000 * (counterValue - i));
  }

  return new Promise((resolve) => {
    setTimeout(resolve, counterValue * 1000);
  });
}

const createAsyncTestFunction = function fnWrapper(name, fn) {
  const newFn = async (delay = 3, needToResetState = true) => {
    this.tests.name = name;
    await testStartSignal(delay);
    console.log(`%c --- start  fn: ${name}  --- `, greenLogStyle);
    await fn();
    console.log(`%c --- end  fn: ${name}  --- `, greenLogStyle);
    await wait(200);
    if (needToResetState) {
      await resetState();
    }

    this.tests.name = '';
    console.log(`%c --- END TEST: ${name}  --- `, darkGreenLogStyle);
  };

  return newFn;
}.bind(this);
