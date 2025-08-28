import {
  greenLogStyle,
  grayLogStyle,
  redLogStyle,
  yellowLogStyle,
} from '../helpers/logStyles';

import { DOMTest } from './testFunctions';

const reportLog = console.log;

export async function iScrollTester(): Promise<object> {
  this.testResults.errors.clear();
  this.testResults.listName = `${this.testResults.listName} (${this.vsb.deviceType} - ${this.vsb.browserName})`;

  console.log('iScrollTester log msg');

  const t = new DOMTest({ context: this });
  console.log(t);

  function showErrors() {
    reportLog('%c ☆ Тест завершен! ☆ ', grayLogStyle);

    const errorCounter = Array.from(this.testResults.errors).reduce(
      (acc, item) => {
        const errorsSize = item[1].length;
        return acc + errorsSize;
      },
      0
    );

    if (this.testResults.errors.size !== 0) {
      reportLog(
        `%c Тестов не пройдено: ${this.testResults.errors.size} <----`,
        yellowLogStyle
      );

      reportLog(`%c Ошибок обнаружено: ${errorCounter} <----`, redLogStyle);

      this.testResults.errors.forEach((value, key) => {
        const allErrors = value;
        const errorName = key;
        reportLog(`%c Тест: ${errorName}`, redLogStyle);
        allErrors.forEach((errorTxt, i) => {
          reportLog(i + 1, errorTxt);
        });
      });
    } else {
      reportLog(
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
