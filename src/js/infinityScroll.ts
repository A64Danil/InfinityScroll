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
  public direction: 'down' | 'up' = 'down';

  public isGoingFromBottom = false;

  // Предыдущая позиция скролла (нужна чтобы сравнивать с новой)
  public prevScroll = 0;

  constructor() {
    console.log('start ScrollDetector');
  }

  setScrollDirection(scroll: number): void {
    if (scroll > this.prevScroll) {
      this.direction = 'down';
    } else {
      this.direction = 'up';
    }
  }

  // eslint-disable-next-line class-methods-use-this
  getDiff(startRenderIndex: number, newRenderIndex: number): number {
    return Math.abs(startRenderIndex - newRenderIndex);
  }

  // TODO: говорит, нужен this
  // eslint-disable-next-line class-methods-use-this
  isSmallDiff(scrollDiff: number, tailingElementsAmount: number): boolean {
    if (scrollDiff !== 0 && scrollDiff <= tailingElementsAmount) {
      return true;
    }
    return false;
  }

  setGoingFromBottom(chunk: ChunkController, chunkOrderNumber: number): void {
    if (
      this.direction === 'down' &&
      chunkOrderNumber <= chunk.firstOrderNumber
    ) {
      this.isGoingFromBottom = false;
    } else if (
      this.direction === 'up' &&
      chunkOrderNumber >= chunk.lastOrderNumber - 1
    ) {
      this.isGoingFromBottom = true;
    }
  }

  isBigDiff(
    scrollDiff: number,
    chunkAmount: number,
    tailingElementsAmount: number
  ): boolean {
    const isBigDiff =
      (this.isGoingFromBottom &&
        scrollDiff > chunkAmount + tailingElementsAmount) ||
      (!this.isGoingFromBottom && scrollDiff > chunkAmount);
    return isBigDiff;
  }
}

class ChunkController {
  // Размер чанка (чанк - видимая часть элементов в спике)
  amount = 2;

  htmlHeight = 0;

  // TODO: разобраться чтобы не говорило что unused
  firstOrderNumber = 0;

  // Порядковый номер последнего чанка в списке
  lastOrderNumber: number;

  // Номер, с которого начинается последний чанк
  lastRenderIndex = 0;

  // Номер, c которого мы будем рендерить следующуй чанк
  public startRenderIndex = 0;

  constructor() {
    console.log('start ChunkController');
  }

  getOrderNumber(scroll: number): number {
    const chunkOrderNumber = Math.floor(scroll / this.htmlHeight);
    return chunkOrderNumber;
  }

  setRenderIndex(
    scroll: number,
    isGoingFromBottom: boolean,
    tailingElementsAmount: number
  ): void {
    this.startRenderIndex = scroll;
    if (isGoingFromBottom) {
      this.startRenderIndex += tailingElementsAmount;
    }
  }

  getRenderIndex(chunkOrderNumber: number): number {
    const startRenderIndex = chunkOrderNumber * this.amount;
    return startRenderIndex;
  }

  isBeginOfListFromTop(halfOfExistingSizeInDOM: number): boolean {
    return this.startRenderIndex < halfOfExistingSizeInDOM;
  }

  isEndOfListFromTop(): boolean {
    return this.startRenderIndex > this.lastRenderIndex;
  }

  isBeginOfListFromBottom(listLength: number): boolean {
    return this.startRenderIndex >= listLength - this.amount * 3;
  }

  isEndOfListFromBottom(tailingElementsAmount: number): boolean {
    return this.startRenderIndex < tailingElementsAmount;
  }

  isAllowRenderNearBorder(
    direction: 'down' | 'up',
    list: ListController
  ): boolean {
    if (
      direction === 'down' &&
      this.isBeginOfListFromTop(list.halfOfExistingSizeInDOM)
    ) {
      console.log('Пока рендерить не надо. Вы в самом верху списка.');
      return false;
    }

    if (direction === 'down' && this.isEndOfListFromTop()) {
      console.log('УЖЕ рендерить не надо.  Вы в самом низу списка.');
      return false;
    }

    if (direction === 'up' && this.isBeginOfListFromBottom(list.length)) {
      console.log(
        'Пока рендерить не надо (up). Вы в самом низу списка. Это сообщение мы должны видеть 2 раза'
      );
      return false;
    }

    if (
      direction === 'up' &&
      this.isEndOfListFromBottom(list.tailingElementsAmount)
    ) {
      console.log('Уже рендерить не надо (up). Вы в самом верху списка.');
      return false;
    }

    return true;
  }
}

class ListController {
  // Содержит генерируемый элемент внутри корневого
  // el: HTMLElement;

  // Длина списка
  length: number | undefined;

  // Размер списка в ДОМ (вычисляется как "чанк * 4")
  existingSizeInDOM = 0;

  // Половина видимого размер списка
  halfOfExistingSizeInDOM = 0;

  // Высота обертки у списка
  wrapperHeight = 0;

  // Высота пункта списка
  itemHeight = 0;

  // Количество элементов в крайнем чанке
  tailingElementsAmount = 0;

  // Стартовый индекс последней части списка
  public startIndexOfLastPart = 0;

  constructor() {
    console.log('Start List Controller', this);
  }
}

class DomManager {
  // даже не знаю зачем эта переменная, нужна для нулевого сетТаймайт
  private delay = 0;

  // хранит в себе id сетТаймаута
  private fillListTimerId: number | undefined;

  private data;

  // TODO: сделать назад приватным
  public targetElem;

  // Содержит в себе хтмл-шаблон, в который мы положим данные из БД
  private template;

  // Общий счётчик элементов (создан для рекурсивной функции чтобы она не добавляла слишком много за раз)
  private GLOBAL_ITEM_COUNTER = 0;

  private avrTimeArr: Array<number> = [];

  private infinityScroll: InfinityScroll;

  constructor(props: {
    data: any;
    targetElem: HTMLElement;
    infinityScroll: InfinityScroll;
    list: ListController;
    chunk: ChunkController;
    // eslint-disable-next-line @typescript-eslint/ban-types
    template: Function;
  }) {
    this.data = props.data;
    this.targetElem = props.targetElem;
    this.infinityScroll = props.infinityScroll;
    this.template = props.template;
  }

  setPaddingToList(
    list: ListController,
    chunkHtmlHeight: number,
    offset = 0
  ): void {
    let paddingBottom =
      list.length * list.itemHeight - chunkHtmlHeight * 4 - offset;

    // TODO: проверить, попадаем ли мы туда
    if (paddingBottom < 0) {
      console.error('==========Мы попали в if paddingBottom < 0 =======');
      paddingBottom = 0;
    }
    this.targetElem.style.paddingBottom = `${paddingBottom}px`;
  }

  setOffsetToList(
    chunk: ChunkController,
    list: ListController,
    direction: 'down' | 'up',
    forcedOffset: number | undefined = undefined
  ): void {
    console.log('chunk.startRenderIndex', chunk.startRenderIndex);

    if (forcedOffset !== undefined) {
      this.targetElem.style.transform = `translate(0,${forcedOffset}px)`;
      this.setPaddingToList(list, chunk.htmlHeight, forcedOffset);
      return;
    }

    let start = chunk.startRenderIndex - chunk.amount;

    // TODO: нужно ли следующие 2 проверки выносить в отдельную функцию?
    if (start < 0) {
      start = 0;
    }
    // Если этого нет, то попадаем в padding 0!
    if (direction === 'down' && start > list.startIndexOfLastPart) {
      start = list.startIndexOfLastPart;
    }
    const offset = start * list.itemHeight;

    this.targetElem.style.transform = `translate(0,${offset}px)`;
    this.setPaddingToList(list, chunk.htmlHeight, offset);
  }

  createItem(elemNum: number): string {
    const element = this.data[elemNum];
    return this.template(element, this.targetElem);
  }

  removeItem(childPosition: 'firstChild' | 'lastChild'): void {
    const child: ChildNode | null = this.targetElem[childPosition];
    // TODO: узнать, чем отличается ChildNode От Node
    this.targetElem.removeChild(child);
  }

  fillList(list: ListController): void {
    if (
      this.GLOBAL_ITEM_COUNTER > 49999 ||
      this.GLOBAL_ITEM_COUNTER >= list.length ||
      this.GLOBAL_ITEM_COUNTER >= list.existingSizeInDOM
    )
      return;

    let templateFragments = '';
    for (
      let i = 0;
      i < 1000 &&
      i < list.length - 1 &&
      this.GLOBAL_ITEM_COUNTER < list.length &&
      this.GLOBAL_ITEM_COUNTER < list.existingSizeInDOM;
      i++
    ) {
      templateFragments += this.createItem(this.GLOBAL_ITEM_COUNTER);
      this.GLOBAL_ITEM_COUNTER++;
    }

    this.targetElem.innerHTML += templateFragments;

    this.fillListTimerId = window.setTimeout(
      () => this.fillList(list),
      this.delay
    );
  }

  resetAllList(
    chunk: ChunkController,
    list: ListController,
    direction: 'down' | 'up'
  ): void {
    const calculatedStart = chunk.startRenderIndex - chunk.amount;
    const newStart =
      calculatedStart > list.startIndexOfLastPart
        ? list.startIndexOfLastPart
        : calculatedStart;

    let newSequence = newStart;

    if (newSequence < 0) newSequence = 0;

    const sequenceNumber = newSequence;

    let templateFragments = '';
    for (let i = 0; i < 1000 && i < list.existingSizeInDOM; i++) {
      // add items
      const elemNum = i + sequenceNumber;
      templateFragments += this.createItem(elemNum);
    }

    const newOffset = newSequence * list.itemHeight;

    this.targetElem.innerHTML = templateFragments;
    this.setOffsetToList(chunk, list, direction, newOffset);

    // TODO: убрать после тестов
    const allTime = this.avrTimeArr.reduce((acc, el) => acc + el);
    console.log('среднее время рендера:', allTime / this.avrTimeArr.length);

    // TODO: не хватает этой переменной
    this.infinityScroll.isWaitRender = false;
  }

  changeItemsInList(
    chunk: ChunkController,
    list: ListController,
    direction: 'down' | 'up',
    isGoingFromBottom: boolean
  ): void {
    // for addItems
    let templateFragments = '';

    // for removeItems
    const childPosition = direction === 'down' ? 'firstChild' : 'lastChild';

    // Это работает праивльно (в начале списка)
    let newSequence =
      direction === 'down'
        ? chunk.startRenderIndex + list.halfOfExistingSizeInDOM
        : chunk.startRenderIndex - chunk.amount;

    if (newSequence < 0) newSequence = 0;

    const sequenceNumber = newSequence;

    for (let i = 0; i < 1000 && i < chunk.amount; i++) {
      const isStartOfList = direction === 'up' && sequenceNumber === 0;

      const isReachTopLimit =
        isGoingFromBottom &&
        isStartOfList &&
        i + sequenceNumber >= list.tailingElementsAmount;

      const isReachBottomLimit =
        direction === 'down' && i + sequenceNumber > list.length - 1;

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
    if (direction === 'down') {
      this.targetElem.innerHTML += templateFragments;
    } else {
      this.targetElem.innerHTML = templateFragments + this.targetElem.innerHTML;
    }
  }

  modifyCurrentDOM(
    chunk: ChunkController,
    list: ListController,
    direction: 'down' | 'up',
    isGoingFromBottom: boolean
  ): void {
    if (!chunk.isAllowRenderNearBorder(direction, list)) {
      return;
    }

    this.changeItemsInList(chunk, list, direction, isGoingFromBottom);
    this.setOffsetToList(chunk, list, direction);

    checkChildrenAmount(
      this.targetElem.childNodes.length,
      list.existingSizeInDOM
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

    this.chunk = new ChunkController();

    this.list = new ListController();

    const domChangerProps = {
      data: null,
      targetElem: this.listEl,
      infinityScroll: this,
      template: props.templateString,
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
    this.getAllSizes();
    this.domMngr.fillList(this.list);
    this.domMngr.setPaddingToList(this.list, this.chunk.htmlHeight);

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

  getAllSizes(): void {
    console.log('GET SIZES');
    const listWrp = this.wrapperEl;
    const list = this.listEl;
    const listWrpStyles = window.getComputedStyle(listWrp);
    let listItem = list.firstChild as HTMLElement;

    this.list.wrapperHeight =
      parseInt(listWrpStyles.getPropertyValue('height'), 10) || 1;

    if (this.list.wrapperHeight < 2) {
      console.error('You must set height to your list-wrapper!');
      return;
    }

    if (!listItem) {
      console.warn('Элементов в списке нет');
      this.domMngr.targetElem.innerHTML += this.domMngr.createItem(0);
      listItem = list.firstChild as HTMLElement;
    }

    this.list.itemHeight = listItem?.offsetHeight || this.list.wrapperHeight;

    this.chunk.amount = Math.ceil(
      this.list.wrapperHeight / this.list.itemHeight
    );

    this.list.existingSizeInDOM = this.chunk.amount * 4;
    this.list.halfOfExistingSizeInDOM = this.list.existingSizeInDOM / 2;
    this.chunk.lastRenderIndex =
      this.list.length - this.list.halfOfExistingSizeInDOM;

    this.list.startIndexOfLastPart =
      this.list.length - this.list.existingSizeInDOM;
    this.chunk.lastOrderNumber = Math.floor(
      this.list.length / this.chunk.amount
    );

    this.chunk.htmlHeight = this.chunk.amount * this.list.itemHeight;

    this.list.tailingElementsAmount = this.list.length % this.chunk.amount;

    if (listItem) {
      console.warn('Элемент в списке есть');
      this.domMngr.removeItem('firstChild');
    }
  }

  calcCurrentDOMRender(e: Event & { target: Element }): void {
    const scroll = e.target.scrollTop;
    // Вычисляем позицию чанка
    const chunkOrderNumber: number = this.chunk.getOrderNumber(scroll);
    checkChildrenAmount(
      this.listEl.childNodes.length,
      this.list.existingSizeInDOM
    );
    // Вычисляем новый индекс для рендера чанка (не путать с браузрным скроллом)
    const newRenderIndex: number = this.chunk.getRenderIndex(chunkOrderNumber);
    this.scroll.setScrollDirection(scroll);

    this.scroll.prevScroll = scroll;

    const scrollDiff: number = this.scroll.getDiff(
      this.chunk.startRenderIndex,
      newRenderIndex
    );
    // Если скролл слишком маленький - не делаем ничего
    if (this.scroll.isSmallDiff(scrollDiff, this.list.tailingElementsAmount)) {
      return;
    }

    this.clearTimerIfNeeded();
    // Устанавливаем буль, если мы движемся вверх от самого низа списка (это важно)
    this.scroll.setGoingFromBottom(this.chunk, chunkOrderNumber);
    // Если скролл слишком большой - рисуем всё заново
    this.checkBigDiffToResetList(scrollDiff);

    // Если скролл поменялся - устанавливаем новый скролл и меняем ДОМ
    if (this.chunk.startRenderIndex !== newRenderIndex) {
      console.warn('====== this.chunk.startRenderIndex поменялся ======');
      this.chunk.setRenderIndex(
        newRenderIndex,
        this.scroll.isGoingFromBottom,
        this.list.tailingElementsAmount
      );
      this.domMngr.modifyCurrentDOM(
        this.chunk,
        this.list,
        this.scroll.direction,
        this.scroll.isGoingFromBottom
      );
    }
  }

  clearTimerIfNeeded(): void {
    if (this.timerIdRefreshList !== null && this.isWaitRender === false) {
      clearTimeout(this.timerIdRefreshList);
    }
  }

  checkBigDiffToResetList(scrollDiff: number): void {
    const isBigDiff: boolean = this.scroll.isBigDiff(
      scrollDiff,
      this.chunk.amount,
      this.list.tailingElementsAmount
    );

    if (isBigDiff && this.isWaitRender === false) {
      this.isWaitRender = true;
      this.timerIdRefreshList = window.setTimeout(() => {
        this.domMngr.resetAllList(this.chunk, this.list, this.scroll.direction);
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
