// eslint-disable-next-line max-classes-per-file
console.log('TS file loaded');

const checkChildrenAmount = (length: number, fullSize: number): void => {
  if (length !== fullSize) {
    console.error('%cКоличесвто деток: ', 'color: tomato', length);
  }
};

type IScrollDirection = 'down' | 'up';

type NameToTagObj = {
  [key: string]: string;
};

const nameToTag: NameToTagObj = {
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
class RenderController {
  private readonly halfOfExistingSizeInDOM: number;

  private readonly lastRenderIndex: number;

  private readonly listLength: number;

  private readonly chunkAmount: number;

  private readonly tailingElementsAmount: number;

  constructor(renderProps: {
    halfOfExistingSizeInDOM: number;
    lastRenderIndex: number;
    listLength: number;
    chunkAmount: number;
    tailingElementsAmount: number;
  }) {
    this.halfOfExistingSizeInDOM = renderProps.halfOfExistingSizeInDOM;
    this.lastRenderIndex = renderProps.lastRenderIndex;
    this.listLength = renderProps.listLength;
    this.chunkAmount = renderProps.chunkAmount;
    this.tailingElementsAmount = renderProps.tailingElementsAmount;
    console.log(this);
  }

  isBeginOfListFromTop(startRenderIndex: number): boolean {
    return startRenderIndex < this.halfOfExistingSizeInDOM;
  }

  isEndOfListFromTop(startRenderIndex: number): boolean {
    return startRenderIndex > this.lastRenderIndex;
  }

  isBeginOfListFromBottom(startRenderIndex: number): boolean {
    return startRenderIndex >= this.listLength - this.chunkAmount * 3;
  }

  isEndOfListFromBottom(startRenderIndex: number): boolean {
    return startRenderIndex < this.tailingElementsAmount;
  }

  isAllowRenderNearBorder(
    direction: IScrollDirection,
    startRenderIndex: number
  ): boolean {
    if (direction === 'down' && this.isBeginOfListFromTop(startRenderIndex)) {
      console.log('Пока рендерить не надо. Вы в самом верху списка.');
      return false;
    }

    if (direction === 'down' && this.isEndOfListFromTop(startRenderIndex)) {
      console.log('УЖЕ рендерить не надо.  Вы в самом низу списка.');
      return false;
    }

    if (direction === 'up' && this.isBeginOfListFromBottom(startRenderIndex)) {
      console.log(
        'Пока рендерить не надо (up). Вы в самом низу списка. Это сообщение мы должны видеть 2 раза'
      );
      return false;
    }

    if (direction === 'up' && this.isEndOfListFromBottom(startRenderIndex)) {
      console.log('Уже рендерить не надо (up). Вы в самом верху списка.');
      return false;
    }

    return true;
  }
}

class ScrollDetector {
  public direction: IScrollDirection = 'down';

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

  // TODO: говорит, нужен this
  // eslint-disable-next-line class-methods-use-this
  isSmallDiff(renderIndexDiff: number, tailingElementsAmount: number): boolean {
    if (renderIndexDiff !== 0 && renderIndexDiff <= tailingElementsAmount) {
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
    renderIndexDiff: number,
    chunkAmount: number,
    tailingElementsAmount: number
  ): boolean {
    const isBigDiff =
      (this.isGoingFromBottom &&
        renderIndexDiff > chunkAmount + tailingElementsAmount) ||
      (!this.isGoingFromBottom && renderIndexDiff > chunkAmount);
    return isBigDiff;
  }
}

class ChunkController {
  // Размер чанка (чанк - видимая часть элементов в спике)
  public amount = 2;

  public htmlHeight = 0;

  public firstOrderNumber = 0;

  // Порядковый номер последнего чанка в списке
  public lastOrderNumber = 1;

  // Номер, с которого начинается последний чанк
  public lastRenderIndex = 0;

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
    renderIndex: number,
    isGoingFromBottom: boolean,
    tailingElementsAmount: number
  ): void {
    this.startRenderIndex = renderIndex;
    if (isGoingFromBottom) {
      this.startRenderIndex += tailingElementsAmount;
    }
  }

  getRenderIndexDiff(newRenderIndex: number): number {
    return Math.abs(this.startRenderIndex - newRenderIndex);
  }

  calcRenderIndex(chunkOrderNumber: number): number {
    const renderIndex = chunkOrderNumber * this.amount;
    return renderIndex;
  }
}

class ListController {
  // Массив данных для превращения в хтмл-ссписок
  public data: object[] | undefined;

  // Длина списка
  length = 0;

  // Размер списка в ДОМ (вычисляется как "чанк * 4")
  existingSizeInDOM = 0;

  // Половина видимого размер списка
  halfOfExistingSizeInDOM = 0;

  wrapperHeight = 0;

  itemHeight = 0;

  // TODO: перенести в чанк?
  // Количество элементов в крайнем чанке
  tailingElementsAmount = 0;

  // Стартовый индекс последней части списка
  public startIndexOfLastPart = 0;

  constructor() {
    console.log('Start List Controller', this);
  }
}

class DomManager {
  public isWaitRender = false;

  // даже не знаю зачем эта переменная, нужна для нулевого сетТаймайт
  private delay = 0;

  // хранит в себе id сетТаймаута
  private fillListTimerId: number | undefined;

  readonly targetElem;

  // Содержит в себе хтмл-шаблон, в который мы положим данные из БД
  private readonly template;

  // Общий счётчик элементов (создан для рекурсивной функции чтобы она не добавляла слишком много за раз)
  private GLOBAL_ITEM_COUNTER = 0;

  public avrTimeArr: Array<number> = [];

  private readonly listLength: number;

  constructor(props: {
    template: TemplateStringFunction;
    targetElem: HTMLElement;
    listLength: number;
  }) {
    // this.data = props.data;
    this.targetElem = props.targetElem;
    this.template = props.template;
    this.listLength = props.listLength;
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
    direction: IScrollDirection,
    forcedOffset: number | undefined = undefined
  ): void {
    /* Список используемых переменных
     *  chunk.startRenderIndex
     *  chunk.htmlHeight
     *  chunk.amount
     *
     *
     * list.startIndexOfLastPart
     * list.itemHeight
     * */
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

  createItem(elemData: object): string {
    return this.template(elemData, this.listLength);
  }

  removeItem(childPosition: 'firstChild' | 'lastChild'): void {
    const child: ChildNode | null = this.targetElem[childPosition];
    if (!child) {
      return;
    }
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
      if (list.data === undefined) {
        throw new Error('Your list.data is undefined');
      }
      const elemData = list.data[this.GLOBAL_ITEM_COUNTER];
      templateFragments += this.createItem(elemData);
      this.GLOBAL_ITEM_COUNTER++;
    }

    this.targetElem.innerHTML += templateFragments;

    this.fillListTimerId = window.setTimeout(
      () => this.fillList(list),
      this.delay
    );
  }

  // eslint-disable-next-line class-methods-use-this
  calcSequenceByDirection(
    direction: IScrollDirection,
    halfOfExistingSizeInDOM: number,
    startRenderIndex: number,
    chunkAmount: number
  ) {
    let precalcSequence =
      direction === 'down'
        ? startRenderIndex + halfOfExistingSizeInDOM
        : startRenderIndex - chunkAmount;

    if (precalcSequence < 0) precalcSequence = 0;

    return precalcSequence;
  }

  // TODO: вынести в хелпер?
  // eslint-disable-next-line class-methods-use-this
  recalcSequence(precalcSequence: number, startIndexOfLastPart: number) {
    const newSequence =
      precalcSequence > startIndexOfLastPart
        ? startIndexOfLastPart
        : precalcSequence;

    return newSequence;
  }

  resetAllList(
    chunk: ChunkController,
    list: ListController,
    direction: IScrollDirection
  ): void {
    const precalcSequence = this.calcSequenceByDirection(
      direction,
      list.halfOfExistingSizeInDOM,
      chunk.startRenderIndex,
      chunk.amount
    );
    const sequenceNumber = this.recalcSequence(
      precalcSequence,
      list.startIndexOfLastPart
    );

    let templateFragments = '';
    for (let i = 0; i < 1000 && i < list.existingSizeInDOM; i++) {
      // add items
      const elemNum = i + sequenceNumber;
      if (list.data === undefined) {
        throw new Error('Your list.data is undefined');
      }
      const elemData = list.data[elemNum];
      templateFragments += this.createItem(elemData);
    }

    const newOffset = sequenceNumber * list.itemHeight;

    this.targetElem.innerHTML = templateFragments;
    this.setOffsetToList(chunk, list, direction, newOffset);

    // TODO: убрать после тестов
    const allTime = this.avrTimeArr.reduce((acc, el) => acc + el);
    console.log('среднее время рендера:', allTime / this.avrTimeArr.length);

    this.isWaitRender = false;
  }

  // eslint-disable-next-line class-methods-use-this
  checkAllowToChangeList(
    direction: IScrollDirection,
    sequenceNumber: number,
    isGoingFromBottom: boolean,
    i: number,
    tailingElementsAmount: number,
    listLength: number
  ): boolean {
    const isStartOfList = direction === 'up' && sequenceNumber === 0;

    const isReachTopLimit =
      isGoingFromBottom &&
      isStartOfList &&
      i + sequenceNumber >= tailingElementsAmount;

    const isReachBottomLimit =
      direction === 'down' && i + sequenceNumber > listLength - 1;

    const isAllowToChange = !isReachTopLimit && !isReachBottomLimit;

    // TODO: убрать после тестов
    if (isReachBottomLimit) {
      console.warn('Выходим за пределы списка в его нижней части');
    } else if (isReachTopLimit) {
      console.warn('Выходим за пределы списка в его ВЕРХНЕЙ части');
    }

    return isAllowToChange;
  }

  prepareItems(
    chunkAmount: number,
    direction: IScrollDirection,
    sequenceNumber: number,
    isGoingFromBottom: boolean,
    tailingElementsAmount: number,
    listLength: number,
    data: Array<object>,
    childPosition: 'firstChild' | 'lastChild'
  ): string {
    let templateFragments = '';

    for (let i = 0; i < 1000 && i < chunkAmount; i++) {
      const allowToChange = this.checkAllowToChangeList(
        direction,
        sequenceNumber,
        isGoingFromBottom,
        i,
        tailingElementsAmount,
        listLength
      );

      if (allowToChange) {
        // add items
        const elemNum = i + sequenceNumber;
        const elemData = data[elemNum];
        templateFragments += this.createItem(elemData);
        // remove items
        this.removeItem(childPosition);
      }
    }

    return templateFragments;
  }

  putElementsToList(direction: IScrollDirection, htmlString: string) {
    if (direction === 'down') {
      this.targetElem.innerHTML += htmlString;
    } else {
      this.targetElem.innerHTML = htmlString + this.targetElem.innerHTML;
    }
  }

  // TODO: Доделать это №3
  changeItemsInList(
    chunk: ChunkController,
    list: ListController,
    direction: IScrollDirection,
    isGoingFromBottom: boolean
  ): void {
    /* Список используемых переменных
     *  chunk.startRenderIndex
     *  chunk.amount
     *
     *
     * list.halfOfExistingSizeInDOM
     * list.tailingElementsAmount
     * list.length
     * list.data
     * */

    // for removeItems
    const childPosition = direction === 'down' ? 'firstChild' : 'lastChild';

    const sequenceNumber = this.calcSequenceByDirection(
      direction,
      list.halfOfExistingSizeInDOM,
      chunk.startRenderIndex,
      chunk.amount
    );

    if (list.data === undefined) {
      throw new Error('Your list.data is undefined');
    }

    const templateFragments = this.prepareItems(
      chunk.amount,
      direction,
      sequenceNumber,
      isGoingFromBottom,
      list.tailingElementsAmount,
      list.length,
      list.data,
      childPosition
    );

    this.putElementsToList(direction, templateFragments);
  }

  modifyCurrentDOM(
    chunk: ChunkController,
    list: ListController,
    direction: IScrollDirection,
    isGoingFromBottom: boolean
  ): void {
    // TODO: Доделать это №4
    /* Список используемых переменных
     *  chunk.startRenderIndex
     *  chunk.amount
     *
     *
     * list.halfOfExistingSizeInDOM
     * list.tailingElementsAmount
     * list.length
     * list.data
     * */
    this.changeItemsInList(chunk, list, direction, isGoingFromBottom);
    /* Список используемых переменных
     *  chunk.startRenderIndex
     *  chunk.htmlHeight
     *  chunk.amount
     *
     * list.startIndexOfLastPart
     * list.itemHeight
     * */
    this.setOffsetToList(chunk, list, direction);

    checkChildrenAmount(
      this.targetElem.childNodes.length,
      list.existingSizeInDOM
    );
  }
}

type TemplateStringFunction = (element: object, listLength?: number) => string;

// START OF CLASS REALIZATION OF INFINITYSCROLL
interface InfinityScrollPropTypes {
  templateString: TemplateStringFunction;
  data: object[];
  dataLoadType: 'instant' | 'lazy';
  dataUrl?: URL;
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
  private readonly selectorId: string;

  // хранит ссылку на корневой html-элеент
  private readonly wrapperEl: HTMLElement;

  // Тип списка (список или таблица)
  private readonly listType: string;

  // Тип загрузки (список доступен сразу или надо качать с интернета)
  private readonly dataLoadType: 'instant' | 'lazy';

  // Содержит генерируемый элемент внутри корневого
  private readonly listEl: HTMLElement;

  private domMngr: DomManager | undefined;

  private scroll: ScrollDetector;

  private readonly chunk: ChunkController;

  private readonly list: ListController;

  private render: RenderController | undefined;

  constructor(props: InfinityScrollPropTypes) {
    this.name = props.name;
    this.selectorId = props.selectorId;

    const wrapper = document.getElementById(props.selectorId);
    if (wrapper === null) {
      throw new Error(`Object ${props.selectorId} does not exist in DOM`);
    }
    this.wrapperEl = wrapper;

    this.listType = props.listType;

    this.listEl = this.createInnerList();

    this.scroll = new ScrollDetector();

    this.chunk = new ChunkController();

    this.list = new ListController();

    const domChangerProps = {
      targetElem: this.listEl,
      listLength: 0,
      template: props.templateString,
    };

    this.dataLoadType = props.dataLoadType;

    this.setListData(props.data, props.dataUrl).then(() => {
      domChangerProps.listLength = this.list.length;
      this.domMngr = new DomManager(domChangerProps);
      this.start();
    });
  }

  start() {
    if (this.domMngr === undefined) {
      throw new Error('Your DomManager is undefined');
    }
    console.log(this);
    if (this.dataLoadType === 'lazy') {
      console.log(this.list.data);
      // return;
    }
    this.getAllSizes();
    // TODO: проверить все пропсы на undefined
    const renderProps = {
      halfOfExistingSizeInDOM: this.list.halfOfExistingSizeInDOM,
      lastRenderIndex: this.chunk.lastRenderIndex,
      listLength: this.list.length,
      chunkAmount: this.chunk.amount,
      tailingElementsAmount: this.list.tailingElementsAmount,
    };
    this.render = new RenderController(renderProps);
    this.domMngr.fillList(this.list);
    this.domMngr.setPaddingToList(this.list, this.chunk.htmlHeight);

    let startDate = Date.now();

    this.wrapperEl.addEventListener('scroll', (e) => {
      const diffTime = Date.now() - startDate;
      if (diffTime < 100 && this.domMngr !== undefined) {
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
    return this.wrapperEl.appendChild(newEl);
  }

  getAllSizes(): void {
    if (this.domMngr === undefined) {
      throw new Error('Your DomManager is undefined');
    }
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
      if (!this.list.data) {
        throw new Error('You does not have list.data');
      }
      const elemData = this.list.data[0];
      this.domMngr.targetElem.innerHTML += this.domMngr.createItem(elemData);
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

  calcCurrentDOMRender(e: Event): void {
    const eventTarget = e.target as HTMLElement;
    const scroll = eventTarget.scrollTop;
    // Вычисляем позицию чанка
    const chunkOrderNumber: number = this.chunk.getOrderNumber(scroll);
    checkChildrenAmount(
      this.listEl.childNodes.length,
      this.list.existingSizeInDOM
    );
    // Вычисляем новый индекс для рендера чанка (не путать с браузрным скроллом)
    const newRenderIndex: number = this.chunk.calcRenderIndex(chunkOrderNumber);
    this.scroll.setScrollDirection(scroll);

    this.scroll.prevScroll = scroll;

    const renderIndexDiff = this.chunk.getRenderIndexDiff(newRenderIndex);
    // Если скролл слишком маленький - не делаем ничего
    if (
      this.scroll.isSmallDiff(renderIndexDiff, this.list.tailingElementsAmount)
    ) {
      return;
    }

    this.clearTimerIfNeeded();
    // Устанавливаем буль, если мы движемся вверх от самого низа списка (это важно)
    this.scroll.setGoingFromBottom(this.chunk, chunkOrderNumber);
    // Если скролл слишком большой - рисуем всё заново
    this.checkBigDiffToResetList(renderIndexDiff);

    // Если скролл поменялся - устанавливаем новый скролл и меняем ДОМ
    if (this.chunk.startRenderIndex !== newRenderIndex) {
      console.warn('====== this.chunk.startRenderIndex поменялся ======');
      this.chunk.setRenderIndex(
        newRenderIndex,
        this.scroll.isGoingFromBottom,
        this.list.tailingElementsAmount
      );

      if (!this.render) {
        throw new Error('this.render is not exist');
      }
      const isAllowRender = this.render.isAllowRenderNearBorder(
        this.scroll.direction,
        this.chunk.startRenderIndex
      );

      if (isAllowRender && this.domMngr) {
        /* Список используемых переменных
         *  chunk.startRenderIndex
         *  chunk.amount
         *  chunk.htmlHeight
         *
         * list.halfOfExistingSizeInDOM
         * list.tailingElementsAmount
         * list.length
         * list.data
         * list.startIndexOfLastPart
         * list.itemHeight
         * */
        this.domMngr.modifyCurrentDOM(
          this.chunk,
          this.list,
          this.scroll.direction,
          this.scroll.isGoingFromBottom
        );
      }
    }
  }

  clearTimerIfNeeded(): void {
    if (
      this.timerIdRefreshList !== null &&
      this.domMngr &&
      this.domMngr.isWaitRender === false
    ) {
      clearTimeout(this.timerIdRefreshList);
    }
  }

  checkBigDiffToResetList(scrollDiff: number): void {
    const isBigDiff: boolean = this.scroll.isBigDiff(
      scrollDiff,
      this.chunk.amount,
      this.list.tailingElementsAmount
    );

    if (isBigDiff && this.domMngr && this.domMngr.isWaitRender === false) {
      this.domMngr.isWaitRender = true;
      this.timerIdRefreshList = window.setTimeout(() => {
        if (this.domMngr) {
          this.domMngr.resetAllList(
            this.chunk,
            this.list,
            this.scroll.direction
          );
        }
      }, 30);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  getRemoteData(url: URL): Promise<unknown> {
    console.log('try to get data from', url);

    return fetch(url).then((response) =>
      response
        .json()
        .then((data) => data)
        .catch((err) => {
          console.log(err);
        })
    );
  }

  async setListData(listData: object[], dataUrl?: URL) {
    let newLength = null;
    if (this.dataLoadType === 'instant') {
      this.list.data = listData;
      newLength = listData && listData.length;
    } else {
      // this.dataUrl = props.dataUrl;
      if (dataUrl === undefined) {
        throw new Error('Your dataUrl is undefined');
      }
      await this.getRemoteData(dataUrl).then((data): void => {
        if (!Array.isArray(data)) {
          throw new Error('Your fetched data does not have Array type');
        }
        this.list.data = data;
        newLength = data && data.length;
      });
    }
    if (!Array.isArray(this.list.data)) {
      throw new Error('Your list does not have Array type');
    }
    if (!newLength) {
      throw new Error('Your list does not have length or length is 0');
    }
    this.list.length = newLength;
  }
}

export { InfinityScroll };
