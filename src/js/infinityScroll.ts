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
  checkIncludeEnd,
  checkBaseIndex,
  checkDataUrl,
  getListLength,
} from './helpers';

import { errorMsg } from '../locales/errors';

import { NumRange, Rec } from './types/utils';

import { calcSequenceByDirection } from './helpers/calcSequence';

import { InfinityScrollPropTypes } from './types/InfinityScrollPropTypes';
import { DataURLType } from './types/DataURL';
import { DataUrlFunction } from './types/DataUrlFunction';

type NameToTagObj = {
  [key: string]: string;
};

const nameToTag: NameToTagObj = {
  list: 'UL',
  table: 'TABLE',
};

const LANG: string = navigator.language.split('-')[0];

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

  private readonly subDir: string | undefined;

  private readonly forcedListLength: number | undefined;

  // Тип списка (список или таблица)
  private readonly listType: string;

  // Тип списка (список или таблица)
  private readonly listWrapperHeight: string | undefined;

  // Тип загрузки (список доступен локально или надо качать с интернета)
  private readonly dataLoadPlace: 'local' | 'remote';

  // Скорость загрузки при асинхронном типе (сразу всё или по частям)
  private isLazy: boolean;

  private readonly dataUrl: DataURLType | undefined;

  private includeEnd: boolean;

  private basedIndex: 0 | 1;

  // Содержит генерируемый элемент внутри корневого
  private readonly listEl: HTMLElement;

  private readonly domMngr: DomManager;

  private scroll: ScrollDetector;

  private readonly chunk: ChunkController;

  private readonly list: ListController;

  private render: RenderController | undefined;

  private readonly skeleton: Skeleton;

  constructor(props: InfinityScrollPropTypes) {
    this.name = props.name;
    this.selectorId = props.selectorId;

    const wrapper = document.getElementById(props.selectorId);
    if (wrapper === null) {
      throw new Error(`Element ${props.selectorId} does not exist in DOM`);
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
      template: props.templateString,
    };
    this.domMngr = new DomManager(domChangerProps);

    this.dataLoadPlace = Array.isArray(props.data) ? 'local' : 'remote';

    this.isLazy = false;

    this.includeEnd = false;

    this.basedIndex = 1;

    console.log(props.data);

    if (this.dataLoadPlace === 'remote') {
      this.dataUrl = props.data as DataURLType;
    }

    this.setListData(props.data).then(() => {
      this.start();
    });
  }

  async start() {
    console.log(this);

    this.setDefaultStyles();
    this.getAllSizes();

    if (this.isLazy) {
      const startIdx = this.basedIndex + 1;

      await this.getListDataLazy(startIdx, this.list.existingSizeInDOM).then(
        (data): void => {
          this.list.data = this.list.data?.concat(data);
        }
      );
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

    this.wrapperEl.addEventListener(
      'scroll',
      this.calcCurrentDOMRender.bind(this)
    );
  }

  setDefaultStyles() {
    if (this.listWrapperHeight !== undefined) {
      this.wrapperEl.style.height = this.listWrapperHeight;
    }

    if (this.wrapperEl.offsetHeight < 10) {
      const msg = errorMsg[LANG].zeroHeight;
      this.wrapperEl.innerHTML = `<h3>${msg}</h3>`;
      throw new Error(msg);
    }

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

    const cssText = `.${this.selectorId}_List {
      overflow: hidden; 
      }
      
.${this.selectorId}_List li { 
      white-space: nowrap;
    }`;
    const styleELem = document.createElement('style');
    styleELem.appendChild(document.createTextNode(cssText));
    this.wrapperEl.prepend(styleELem);

    if (listItem) {
      this.domMngr.removeItem('firstChild');
    }
  }

  async calcCurrentDOMRender(e: Event): Promise<void> {
    const eventTarget = e.target as HTMLElement;
    const scroll = eventTarget.scrollTop;
    // Вычисляем позицию чанка
    const chunkOrderNumber: number = this.chunk.getOrderNumber(scroll);

    if (process.env.NODE_ENV === 'development') {
      checkChildrenAmount(
        this.listEl.childNodes.length,
        this.list.existingSizeInDOM
      );
    }
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
      console.log(
        `====== this.chunk.startRenderIndex поменялся ${this.chunk.startRenderIndex} ======`
      );

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
        if (this.isLazy && !isBigDiff) {
          const [sequenceStart, sequenceEnd] = this.getSequence(
            this.chunk.startRenderIndex
          );
          const unfoundedRanges = this.checkItemForLoad(
            sequenceStart,
            sequenceEnd
          );

          if (unfoundedRanges.length) {
            console.log('Unfounded', unfoundedRanges);
            this.fetchUnfoundedRanges(unfoundedRanges as NumRange[]);
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
        if (process.env.NODE_ENV === 'development') {
          // For tests - 1
          if (!isBigDiff) {
            this.checkIndexOrdering();
          }
        }
      }
    }
  }

  checkBigDiff(scrollDiff: number): boolean {
    return this.scroll.isBigDiff(
      scrollDiff,
      this.chunk.amount,
      this.list.tailingElementsAmount
    );
  }

  sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  setTimerToRefreshList() {
    const timerID = window.setTimeout(async () => {
      if (this.render) {
        const renderIndex = this.chunk.startRenderIndex;
        const [sequenceStart, sequenceEnd] = this.getSequence(
          this.chunk.startRenderIndex,
          true
        );

        if (this.isLazy) {
          if (process.env.NODE_ENV === 'development') {
            // For tests - 2
            // await this.sleep(3000);
          }

          const ranges: NumRange = [sequenceStart, sequenceEnd];
          console.log('ranges', ranges);

          this.fetchUnfoundedRanges([ranges]);
        }
        if (timerID !== this.timerIdRefreshList) {
          return;
        }
        console.log('Восстанавливаем значение this.chunk.startRenderIndex');
        this.chunk.startRenderIndex = renderIndex;
        console.log(
          `====== this.chunk.startRenderIndex форсированно поменялся ${this.chunk.startRenderIndex} ======`
        );
        // END Fetch new DATA
        this.domMngr.resetAllList(
          this.chunk,
          renderIndex,
          sequenceStart,
          this.list,
          this.scroll.direction
        );
        if (process.env.NODE_ENV === 'development') {
          // For tests - 3
          console.log('BEFORE checkIndexOrdering (reset list)');
          this.checkIndexOrdering();
          console.log('AFTER checkIndexOrdering  (reset list)');
        }
      }
    }, 30);
    this.timerIdRefreshList = timerID;
    // console.log('Timer started by id', this.timerIdRefreshList);
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
          const extractedData = this.extractResponse(fetchedData);
          this.list.data = extractedData;
          newLength = extractedData && extractedData.length;
        });
      } else {
        this.isLazy = true;
        await this.checkApiSettings();
        console.log('Конечный индекс includeEnd? ', this.includeEnd);
        console.log('Индекс считается с ', this.basedIndex);
        const startIdx = this.basedIndex;
        const endIdx = this.basedIndex + Number(!this.includeEnd);
        const fetchedData = await this.getListDataLazy(startIdx, endIdx);
        console.log(fetchedData);
        this.list.data = fetchedData;

        if (this.forcedListLength) {
          newLength = this.forcedListLength;
        } else {
          newLength =
            (await getListLength(dataUrl as DataUrlFunction, this.subDir)) +
            Number(!this.basedIndex);
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
      const tempStartIndex = renderIndex - this.chunk.amount;
      sequenceStart = tempStartIndex > 0 ? tempStartIndex : 0;
      sequenceEnd = sequenceStart + this.list.existingSizeInDOM;
    }
    const lastStartIndex = this.list.length - this.list.existingSizeInDOM;
    const lastEndIndex = this.list.length;
    if (sequenceStart > lastStartIndex) {
      console.log('Случай сложный');
      [sequenceStart, sequenceEnd] = [lastStartIndex, lastEndIndex];
    }
    return [sequenceStart, sequenceEnd];
  }

  fetchUnfoundedRanges(unfoundedRanges: NumRange[]): void {
    console.log(unfoundedRanges);
    unfoundedRanges.forEach(([sequenceStart, sequenceEnd]) => {
      const [startFetchIndex, endFetchIndex] = [
        sequenceStart + this.basedIndex,
        sequenceEnd + this.basedIndex - Number(this.includeEnd),
      ];
      // console.log(
      //   `startFetchIndex - endFetchIndex ${startFetchIndex} - ${endFetchIndex}`
      // );

      getRemoteDataByRange(
        this.dataUrl as DataUrlFunction,
        startFetchIndex,
        endFetchIndex
      ).then((data): void => {
        const extractedData = this.extractResponse(data);
        console.log(`Loaded from: ${startFetchIndex}, to: ${endFetchIndex}`);
        this.addNewItemsToDataList(sequenceStart, extractedData);
        this.updateSkeletonItems(sequenceStart, extractedData);
      });
    });
  }

  addNewItemsToDataList(sequenceStart: number, data: Rec[]) {
    const loopLength = data.length;
    for (let i = 0; i < loopLength; i++) {
      const currentIndex = sequenceStart + i;
      this.list.data[currentIndex] = data[i];
    }
  }

  updateSkeletonItems(sequenceStart: number, data: Rec[]) {
    const loopLength = data.length;
    for (let i = 0; i < loopLength; i++) {
      const currentIndex = sequenceStart + i;
      const dataIndex = currentIndex + 1;
      const searchSelector = `[aria-posinset="${dataIndex}"]`;
      const element = this.domMngr.targetElem.querySelector(
        searchSelector
      ) as HTMLElement;
      // console.log(searchSelector, dataIndex, currentIndex);
      if (element) this.skeleton.updateElement(element, data[i], dataIndex);
    }
  }

  checkItemForLoad(sequenceStart: number, sequenceEnd: number): unknown[] {
    const unfoundedItems: NumRange[] = [];
    let isUndefined = false;
    const buffer: number[] = [];
    const lastIndex = sequenceEnd - 1;
    for (let i = sequenceStart; i < sequenceEnd; i++) {
      const currentElem = this.list.data[i];
      // console.log(`Check ${i}`, currentElem !== undefined);
      if (currentElem === undefined && isUndefined === false) {
        isUndefined = true;
        buffer.push(i);
      } else if (
        isUndefined &&
        (currentElem !== undefined || i === lastIndex)
      ) {
        const index = i === lastIndex && currentElem === undefined ? i + 1 : i;
        buffer.push(index);
        unfoundedItems.push(buffer.slice() as NumRange);
        buffer.length = 0;
        isUndefined = false;
      }
    }
    return unfoundedItems;
  }

  checkIndexOrdering() {
    const list = this.domMngr?.targetElem;

    if (!list) {
      throw new Error('You do not have HTML-element for your list');
    }

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

  async getListDataLazy(start = 0, end = 1) {
    if (!this.dataUrl) {
      throw new Error(
        'You try to call getListDataLazy, but you dont have dataUrl'
      );
    }
    if (typeof this.dataUrl === 'string') {
      throw new Error(
        'You try to call getListDataLazy, but your dataUrl is a string type'
      );
    }

    const fetchedData = await getRemoteDataByRange(
      this.dataUrl,
      start,
      end
    ).then((data) => this.extractResponse(data));

    return fetchedData;
  }

  extractResponse(data: Rec[]): Rec[] {
    const res = Array.isArray(data) ? data : this.subDir && data[this.subDir];
    if (!Array.isArray(res)) {
      throw new Error('Your fetched data does not have Array type');
    }
    return res;
  }
}

export { InfinityScroll };
