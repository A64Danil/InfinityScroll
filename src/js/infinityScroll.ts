import BigDataList1 from '../../mocks/bigList100.json'; // import mock data
import BigDataList2 from '../../mocks/bigList100000.json'; // import mock data

console.log('TS file loaded');

// TODO: придумать нормальные имена для элементов

const InfinityListWrapper: HTMLElement | null = document.querySelector<HTMLElement>(
  '#infinityScrollWrapper'
);

const InfinityList: HTMLElement | null = document.querySelector<HTMLElement>(
  '#infinityScrollList'
);

const StartBtn: HTMLElement | null = document.querySelector<HTMLElement>(
  '#infinityScrollListStartBtn'
);

const InfinityScrollCurrentScrollPosition: HTMLElement | null = document.querySelector<HTMLElement>(
  '#infinityScrollCurrentScrollPosition'
);

let GLOBAL_ITEM_COUNTER = 0;

const delay = 0;

const CurrentBigList = BigDataList1.data;

const LIST_LENGTH = CurrentBigList.length;

console.log('LIST_LENGTH', LIST_LENGTH);

let LIST_FULL_VISIBLE_SIZE = 2;
let LIST_HALF_VISIBLE_SIZE = 1;
let LIST_START_OF_LAST_VISIBLE_SIZE = LIST_LENGTH - LIST_HALF_VISIBLE_SIZE;

let LIST_LAST_SCROLL_POSITION = LIST_LENGTH - LIST_FULL_VISIBLE_SIZE;

let currentListScroll = 0;
let chunkAmount = 1;
let listWrpHeight = 1;
let listItemHeight = 1;
let chunkHeight = 1;
let scrollDirection = 'down';

let tailingElementsAmount = 0;
let lastScrollTopPosition = 0;

let LAST_CHUNK_ORDER_NUMBER = 1;

let isGoingFromBottom = false;
let timer: number;

let currentPositionRelative = 0;
const avrTimeArr: Array<number> = [];

let isWaitRender = false;

/* Давайте посчитаем все промежуточные переменные:
1) Высота всего списка, чтобы понимать "размер" блоков (чанков)
2) Высота пункта списка, чтобы понимать сколько пунктов влезает в чанк (сколько грузить за раз)
3) Используем высоту чанка чтобы регулировать отступы
4) Держим в памяти число, указывающее на начальный пункт списка в чанке - currentListScroll
5) При переходе к след/пред чанку выполняем действия с ДОМ и отступами

// если дифф слишком большой, то делаем фуллРендер
// для того чтобы подчитать дифф, нужно понять, когда скролл остановился


--- до рефакторинга было 450 строк кода

 */

const setPaddingToList = function (offset = 0): void {
  let paddingBottom = LIST_LENGTH * listItemHeight - chunkHeight * 4 - offset;

  // TODO: проверить, попадаем ли мы туда
  if (paddingBottom < 0) {
    console.error('==============Мы попали в if paddingBottom < 0 ==========');
    paddingBottom = 0;
  }
  InfinityList.style.paddingBottom = `${paddingBottom}px`;
};

const setOffsetToList = function (
  forcedOffset: number | undefined = undefined
): void {
  console.log('currentListScroll', currentListScroll);

  if (forcedOffset !== undefined) {
    console.log('Вы задаёте start для оффсета вручную!');
    InfinityList.style.transform = `translate(0,${forcedOffset}px)`;
    setPaddingToList(forcedOffset);
    return;
  }

  let start = currentListScroll - chunkAmount;

  // TODO: нужно ли следующие 2 проверки выносить в отдельную функцию?
  if (start < 0) {
    start = 0;
  }
  console.log('start', start);

  // Если этого нет, то попадаем в padding 0!
  if (scrollDirection === 'down' && start > LIST_LAST_SCROLL_POSITION) {
    start = LIST_LAST_SCROLL_POSITION;
  }

  const offset = start * listItemHeight;

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
  if (InfinityScrollCurrentScrollPosition) {
    InfinityScrollCurrentScrollPosition.style.height = `${listWrpHeight}px`;
  }

  listItemHeight = listItem?.offsetHeight || listWrpHeight;

  chunkAmount = Math.ceil(listWrpHeight / listItemHeight);

  console.log(listWrpHeight);
  console.log('listItemHeight', listItemHeight);
  console.log(chunkAmount);

  LIST_FULL_VISIBLE_SIZE = chunkAmount * 4;
  LIST_HALF_VISIBLE_SIZE = LIST_FULL_VISIBLE_SIZE / 2;
  LIST_START_OF_LAST_VISIBLE_SIZE = LIST_LENGTH - LIST_HALF_VISIBLE_SIZE;
  LIST_LAST_SCROLL_POSITION = LIST_LENGTH - LIST_FULL_VISIBLE_SIZE;

  LAST_CHUNK_ORDER_NUMBER = Math.floor(LIST_LENGTH / chunkAmount);

  chunkHeight = chunkAmount * listItemHeight;

  tailingElementsAmount = LIST_LENGTH % chunkAmount;

  console.log('Остаток - ', tailingElementsAmount);

  setPaddingToList();
};

const TAG_TPL = function (name: string, number: string | number) {
  return `<li 
        class="infinityScrollList__listItem" 
        aria-setsize="${LIST_LENGTH}" 
        aria-posinset="${number + 1}"
        >
            ${name} ${number + 1}
    </li>`;
};

const createItem = function (elemNum: number) {
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

const resetAllList = function () {
  console.log(
    'Будем перерисовывать весь список заново с учетом позиции',
    currentListScroll
  );
  const calculatedStart = currentListScroll - chunkAmount;
  const newStart =
    calculatedStart > LIST_LAST_SCROLL_POSITION
      ? LIST_LAST_SCROLL_POSITION
      : calculatedStart;

  let newSequence = newStart;

  if (newSequence < 0) newSequence = 0;

  const sequenceNumber = newSequence;
  console.log('resetAllList sequenceNumber: ', sequenceNumber);

  let templateFragments = '';
  for (let i = 0; i < 1000 && i < LIST_FULL_VISIBLE_SIZE; i++) {
    // TODO: убрать после тестов
    // console.log('i + sequenceNumber ', i + sequenceNumber);
    // add items
    const elemNum = i + sequenceNumber;
    templateFragments += createItem(elemNum);
  }

  const newOffset = newSequence * listItemHeight;
  console.log('newOffset', newOffset);

  InfinityList.innerHTML = templateFragments;
  setOffsetToList(newOffset);

  console.log('Считаем среднее время рендера');
  const allTime = avrTimeArr.reduce((acc, el) => acc + el);
  console.log('avg:', allTime / avrTimeArr.length);

  isWaitRender = false;

  if (InfinityScrollCurrentScrollPosition) {
    InfinityScrollCurrentScrollPosition.classList.remove('active');
  }
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
      : currentListScroll - chunkAmount;

  if (newSequence < 0) newSequence = 0;

  const sequenceNumber = newSequence;
  console.log('CHANGE-ITEMS-IN-LIST sequenceNumber: ', sequenceNumber);

  for (let i = 0; i < 1000 && i < chunkAmount; i++) {
    const isStartOfList = scrollDirection === 'up' && sequenceNumber === 0;

    const isReachTopLimit =
      isGoingFromBottom &&
      isStartOfList &&
      i + sequenceNumber >= tailingElementsAmount;

    const isReachBottomLimit =
      scrollDirection === 'down' && i + sequenceNumber > LIST_LENGTH - 1;

    const allowToChange = !isReachTopLimit && !isReachBottomLimit;

    // TODO: убрать после тестов
    if (isReachBottomLimit) {
      console.warn('Выходим за пределы списка в его нижней части');
    } else if (isReachTopLimit) {
      console.warn('Выходим за пределы списка в его ВЕРХНЕЙ части');
    }

    if (allowToChange) {
      // add items
      const elemNum = i + sequenceNumber;
      templateFragments += createItem(elemNum);
      // remove items
      removeItem(childPosition);
    }
  }

  // TODO: вынести в отдельную функцию?
  if (scrollDirection === 'down') {
    InfinityList.innerHTML += templateFragments;
  } else {
    InfinityList.innerHTML = templateFragments + InfinityList.innerHTML;
  }
};

const modifyCurrentDOM = function () {
  // TODO: удалить после отладки
  if (true) {
    //  ===== временные переменные =====
    const calculatedStart = currentListScroll - chunkAmount;
    const newStart =
      calculatedStart > LIST_LAST_SCROLL_POSITION
        ? LIST_LAST_SCROLL_POSITION
        : calculatedStart;

    const calculatedEnd =
      currentListScroll + LIST_HALF_VISIBLE_SIZE + chunkAmount;
    const newEnd = calculatedEnd > LIST_LENGTH ? LIST_LENGTH : calculatedEnd;

    console.log('Диапазон поменялся');
    console.log(
      `currentListScroll: %c${currentListScroll}`,
      'color: red; font-weight: bold;',
      `, Range - от ${newStart + 1} до ${newEnd}`
    );
    //  ===== END временные переменные END=====
  }

  const isBeginOfListFromTop = currentListScroll < LIST_HALF_VISIBLE_SIZE;

  const isEndOfListFromTop =
    currentListScroll > LIST_START_OF_LAST_VISIBLE_SIZE;

  const isBeginOfListFromBottom =
    currentListScroll >= LIST_LENGTH - chunkAmount * 3;

  const isEndOfListFromBottom = currentListScroll < tailingElementsAmount;

  // Главное правило - если идём вниз, то множитель х2, если вверх, то х3 (т.к. считаем от начала чанка)
  if (scrollDirection === 'down' && isBeginOfListFromTop) {
    console.log('Пока рендерить не надо. Вы в самом верху списка.');
    return;
  }

  if (scrollDirection === 'down' && isEndOfListFromTop) {
    console.log('УЖЕ рендерить не надо.  Вы в самом низу списка.');
    return;
  }

  if (scrollDirection === 'up' && isBeginOfListFromBottom) {
    console.log(
      'Пока рендерить не надо (up). Вы в самом низу списка. Это сообщение мы должны видеть 2 раза'
    );
    return;
  }

  if (scrollDirection === 'up' && isEndOfListFromBottom) {
    console.log('Уже рендерить не надо (up). Вы в самом верху списка.');
    return;
  }

  changeItemsInList();
  setOffsetToList();

  if (InfinityList.childNodes.length !== LIST_FULL_VISIBLE_SIZE) {
    console.error(
      '%cКоличесвто деток: ',
      'color: tomato',
      InfinityList.childNodes.length
    );
  }
};

const calcCurrentDOMRender = function (e: Event & { target: Element }) {
  const { scrollTop } = e.target;
  const orderedNumberOfChunk = Math.floor(scrollTop / chunkHeight);

  if (InfinityList.childNodes.length !== LIST_FULL_VISIBLE_SIZE) {
    console.error(
      '%cКоличесвто деток: ',
      'color: tomato',
      InfinityList.childNodes.length
    );
  }

  let newCurrentListScroll = orderedNumberOfChunk * chunkAmount;

  if (scrollTop > lastScrollTopPosition) {
    scrollDirection = 'down';
  } else {
    scrollDirection = 'up';
  }

  lastScrollTopPosition = scrollTop;

  const scrollDiff = Math.abs(currentListScroll - newCurrentListScroll);

  if (scrollDiff !== 0 && scrollDiff <= tailingElementsAmount) {
    return;
  }

  if (timer !== null && isWaitRender === false) {
    clearTimeout(timer);
  }

  if (
    scrollDirection === 'down' &&
    orderedNumberOfChunk <= tailingElementsAmount
  ) {
    isGoingFromBottom = false;
  } else if (
    scrollDirection === 'up' &&
    orderedNumberOfChunk >= LAST_CHUNK_ORDER_NUMBER - 1
  ) {
    isGoingFromBottom = true;
  }

  const isBigDiff =
    (isGoingFromBottom && scrollDiff > chunkAmount + tailingElementsAmount) ||
    (!isGoingFromBottom && scrollDiff > chunkAmount);

  if (isBigDiff && isWaitRender === false) {
    console.warn(
      `%cСлишком большой дифф, надо рендерить все заново. Дифф ${scrollDiff}`,
      'background-color: red;'
    );
    currentPositionRelative = Math.round(
      (scrollTop / (LIST_LENGTH * listItemHeight)) * 100
    );

    isWaitRender = true;
    timer = window.setTimeout(() => {
      console.log('========== Очевидно, что вы закончили скроллить ========');
      resetAllList();
    }, 30);
  }

  if (currentListScroll !== newCurrentListScroll) {
    console.warn('====== currentListScroll поменялся ======');
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
let startDate = Date.now();

// TODO: Убрать лишние логи
// InfinityListWrapper?.addEventListener('scroll', calcCurrentDOMRender);
InfinityListWrapper?.addEventListener('scroll', (e) => {
  const diffTime = Date.now() - startDate;
  if (diffTime < 100) {
    avrTimeArr.push(diffTime);
  }
  calcCurrentDOMRender(e);
  startDate = Date.now();
});

getAllSizes(InfinityListWrapper, InfinityList);

// START OF CLASS REALIZATION OF SCROLL
interface ListData {
  name: string;
  number: number;
}

interface InfinityScrollPropTypes {
  data: Array<ListData>;
  name: string;
  selectorId: string;
  wrapperEl: HTMLElement;
  listType: 'list' | 'table';
}

const myProps: InfinityScrollPropTypes = {
  data: CurrentBigList,
  name: 'my scroll list name',
  selectorId: 'myInfinityScroll',
  listType: 'list',
};

const nameToTag = {
  list: 'UL',
  table: 'TABLE',
};

class InfinityScroll {
  private delay: number;

  private timerId: number;

  private name: string;

  private selectorId: string;

  private wrapperEl: HTMLElement | null;

  private listType: string;

  private listEl: HTMLElement;

  private GLOBAL_ITEM_COUNTER: number;

  private LIST_LENGTH: number;

  private LIST_FULL_VISIBLE_SIZE: number;

  private LIST_HALF_VISIBLE_SIZE: number;

  private LIST_START_OF_LAST_VISIBLE_SIZE: number;

  private LIST_LAST_SCROLL_POSITION: number;

  private chunkAmount: number;

  private listWrpHeight: number;

  private listItemHeight: number;

  private chunkHeight: number;

  private LAST_CHUNK_ORDER_NUMBER: number;

  private tailingElementsAmount: number;

  constructor(props: InfinityScrollPropTypes) {
    this.delay = 0;
    this.GLOBAL_ITEM_COUNTER = 0;
    console.log(props);
    this.LIST_LENGTH = props.data.length;

    this.name = props.name;
    this.selectorId = props.selectorId;
    this.wrapperEl = document.getElementById(props.selectorId);
    this.listType = props.listType;
  }

  start() {
    console.log('Здесь будем создавать список');
    this.listEl = this.createInnerList();
    console.log(this);
    // this.setMainVars();
    this.getAllSizes();
    this.fillList(this);
    this.getAllSizes();
  }

  createInnerList(): HTMLElement {
    const newEl = document.createElement(nameToTag[this.listType]);
    // ID-то наверное и не нужен вообще, если есть доступ к списку итак?
    const newElID =
      this.selectorId +
      this.listType.charAt(0).toUpperCase() +
      this.listType.slice(1);
    newEl.setAttribute('id', newElID);
    newEl.setAttribute('class', 'Demo_infinityScrollList');
    return this.wrapperEl?.appendChild(newEl);
  }

  // createItem(elemNum: number): string {
  //   const element = CurrentBigList[elemNum];
  //   return TAG_TPL(element.name, element.number);
  // }

  fillList(that: this): void {
    console.log('AGAIN!');
    console.log('this.GLOBAL_ITEM_COUNTER', this.GLOBAL_ITEM_COUNTER);
    console.log('this.LIST_FULL_VISIBLE_SIZE', this.LIST_FULL_VISIBLE_SIZE);
    if (
      this.GLOBAL_ITEM_COUNTER > 49999 ||
      this.GLOBAL_ITEM_COUNTER >= this.LIST_LENGTH ||
      this.GLOBAL_ITEM_COUNTER >= this.LIST_FULL_VISIBLE_SIZE
    )
      return;

    let templateFragments = '';
    for (
      let i = 0;
      i < 1000 &&
      i < this.LIST_LENGTH - 1 &&
      this.GLOBAL_ITEM_COUNTER < this.LIST_LENGTH &&
      this.GLOBAL_ITEM_COUNTER < this.LIST_FULL_VISIBLE_SIZE;
      i++
    ) {
      templateFragments += createItem(this.GLOBAL_ITEM_COUNTER);
      this.GLOBAL_ITEM_COUNTER++;
    }

    console.log(this);
    console.log(this.listEl);
    this.listEl.innerHTML += templateFragments;

    this.timerId = window.setTimeout(() => this.fillList(this), this.delay);
  }

  getAllSizes(): void {
    const listWrp = this.wrapperEl;
    const list = this.listEl;
    const listStyles = window.getComputedStyle(list);
    const listItem = list.firstChild as HTMLElement;
    console.log(listItem);
    this.listWrpHeight =
      parseInt(
        window.getComputedStyle(listWrp).getPropertyValue('height'),
        10
      ) || 1;

    if (this.listWrpHeight < 2) {
      console.error('You must set height to your list-wrapper!');
      return;
    }
    if (InfinityScrollCurrentScrollPosition) {
      InfinityScrollCurrentScrollPosition.style.height = `${this.listWrpHeight}px`;
    }

    this.listItemHeight = listItem?.offsetHeight || this.listWrpHeight;

    this.chunkAmount = Math.ceil(this.listWrpHeight / this.listItemHeight);

    console.log(this.listWrpHeight);
    console.log('this.listItemHeight', this.listItemHeight);
    console.log(this.chunkAmount);

    this.LIST_FULL_VISIBLE_SIZE = this.chunkAmount * 4;
    this.LIST_HALF_VISIBLE_SIZE = this.LIST_FULL_VISIBLE_SIZE / 2;
    this.LIST_START_OF_LAST_VISIBLE_SIZE =
      this.LIST_LENGTH - this.LIST_HALF_VISIBLE_SIZE;
    this.LIST_LAST_SCROLL_POSITION =
      this.LIST_LENGTH - this.LIST_FULL_VISIBLE_SIZE;

    this.LAST_CHUNK_ORDER_NUMBER = Math.floor(
      this.LIST_LENGTH / this.chunkAmount
    );

    this.chunkHeight = this.chunkAmount * this.listItemHeight;

    this.tailingElementsAmount = this.LIST_LENGTH % this.chunkAmount;

    console.log('Остаток - ', this.tailingElementsAmount);

    // this.setPaddingToList();
  }
}

const myScroll = new InfinityScroll(myProps);

myScroll.start();
