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

/* Давайте посчитаем все промежуточные переменные:
1) Высота всего списка, чтобы понимать "размер" блоков (чанков)
2) Высота пункта списка, чтобы понимать сколько пунктов влезает в чанк (сколько грузить за раз)
3) Используем высоту чанка чтобы регулировать отступы
4) Держим в памяти число, указывающее на начальный пункт списка в чанке
5) При переходе к след/пред чанку выполняем действия с ДОМ и отступами

 */
const getAllSizes = (bigListNode: HTMLElement) => {
  const list = bigListNode;
  const listItem = list.firstChild as HTMLElement;

  const listHeight = list.offsetHeight || 1;

  const listItemHeight = listItem?.offsetHeight || listHeight;

  const chunkAmount = Math.ceil(listHeight / listItemHeight);

  console.log(listHeight);
  console.log(listItemHeight);
  console.log(chunkAmount);
};

const TAG_TPL = function (name: string, number: string | number) {
  return `<li class="infinityScroll__listItem">${name} ${number}</li>`;
};

let timerId;

const addItemList = function () {
  console.log('AGAIN!');
  if (GLOBAL_ITEM_COUNTER > 49999 || GLOBAL_ITEM_COUNTER >= MAX_LENGTH) return;

  let templateFragments = '';
  for (
    let i = 0;
    i < 1000 && i < MAX_LENGTH - 1 && GLOBAL_ITEM_COUNTER < MAX_LENGTH;
    i++
  ) {
    const element = CurrentBigList[GLOBAL_ITEM_COUNTER];
    templateFragments += TAG_TPL(element.name, element.number);
    GLOBAL_ITEM_COUNTER++;
  }

  InfinityList.innerHTML += templateFragments;

  timerId = setTimeout(addItemList, delay);
};

StartBtn?.addEventListener('click', () => {
  addItemList();
  getAllSizes(InfinityList);
});

InfinityList?.addEventListener('scroll', () => {
  console.log('Вот и проскролился...');
});

getAllSizes(InfinityList);
