import BigDataList100 from '../../mocks/bigList100.json'; // import mock data
import BigDataList10k from '../../mocks/bigList10000.json'; // import mock data
import BigDataList100k from '../../mocks/bigList100000.json'; // import mock data

console.log('TS file loaded');

const checkChildrenAmount = (length: number, fullSize: number): void => {
  if (length !== fullSize) {
    console.error('%cКоличесвто деток: ', 'color: tomato', length);
  }
};

// TODO: придумать нормальные имена для элементов

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

// START OF CLASS REALIZATION OF SCROLL
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
        aria-posinset="${element.number + 1}"
        >
            ${element.name} ${element.number + 1}
    </li>`,
};

const nameToTag = {
  list: 'UL',
  table: 'TABLE',
};

class InfinityScroll {
  private delay = 0;

  private timerId: number | undefined;

  private name: string;

  private selectorId: string;

  private wrapperEl: HTMLElement | null;

  private listData: Array<ListData> | Promise<unknown>;

  private listType: string;

  private dataUrl: string | undefined;

  private dataLoadType: 'instant' | 'lazy';

  private templateString: TplStringFn;

  private listEl: HTMLElement | null;

  private GLOBAL_ITEM_COUNTER = 0;

  private LIST_LENGTH: number | undefined;

  private LIST_FULL_VISIBLE_SIZE = 4;

  private LIST_HALF_VISIBLE_SIZE = 2;

  private LIST_START_OF_LAST_VISIBLE_SIZE = 2;

  private LIST_LAST_SCROLL_POSITION = 0;

  private currentListScroll = 0;

  private chunkAmount = 2;

  private listWrpHeight = 0;

  private listItemHeight = 0;

  private chunkHeight = 0;

  private scrollDirection = 'down';

  private tailingElementsAmount = 0;

  private lastScrollTopPosition = 0;

  private LAST_CHUNK_ORDER_NUMBER = 0;

  private isGoingFromBottom = false;

  private avrTimeArr: Array<number> = [];

  private isWaitRender = false;

  constructor(props: InfinityScrollPropTypes) {
    this.dataLoadType = props.dataLoadType;
    if (this.dataLoadType === 'instant') {
      this.listData = props.data;
      this.LIST_LENGTH = this.listData && this.listData.length;
      console.log(this.LIST_LENGTH);
    } else {
      this.dataUrl = props.dataUrl;
      this.listData = this.getRemoteData().then((data) => data);
    }

    this.templateString = props.templateString;

    this.name = props.name;
    this.selectorId = props.selectorId;
    this.wrapperEl = document.getElementById(props.selectorId);
    this.listType = props.listType;

    this.listEl = this.createInnerList();
  }

  async start() {
    console.log(this);
    if (this.dataLoadType === 'lazy') {
      const data = await this.listData;
      console.log(data);
      return;
    }
    // this.setMainVars();
    // TODO: перебрать эту часть чтобы не было двух повторных вызовов
    this.getAllSizes();
    this.fillList();
    this.getAllSizes();

    let startDate = Date.now();

    this.wrapperEl.addEventListener('scroll', (e) => {
      const diffTime = Date.now() - startDate;
      if (diffTime < 100) {
        this.avrTimeArr.push(diffTime);
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

  setPaddingToList(offset = 0): void {
    let paddingBottom =
      this.LIST_LENGTH * this.listItemHeight - this.chunkHeight * 4 - offset;

    // TODO: проверить, попадаем ли мы туда
    if (paddingBottom < 0) {
      console.error('==========Мы попали в if paddingBottom < 0 =======');
      paddingBottom = 0;
    }
    this.listEl.style.paddingBottom = `${paddingBottom}px`;
  }

  setOffsetToList(forcedOffset: number | undefined = undefined): void {
    console.log('currentListScroll', this.currentListScroll);

    if (forcedOffset !== undefined) {
      this.listEl.style.transform = `translate(0,${forcedOffset}px)`;
      this.setPaddingToList(forcedOffset);
      return;
    }

    let start = this.currentListScroll - this.chunkAmount;

    // TODO: нужно ли следующие 2 проверки выносить в отдельную функцию?
    if (start < 0) {
      start = 0;
    }

    // Если этого нет, то попадаем в padding 0!
    if (
      this.scrollDirection === 'down' &&
      start > this.LIST_LAST_SCROLL_POSITION
    ) {
      start = this.LIST_LAST_SCROLL_POSITION;
    }

    const offset = start * this.listItemHeight;

    this.listEl.style.transform = `translate(0,${offset}px)`;
    this.setPaddingToList(offset);
  }

  fillList(): void {
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
      templateFragments += this.createItem(this.GLOBAL_ITEM_COUNTER);
      this.GLOBAL_ITEM_COUNTER++;
    }

    this.listEl.innerHTML += templateFragments;

    this.timerId = window.setTimeout(() => this.fillList(), this.delay);
  }

  getAllSizes(): void {
    const listWrp = this.wrapperEl;
    const list = this.listEl;
    const listWrpStyles = window.getComputedStyle(listWrp);
    const listItem = list.firstChild as HTMLElement;

    this.listWrpHeight =
      parseInt(listWrpStyles.getPropertyValue('height'), 10) || 1;

    if (this.listWrpHeight < 2) {
      console.error('You must set height to your list-wrapper!');
      return;
    }

    this.listItemHeight = listItem?.offsetHeight || this.listWrpHeight;

    this.chunkAmount = Math.ceil(this.listWrpHeight / this.listItemHeight);

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

    this.setPaddingToList();
  }

  TAG_TPL(element: unknown) {
    return this.templateString(element, this);
  }

  createItem(elemNum: number): string {
    const element = this.listData[elemNum];
    return this.TAG_TPL(element);
  }

  removeItem(childPosition: string) {
    const child = this.listEl[childPosition];
    this.listEl.removeChild(child);
  }

  resetAllList(): void {
    const calculatedStart = this.currentListScroll - this.chunkAmount;
    const newStart =
      calculatedStart > this.LIST_LAST_SCROLL_POSITION
        ? this.LIST_LAST_SCROLL_POSITION
        : calculatedStart;

    let newSequence = newStart;

    if (newSequence < 0) newSequence = 0;

    const sequenceNumber = newSequence;

    let templateFragments = '';
    for (let i = 0; i < 1000 && i < this.LIST_FULL_VISIBLE_SIZE; i++) {
      // add items
      const elemNum = i + sequenceNumber;
      templateFragments += this.createItem(elemNum);
    }

    const newOffset = newSequence * this.listItemHeight;

    this.listEl.innerHTML = templateFragments;
    this.setOffsetToList(newOffset);

    // TODO: убрать после тестов
    const allTime = this.avrTimeArr.reduce((acc, el) => acc + el);
    console.log('среднее время рендера:', allTime / this.avrTimeArr.length);

    this.isWaitRender = false;
  }

  changeItemsInList(): void {
    // for addItems
    let templateFragments = '';

    // for removeItems
    const childPosition =
      this.scrollDirection === 'down' ? 'firstChild' : 'lastChild';

    // Это работает праивльно (в начале списка)
    let newSequence =
      this.scrollDirection === 'down'
        ? this.currentListScroll + this.LIST_HALF_VISIBLE_SIZE
        : this.currentListScroll - this.chunkAmount;

    if (newSequence < 0) newSequence = 0;

    const sequenceNumber = newSequence;

    for (let i = 0; i < 1000 && i < this.chunkAmount; i++) {
      const isStartOfList =
        this.scrollDirection === 'up' && sequenceNumber === 0;

      const isReachTopLimit =
        this.isGoingFromBottom &&
        isStartOfList &&
        i + sequenceNumber >= this.tailingElementsAmount;

      const isReachBottomLimit =
        this.scrollDirection === 'down' &&
        i + sequenceNumber > this.LIST_LENGTH - 1;

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
    if (this.scrollDirection === 'down') {
      this.listEl.innerHTML += templateFragments;
    } else {
      this.listEl.innerHTML = templateFragments + this.listEl.innerHTML;
    }
  }

  modifyCurrentDOM(): void {
    const isBeginOfListFromTop =
      this.currentListScroll < this.LIST_HALF_VISIBLE_SIZE;

    const isEndOfListFromTop =
      this.currentListScroll > this.LIST_START_OF_LAST_VISIBLE_SIZE;

    const isBeginOfListFromBottom =
      this.currentListScroll >= this.LIST_LENGTH - this.chunkAmount * 3;

    const isEndOfListFromBottom =
      this.currentListScroll < this.tailingElementsAmount;

    // Главное правило - если идём вниз, то множитель х2, если вверх, то х3 (т.к. считаем от начала чанка)
    // TODO: сделать рефакторинг 4х условий
    if (this.scrollDirection === 'down' && isBeginOfListFromTop) {
      console.log('Пока рендерить не надо. Вы в самом верху списка.');
      return;
    }

    if (this.scrollDirection === 'down' && isEndOfListFromTop) {
      console.log('УЖЕ рендерить не надо.  Вы в самом низу списка.');
      return;
    }

    if (this.scrollDirection === 'up' && isBeginOfListFromBottom) {
      console.log(
        'Пока рендерить не надо (up). Вы в самом низу списка. Это сообщение мы должны видеть 2 раза'
      );
      return;
    }

    if (this.scrollDirection === 'up' && isEndOfListFromBottom) {
      console.log('Уже рендерить не надо (up). Вы в самом верху списка.');
      return;
    }

    this.changeItemsInList();
    this.setOffsetToList();

    checkChildrenAmount(
      this.listEl.childNodes.length,
      this.LIST_FULL_VISIBLE_SIZE
    );
  }

  calcCurrentDOMRender(e: Event & { target: Element }) {
    const { scrollTop } = e.target;
    const orderedNumberOfChunk = Math.floor(scrollTop / this.chunkHeight);

    checkChildrenAmount(
      this.listEl.childNodes.length,
      this.LIST_FULL_VISIBLE_SIZE
    );

    let newCurrentListScroll = orderedNumberOfChunk * this.chunkAmount;

    if (scrollTop > this.lastScrollTopPosition) {
      this.scrollDirection = 'down';
    } else {
      this.scrollDirection = 'up';
    }

    this.lastScrollTopPosition = scrollTop;

    const scrollDiff = Math.abs(this.currentListScroll - newCurrentListScroll);

    if (scrollDiff !== 0 && scrollDiff <= this.tailingElementsAmount) {
      return;
    }

    if (this.timerId !== null && this.isWaitRender === false) {
      clearTimeout(this.timerId);
    }

    if (
      this.scrollDirection === 'down' &&
      orderedNumberOfChunk <= this.tailingElementsAmount
    ) {
      this.isGoingFromBottom = false;
    } else if (
      this.scrollDirection === 'up' &&
      orderedNumberOfChunk >= this.LAST_CHUNK_ORDER_NUMBER - 1
    ) {
      this.isGoingFromBottom = true;
    }

    const isBigDiff =
      (this.isGoingFromBottom &&
        scrollDiff > this.chunkAmount + this.tailingElementsAmount) ||
      (!this.isGoingFromBottom && scrollDiff > this.chunkAmount);

    if (isBigDiff && this.isWaitRender === false) {
      this.isWaitRender = true;
      this.timerId = window.setTimeout(() => {
        this.resetAllList();
      }, 30);
    }

    if (this.currentListScroll !== newCurrentListScroll) {
      console.warn('====== currentListScroll поменялся ======');
      // TODO: удалить после отладки
      if (this.isGoingFromBottom) {
        newCurrentListScroll += this.tailingElementsAmount;
      }
      this.currentListScroll = newCurrentListScroll;

      // DOM Manipulation
      this.modifyCurrentDOM();
    }
  }

  async getRemoteData(): Promise<unknown> {
    console.log('try to get data from', this.dataUrl);

    await fetch(this.dataUrl).then((response) =>
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
  myInstantScroll.start();
}

const lazyList = document.getElementById(lazyListProps.selectorId);

if (lazyList !== null) {
  console.log('Lazy list Started');
  const myLazyScroll = new InfinityScroll(lazyListProps);
  myLazyScroll.start();
}
