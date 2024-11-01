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
  getRemoteDataByRange,
  getListDataLazy,
  checkIncludeEnd,
  checkBaseIndex,
  checkDataUrl,
  getListLength,
} from './helpers';

import { calcSequenceByDirection } from './helpers/calcSequence';

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

  private subDir: string | undefined;

  private readonly forcedListLength: number | undefined;

  // Тип списка (список или таблица)
  private readonly listType: string;

  // Тип списка (список или таблица)
  private readonly listWrapperHeight: string;

  // Тип загрузки (список доступен локально или надо качать с интернета)
  private readonly dataLoadPlace: 'local' | 'remote';

  // Скорость загрузки при асинхронном типе (сразу всё или по частям)
  private dataLoadSpeed: 'instant' | 'lazy';

  private dataUrl: DataURLType | undefined;

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

    this.subDir = props.subDir;

    this.forcedListLength = props.forcedListLength;

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

    this.dataLoadPlace = Array.isArray(props.data) ? 'local' : 'remote';

    this.dataLoadSpeed = 'instant';

    this.includeEnd = false;

    this.basedIndex = 1;

    console.log(props.data);
    if (this.dataLoadPlace === 'local') {
      this.setListData(props.data);
      domChangerProps.listLength = this.list.length;
      this.domMngr = new DomManager(domChangerProps);
      this.start();
    } else {
      this.dataUrl = props.data as DataURLType;
      this.setListData(this.dataUrl).then(() => {
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
        this.list.existingSizeInDOM,
        this.subDir
      ).then((data): void => {
        console.log('Вот что стянули');
        console.log(data);
        this.list.data = this.list.data?.concat(data);
        //
        this.list.data[34] = { name: 'Fake data 35' };
        this.list.data[35] = { name: 'Fake data 36' };
        this.list.data[37] = { name: 'Fake data 38' };

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
          const [sequenceStart, sequenceEnd] = this.getSequence(
            this.chunk.startRenderIndex
          );
          const unfoundedRanges = this.checkItemForLoad(
            sequenceStart,
            sequenceEnd
          );

          if (unfoundedRanges.length) {
            console.log('Unfounded', unfoundedRanges);
            this.lazyOrderedFetch(unfoundedRanges);
          }
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
          // TODO: этот момент проверить еще раз
          // this.lazyOrderedFetch(renderIndex, true);
          const endIndex = this.chunk.amount * 4 + renderIndex;
          await getListDataLazy(
            this.dataUrl,
            renderIndex,
            endIndex,
            this.subDir
          );
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
    this.includeEnd = await checkIncludeEnd(
      this.dataUrl as DataUrlFunction,
      this.subDir
    );
    this.basedIndex = await checkBaseIndex(
      this.dataUrl as DataUrlFunction,
      this.includeEnd,
      this.subDir
    );
  }

  async setListData(data: object[] | DataURLType) {
    let newLength = null;
    if (this.dataLoadPlace === 'local') {
      this.list.data = data as [];
      newLength = data && data.length;
    } else {
      const dataUrl = data as DataURLType;
      const [isDataUrlString, isDataUrlReturnString] = checkDataUrl(dataUrl);

      if (!isDataUrlString && !isDataUrlReturnString) {
        throw new Error(
          'Your dataUrl is not a valid URL; or returned value is not a  valid URL'
        );
      }

      if (!isDataUrlReturnString) {
        await getRemoteData(dataUrl as string).then((fetchedData): void => {
          const transformatedData =
            this.subDir && !Array.isArray(fetchedData)
              ? fetchedData[this.subDir]
              : fetchedData;

          if (!Array.isArray(transformatedData)) {
            throw new Error('Your fetched data does not have Array type');
          }
          this.list.data = transformatedData;
          newLength = transformatedData && transformatedData.length;
        });
      } else {
        this.dataLoadSpeed = 'lazy';
        await this.checkApiSettings();
        console.log('Конечный индекс includeEnd? ', this.includeEnd);
        console.log('Индекс считается с ', this.basedIndex);
        // TODO: вынести в хелпер?
        const startIdx = this.basedIndex;
        const endIdx = this.basedIndex + Number(!this.includeEnd);
        const fetchedData = await getListDataLazy(
          dataUrl,
          startIdx,
          endIdx,
          this.subDir
        );
        console.log(fetchedData);
        this.list.data = fetchedData;
        // const getXTotalCount = await

        if (this.forcedListLength) {
          newLength = this.forcedListLength;
        } else {
          const fetchedListLength =
            (await getListLength(dataUrl as DataUrlFunction, this.subDir)) +
            Number(!this.basedIndex);

          console.log('fetchedListLength', fetchedListLength);
          newLength = fetchedListLength;
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

  getSequence(renderIndex: number, isFetchToReset = false): number[] {
    let sequenceStart;
    let sequenceEnd;
    if (!isFetchToReset) {
      sequenceStart = calcSequenceByDirection(
        this.scroll.direction,
        this.list.halfOfExistingSizeInDOM,
        renderIndex,
        this.chunk.amount
      );
      sequenceEnd = sequenceStart + this.chunk.amount;
    } else {
      sequenceStart = renderIndex;
      sequenceEnd = sequenceStart + this.list.existingSizeInDOM;
    }
    const lastStartIndex = this.list.length - this.list.existingSizeInDOM;
    const lastEndIndex = this.list.length;
    if (sequenceStart > lastStartIndex) {
      console.warn('Случай сложный');
      [sequenceStart, sequenceEnd] = [lastStartIndex, lastEndIndex];
    }
    console.log('sequenceStart-end', sequenceStart, sequenceEnd); // 32 - 39
    return [sequenceStart, sequenceEnd];
  }

  async lazyOrderedFetch(unfoundedRanges: number[]) {
    console.log(unfoundedRanges);
    unfoundedRanges.forEach(([sequenceStart, sequenceEnd]) => {
      let [startFetchIndex, endFetchIndex] = [0, 1];

      const lastStartIndex = this.list.length - this.list.existingSizeInDOM;
      const lastEndIndex = this.list.length;
      [startFetchIndex, endFetchIndex] = [
        sequenceStart + this.basedIndex,
        sequenceEnd + this.basedIndex - Boolean(this.includeEnd),
      ];
      console.log(
        `startFetchIndex - endFetchIndex ${startFetchIndex} - ${endFetchIndex}`
      );

      // 32 33 34 35 36 37 38 39 40 // start from 0, end excluded // 32 - 40
      // 32 33 34 35 36 37 38 39  // start from 0, end included // 32 - 39

      // 33 34 35 36 37 38 39 40 41 // start from 1, end excluded // 33 - 41
      // 33 34 35 36 37 38 39 40  // start from 0, end included // 33 - 40

      getRemoteDataByRange(
        this.dataUrl as DataUrlFunction,
        startFetchIndex,
        endFetchIndex
      ).then(
        // getRemoteData(this.dataUrl(startFetchIndex, endFetchIndex)).then(
        (data): void => {
          const finalData = this.subDir ? data[this.subDir] : data;
          // if (this.subDir) {
          //   console.log('you need to take from subdir');
          //   console.log(data);
          // }
          if (!Array.isArray(finalData)) {
            throw new Error('Your fetched data does not have Array type');
          }
          console.log(finalData);
          this.addNewItemsToDataList(sequenceStart, finalData);
          this.updateSkeletonItems(sequenceStart, finalData);
          // const dataObj = {
          //   data: this.list.data?.slice(),
          // };
          // console.log(dataObj);
        }
      );
    });
  }

  // 0 - 31 (32 всего)
  // 32 - 39 (40 всего)
  // 32 - 40 (41 всего)
  /// id 33 -> ячейку 32
  addNewItemsToDataList(sequenceStart: number, data: Array<object>) {
    const loopLength = data.length;
    for (let i = 0; i < loopLength; i++) {
      const currentIndex = sequenceStart + i;
      this.list.data[currentIndex] = data[i];
    }
    console.log(this.list.data);
  }

  updateSkeletonItems(sequenceStart: number, data: Array<object>) {
    const loopLength = data.length;
    for (let i = 0; i < loopLength; i++) {
      const currentIndex = sequenceStart + i;
      const dataIndex = currentIndex + 1;
      const searchSelector = `[aria-posinset="${dataIndex}"]`;
      const element = this.domMngr.targetElem.querySelector(searchSelector);
      // console.log(searchSelector, dataIndex, currentIndex);
      if (element) this.skeleton.updateElement(element, data[i], dataIndex);
    }
  }

  checkItemForLoad(sequenceStart, sequenceEnd) {
    const unfoundedItems = [];
    let isUndefined = false;
    let buffer = [];
    for (let i = sequenceStart; i < sequenceEnd; i++) {
      const currentElem = this.list.data[i];
      // console.log(`Check ${i}`, currentElem !== undefined);
      if (currentElem === undefined && isUndefined === false) {
        isUndefined = true;
        buffer.push(i);
      } else if (
        // TODO: можно оптимизировать
        (currentElem !== undefined && isUndefined) ||
        (i === sequenceEnd - 1 && isUndefined)
      ) {
        buffer.push(
          i === sequenceEnd - 1 && currentElem === undefined ? i + 1 : i
        );
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
