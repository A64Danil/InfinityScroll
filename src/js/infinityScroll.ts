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

  constructor() {
    console.log('start ScrollDetector');
  }
}

class ChunkController {
  // Размер чанка (чанк - видимая часть элементов в спике)
  private chunkAmount = 2;

  private chunkHeight = 0;

  // Порядковый номер последнего чанка в списке
  private LAST_CHUNK_ORDER_NUMBER: number;
}

class ListController {
  // Содержит генерируемый элемент внутри корневого
  private listEl: HTMLElement | null;
}

class DomManager {
  private data;

  private targetElem;

  private template;

  private scroll: ScrollDetector;

  constructor(props: unknown) {
    this.data = props.data;
    this.targetElem = props.targetElem;
    this.template = props.template;
    this.scroll = props.scrollDetector;
    console.log(this.scroll);
  }

  createItem(elemNum: number): string {
    const element = this.data[elemNum];
    return this.template(element, this.targetElem);
  }

  removeItem(childPosition: string): void {
    const child = this.targetElem[childPosition];
    this.targetElem.removeChild(child);
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
  // даже не знаю зачем эта переменная, нужна для нулевого сетТаймайт
  private delay = 0;

  // хранит в себе id сетТаймаута
  private timerId: number | undefined;

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

  // Содержит в себе хтмл-шаблон, в который мы положим данные из БД
  private templateString: TplStringFn;

  // Содержит генерируемый элемент внутри корневого
  private listEl: HTMLElement | null;

  // Общий счётчик элементов (создан для рекурсивной функции чтобы она не добавляла слишком много за раз)
  private GLOBAL_ITEM_COUNTER = 0;

  // Длина списка
  private LIST_LENGTH: number | undefined;

  // Видимая часть списка (вычисляется по цсс-свойствам)
  private LIST_FULL_VISIBLE_SIZE = 4;

  // Видимая часть списка (половина от полной)
  private LIST_HALF_VISIBLE_SIZE = 2;

  // Номер позиции, с которой начинается последяя видимая часть списка
  private LIST_START_OF_LAST_VISIBLE_SIZE = 2;

  // Предыдущая сохраненная позиция скролла (нужна чтобы сравнивать с новой)
  // private LIST_LAST_SCROLL_POSITION = 0;

  // Текущая позиция скролла
  // Содержит номер элемента, с которого начинается текущая видимая часть
  // private currentListScroll = 0;

  // Размер чанка (чанк - видимая часть элементов в спике)
  private chunkAmount = 2;

  private listWrpHeight = 0;

  private listItemHeight = 0;

  private chunkHeight = 0;

  // private scrollDirection = 'down';

  private tailingElementsAmount = 0;

  // Предыдущая величина скролла (в пикселях)
  private lastScrollTopPosition = 0;

  // Порядковый номер последнего чанка в списке
  private LAST_CHUNK_ORDER_NUMBER = 0;

  // private isGoingFromBottom = false;

  private avrTimeArr: Array<number> = [];

  private isWaitRender = false;

  private infinityDomChanger: DomManager;

  private scroll: ScrollDetector;

  constructor(props: InfinityScrollPropTypes) {
    this.templateString = props.templateString;
    this.name = props.name;
    this.selectorId = props.selectorId;
    this.wrapperEl = document.getElementById(props.selectorId);
    this.listType = props.listType;

    this.listEl = this.createInnerList();

    this.scroll = new ScrollDetector();

    const domChangerProps = {
      data: null,
      targetElem: this.listEl,
      template: this.templateString,
      scrollDetector: this.scroll,
    };

    this.dataLoadType = props.dataLoadType;

    if (this.dataLoadType === 'instant') {
      this.listData = props.data;
      this.LIST_LENGTH = this.listData && this.listData.length;
      console.log(this.LIST_LENGTH);
      domChangerProps.data = this.listData;
      this.infinityDomChanger = new DomManager(domChangerProps);
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
          this.LIST_LENGTH = this.listData && this.listData.length;
          domChangerProps.data = this.listData;
          this.infinityDomChanger = new DomManager(domChangerProps);
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
    console.log('currentListScroll', this.scroll.currentListScroll);

    if (forcedOffset !== undefined) {
      this.listEl.style.transform = `translate(0,${forcedOffset}px)`;
      this.setPaddingToList(forcedOffset);
      return;
    }

    let start = this.scroll.currentListScroll - this.chunkAmount;

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
      templateFragments += this.infinityDomChanger.createItem(
        this.GLOBAL_ITEM_COUNTER
      );
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
    this.scroll.LIST_LAST_SCROLL_POSITION =
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
    const calculatedStart = this.scroll.currentListScroll - this.chunkAmount;
    const newStart =
      calculatedStart > this.scroll.LIST_LAST_SCROLL_POSITION
        ? this.scroll.LIST_LAST_SCROLL_POSITION
        : calculatedStart;

    let newSequence = newStart;

    if (newSequence < 0) newSequence = 0;

    const sequenceNumber = newSequence;

    let templateFragments = '';
    for (let i = 0; i < 1000 && i < this.LIST_FULL_VISIBLE_SIZE; i++) {
      // add items
      const elemNum = i + sequenceNumber;
      templateFragments += this.infinityDomChanger.createItem(elemNum);
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
      this.scroll.scrollDirection === 'down' ? 'firstChild' : 'lastChild';

    // Это работает праивльно (в начале списка)
    let newSequence =
      this.scroll.scrollDirection === 'down'
        ? this.scroll.currentListScroll + this.LIST_HALF_VISIBLE_SIZE
        : this.scroll.currentListScroll - this.chunkAmount;

    if (newSequence < 0) newSequence = 0;

    const sequenceNumber = newSequence;

    for (let i = 0; i < 1000 && i < this.chunkAmount; i++) {
      const isStartOfList =
        this.scroll.scrollDirection === 'up' && sequenceNumber === 0;

      const isReachTopLimit =
        this.scroll.isGoingFromBottom &&
        isStartOfList &&
        i + sequenceNumber >= this.tailingElementsAmount;

      const isReachBottomLimit =
        this.scroll.scrollDirection === 'down' &&
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
        templateFragments += this.infinityDomChanger.createItem(elemNum);
        // remove items
        this.infinityDomChanger.removeItem(childPosition);
      }
    }

    // TODO: вынести в отдельную функцию?
    if (this.scroll.scrollDirection === 'down') {
      this.listEl.innerHTML += templateFragments;
    } else {
      this.listEl.innerHTML = templateFragments + this.listEl.innerHTML;
    }
  }

  modifyCurrentDOM(): void {
    const isBeginOfListFromTop =
      this.scroll.currentListScroll < this.LIST_HALF_VISIBLE_SIZE;

    const isEndOfListFromTop =
      this.scroll.currentListScroll > this.LIST_START_OF_LAST_VISIBLE_SIZE;

    const isBeginOfListFromBottom =
      this.scroll.currentListScroll >= this.LIST_LENGTH - this.chunkAmount * 3;

    const isEndOfListFromBottom =
      this.scroll.currentListScroll < this.tailingElementsAmount;

    // Главное правило - если идём вниз, то множитель х2, если вверх, то х3 (т.к. считаем от начала чанка)
    // TODO: сделать рефакторинг 4х условий
    if (this.scroll.scrollDirection === 'down' && isBeginOfListFromTop) {
      console.log('Пока рендерить не надо. Вы в самом верху списка.');
      return;
    }

    if (this.scroll.scrollDirection === 'down' && isEndOfListFromTop) {
      console.log('УЖЕ рендерить не надо.  Вы в самом низу списка.');
      return;
    }

    if (this.scroll.scrollDirection === 'up' && isBeginOfListFromBottom) {
      console.log(
        'Пока рендерить не надо (up). Вы в самом низу списка. Это сообщение мы должны видеть 2 раза'
      );
      return;
    }

    if (this.scroll.scrollDirection === 'up' && isEndOfListFromBottom) {
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
      this.scroll.scrollDirection = 'down';
    } else {
      this.scroll.scrollDirection = 'up';
    }

    this.lastScrollTopPosition = scrollTop;

    const scrollDiff = Math.abs(
      this.scroll.currentListScroll - newCurrentListScroll
    );

    if (scrollDiff !== 0 && scrollDiff <= this.tailingElementsAmount) {
      return;
    }

    if (this.timerId !== null && this.isWaitRender === false) {
      clearTimeout(this.timerId);
    }

    if (
      this.scroll.scrollDirection === 'down' &&
      orderedNumberOfChunk <= this.tailingElementsAmount
    ) {
      this.scroll.isGoingFromBottom = false;
    } else if (
      this.scroll.scrollDirection === 'up' &&
      orderedNumberOfChunk >= this.LAST_CHUNK_ORDER_NUMBER - 1
    ) {
      this.scroll.isGoingFromBottom = true;
    }

    const isBigDiff =
      (this.scroll.isGoingFromBottom &&
        scrollDiff > this.chunkAmount + this.tailingElementsAmount) ||
      (!this.scroll.isGoingFromBottom && scrollDiff > this.chunkAmount);

    if (isBigDiff && this.isWaitRender === false) {
      this.isWaitRender = true;
      this.timerId = window.setTimeout(() => {
        this.resetAllList();
      }, 30);
    }

    if (this.scroll.currentListScroll !== newCurrentListScroll) {
      console.warn('====== currentListScroll поменялся ======');
      // TODO: удалить после отладки
      if (this.scroll.isGoingFromBottom) {
        newCurrentListScroll += this.tailingElementsAmount;
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
