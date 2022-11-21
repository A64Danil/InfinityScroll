// eslint-disable-next-line max-classes-per-file
import BigDataList100 from '../../mocks/bigList100.json'; // import mock data

console.log('TS file loaded');

const checkChildrenAmount = (length: number, fullSize: number): void => {
  if (length !== fullSize) {
    console.error('%cКоличесвто деток: ', 'color: tomato', length);
  }
};

const StartBtn: HTMLElement | null = document.querySelector<HTMLElement>(
  '#infinityScrollListStartBtn'
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BigJson1 = BigDataList100.data;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// const BigJson2 = BigDataList10k.data;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// const BigJson3 = BigDataList100k.data;

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

StartBtn?.addEventListener('click', () => {
  console.log('Nothing happens');
});

// HELPER FUNCTIONS
class ScrollDetector {
  // Предыдущая сохраненная позиция скролла (нужна чтобы сравнивать с новой)
  public LIST_LAST_SCROLL_POSITION = 0;

  // Текущая позиция скролла
  // Содержит номер элемента, с которого начинается текущая видимая часть
  // private currentListScroll = 0;
  public currentListScroll = 0;

  scrollDirection = 'down';

  isGoingFromBottom = false;

  lastScrollTopPosition = 0;

  private list: ListController | undefined;

  private listChunk: ChunkController | undefined;

  constructor() {
    console.log('start ScrollDetector');
  }

  setList(list: ListController) {
    this.list = list;
  }

  setListChunk(listChunk: ChunkController) {
    this.listChunk = listChunk;
  }

  isBeginOfListFromTop() {
    return this.currentListScroll < this.list.HALF_VISIBLE_SIZE;
  }

  isEndOfListFromTop() {
    return this.currentListScroll > this.list.START_OF_LAST_VISIBLE_SIZE;
  }

  isBeginOfListFromBottom() {
    return (
      this.currentListScroll >=
      this.list.length - this.listChunk.chunkAmount * 3
    );
  }

  isEndOfListFromBottom() {
    return this.currentListScroll < this.list.tailingElementsAmount;
  }

  isAllowRenderNearBorder() {
    console.log('isAllowRenderNearBorder');
    if (this.scrollDirection === 'down' && this.isBeginOfListFromTop()) {
      console.log('Пока рендерить не надо. Вы в самом верху списка.');
      return false;
    }

    if (this.scrollDirection === 'down' && this.isEndOfListFromTop()) {
      console.log('УЖЕ рендерить не надо.  Вы в самом низу списка.');
      return false;
    }

    if (this.scrollDirection === 'up' && this.isBeginOfListFromBottom()) {
      console.log(
        'Пока рендерить не надо (up). Вы в самом низу списка. Это сообщение мы должны видеть 2 раза'
      );
      return false;
    }

    if (this.scrollDirection === 'up' && this.isEndOfListFromBottom()) {
      console.log('Уже рендерить не надо (up). Вы в самом верху списка.');
      return false;
    }

    return true;
  }
}

class ChunkController {
  // Размер чанка (чанк - видимая часть элементов в спике)
  chunkAmount = 2;

  chunkHeight = 0;

  // Порядковый номер последнего чанка в списке
  LAST_ORDER_NUMBER: number;

  constructor() {
    console.log('start ChunkController');
  }
}

class ListController {
  // Содержит генерируемый элемент внутри корневого
  el: HTMLElement;

  // Длина списка
  length: number | undefined;

  // Видимая часть списка (вычисляется по цсс-свойствам)
  FULL_VISIBLE_SIZE = 0;

  // Видимая часть списка (половина от полной)
  HALF_VISIBLE_SIZE = 0;

  // Номер позиции, с которой начинается последяя видимая часть списка
  START_OF_LAST_VISIBLE_SIZE = 0;

  // Высота обертки у списка
  wrapperHeight = 0;

  // Высота пункта списка
  itemHeight = 0;

  // Количество элементов в крайнем чанке
  tailingElementsAmount = 0;

  private readonly wrapperEl: HTMLElement;

  private listChunk: ChunkController;

  private readonly scroll: ScrollDetector;

  constructor(props: {
    wrapperEl: HTMLElement;
    el: HTMLElement;
    scroll: ScrollDetector;
    listChunk: ChunkController;
  }) {
    this.el = props.el;
    this.wrapperEl = props.wrapperEl;
    this.listChunk = props.listChunk;
    this.scroll = props.scroll;
    console.log('Start List Controller', this);
  }

  getAllSizes(): void {
    console.log('GET SIZES');
    const listWrp = this.wrapperEl;
    const list = this.el;
    const listWrpStyles = window.getComputedStyle(listWrp);
    const listItem = list.firstChild as HTMLElement;

    this.wrapperHeight =
      parseInt(listWrpStyles.getPropertyValue('height'), 10) || 1;

    if (this.wrapperHeight < 2) {
      console.error('You must set height to your list-wrapper!');
      return;
    }

    this.itemHeight = listItem?.offsetHeight || this.wrapperHeight;

    this.listChunk.chunkAmount = Math.ceil(
      this.wrapperHeight / this.itemHeight
    );

    this.FULL_VISIBLE_SIZE = this.listChunk.chunkAmount * 4;
    this.HALF_VISIBLE_SIZE = this.FULL_VISIBLE_SIZE / 2;
    this.START_OF_LAST_VISIBLE_SIZE = this.length - this.HALF_VISIBLE_SIZE;
    console.log(this.scroll.LIST_LAST_SCROLL_POSITION);
    this.scroll.LIST_LAST_SCROLL_POSITION =
      this.length - this.FULL_VISIBLE_SIZE;

    this.listChunk.LAST_ORDER_NUMBER = Math.floor(
      this.length / this.listChunk.chunkAmount
    );

    this.listChunk.chunkHeight = this.listChunk.chunkAmount * this.itemHeight;

    this.tailingElementsAmount = this.length % this.listChunk.chunkAmount;
  }
}

class DomManager {
  // даже не знаю зачем эта переменная, нужна для нулевого сетТаймайт
  private delay = 0;

  // хранит в себе id сетТаймаута
  private fillListTimerId: number | undefined;

  private data;

  private targetElem;

  // Содержит в себе хтмл-шаблон, в который мы положим данные из БД
  private template;

  // Общий счётчик элементов (создан для рекурсивной функции чтобы она не добавляла слишком много за раз)
  private GLOBAL_ITEM_COUNTER = 0;

  private avrTimeArr: Array<number> = [];

  private list: ListController;

  private listChunk: ChunkController;

  private readonly scroll: ScrollDetector;

  private infinityScroll: InfinityScroll;

  constructor(props: {
    data: any;
    targetElem: HTMLElement;
    infinityScroll: InfinityScroll;
    list: ListController;
    chunk: ChunkController;
    // eslint-disable-next-line @typescript-eslint/ban-types
    template: Function;
    scrollDetector: ScrollDetector;
  }) {
    this.data = props.data;
    this.targetElem = props.targetElem;
    this.infinityScroll = props.infinityScroll;
    this.list = props.list;
    this.listChunk = props.chunk;
    this.template = props.template;
    this.scroll = props.scrollDetector;
  }

  setPaddingToList(offset = 0): void {
    let paddingBottom =
      this.list.length * this.list.itemHeight -
      this.listChunk.chunkHeight * 4 -
      offset;

    // TODO: проверить, попадаем ли мы туда
    if (paddingBottom < 0) {
      console.error('==========Мы попали в if paddingBottom < 0 =======');
      paddingBottom = 0;
    }
    this.targetElem.style.paddingBottom = `${paddingBottom}px`;
  }

  setOffsetToList(forcedOffset: number | undefined = undefined): void {
    console.log('currentListScroll', this.scroll.currentListScroll);

    if (forcedOffset !== undefined) {
      this.targetElem.style.transform = `translate(0,${forcedOffset}px)`;
      this.setPaddingToList(forcedOffset);
      return;
    }

    let start = this.scroll.currentListScroll - this.listChunk.chunkAmount;

    // TODO: нужно ли следующие 2 проверки выносить в отдельную функцию?
    if (start < 0) {
      start = 0;
    }

    // Если этого нет, то попадаем в padding 0!
    if (
      this.scroll.scrollDirection === 'down' &&
      start > this.scroll.LIST_LAST_SCROLL_POSITION
    ) {
      start = this.scroll.LIST_LAST_SCROLL_POSITION;
    }

    const offset = start * this.list.itemHeight;

    this.targetElem.style.transform = `translate(0,${offset}px)`;
    this.setPaddingToList(offset);
  }

  createItem(elemNum: number): string {
    const element = this.data[elemNum];
    return this.template(element, this.targetElem);
  }

  removeItem(childPosition: string): void {
    const child = this.targetElem[childPosition];
    this.targetElem.removeChild(child);
  }

  fillList(): void {
    if (
      this.GLOBAL_ITEM_COUNTER > 49999 ||
      this.GLOBAL_ITEM_COUNTER >= this.list.length ||
      this.GLOBAL_ITEM_COUNTER >= this.list.FULL_VISIBLE_SIZE
    )
      return;

    let templateFragments = '';
    for (
      let i = 0;
      i < 1000 &&
      i < this.list.length - 1 &&
      this.GLOBAL_ITEM_COUNTER < this.list.length &&
      this.GLOBAL_ITEM_COUNTER < this.list.FULL_VISIBLE_SIZE;
      i++
    ) {
      templateFragments += this.createItem(this.GLOBAL_ITEM_COUNTER);
      this.GLOBAL_ITEM_COUNTER++;
    }

    this.targetElem.innerHTML += templateFragments;

    this.fillListTimerId = window.setTimeout(() => this.fillList(), this.delay);
  }

  resetAllList(): void {
    const calculatedStart =
      this.scroll.currentListScroll - this.listChunk.chunkAmount;
    const newStart =
      calculatedStart > this.scroll.LIST_LAST_SCROLL_POSITION
        ? this.scroll.LIST_LAST_SCROLL_POSITION
        : calculatedStart;

    let newSequence = newStart;

    if (newSequence < 0) newSequence = 0;

    const sequenceNumber = newSequence;

    let templateFragments = '';
    for (let i = 0; i < 1000 && i < this.list.FULL_VISIBLE_SIZE; i++) {
      // add items
      const elemNum = i + sequenceNumber;
      templateFragments += this.createItem(elemNum);
    }

    const newOffset = newSequence * this.list.itemHeight;

    this.targetElem.innerHTML = templateFragments;
    this.setOffsetToList(newOffset);

    // TODO: убрать после тестов
    const allTime = this.avrTimeArr.reduce((acc, el) => acc + el);
    console.log('среднее время рендера:', allTime / this.avrTimeArr.length);

    // TODO: не хватает этой переменной
    this.infinityScroll.isWaitRender = false;
  }

  changeItemsInList(): void {
    // for addItems
    let templateFragments = '';

    // for removeItems
    const childPosition =
      this.scroll.scrollDirection === 'down' ? 'firstChild' : 'lastChild';

    // Это работает праивльно (в начале списка)
    let newSequence =
      this.scroll.scrollDirection === 'down'
        ? this.scroll.currentListScroll + this.list.HALF_VISIBLE_SIZE
        : this.scroll.currentListScroll - this.listChunk.chunkAmount;

    if (newSequence < 0) newSequence = 0;

    const sequenceNumber = newSequence;

    for (let i = 0; i < 1000 && i < this.listChunk.chunkAmount; i++) {
      const isStartOfList =
        this.scroll.scrollDirection === 'up' && sequenceNumber === 0;

      const isReachTopLimit =
        this.scroll.isGoingFromBottom &&
        isStartOfList &&
        i + sequenceNumber >= this.list.tailingElementsAmount;

      const isReachBottomLimit =
        this.scroll.scrollDirection === 'down' &&
        i + sequenceNumber > this.list.length - 1;

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
        templateFragments += this.createItem(elemNum);
        // remove items
        this.removeItem(childPosition);
      }
    }

    // TODO: вынести в отдельную функцию?
    if (this.scroll.scrollDirection === 'down') {
      this.targetElem.innerHTML += templateFragments;
    } else {
      this.targetElem.innerHTML = templateFragments + this.targetElem.innerHTML;
    }
  }
}

// START OF CLASS REALIZATION OF INFINITYSCROLL
interface ListData {
  name: string;
  number: number;
}

interface InfinityScrollPropTypes {
  data?: Array<ListData>;
  dataLoadType: 'instant' | 'lazy';
  dataUrl?: string;
  name: string;
  selectorId: string;
  listType: 'list' | 'table';
  templateString: TplStringFn;
}

type TplStringFn = (el: unknown, context: InfinityScroll) => string;

const instantListProps: InfinityScrollPropTypes = {
  data: BigJson1,
  dataLoadType: 'instant',
  name: 'my scroll list name',
  selectorId: 'instantInfinityScrollWrapper',
  listType: 'list',
  templateString: (
    element: unknown,
    parentList?: InfinityScroll
  ): string => `<li 
        class="Demo_infinityScrollList__listItem" 
        aria-setsize="${parentList.LIST_LENGTH}" 
        aria-posinset="${element.number + 1}"
        >
            ${element.name} ${element.number + 1}
    </li>`,
};

const lazyListProps: InfinityScrollPropTypes = {
  data: BigJson1,
  dataLoadType: 'lazy',
  dataUrl: 'https://jsonplaceholder.typicode.com/comments',
  name: 'my scroll list name',
  selectorId: 'lazyInfinityScrollWrapper',
  listType: 'list',
  templateString: (
    element: unknown,
    parentList?: InfinityScroll
  ): string => `<li 
        class="infinityScrollList__listItem" 
        aria-setsize="${parentList.LIST_LENGTH}" 
        aria-posinset="${element.id}"
        >
            ${element.email} ${element.id}
    </li>`,
};

const nameToTag = {
  list: 'UL',
  table: 'TABLE',
};

class InfinityScroll {
  // хранит в себе id сетТаймаута
  private timerIdRefreshList: number | undefined;

  // ввёл, но пока не использовал
  private name: string;

  // хранит html-id главного корневого элемента
  private selectorId: string;

  // хранит ссылку на корневой html-элеент
  private wrapperEl: HTMLElement | null;

  // Массив данных для превращения в хтмл-ссписок
  private listData: unknown;

  // Тип списка (список или таблица)
  private listType: string;

  // dataSourceUrl - Ссылка на БД, откуда качать инфу
  private dataUrl: string | undefined;

  // Тип загрузки (список доступен сразу или надо качать с интернета)
  private dataLoadType: 'instant' | 'lazy';

  // Содержит генерируемый элемент внутри корневого
  private listEl: HTMLElement | null;

  private avrTimeArr: Array<number> = [];

  public isWaitRender = false;

  private domMngr: DomManager;

  private scroll: ScrollDetector;

  private listChunk: ChunkController;

  private list: ListController;

  constructor(props: InfinityScrollPropTypes) {
    this.name = props.name;
    this.selectorId = props.selectorId;
    this.wrapperEl = document.getElementById(props.selectorId);
    this.listType = props.listType;

    this.listEl = this.createInnerList();

    this.scroll = new ScrollDetector();

    this.listChunk = new ChunkController();

    const listProps = {
      el: this.listEl,
      wrapperEl: this.wrapperEl,
      scroll: this.scroll,
      listChunk: this.listChunk,
    };

    this.list = new ListController(listProps);

    this.scroll.setList(this.list);
    this.scroll.setListChunk(this.listChunk);

    const domChangerProps = {
      data: null,
      targetElem: this.listEl,
      infinityScroll: this,
      list: this.list,
      chunk: this.listChunk,
      template: props.templateString,
      scrollDetector: this.scroll,
    };

    this.dataLoadType = props.dataLoadType;

    if (this.dataLoadType === 'instant') {
      this.listData = props.data;
      this.list.length = this.listData && this.listData.length;
      console.log(this.list.length);
      domChangerProps.data = this.listData;
      this.domMngr = new DomManager(domChangerProps);
      this.start();
    } else {
      this.dataUrl = props.dataUrl;
      this.getRemoteData()
        .then((data) => {
          console.log(data);
          this.listData = data;
          return data;
        })
        .then((data) => {
          console.log('second then');
          this.list.length = this.listData && this.listData.length;
          domChangerProps.data = this.listData;
          this.domMngr = new DomManager(domChangerProps);
          this.start();
        });
    }
  }

  start() {
    console.log(this);
    if (this.dataLoadType === 'lazy') {
      console.log(this.listData);
      // return;
    }
    console.log('before get sizes');
    // this.setMainVars();
    // TODO: перебрать эту часть чтобы не было двух повторных вызовов
    this.list.getAllSizes();
    this.domMngr.fillList();
    this.list.getAllSizes();
    this.domMngr.setPaddingToList();

    let startDate = Date.now();

    this.wrapperEl.addEventListener('scroll', (e) => {
      const diffTime = Date.now() - startDate;
      if (diffTime < 100) {
        this.domMngr.avrTimeArr.push(diffTime);
      }
      this.calcCurrentDOMRender(e);
      startDate = Date.now();
    });
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

  // SCROLL + DOM
  modifyCurrentDOM(): void {
    if (!this.scroll.isAllowRenderNearBorder()) {
      return;
    }

    this.domMngr.changeItemsInList();
    this.domMngr.setOffsetToList();

    checkChildrenAmount(
      this.listEl.childNodes.length,
      this.list.FULL_VISIBLE_SIZE
    );
  }

  calcCurrentDOMRender(e: Event & { target: Element }) {
    const { scrollTop } = e.target;
    const orderedNumberOfChunk = Math.floor(
      scrollTop / this.listChunk.chunkHeight
    );

    checkChildrenAmount(
      this.listEl.childNodes.length,
      this.list.FULL_VISIBLE_SIZE
    );

    let newCurrentListScroll =
      orderedNumberOfChunk * this.listChunk.chunkAmount;

    if (scrollTop > this.scroll.lastScrollTopPosition) {
      this.scroll.scrollDirection = 'down';
    } else {
      this.scroll.scrollDirection = 'up';
    }

    this.scroll.lastScrollTopPosition = scrollTop;

    const scrollDiff = Math.abs(
      this.scroll.currentListScroll - newCurrentListScroll
    );

    if (scrollDiff !== 0 && scrollDiff <= this.list.tailingElementsAmount) {
      return;
    }

    if (this.timerIdRefreshList !== null && this.isWaitRender === false) {
      clearTimeout(this.timerIdRefreshList);
    }

    if (
      this.scroll.scrollDirection === 'down' &&
      orderedNumberOfChunk <= this.list.tailingElementsAmount
    ) {
      this.scroll.isGoingFromBottom = false;
    } else if (
      this.scroll.scrollDirection === 'up' &&
      orderedNumberOfChunk >= this.listChunk.LAST_ORDER_NUMBER - 1
    ) {
      this.scroll.isGoingFromBottom = true;
    }

    const isBigDiff =
      (this.scroll.isGoingFromBottom &&
        scrollDiff >
          this.listChunk.chunkAmount + this.list.tailingElementsAmount) ||
      (!this.scroll.isGoingFromBottom &&
        scrollDiff > this.listChunk.chunkAmount);

    if (isBigDiff && this.isWaitRender === false) {
      this.isWaitRender = true;
      this.timerIdRefreshList = window.setTimeout(() => {
        this.domMngr.resetAllList();
      }, 30);
    }

    if (this.scroll.currentListScroll !== newCurrentListScroll) {
      console.warn('====== currentListScroll поменялся ======');
      // TODO: удалить после отладки
      if (this.scroll.isGoingFromBottom) {
        newCurrentListScroll += this.list.tailingElementsAmount;
      }
      this.scroll.currentListScroll = newCurrentListScroll;

      // DOM Manipulation
      this.modifyCurrentDOM();
    }
  }

  getRemoteData(): Promise<unknown> {
    console.log('try to get data from', this.dataUrl);

    return fetch(this.dataUrl).then((response) =>
      response
        .json()
        .then((data) => {
          console.log(data);
          return data;
        })
        .catch((err) => {
          console.log(err);
        })
    );
  }
}

const instantList = document.getElementById(instantListProps.selectorId);
if (instantList !== null) {
  console.log('Instant list Started');
  const myInstantScroll = new InfinityScroll(instantListProps);
}

const lazyList = document.getElementById(lazyListProps.selectorId);

if (lazyList !== null) {
  console.log('Lazy list Started');
  const myLazyScroll = new InfinityScroll(lazyListProps);
}
