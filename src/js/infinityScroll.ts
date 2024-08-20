import {
  RenderController,
  ScrollDetector,
  ChunkController,
  ListController,
  DomManager,
  Skeleton,
} from './controllers';

import {
  checkChildrenAmount,
  isPropsUndefined,
  getRemoteData,
  getListDataLazy,
  checkIncludeEnd,
  checkBaseIndex,
  checkDataUrl,
} from './helpers';

import {
  calcSequenceByDirection,
  recalcSequence,
} from './helpers/calcSequence';

import { InfinityScrollPropTypes } from './types/InfinityScrollPropTypes';
import { DataURLType } from './types/DataURL';
import { DataUrlFunction } from './types/DataUrlFunction';

// http://localhost:3000/data?_page=1&_limit=20

console.log('Main TS file loaded');

type NameToTagObj = {
  [key: string]: string;
};

const nameToTag: NameToTagObj = {
  list: 'UL',
  table: 'TABLE',
};

// START OF CLASS REALIZATION OF INFINITYSCROLL

class InfinityScroll {
  // хранит в себе id сетТаймаута
  private timerIdRefreshList: number | undefined;

  // ввёл, но пока не использовал
  private name: string | undefined;

  // хранит html-id главного корневого элемента
  private readonly selectorId: string;

  // хранит ссылку на корневой html-элеент
  private readonly wrapperEl: HTMLElement;

  private readonly forcedListLength: number | 'auto';

  // Тип списка (список или таблица)
  private readonly listType: string;

  // Тип списка (список или таблица)
  private readonly listWrapperHeight: string;

  // TODO: кажется это лишний параметр, можно смотреть на data|dataURL
  // Тип загрузки (список доступен локально или надо качать с интернета)
  private readonly dataLoadPlace: 'local' | 'remote';

  // Скорость загрузки при асинхронном типе (сразу всё или по частям)
  private readonly dataLoadSpeed: 'instant' | 'lazy';

  private readonly dataUrl: DataURLType | undefined;

  private includeEnd: boolean;

  private basedIndex: 0 | 1;

  // Содержит генерируемый элемент внутри корневого
  private readonly listEl: HTMLElement;

  private domMngr: DomManager | undefined;

  private scroll: ScrollDetector;

  private readonly chunk: ChunkController;

  private readonly list: ListController;

  private render: RenderController | undefined;

  private skeleton: Skeleton;

  constructor(props: InfinityScrollPropTypes) {
    this.name = props.name;
    this.selectorId = props.selectorId;

    const wrapper = document.getElementById(props.selectorId);
    if (wrapper === null) {
      throw new Error(`Object ${props.selectorId} does not exist in DOM`);
    }
    this.wrapperEl = wrapper;

    this.forcedListLength = props.forcedListLength || 'auto';

    this.listType = props.listType || 'list';

    this.listWrapperHeight = props.listWrapperHeight;

    this.listEl = this.createInnerList();

    this.scroll = new ScrollDetector();

    this.chunk = new ChunkController();

    this.list = new ListController();

    this.skeleton = new Skeleton({
      template: props.templateString,
    });

    const domChangerProps = {
      skeleton: this.skeleton,
      targetElem: this.listEl,
      listLength: 0,
      template: props.templateString,
    };

    this.dataLoadPlace = props.dataLoadPlace || 'local';

    this.dataLoadSpeed = props.dataLoadSpeed || 'instant';

    this.includeEnd = false;

    this.basedIndex = 1;

    console.log(props.data);
    if (props.data) {
      this.setListData(props.data, null);
      domChangerProps.listLength = this.list.length;
      this.domMngr = new DomManager(domChangerProps);
      this.start();
    } else {
      this.dataUrl = props.dataUrl;
      console.log(this.dataUrl);

      this.setListData(null, this.dataUrl).then(() => {
        domChangerProps.listLength = this.list.length;
        this.domMngr = new DomManager(domChangerProps);
        this.start();
      });
    }
  }

  async start() {
    if (this.domMngr === undefined) {
      throw new Error('Your DomManager is undefined');
    }
    console.log(this);
    // TODO: зачем тут return?
    if (this.dataLoadPlace === 'remote') {
      console.log(this.list.data);
      // return;
    }
    this.setDefaultStyles();
    this.getAllSizes();

    if (this.dataLoadSpeed === 'lazy') {
      console.log('Заполняем первичный раз');
      console.log(this.list.data);
      const startIdx = this.basedIndex + 1;
      // Test Data

      // const emptyList = new Array(this.list.length).fill(null).map((el, i) => ({
      //   id: i,
      //   name: `test name ${i}`,
      // }));
      // console.log(emptyList);
      // this.list.data = emptyList;

      // Real data
      //
      await getListDataLazy(
        this.dataUrl,
        startIdx,
        this.list.existingSizeInDOM
      ).then((data): void => {
        console.log('Вот что стянули');
        console.log(data);
        this.list.data = this.list.data?.concat(data);

        console.log('Вот что получилось');
        console.log(this.list.data);
      });
    }

    const renderProps = {
      halfOfExistingSizeInDOM: this.list.halfOfExistingSizeInDOM,
      lastRenderIndex: this.chunk.lastRenderIndex,
      listLength: this.list.length,
      chunkAmount: this.chunk.amount,
      tailingElementsAmount: this.list.tailingElementsAmount,
    };
    if (isPropsUndefined(renderProps)) {
      throw new Error('Some of props for RenderController is undefined');
    }
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

  setDefaultStyles() {
    this.wrapperEl.style.height = this.listWrapperHeight;
    this.wrapperEl.style.overflowY = 'scroll';
  }

  createInnerList(): HTMLElement {
    const newEl = document.createElement(nameToTag[this.listType]);
    const newElClass = `${this.selectorId}_${this.listType
      .charAt(0)
      .toUpperCase()}${this.listType.slice(1)}`;
    newEl.setAttribute('class', newElClass);
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
      console.error('You must set height to your list-wrapper more than 10px!');
      return;
    }

    if (!listItem) {
      console.warn('Элементов в списке нет');
      if (!this.list.data) {
        throw new Error('You does not have list.data');
      }
      const elemData = this.list.data[0];
      this.domMngr.targetElem.append(this.domMngr.createItem(elemData, 0));
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

  async calcCurrentDOMRender(e: Event): void {
    if (this.domMngr?.isStopRender) {
      this.domMngr.isStopRender = false;
      return;
    }

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

    const renderIndexDiff = this.chunk.getRenderIndexDiff(newRenderIndex);

    // Устанавливаем буль, если мы движемся вверх от самого низа списка (это важно)
    this.scroll.setGoingFromBottom(
      this.chunk.firstOrderNumber,
      this.chunk.lastOrderNumber,
      chunkOrderNumber
    );

    const resultIndex =
      newRenderIndex +
      (this.scroll.isGoingFromBottom ? this.list.tailingElementsAmount : 0);

    // this.clearTimerIfNeeded();

    // Если скролл слишком большой - рисуем всё заново
    const isBigDiff = this.checkBigDiff(renderIndexDiff);
    if (isBigDiff) {
      // console.log('Перезапускаем таймер, старый id', this.timerIdRefreshList);
      clearTimeout(this.timerIdRefreshList);
      this.setTimerToRefreshList();
    }

    // Если скролл поменялся - устанавливаем новый скролл и меняем ДОМ
    if (this.chunk.startRenderIndex !== resultIndex) {
      this.chunk.startRenderIndex = resultIndex;
      console.warn(
        `====== this.chunk.startRenderIndex поменялся ${this.chunk.startRenderIndex} ======`
      );
      // console.log(
      //   'this.scroll.isGoingFromBottom',
      //   this.scroll.isGoingFromBottom
      // );

      if (!this.render) {
        throw new Error('this.render is not exist');
      }
      const isAllowRender = this.render.isAllowRenderNearBorder(
        this.scroll.direction,
        this.chunk.startRenderIndex
      );

      if (isAllowRender && this.domMngr) {
        const mainChunkProps = {
          startRenderIndex: this.chunk.startRenderIndex,
          amount: this.chunk.amount,
          htmlHeight: this.chunk.htmlHeight,
        };

        // Fetch new DATA
        if (this.dataLoadSpeed === 'lazy' && !isBigDiff) {
          this.lazyOrderedFetch(this.chunk.startRenderIndex);
        }
        // END Fetch new DATA

        const mainListProps = {
          existingSizeInDOM: this.list.existingSizeInDOM,
          halfOfExistingSizeInDOM: this.list.halfOfExistingSizeInDOM,
          tailingElementsAmount: this.list.tailingElementsAmount,
          length: this.list.length,
          data: this.list.data,
          startIndexOfLastPart: this.list.startIndexOfLastPart,
          itemHeight: this.list.itemHeight,
        };
        this.domMngr.modifyCurrentDOM(
          mainChunkProps,
          mainListProps,
          this.scroll.direction,
          this.scroll.isGoingFromBottom
        );
        if (!isBigDiff) this.checkIndexOrdering();
      }
    }
  }

  // clearTimerIfNeeded(): void {
  //   if (
  //     this.timerIdRefreshList !== null &&
  //     this.domMngr &&
  //     this.domMngr.isWaitRender === false
  //   ) {
  //     clearTimeout(this.timerIdRefreshList);
  //   }
  // }

  checkBigDiff(scrollDiff: number): boolean {
    const isBigDiff: boolean = this.scroll.isBigDiff(
      scrollDiff,
      this.chunk.amount,
      this.list.tailingElementsAmount
    );
    return isBigDiff;
  }

  sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  setTimerToRefreshList() {
    const timerID = window.setTimeout(async () => {
      if (this.domMngr) {
        // Fetch new DATA
        const renderIndex = this.chunk.startRenderIndex;
        if (this.dataLoadSpeed === 'lazy') {
          // TODO: функция для тестов
          await this.sleep(1000);
          this.lazyOrderedFetch(renderIndex, true);
          console.log(
            `Дата зафетчилась, rednerIndex: ${renderIndex}, timerID: ${timerID}, this.timerIdRefreshList: ${this.timerIdRefreshList}`
          );
        }
        if (timerID !== this.timerIdRefreshList) {
          return;
        }
        console.log('Восстанавливаем значение this.chunk.startRenderIndex');
        this.chunk.startRenderIndex = renderIndex;
        console.warn(
          `====== this.chunk.startRenderIndex форсированно поменялся ${this.chunk.startRenderIndex} ======`
        );

        const isAllowRenderNearBorder = this.render.isAllowRenderNearBorder(
          this.scroll.direction,
          renderIndex
        );
        // END Fetch new DATA
        this.domMngr.resetAllList(
          this.chunk,
          renderIndex,
          this.chunk.amount,
          this.list,
          this.scroll.direction,
          isAllowRenderNearBorder
        );
      }
    }, 30);
    this.timerIdRefreshList = timerID;
    console.log('Timer started by id', this.timerIdRefreshList);
  }

  async checkApiSettings() {
    this.includeEnd = await checkIncludeEnd(this.dataUrl as DataUrlFunction);
    this.basedIndex = await checkBaseIndex(
      this.dataUrl as DataUrlFunction,
      this.includeEnd
    );
  }

  async setListData(listData: object[] | null, dataUrl?: DataURLType | null) {
    if (this.dataUrl) {
      const [isDataUrlString, isDataUrlReturnString] = checkDataUrl(
        this.dataUrl
      );

      if (!isDataUrlString && !isDataUrlReturnString) {
        throw new Error(
          'Your dataUrl is not a valid URL; or returned value is not a  valid URL'
        );
      }

      if (isDataUrlReturnString) {
        await this.checkApiSettings();
        console.log('Конечный индекс includeEnd? ', this.includeEnd);
        console.log('Индекс считается с ', this.basedIndex);
      }
    }

    let newLength = null;
    // TODO: ждёт переделки чтобы избавить от this.dataLoadPlace
    if (this.dataLoadPlace === 'local') {
      this.list.data = listData;
      newLength = listData && listData.length;
    } else {
      // this.dataUrl = props.dataUrl;
      if (dataUrl === undefined) {
        throw new Error('Your dataUrl is undefined');
      }

      if (this.dataLoadSpeed === 'instant') {
        await getRemoteData(dataUrl).then((data): void => {
          if (!Array.isArray(data)) {
            throw new Error('Your fetched data does not have Array type');
          }
          this.list.data = data;
          newLength = data && data.length;
        });
      } else {
        console.log('Будущий функционал для лейзи');
        // TODO: вынести в хелпер?
        const startIdx = this.basedIndex;
        const endIdx = this.basedIndex + Number(!this.includeEnd);
        const data = await getListDataLazy(dataUrl, startIdx, endIdx);
        console.log(data);
        console.log(this.list.existingSizeInDOM);
        this.list.data = data;
        if (this.forcedListLength) {
          // TODO: не забыть написать функцию для определения длины списка
          newLength =
            this.forcedListLength === 'auto' ? 1000 : this.forcedListLength;
        } else {
          newLength = data && data.length;
        }
      }
    }
    if (!Array.isArray(this.list.data)) {
      throw new Error('Your list does not have Array type');
    }
    if (!newLength) {
      throw new Error('Your list does not have length or length is 0');
    }
    this.list.length = newLength;
    this.skeleton.setListHeight(this.list.length);
  }

  async lazyOrderedFetch(renderIndex: number, isFetchToReset = false) {
    // TODO: убрать - имитируем медленный интернет
    await this.sleep(4000);
    let [startFetchIndex, endFetchIndex] = [0, 1];
    const lastStartIndex = this.list.length - this.list.existingSizeInDOM;
    const lastEndIndex = this.list.length;
    let sequenceStart;
    let sequenceEnd;
    if (!isFetchToReset) {
      sequenceStart = calcSequenceByDirection(
        this.scroll.direction,
        this.list.halfOfExistingSizeInDOM,
        renderIndex,
        this.chunk.amount
      );

      console.log('sequenceStart', sequenceStart);
      sequenceEnd = sequenceStart + this.chunk.amount;
    } else {
      // const baseStyles = [
      //   'color: #fff',
      //   'background-color: #900',
      //   'padding: 2px 4px',
      //   'border-radius: 2px',
      // ].join(';');
      // console.log('%c============= Фетч всего списка', baseStyles);
      // console.log('renderIndex', renderIndex);
      // TODO: это место надо проверить, действительно ли нужно вот так...
      // sequenceStart = renderIndex - this.chunk.amount;
      sequenceStart = renderIndex;
      // console.log('sequenceStart', sequenceStart);
      sequenceEnd = sequenceStart + this.list.existingSizeInDOM;
    }
    // console.log('sequenceStart', sequenceStart, sequenceEnd);
    [startFetchIndex, endFetchIndex] =
      sequenceStart < lastStartIndex
        ? [sequenceStart + this.basedIndex, sequenceEnd]
        : [lastStartIndex, lastEndIndex];
    console.log(`${startFetchIndex} - ${endFetchIndex}`);

    const unfoundedRanges = this.checkItemForLoad(
      startFetchIndex,
      endFetchIndex
    );
    console.log('Unfounded', unfoundedRanges);
    await getRemoteData(this.dataUrl(startFetchIndex, endFetchIndex)).then(
      (data): void => {
        if (!Array.isArray(data)) {
          throw new Error('Your fetched data does not have Array type');
        }
        console.log(data);
        // console.log('startFetchIndex', startFetchIndex);
        this.addNewItemsToDataList(startFetchIndex, data);
        this.updateSkeletonItems(startFetchIndex, data);
        const dataObj = {
          data: this.list.data?.slice(),
        };
        // console.log(dataObj);
      }
    );
  }

  // 0 - 31 (32 всего)
  // 32 - 39 (40 всего)
  // 32 - 40 (41 всего)
  addNewItemsToDataList(startFetchIndex: number, data: Array<object>) {
    const loopLength = data.length;
    for (let i = 0; i < loopLength; i++) {
      const currentIndex = startFetchIndex - this.basedIndex + i;
      this.list.data[currentIndex] = data[i];
    }
    console.log(this.list.data);
  }

  updateSkeletonItems(startFetchIndex: number, data: Array<object>) {
    const loopLength = data.length;
    for (let i = 0; i < loopLength; i++) {
      // if baseIdx = 0 ===> currentIndex  + 0
      // if baseIdx = 1 ===> currentIndex  - 1
      const currentIndex = startFetchIndex - this.basedIndex + i;
      const dataIndex = currentIndex + 1;
      const searchSelector = `[aria-posinset="${dataIndex}"]`;
      const element = this.domMngr.targetElem.querySelector(searchSelector);
      console.log(searchSelector, dataIndex, currentIndex);
      if (element) this.skeleton.updateElement(element, data[i], dataIndex);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  checkItemForLoad(startFetchIndex, endFetchIndex) {
    // const testArr = [, 34, 5, , 8, , , , , 4, 6, , 3, , , 4, 12];
    console.log(startFetchIndex, endFetchIndex);
    const unfoundedItems = [];
    let isUndefined = false;
    let buffer = [];
    for (let i = startFetchIndex; i <= endFetchIndex; i++) {
      // console.log(`Check ${i}`);
      const currentElem = this.list.data[i];
      // const currentElem = testArr[i];
      console.log(currentElem);
      if (currentElem === undefined && isUndefined === false) {
        isUndefined = true;
        buffer.push(i);
      } else if (
        (currentElem !== undefined && isUndefined === true) ||
        i === endFetchIndex
      ) {
        buffer.push(i);
        unfoundedItems.push(buffer.slice());
        buffer = [];
        isUndefined = false;
      }
    }
    return unfoundedItems;
  }

  checkIndexOrdering() {
    const list = this.domMngr?.targetElem;

    let prevIndex: number | null = null;
    // console.log('prevIndex', prevIndex);
    [...list.children].forEach((elem) => {
      const elemIndex = Number(elem.getAttribute('aria-posinset'));
      if (prevIndex !== null) {
        if (prevIndex + 1 !== elemIndex) {
          console.error(
            `Индексы поломались на элементе ${elemIndex} (ожидали ${
              prevIndex + 1
            })`
          );
        }
        prevIndex = elemIndex;
      } else {
        prevIndex = elemIndex;
      }
    });
  }
}

export { InfinityScroll };
