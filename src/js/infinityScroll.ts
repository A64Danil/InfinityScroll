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
4) Держим в памяти число, указывающее на начальный пункт списка в чанке - this.scroll.position
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

  // Текущая позиция скролла
  // Содержит номер элемента, с которого начинается текущая видимая часть
  // ==> переменная указывает, с какого элемента начинается текущий чанк
  // private currentListScroll = 0;
  // перенести в List и назвать VisiblePosition
  public position = 0;

  public direction = 'down';

  public isGoingFromBottom = false;

  // Предыдущая сохраненная позиция скролла (нужна чтобы сравнивать с новой)
  // TODO: переименовать после удаления position
  public lastScrollTopPosition = 0;

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

  setScroll(scroll: number): void {
    this.position = scroll;
    if (this.isGoingFromBottom) {
      this.position += this.list.tailingElementsAmount;
    }
  }

  setScrollDirection(scrollTop: number): void {
    if (scrollTop > this.lastScrollTopPosition) {
      this.direction = 'down';
    } else {
      this.direction = 'up';
    }
  }

  getDiff(newCurrentListScroll: number): number {
    return Math.abs(this.position - newCurrentListScroll);
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
      chunkPosition >= this.listChunk.LAST_ORDER_NUMBER - 1
    ) {
      this.isGoingFromBottom = true;
    }
  }

  isBigDiff(scrollDiff: number): boolean {
    const isBigDiff =
      (this.isGoingFromBottom &&
        scrollDiff >
          this.listChunk.chunkAmount + this.list.tailingElementsAmount) ||
      (!this.isGoingFromBottom && scrollDiff > this.listChunk.chunkAmount);
    return isBigDiff;
  }

  isBeginOfListFromTop(): boolean {
    return this.position < this.list.HALF_VISIBLE_SIZE;
  }

  isEndOfListFromTop(): boolean {
    return this.position > this.list.START_OF_LAST_VISIBLE_SIZE;
  }

  isBeginOfListFromBottom(): boolean {
    return this.position >= this.list.length - this.listChunk.chunkAmount * 3;
  }

  isEndOfListFromBottom(): boolean {
    return this.position < this.list.tailingElementsAmount;
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

  chunkHeight = 0;

  // Порядковый номер последнего чанка в списке
  LAST_ORDER_NUMBER: number;

  constructor() {
    console.log('start ChunkController');
  }

  getChunkPosition(scrollTop: number): number {
    const chunkPosition = Math.floor(scrollTop / this.chunkHeight);
    return chunkPosition;
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

  // Номер элемента, с которого начинается видимый чанк
  public visiblePosition: number;

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
    this.listChunk.LAST_ORDER_NUMBER = Math.floor(
      this.length / this.listChunk.chunkAmount
    );

    this.listChunk.chunkHeight = this.listChunk.chunkAmount * this.itemHeight;

    this.tailingElementsAmount = this.length % this.listChunk.chunkAmount;
  }

  getScroll(chunkPosition: number): number {
    const listScroll = chunkPosition * this.listChunk.chunkAmount;
    return listScroll;
  }

  // setPosition(scroll: number): void {
  //   this.visiblePosition = scroll;
  //   if (this.scroll.isGoingFromBottom) {
  //     this.visiblePosition += this.tailingElementsAmount;
  //   }
  // }
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
    console.log('this.scroll.position', this.scroll.position);

    if (forcedOffset !== undefined) {
      this.targetElem.style.transform = `translate(0,${forcedOffset}px)`;
      this.setPaddingToList(forcedOffset);
      return;
    }

    let start = this.scroll.position - this.listChunk.chunkAmount;

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
    const calculatedStart = this.scroll.position - this.listChunk.chunkAmount;
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
        ? this.scroll.position + this.list.HALF_VISIBLE_SIZE
        : this.scroll.position - this.listChunk.chunkAmount;

    if (newSequence < 0) newSequence = 0;

    const sequenceNumber = newSequence;

    for (let i = 0; i < 1000 && i < this.listChunk.chunkAmount; i++) {
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

  calcCurrentDOMRender(e: Event & { target: Element }): void {
    const { scrollTop } = e.target;
    // Вычисляем позицию чанка
    const chunkPosition: number = this.listChunk.getChunkPosition(scrollTop);
    checkChildrenAmount(
      this.listEl.childNodes.length,
      this.list.FULL_VISIBLE_SIZE
    );
    // Вычисляем позицию скролла списка (не путать с браузрным скроллом)
    const newScroll: number = this.list.getScroll(chunkPosition);
    this.scroll.setScrollDirection(scrollTop);

    this.scroll.lastScrollTopPosition = scrollTop;

    const scrollDiff: number = this.scroll.getDiff(newScroll);
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
    if (this.scroll.position !== newScroll) {
      console.warn('====== this.scroll.position поменялся ======');
      this.scroll.setScroll(newScroll);
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
