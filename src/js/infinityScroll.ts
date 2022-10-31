import BigDataList1 from '../../mocks/bigList100.json'; // import mock data
import BigDataList2 from '../../mocks/bigList100000.json'; // import mock data

console.log('TS file loaded');

const InfinityListWrapper: HTMLOListElement | null = document.querySelector<HTMLElement>(
  '#infinityScrollWrapper'
);

const InfinityList: HTMLOListElement | null = document.querySelector<HTMLElement>(
  '#infinityScrollList'
);

const StartBtn: HTMLButtonElement | null = document.querySelector<HTMLElement>(
  '#infinityScrollListStartBtn'
);

let GLOBAL_ITEM_COUNTER = 0;

const delay = 0;

const CurrentBigList = BigDataList1.data;

const LIST_LENGTH = CurrentBigList.length;

console.log('LIST_LENGTH', LIST_LENGTH);

let LIST_FULL_VISIBLE_SIZE = 2;
let LIST_HALF_VISIBLE_SIZE = 1;
let LIST_START_OF_LAST_VISIBLE_SIZE = LIST_LENGTH - LIST_HALF_VISIBLE_SIZE;

let currentListScroll = 0;
let chunkAmount = 1;
let listWrpHeight = 1;
let listItemHeight = 1;
let chunkHeight = 1;
let scrollDirection = 'down';
let isBorderOfList = true;

let tailingElementsAmount = 0;
let lastScrollTopPosition = 0;

let LAST_CHUNK_ORDER_NUMBER = 1;

let isGoingFromBottom = false;

/* Давайте посчитаем все промежуточные переменные:
1) Высота всего списка, чтобы понимать "размер" блоков (чанков)
2) Высота пункта списка, чтобы понимать сколько пунктов влезает в чанк (сколько грузить за раз)
3) Используем высоту чанка чтобы регулировать отступы
4) Держим в памяти число, указывающее на начальный пункт списка в чанке - currentListScroll
5) При переходе к след/пред чанку выполняем действия с ДОМ и отступами

--- до рефакторинга было 450 строк кода

 */

const setPaddingToList = function (offset = 0): void {
  let paddingBottom = LIST_LENGTH * listItemHeight - chunkHeight * 4 - offset;

  console.log('paddingBottom', paddingBottom);

  // TODO: проверить, попадаем ли мы туда
  // Кажется нет, значит это скоро можно удалить
  if (paddingBottom < 0) {
    console.warn('==============Мы попали в if paddingBottom < 0 ==========');
    paddingBottom = 0;
  }
  InfinityList.style.paddingBottom = `${paddingBottom}px`;
};

const setOffsetToList = function (): void {
  console.log('currentListScroll', currentListScroll);

  // TODO: скролл теперь правильный, но хочется чтобы он был с 10 по 20й элемент, а не с 20 по 30й

  // let start =
  //   scrollDirection === 'down'
  //     ? currentListScroll - chunkAmount
  //     : currentListScroll - chunkAmount + tailingElementsAmount;

  let start = currentListScroll - chunkAmount;
  if (start < 0) {
    console.log('start меньше нуля, исправляем на 0. До этого был: ', start);
    start = 0;
  }
  console.log('start', start);

  // Если этого нет, то попадаем в padding 0!
  if (
    scrollDirection === 'down' &&
    start + LIST_FULL_VISIBLE_SIZE > LIST_LENGTH
  ) {
    console.warn('Здесь у вас будут проблемы с оффсетом. Надо считать иначе');
    start = start + LIST_LENGTH - currentListScroll - chunkAmount * 3;
    console.log('refreshed start', start);
  }

  console.log('LIST_LENGTH - start', LIST_LENGTH - start);

  // TODO: кажется это уже не нужно - удалить, если все работает нормально при скролле наверх
  // if (
  //   scrollDirection === 'up' &&
  //   // LIST_FULL_VISIBLE_SIZE < LIST_LENGTH - start
  //   LIST_LENGTH - start === 46
  //   // 44 < 46
  //   // 44 < 101 - 55 = 46    // 2
  //   // 44 < 101 - 44 = 57 // 2
  //   // 44 < 101 - 33 = 68 // 2
  // ) {
  //   console.log(
  //     '%cВы скроллите вверх? Посчитаем оффсет иначе!',
  //     'background-color: tomato'
  //   );
  //   console.log('LIST_LENGTH - start', LIST_LENGTH - start);
  //   start = start + LIST_LENGTH - currentListScroll - chunkAmount * 4;
  //   console.log('refreshed start', start);
  // }

  const offset = start * listItemHeight;
  console.log('offset', offset);

  InfinityList.style.transform = `translate(0,${offset}px)`;
  setPaddingToList(offset);
};

const getAllSizes = (bigListWrp: HTMLElement, bigListNode: HTMLElement) => {
  const listWrp = bigListWrp;
  const list = bigListNode;
  const listStyles = window.getComputedStyle(list);
  const listItem = list.firstChild as HTMLElement;

  listWrpHeight =
    parseInt(window.getComputedStyle(listWrp).getPropertyValue('height'), 10) ||
    1;

  if (listWrpHeight < 2) {
    console.error('You must set height to your list-wrapper!');
    return;
  }

  listItemHeight = listItem?.offsetHeight || listWrpHeight;

  chunkAmount = Math.ceil(listWrpHeight / listItemHeight);

  console.log(listWrpHeight);
  console.log(listItemHeight);
  console.log(chunkAmount);

  LIST_FULL_VISIBLE_SIZE = chunkAmount * 4;
  LIST_HALF_VISIBLE_SIZE = LIST_FULL_VISIBLE_SIZE / 2;
  LIST_START_OF_LAST_VISIBLE_SIZE = LIST_LENGTH - LIST_HALF_VISIBLE_SIZE;

  LAST_CHUNK_ORDER_NUMBER = Math.floor(LIST_LENGTH / chunkAmount);

  chunkHeight = chunkAmount * listItemHeight;

  tailingElementsAmount = LIST_LENGTH % chunkAmount;

  console.log('Остаток - ', tailingElementsAmount);

  setPaddingToList();
};

const TAG_TPL = function (name: string, number: string | number) {
  return `<li 
        class="infinityScroll__listItem" 
        aria-setsize="${LIST_LENGTH}" 
        aria-posinset="${number + 1}"
        >
            ${name} ${number + 1}
    </li>`;
};

const createItem = function (elemNum: number) {
  // console.log('elemNum', elemNum);
  // console.log('sequenceNumber', sequenceNumber);
  const element = CurrentBigList[elemNum];
  return TAG_TPL(element.name, element.number);
};

const removeItem = function (childPosition: string) {
  const child = InfinityList?.[childPosition];
  InfinityList.removeChild(child);
};

let timerId;

const fillList = function () {
  console.log('AGAIN!');
  console.log('GLOBAL_ITEM_COUNTER', GLOBAL_ITEM_COUNTER);
  console.log('LIST_FULL_VISIBLE_SIZE', LIST_FULL_VISIBLE_SIZE);
  if (
    GLOBAL_ITEM_COUNTER > 49999 ||
    GLOBAL_ITEM_COUNTER >= LIST_LENGTH ||
    GLOBAL_ITEM_COUNTER >= LIST_FULL_VISIBLE_SIZE
  )
    return;

  let templateFragments = '';
  for (
    let i = 0;
    i < 1000 &&
    i < LIST_LENGTH - 1 &&
    GLOBAL_ITEM_COUNTER < LIST_LENGTH &&
    GLOBAL_ITEM_COUNTER < LIST_FULL_VISIBLE_SIZE;
    i++
  ) {
    templateFragments += createItem(GLOBAL_ITEM_COUNTER);
    GLOBAL_ITEM_COUNTER++;
  }

  InfinityList.innerHTML += templateFragments;

  timerId = setTimeout(fillList, delay);
};

const changeItemsInList = function () {
  // for addItems
  let templateFragments = '';

  // for removeItems
  const childPosition = scrollDirection === 'down' ? 'firstChild' : 'lastChild';

  // Это работает праивльно (в начале списка)
  let newSequence =
    scrollDirection === 'down'
      ? currentListScroll + LIST_HALF_VISIBLE_SIZE
      : currentListScroll - chunkAmount * 1;

  if (newSequence < 0) newSequence = 0;

  const sequenceNumber = newSequence;
  console.log('CHANGE-ITEMS-IN-LIST sequenceNumber: ', sequenceNumber);

  for (let i = 0; i < 1000 && i < chunkAmount; i++) {
    // TODO: убрать после тестов

    // console.log('i + sequenceNumber ', i + sequenceNumber);
    if (scrollDirection === 'down' && i + sequenceNumber > LIST_LENGTH - 1) {
      console.warn('Выходим за пределы списка в его нижней части');
      // eslint-disable-next-line no-continue
      continue;
    }
    // 0 ==>  1 2 --- 3 4 5 6 7 8 9 10 11 12
    if (
      scrollDirection === 'up' &&
      sequenceNumber === 0 &&
      i + sequenceNumber >= tailingElementsAmount
    ) {
      console.warn('Выходим за пределы списка в его ВЕРХНЕЙ части');
      // eslint-disable-next-line no-continue
      continue;
    }

    // add items
    const elemNum = i + sequenceNumber;
    templateFragments += createItem(elemNum);

    // remove items
    removeItem(childPosition);
  }

  if (scrollDirection === 'down') {
    InfinityList.innerHTML += templateFragments;
  } else {
    console.log('Добавляем ВВЕРХ!!');
    InfinityList.innerHTML = templateFragments + InfinityList.innerHTML;
  }
};

const modifyCurrentDOM = function () {
  // TODO: удалить после отладки
  // временные переменные
  const calculatedStart = currentListScroll - chunkAmount;
  const newStart =
    calculatedStart > LIST_LENGTH - LIST_FULL_VISIBLE_SIZE
      ? LIST_LENGTH - LIST_FULL_VISIBLE_SIZE
      : calculatedStart;

  const calculatedEnd =
    currentListScroll + LIST_HALF_VISIBLE_SIZE + chunkAmount;
  const newEnd = calculatedEnd > LIST_LENGTH ? LIST_LENGTH : calculatedEnd;

  // console.log('Будущий старт:', newStart);
  console.log('Мы на границе списка?', isBorderOfList);

  console.log('Диапазон поменялся');
  console.log(
    `currentListScroll: %c${currentListScroll}`,
    'color: red; font-weight: bold;',
    `, Range - от ${newStart + 1} до ${newEnd}`
  );

  // TODO: наверное всё это надо перенести в функицю calcCurrentDOMRender

  const isBeginOfListFromTop = currentListScroll < LIST_HALF_VISIBLE_SIZE;

  const isEndOfListFromTop =
    currentListScroll > LIST_START_OF_LAST_VISIBLE_SIZE;

  // TODO: уточнить - больше или большеИЛИравно - это должно сработать 2 раза
  const isBeginOfListFromBottom =
    // currentListScroll >= LIST_LENGTH - LIST_FULL_VISIBLE_SIZE;
    currentListScroll >= LIST_LENGTH - chunkAmount * 3;
  console.log('LIST_LENGTH - chunkAmount * 3', LIST_LENGTH - chunkAmount * 3);

  const isEndOfListFromBottom =
    currentListScroll < LIST_FULL_VISIBLE_SIZE - chunkAmount * 3;

  // Главное правило - если идём вниз, то множитель х2, если вверх, то х3 (т.к. считаем от начала чанка)
  if (scrollDirection === 'down' && isBeginOfListFromTop) {
    console.log('isBeginOfListFromTop', isBeginOfListFromTop);
    console.log('Пока рендерить не надо. Вы в самом верху списка.');
    isBorderOfList = true;
    return;
  }

  // TODO: без этого работает, но лучше улучшить проверку в функция add и remove
  if (scrollDirection === 'down' && isEndOfListFromTop) {
    console.log('isEndOfListFromTop', isEndOfListFromTop);
    console.log('УЖЕ рендерить не надо.  Вы в самом низу списка.');
    isBorderOfList = true;
    return;
  }

  if (scrollDirection === 'up' && isBeginOfListFromBottom) {
    console.log('isBeginOfListFromBottom', isBeginOfListFromBottom);
    console.log(
      'Пока рендерить не надо (up). Вы в самом низу списка. Это сообщение мы должны видеть 2 раза'
    );
    isBorderOfList = true;
    return;
  }

  // TODO: пока временно отключаем, пока не разберемся с tailingsElements
  // if (scrollDirection === 'up' && isEndOfListFromBottom) {
  //   console.log('isEndOfListFromBottom', isEndOfListFromBottom);
  //   console.log('Уже рендерить не надо (up). Вы в самом верху списка.');
  //   isBorderOfList = true;
  //   return;
  // }

  isBorderOfList = false;

  console.log('ПОСЛЕ ПРОВЕРОК РЕНДЕРА');

  changeItemsInList();

  setOffsetToList();

  if (InfinityList.childNodes.length !== chunkAmount * 4) {
    console.log(
      '%cКоличесвто деток: ',
      'color: tomato',
      InfinityList.childNodes.length
    );
  }
};

const calcCurrentDOMRender = function (e: Event & { target: Element }) {
  const { scrollTop } = e.target;
  const orderedNumberOfChunk = Math.floor(scrollTop / chunkHeight);

  if (InfinityList.childNodes.length !== chunkAmount * 4) {
    console.log(
      '%cКоличесвто деток: ',
      'color: tomato',
      InfinityList.childNodes.length
    );
  }

  let newCurrentListScroll = orderedNumberOfChunk * chunkAmount;

  if (scrollTop > lastScrollTopPosition) {
    scrollDirection = 'down';
    if (orderedNumberOfChunk <= 1) {
      console.log(`%cisGoingFromBottom ${isGoingFromBottom}`, 'color: red;');
      isGoingFromBottom = false;
    }
  } else {
    scrollDirection = 'up';
    if (orderedNumberOfChunk >= LAST_CHUNK_ORDER_NUMBER - 1) {
      isGoingFromBottom = true;
    }
    console.log('isGoingFromBottom', isGoingFromBottom);
  }

  lastScrollTopPosition = scrollTop;

  const scrollDiff = Math.abs(currentListScroll - newCurrentListScroll);

  if (scrollDiff <= tailingElementsAmount) {
    return;
  }

  if (currentListScroll !== newCurrentListScroll) {
    console.warn('====== currentListScroll поменялся ======');
    // это нужно прибавить только когда мы находимся в нижней части списка и скроллим на верх
    // TODO: удалить после отладки
    if (isGoingFromBottom) {
      console.log(
        '%c====> Прибавляем хвостик к скроллу',
        'background-color: green;'
      );
      newCurrentListScroll += tailingElementsAmount;
    }
    currentListScroll = newCurrentListScroll;
    // DOM Manipulation
    modifyCurrentDOM();
  }
};

StartBtn?.addEventListener('click', () => {
  fillList();
  getAllSizes(InfinityListWrapper, InfinityList);
});

InfinityListWrapper?.addEventListener('scroll', calcCurrentDOMRender);

getAllSizes(InfinityListWrapper, InfinityList);
