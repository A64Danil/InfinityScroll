const greenLogStyle =
  'background-color: lightgreen; color: white; font-weight: bold;';

const darkGreenLogStyle =
  'background-color: darkgreen; color: white; font-weight: bold;';

const grayLogStyle = 'background-color: gray; color: white; font-weight: bold;';

const redLogStyle =
  'background-color: tomato; color: white; font-weight: bold;';

const yellowLogStyle =
  'background-color: yellow; color: #333; font-weight: bold;';

export function iScrollTester() {
  console.log('iScrollTester log msg');

  const { fillerHeight, elem: scrollElem } = this.vsb;

  const repeats = 33;
  const scrollStepSize = Math.ceil(fillerHeight / repeats);
  const chunkHeight = this.chunk.htmlHeight;

  const wait = (time = 0) =>
    new Promise((resolve) => {
      setTimeout(() => resolve(), time);
    });

  const scrollUp = () =>
    new Promise((resolve) => {
      const finishTime = repeats * 10 + 30;
      for (let i = 0; i < repeats; i++) {
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

  console.clear();
  console.log('start iScroll testing!');

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

  async function resetState() {
    console.log('%c || Reset iScoll State ||', grayLogStyle);
    await scrollToTopNow();
    await scrollDown();
    await scrollUp();
    return Promise.resolve();
  }

  function createAsyncTestFunction(name, fn) {
    async function newFn(delay = 3) {
      await testStartSignal(delay);
      console.log(`%c --- start  fn: ${name}  --- `, greenLogStyle);
      await fn();
      console.log(`%c --- end  fn: ${name}  --- `, greenLogStyle);
      await wait(200);
      await resetState();

      console.log(`%c --- END TEST: ${name}  --- `, darkGreenLogStyle);
    }
    return newFn;
  }

  const testLocalSimple100item = createAsyncTestFunction(
    'test__demoList_local_simple_100item',
    async () => {
      await scrollTo(3050, 1000);
      await scrollTo(2750, 200);
      await scrollToTop(50);
      await scrollTo(chunkHeight * 1.5, 500);
    }
  );

  const testRemoteSimple500item = createAsyncTestFunction(
    'demoList_remote_simple_500item',
    async () => {
      await scrollDown();
      await scrollUp();
    }
  );

  (async () => {
    await testLocalSimple100item();
    console.log('after func');
    await testRemoteSimple500item();
  })();

  //

  // scrollToBottom().

  // setTimeout(() => {
  //     console.log('before go bottom');
  //     scrollDown()
  //         .then(scrollUp)
  //     // scrollUp()
  //         .then(scrollDown)
  //         .then(scrollUp)
  //         .then(scrollDown)
  //         .then(scrollUp)
  //         .then(scrollDown)
  //         .then(scrollUp)
  //
  // }, 0);

  // this.vsb.elem.scrollTop = 3050;

  setTimeout(() => {
    // goTop();
    // scrollUp();
  }, 500);
  //
  setTimeout(() => {
    // this.vsb.elem.scrollTop = 2250;
  }, 1000);

  setTimeout(() => {
    // this.vsb.elem.scrollTop = 3250;
  }, 1200);
  // setTimeout(() => {
  //   console.log('before go bottom');
  //   // scrollDown()
  //   //     .then(scrollUp)
  // scrollUp()
  //       .then(scrollDown)
  //       .then(scrollUp)
  //       .then(scrollDown)
  //       .then(scrollUp)
  //       .then(scrollDown)
  //       .then(scrollUp)
  //   // goBottom();
  //   // .then(goTop)
  //   // .then(goBottom)
  //   // .then(goTop)
  //   // .then(goBottom)
  //   // .then(goTop)
  //   // .then(goBottom)
  //   // .then(goTop)
  //
  //   // goTop()
  //   //   .then(goBottom)
  //   //   .then(goTop)
  //   //   .then(goBottom)
  //   //   .then(goTop)
  //   //   .then(goBottom);
  // }, 3000);
}
