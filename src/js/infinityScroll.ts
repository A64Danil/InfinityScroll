// eslint-disable-next-line max-classes-per-file
console.log('TS file loaded');

const checkChildrenAmount = (length: number, fullSize: number): void => {
  if (length !== fullSize) {
    console.error('%cКоличесвто деток: ', 'color: tomato', length);
  }
};

const nameToTag = {
  list: 'UL',
  table: 'TABLE',
};

/* Давайте посчитаем все промежуточные переменные:
1) Высота всего списка, чтобы понимать "размер" блоков (чанков)
2) Высота пункта списка, чтобы понимать сколько пунктов влезает в чанк (сколько грузить за раз)
3) Используем высоту чанка чтобы регулировать отступы
4) Держим в памяти число, указывающее на начальный пункт списка в чанке
5) При переходе к след/пред чанку выполняем действия с ДОМ и отступами

// если дифф слишком большой, то делаем фуллРендер
// для того чтобы подчитать дифф, нужно понять, когда скролл остановился


--- до рефакторинга было 450 строк кода

 */

// HELPER FUNCTIONS
class ScrollDetector {
  // Последняя доступная позиция скролла
  // Предыдущая сохраненная позиция скролла (нужна чтобы сравнивать с новой)
  // TODO: проверить, нужна ли она вообще
  public LIST_LAST_SCROLL_POSITION = 0;

  public direction = 'down';

  public isGoingFromBottom = false;

  // Предыдущая сохраненная позиция скролла (нужна чтобы сравнивать с новой)
  // TODO: переименовать после удаления position
  public lastScrollTopPosition = 0;

  private list: ListController | undefined;

  private chunk: ChunkController | undefined;

  constructor() {
    console.log('start ScrollDetector');
  }

  setList(list: ListController) {
    this.list = list;
  }

  setListChunk(chunk: ChunkController) {
    this.chunk = chunk;
  }

  setScrollDirection(scrollTop: number): void {
    if (scrollTop > this.lastScrollTopPosition) {
      this.direction = 'down';
    } else {
      this.direction = 'up';
    }
  }

  getDiff(newCurrentListScroll: number): number {
    return Math.abs(this.chunk.startRenderIndex - newCurrentListScroll);
  }

  isSmallDiff(scrollDiff: number): boolean {
    if (scrollDiff !== 0 && scrollDiff <= this.list.tailingElementsAmount) {
      return true;
    }
    return false;
  }

  setGoingFromBottom(chunkPosition: number): void {
    if (
      this.direction === 'down' &&
      chunkPosition <= this.list.tailingElementsAmount
    ) {
      this.isGoingFromBottom = false;
    } else if (
      this.direction === 'up' &&
      chunkPosition >= this.chunk.lastRenderIndex - 1
    ) {
      this.isGoingFromBottom = true;
    }
  }

  isBigDiff(scrollDiff: number): boolean {
    const isBigDiff =
      (this.isGoingFromBottom &&
        scrollDiff >
          this.chunk.chunkAmount + this.list.tailingElementsAmount) ||
      (!this.isGoingFromBottom && scrollDiff > this.chunk.chunkAmount);
    return isBigDiff;
  }

  isBeginOfListFromTop(): boolean {
    return this.chunk.startRenderIndex < this.list.HALF_VISIBLE_SIZE;
  }

  isEndOfListFromTop(): boolean {
    return this.chunk.startRenderIndex > this.list.START_OF_LAST_VISIBLE_SIZE;
  }

  isBeginOfListFromBottom(): boolean {
    return (
      this.chunk.startRenderIndex >=
      this.list.length - this.chunk.chunkAmount * 3
    );
  }

  isEndOfListFromBottom(): boolean {
    return this.chunk.startRenderIndex < this.list.tailingElementsAmount;
  }

  isAllowRenderNearBorder(): boolean {
    if (this.direction === 'down' && this.isBeginOfListFromTop()) {
      console.log('Пока рендерить не надо. Вы в самом верху списка.');
      return false;
    }

    if (this.direction === 'down' && this.isEndOfListFromTop()) {
      console.log('УЖЕ рендерить не надо.  Вы в самом низу списка.');
      return false;
    }

    if (this.direction === 'up' && this.isBeginOfListFromBottom()) {
      console.log(
        'Пока рендерить не надо (up). Вы в самом низу списка. Это сообщение мы должны видеть 2 раза'
      );
      return false;
    }

    if (this.direction === 'up' && this.isEndOfListFromBottom()) {
      console.log('Уже рендерить не надо (up). Вы в самом верху списка.');
      return false;
    }

    return true;
  }
}

class ChunkController {
  // Размер чанка (чанк - видимая часть элементов в спике)
  chunkAmount = 2;

  htmlHeight = 0;

  // Порядковый номер последнего чанка в списке
  lastRenderIndex: number;

  // Номер, c которого мы будем рендерить следующуй чанк
  public startRenderIndex = 0;

  private scroll: ScrollDetector;

  private list: ListController;

  constructor(props: { scroll: ScrollDetector }) {
    console.log('start ChunkController');
    this.scroll = props.scroll;
  }

  setList(list: ListController) {
    this.list = list;
  }

  getOrderNumber(scrollTop: number): number {
    const chunkOrderNumber = Math.floor(scrollTop / this.htmlHeight);
    return chunkOrderNumber;
  }

  setRenderIndex(scroll: number): void {
    this.startRenderIndex = scroll;
    if (this.scroll.isGoingFromBottom) {
      this.startRenderIndex += this.list.tailingElementsAmount;
    }
  }

  getRenderIndex(chunkPosition: number): number {
    const startRenderIndex = chunkPosition * this.chunkAmount;
    return startRenderIndex;
  }
}

class ListController {
  // Содержит генерируемый элемент внутри корневого
  el: HTMLElement;

  // Длина списка
  length: number | undefined;

  // Видимый размер списка (вычисляется по цсс-свойствам)
  // TODO: не "видимы", а присутствующий в ДОМ
  FULL_VISIBLE_SIZE = 0;

  // Половина видимого размер списка
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

  private chunk: ChunkController;

  private readonly scroll: ScrollDetector;

  constructor(props: {
    wrapperEl: HTMLElement;
    el: HTMLElement;
    scroll: ScrollDetector;
    chunk: ChunkController;
  }) {
    this.el = props.el;
    this.wrapperEl = props.wrapperEl;
    this.chunk = props.chunk;
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

    this.chunk.chunkAmount = Math.ceil(this.wrapperHeight / this.itemHeight);

    this.FULL_VISIBLE_SIZE = this.chunk.chunkAmount * 4;
    this.HALF_VISIBLE_SIZE = this.FULL_VISIBLE_SIZE / 2;
    this.START_OF_LAST_VISIBLE_SIZE = this.length - this.HALF_VISIBLE_SIZE;
    console.log(
      'this.scroll.LIST_LAST_SCROLL_POSITION',
      this.scroll.LIST_LAST_SCROLL_POSITION
    );
    this.scroll.LIST_LAST_SCROLL_POSITION =
      this.length - this.FULL_VISIBLE_SIZE;
    console.log(
      'this.scroll.LIST_LAST_SCROLL_POSITION',
      this.scroll.LIST_LAST_SCROLL_POSITION
    );
    this.chunk.lastRenderIndex = Math.floor(
      this.length / this.chunk.chunkAmount
    );

    this.chunk.htmlHeight = this.chunk.chunkAmount * this.itemHeight;

    this.tailingElementsAmount = this.length % this.chunk.chunkAmount;
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

  private chunk: ChunkController;

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
    this.chunk = props.chunk;
    this.template = props.template;
    this.scroll = props.scrollDetector;
  }

  setPaddingToList(offset = 0): void {
    let paddingBottom =
      this.list.length * this.list.itemHeight -
      this.chunk.htmlHeight * 4 -
      offset;

    // TODO: проверить, попадаем ли мы туда
    if (paddingBottom < 0) {
      console.error('==========Мы попали в if paddingBottom < 0 =======');
      paddingBottom = 0;
    }
    this.targetElem.style.paddingBottom = `${paddingBottom}px`;
  }

  setOffsetToList(forcedOffset: number | undefined = undefined): void {
    console.log('this.chunk.startRenderIndex', this.chunk.startRenderIndex);

    if (forcedOffset !== undefined) {
      this.targetElem.style.transform = `translate(0,${forcedOffset}px)`;
      this.setPaddingToList(forcedOffset);
      return;
    }

    let start = this.chunk.startRenderIndex - this.chunk.chunkAmount;

    // TODO: нужно ли следующие 2 проверки выносить в отдельную функцию?
    if (start < 0) {
      start = 0;
    }
    // Если этого нет, то попадаем в padding 0!
    if (
      this.scroll.direction === 'down' &&
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
      this.chunk.startRenderIndex - this.chunk.chunkAmount;
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
      this.scroll.direction === 'down' ? 'firstChild' : 'lastChild';

    // Это работает праивльно (в начале списка)
    let newSequence =
      this.scroll.direction === 'down'
        ? this.chunk.startRenderIndex + this.list.HALF_VISIBLE_SIZE
        : this.chunk.startRenderIndex - this.chunk.chunkAmount;

    if (newSequence < 0) newSequence = 0;

    const sequenceNumber = newSequence;

    for (let i = 0; i < 1000 && i < this.chunk.chunkAmount; i++) {
      const isStartOfList =
        this.scroll.direction === 'up' && sequenceNumber === 0;

      const isReachTopLimit =
        this.scroll.isGoingFromBottom &&
        isStartOfList &&
        i + sequenceNumber >= this.list.tailingElementsAmount;

      const isReachBottomLimit =
        this.scroll.direction === 'down' &&
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
    if (this.scroll.direction === 'down') {
      this.targetElem.innerHTML += templateFragments;
    } else {
      this.targetElem.innerHTML = templateFragments + this.targetElem.innerHTML;
    }
  }

  modifyCurrentDOM(): void {
    if (!this.scroll.isAllowRenderNearBorder()) {
      return;
    }

    this.changeItemsInList();
    this.setOffsetToList();

    checkChildrenAmount(
      this.targetElem.childNodes.length,
      this.list.FULL_VISIBLE_SIZE
    );
  }
}

// START OF CLASS REALIZATION OF INFINITYSCROLL
interface InfinityScrollPropTypes {
  // data?: Array<ListData>;
  dataLoadType: 'instant' | 'lazy';
  dataUrl?: string;
  name: string;
  selectorId: string;
  listType: 'list' | 'table';
  // templateString: TplStringFn;
}

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

  private chunk: ChunkController;

  private list: ListController;

  constructor(props: InfinityScrollPropTypes) {
    this.name = props.name;
    this.selectorId = props.selectorId;
    this.wrapperEl = document.getElementById(props.selectorId);
    this.listType = props.listType;

    this.listEl = this.createInnerList();

    this.scroll = new ScrollDetector();

    const chunkProps = {
      scroll: this.scroll,
    };

    this.chunk = new ChunkController(chunkProps);

    const listProps = {
      el: this.listEl,
      wrapperEl: this.wrapperEl,
      scroll: this.scroll,
      chunk: this.chunk,
    };

    this.list = new ListController(listProps);

    this.chunk.setList(this.list);

    this.scroll.setList(this.list);
    this.scroll.setListChunk(this.chunk);

    const domChangerProps = {
      data: null,
      targetElem: this.listEl,
      infinityScroll: this,
      list: this.list,
      chunk: this.chunk,
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

  calcCurrentDOMRender(e: Event & { target: Element }): void {
    const { scrollTop } = e.target;
    // Вычисляем позицию чанка
    const chunkPosition: number = this.chunk.getOrderNumber(scrollTop);
    checkChildrenAmount(
      this.listEl.childNodes.length,
      this.list.FULL_VISIBLE_SIZE
    );
    // Вычисляем новый индекс для рендера чанка (не путать с браузрным скроллом)
    const newRenderIndex: number = this.chunk.getRenderIndex(chunkPosition);
    this.scroll.setScrollDirection(scrollTop);

    this.scroll.lastScrollTopPosition = scrollTop;

    const scrollDiff: number = this.scroll.getDiff(newRenderIndex);
    // Если скролл слишком маленький - не делаем ничего
    if (this.scroll.isSmallDiff(scrollDiff)) {
      return;
    }

    this.clearTimerIfNeeded();
    // Устанавливаем буль, если мы движемся вверх от самого низа списка (это важно)
    this.scroll.setGoingFromBottom(chunkPosition);
    // Если скролл слишком большой - рисуем всё заново
    this.checkBigDiffToResetList(scrollDiff);

    // Если скролл поменялся - устанавливаем новый скролл и меняем ДОМ
    if (this.chunk.startRenderIndex !== newRenderIndex) {
      console.warn('====== this.chunk.startRenderIndex поменялся ======');
      this.chunk.setRenderIndex(newRenderIndex);
      this.domMngr.modifyCurrentDOM();
    }
  }

  clearTimerIfNeeded(): void {
    if (this.timerIdRefreshList !== null && this.isWaitRender === false) {
      clearTimeout(this.timerIdRefreshList);
    }
  }

  checkBigDiffToResetList(scrollDiff: number): void {
    const isBigDiff: boolean = this.scroll.isBigDiff(scrollDiff);

    if (isBigDiff && this.isWaitRender === false) {
      this.isWaitRender = true;
      this.timerIdRefreshList = window.setTimeout(() => {
        this.domMngr.resetAllList();
      }, 30);
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

export { InfinityScroll };
