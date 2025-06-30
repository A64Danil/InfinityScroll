const logStyle =
  'background-color: lightgreen; color: white; font-weight: bold;';

export function iScrollTester() {
  console.log('iScrollTester log msg');

  const { fillerHeight, elem: scrollElem } = this.vsb;

  const repeats = 33;
  const scrollStepSize = Math.ceil(fillerHeight / repeats);
  const chunkHeight = this.chunk.htmlHeight;

  const wait = (time: number) =>
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
      resolve();
    });

  const scrollTo = (offset: number, delay = 0) =>
    new Promise((resolve) => {
      setTimeout(() => {
        scrollToNow(offset);
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
        console.log(`%c ${i}! `, logStyle);
      }, 1000 * (counterValue - i));
    }

    return new Promise((resolve) => {
      setTimeout(resolve, counterValue * 1000);
    });
    // console.log('%c 3! ', logStyle);
    // await wait(1000);
  }
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async function test__demoList_local_simple_100item() {
    console.log('%c --- start demoList_local_simple_100item --- ', logStyle);
    await scrollTo(3050, 1000);
    await scrollTo(2750, 200);
    await scrollToTop(50);
    await scrollTo(chunkHeight * 1.5, 500);
    // console.log('before return')
    return Promise.resolve();
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  async function test__demoList_remote_simple_500item() {
    console.log('%c --- start demoList_remote_simple_500item --- ', logStyle);
    await scrollDown();
    await scrollUp();
  }

  (async function () {
    await testStartSignal();
    // await test__demoList_local_simple_100item();
    // await testStartSignal();
    await test__demoList_remote_simple_500item();
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
