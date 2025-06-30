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
  this.tests.name = '';
  this.tests.errors.clear();

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

  function showErrors() {
    console.log('%c Тест завершен! ', grayLogStyle);

    const errorCounter = Array.from(this.tests.errors).reduce((acc, item) => {
      const errorsSize = item[1].length;
      return acc + errorsSize;
    }, 0);

    if (this.tests.errors.size !== 0) {
      console.log(
        `%c Тестов не пройдено: ${this.tests.errors.size} <----`,
        yellowLogStyle
      );

      console.log(`%c Ошибок обнаружено: ${errorCounter} <----`, redLogStyle);

      this.tests.errors.forEach((value, key) => {
        const allErrors = value;
        const errorName = key;
        console.log(`%c Тест: ${errorName}`, redLogStyle);
        allErrors.forEach((errorTxt, i) => {
          console.log(i + 1, errorTxt);
        });
      });
    } else {
      console.log(
        '%c ☆☆☆ Все тесты завершены без ошибок! Поздравляю! ☆☆☆',
        greenLogStyle
      );
    }
  }

  const createAsyncTestFunction = function fnWrapper(name, fn) {
    console.log(this);

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

  const testLocalSimple100item = createAsyncTestFunction(
    'LocalSimple100item',
    async () => {
      await scrollTo(3050, 1000);
      await scrollTo(2750, 200);
      await scrollToTop(50);
      await scrollTo(chunkHeight * 1.5, 500);
    }
  );

  const testRemoteSimple500item = createAsyncTestFunction(
    'RemoteSimple500item',
    async () => {
      await scrollDown();
      await scrollUp();
    }
  );

  const smoothUpDownScrollDomTest = createAsyncTestFunction(
    'smoothUpDownScrollDomTest',
    async () => {
      await scrollDown();
      await scrollUp();
      await scrollDown();
      await scrollUp();
      await scrollDown();
      await scrollUp();
      await scrollDown();
      await scrollUp();
      await scrollDown();
      await scrollUp();
    }
  );

  const fastUpDownScrollDomTest = createAsyncTestFunction(
    'chaoticScrollDomTest',
    async () => {
      ///
      await scrollToBottom();
      await scrollToTop(150);
      await scrollToBottom(150);
      await scrollToTop(150);
      await scrollToBottom(150);
      await scrollToTop(150);
      await scrollToBottom(150);
      await scrollToTop(150);
      await scrollToBottom(150);
      await scrollToTop(150);
      await scrollToBottom(150);
      await scrollToTop(150);
    }
  );

  const chaoticScrollDomTest = createAsyncTestFunction(
    'chaoticScrollDomTest',
    async () => {
      ///
      await scrollToNow(900);
      await scrollToBottomNow();
      await scrollTo(0, 300);
      await scrollTo(chunkHeight * 1.5, 300);
      await scrollTo(fillerHeight - chunkHeight * 1.5, 300);
      await scrollTo(chunkHeight * 3, 300);
      await scrollToNow(chunkHeight / 2);
      await scrollDown();
      await scrollToTopNow();
      await scrollToNow(fillerHeight / 2);
      await scrollDown();
      await scrollToNow(fillerHeight / 2);
      await scrollUp();
    }
  );

  const asyncChaoticScrollDomTest = createAsyncTestFunction(
    'asyncChaoticScrollDomTest',
    async () => {
      await scrollToNow(900);
      await scrollToBottomNow();
      await scrollTo(0, 300);
      scrollUp();
      await scrollTo(chunkHeight * 1.5, 300);
      await scrollTo(fillerHeight - chunkHeight * 1.5, 300);
      await scrollDown().then(async () => {
        scrollTo(chunkHeight * 3, 400);
        scrollTo(chunkHeight * 5, 800);
        scrollTo(chunkHeight, 1200);
        scrollToNow(chunkHeight / 2);
        await scrollUp();
        await scrollDown();
        await scrollUp();
        await scrollDown();
        await scrollUp();
        await scrollDown();
        await scrollUp();
        await scrollDown();
        await scrollUp();
      });
      await scrollDown();
      scrollToNow(fillerHeight / 2);
      scrollTo(fillerHeight / 2, 1200);
      await scrollDown();
      scrollToNow(fillerHeight / 2);
      await scrollUp();
    }
  );

  const needToReset = false;

  (async () => {
    await fastUpDownScrollDomTest(1, needToReset);
    await chaoticScrollDomTest(1, needToReset);
    await asyncChaoticScrollDomTest(1, needToReset);
    await smoothUpDownScrollDomTest(1, needToReset);
    await testLocalSimple100item(1, needToReset);
    console.log('after func');
    await testRemoteSimple500item(1);

    showErrors.call(this);
  })();

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
}
