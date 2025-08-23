import {
  greenLogStyle,
  grayLogStyle,
  redLogStyle,
  yellowLogStyle,
} from '../helpers/logStyles';

import { DOMTest } from './testFunctions';

export async function iScrollTester(): Promise<object> {
  this.testResults.errors.clear();

  console.log('iScrollTester log msg');

  const t = new DOMTest({ context: this });
  console.log(t);

  function showErrors() {
    console.log('%c ☆ Тест завершен! ☆ ', grayLogStyle);

    const errorCounter = Array.from(this.testResults.errors).reduce(
      (acc, item) => {
        const errorsSize = item[1].length;
        return acc + errorsSize;
      },
      0
    );

    if (this.testResults.errors.size !== 0) {
      console.log(
        `%c Тестов не пройдено: ${this.testResults.errors.size} <----`,
        yellowLogStyle
      );

      console.log(`%c Ошибок обнаружено: ${errorCounter} <----`, redLogStyle);

      this.testResults.errors.forEach((value, key) => {
        const allErrors = value;
        const errorName = key;
        console.log(`%c Тест: ${errorName}`, redLogStyle);
        allErrors.forEach((errorTxt, i) => {
          console.log(i + 1, errorTxt);
        });
      });
    } else {
      console.log(
        '%c ☆☆☆☆☆ Все тесты завершены без ошибок! Поздравляю! ☆☆☆☆☆',
        greenLogStyle
      );
    }
  }

  // const needToReset = false;
  const needToReset = true;

  // Start all tests

  await t.run.fastUpDownScrollDomTest(1, needToReset);
  await t.run.chaoticScrollDomTest(1, needToReset);
  await t.run.asyncChaoticScrollDomTest(1, needToReset);
  await t.run.smoothUpDownScrollDomTest(1, needToReset);
  await t.run.testLocalSimple100item(1, needToReset);
  await t.run.testRemoteLazyDummyjsonAPI(1, needToReset);
  console.log('after func');
  await t.run.testRemoteSimple500item(1);
  // await testRemoteSimple500item(1);
  // await testRemoteSimple500item(1);
  // await testRemoteSimple500item(1);
  // await testRemoteSimple500item(1);

  showErrors.call(this);
  // showErrors();
  return Promise.resolve(this.testResults);
}
