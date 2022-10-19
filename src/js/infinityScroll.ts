import BigDataList1 from '../../mocks/bigList100.json'; // import mock data
import BigDataList2 from '../../mocks/bigList100000.json'; // import mock data

console.log('TS file loaded');

const InfinityList: HTMLOListElement | null = document.querySelector<HTMLElement>(
  '#infinityScrollList'
);

const StartBtn: HTMLButtonElement | null = document.querySelector<HTMLElement>(
  '#infinityScrollListStartBtn'
);

let GLOBAL_ITEM_COUNTER = 0;

const delay = 0;

const CurrentBigList = BigDataList1.data;

const MAX_LENGTH = CurrentBigList.length;

console.log('MAX_LENGTH', MAX_LENGTH);

let MAX_LIST_SIZE = 1;

let currentListScroll = 0;
let chunkAmount = 1;
let listHeight = 1;
let listItemHeight = 1;

const renderedRange = {
  start: 1,
  end: chunkAmount * 4,
};
/* Давайте посчитаем все промежуточные переменные:
1) Высота всего списка, чтобы понимать "размер" блоков (чанков)
2) Высота пункта списка, чтобы понимать сколько пунктов влезает в чанк (сколько грузить за раз)
3) Используем высоту чанка чтобы регулировать отступы
4) Держим в памяти число, указывающее на начальный пункт списка в чанке - currentListScroll
5) При переходе к след/пред чанку выполняем действия с ДОМ и отступами

 */
const getAllSizes = (bigListNode: HTMLElement) => {
  const list = bigListNode;
  const listStyles = window.getComputedStyle(list);
  const listItem = list.firstChild as HTMLElement;

  listHeight =
    parseInt(window.getComputedStyle(list).getPropertyValue('height'), 10) || 1;

  if (listHeight < 2) {
    console.error('You must set height to your list!');
    return;
  }

  listItemHeight = listItem?.offsetHeight || listHeight;

  chunkAmount = Math.ceil(listHeight / listItemHeight);

  console.log(listHeight);
  console.log(listItemHeight);
  console.log(chunkAmount);

  MAX_LIST_SIZE = chunkAmount * 4;
};

const TAG_TPL = function (name: string, number: string | number) {
  return `<li class="infinityScroll__listItem">${name} ${number}</li>`;
};

let timerId;

const fillList = function () {
  console.log('AGAIN!');
  console.log('GLOBAL_ITEM_COUNTER', GLOBAL_ITEM_COUNTER);
  console.log('MAX_LIST_SIZE', MAX_LIST_SIZE);
  if (
    GLOBAL_ITEM_COUNTER > 49999 ||
    GLOBAL_ITEM_COUNTER >= MAX_LENGTH ||
    GLOBAL_ITEM_COUNTER >= MAX_LIST_SIZE
  )
    return;

  let templateFragments = '';
  for (
    let i = 0;
    i < 1000 &&
    i < MAX_LENGTH - 1 &&
    GLOBAL_ITEM_COUNTER < MAX_LENGTH &&
    GLOBAL_ITEM_COUNTER < MAX_LIST_SIZE;
    i++
  ) {
    const element = CurrentBigList[GLOBAL_ITEM_COUNTER];
    templateFragments += TAG_TPL(element.name, element.number);
    GLOBAL_ITEM_COUNTER++;
  }

  InfinityList.innerHTML += templateFragments;

  timerId = setTimeout(fillList, delay);
};

const addItemsToList = function (sequenceNumber: number) {
  if (sequenceNumber < MAX_LIST_SIZE) {
    console.log('sequenceNumber = ', sequenceNumber);
    console.log('Пока рендерить не надо');
    return;
  }

  let templateFragments = '';

  for (let i = 0; i < 1000 && i < chunkAmount; i++) {
    const elemNum = i + sequenceNumber;
    const element = CurrentBigList[elemNum];
    templateFragments += TAG_TPL(element.name, element.number);
    // console.log(element);
  }
  InfinityList.innerHTML += templateFragments;
};

const modifyCurrentDOM = function () {
  // имеется
  const newStart = currentListScroll - chunkAmount * 2;
  const newEnd = currentListScroll + chunkAmount * 2;

  if (renderedRange.end !== newEnd) {
    renderedRange.start = newStart < 0 ? 0 : newStart;
    renderedRange.end = newEnd;

    console.log('Диапазон поменялся');
    console.log(
      `currentListScroll: ${currentListScroll}, Range: ${renderedRange.start} - ${renderedRange.end}`
    );

    addItemsToList(renderedRange.end);
  }

  // renderedRange = {
  //   start: currentListScroll - chunkAmount * 2,
  //   end: currentListScroll + chunkAmount * 2,
  // };

  // // вариант 1
  // const renderedRange = {
  //   start:
  //     currentListScroll - chunkAmount < 0 ? 0 : currentListScroll - chunkAmount,
  //   end: currentListScroll + chunkAmount * 2,
  // };

  // 01 - 11 - удалить
  // 12 - 22
  // 23 - 33 --- смотрим сюда
  // 34 - 44 --- и сюда
  // 45 - 55 - отрендерить

  // addItemsToList(renderedRange.start);
  //
  // console.log(
  //   `currentListScroll: ${currentListScroll}, Range: ${renderedRange.start} - ${renderedRange.end}`
  // );
};

const calcCurrentDOMRender = function (e: Event & { target: Element }) {
  const { scrollTop } = e.target;
  const chunkSize = chunkAmount * listItemHeight;
  const orderedNumberOfChunk = Math.floor(scrollTop / chunkSize);

  currentListScroll = orderedNumberOfChunk * chunkAmount;

  // DOM Manipulation
  modifyCurrentDOM();
};

StartBtn?.addEventListener('click', () => {
  fillList();
  getAllSizes(InfinityList);
});

InfinityList?.addEventListener('scroll', calcCurrentDOMRender);

getAllSizes(InfinityList);
