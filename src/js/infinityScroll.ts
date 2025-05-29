import {
  RenderController,
  ScrollDetector,
  ChunkController,
  ListController,
  DomManager,
  Skeleton,
  Vsb,
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
  div: 'DIV',
};

const LANG: string = navigator.language.split('-')[0];
const errorLang = LANG === 'ru' ? 'ru' : 'en';

const errors = errorMsg[errorLang];

const cssAnimationSkeletonText = `.loading .dots {
    width: 0.5em;
    animation: load 3s steps(4, end) infinite;
    display: inline-block;
    overflow: hidden;
    vertical-align: text-bottom;
}

@keyframes load {
    from {
        width: 0em;
    }
    to   {
        width: 2em;
    }
}
`;

// START OF CLASS REALIZATION OF INFINITYSCROLL

// TODO: начать кэшировать некоторые настройки списка
class InfinityScroll {
  // хранит в себе id сетТаймаута
  private timerIdRefreshList: number | undefined;

  // ввёл, но пока не использовал
  private name: string | undefined;

  // хранит html-id главного корневого элемента
  private readonly selectorId: string;

  // хранит ссылку на корневой html-элеент
  private readonly wrapperEl: HTMLElement;

  // промежуточная обёртка
  private middleWrapper: HTMLElement | undefined;

  private readonly subDir: string | undefined;

  private readonly forcedListLength: number | undefined;

  // Тип списка (список или таблица)
  private readonly listType: 'table' | 'list' | 'div';

  private readonly tHeadNames: string[] | undefined;

  private readonly listWrapperHeight: string | undefined;

  // Тип загрузки (список доступен локально или надо качать с интернета)
  private readonly dataLoadPlace: 'local' | 'remote';

  // Скорость загрузки при асинхронном типе (сразу всё или по частям)
  private isLazy: boolean;

  private readonly dataUrl: DataURLType | undefined;

  private includeEnd: boolean;

  private basedIndex: 0 | 1;

  private isSyncing: boolean;

  // Содержит генерируемый элемент внутри корневого
  private readonly listEl: HTMLElement;

  private readonly domMngr: DomManager;

  private scroll: ScrollDetector;

  private readonly chunk: ChunkController;

  private readonly list: ListController;

  private render: RenderController | undefined;

  private readonly skeleton: Skeleton;

  private vsb: Vsb;

  constructor(props: InfinityScrollPropTypes) {
    this.selectorId = props.selectorId;

    const wrapper = document.getElementById(props.selectorId);
    if (wrapper === null) {
      throw new Error(`${props.selectorId} - ${errors.elementNotExist}`);
    }
    this.wrapperEl = wrapper;

    this.subDir = props.subDir;

    this.forcedListLength = props.forcedListLength;

    this.listType = props.listType || 'list';

    this.tHeadNames = props.tHeadNames;

    this.listWrapperHeight = props.listWrapperHeight;

    this.listEl = this.createInnerList();

    this.scroll = new ScrollDetector();

    this.chunk = new ChunkController();

    this.list = new ListController();

    this.vsb = new Vsb(() => {
      if (this.isSyncing) {
        // console.log('Внещний скролл, поэтому не тригерим handleScroll');
        return;
      }

      this.isSyncing = true;

      this.vsb.handleScroll();
      this.calcCurrentDOMRender();

      setTimeout(() => {
        this.isSyncing = false;
      }, 0);
    });

    this.skeleton = new Skeleton({
      template: props.templateString,
      templateCb: props.templateCb,
      listType: this.listType,
    });

    const domChangerProps = {
      skeleton: this.skeleton,
      targetElem: this.listEl,
      // TODO: этот пропс тут НЕ НУЖЕН??
      template: props.templateString,
    };
    this.domMngr = new DomManager(domChangerProps);

    this.dataLoadPlace = Array.isArray(props.data) ? 'local' : 'remote';

    this.isLazy = false;

    this.includeEnd = false;

    this.basedIndex = 1;

    this.isSyncing = false;

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

    this.list.length = Math.round(this.vsb.safeLimit / this.list.itemHeight);
    console.log('this.list.itemHeight)', this.list.itemHeight);
    console.log('this.list.length', this.list.length);
    if (this.list.length > this.list.data.length) {
      this.list.length = this.list.data.length;
    } else if (this.list.length <= 0) {
      // TODO: only for tests?
      this.list.length = this.list.data.length;
    }
    this.list.lastPageLength = this.list.fullLength % this.list.length;

    // TODO: кажется тут это не нужно, попробуем пока без этого
    // this.chunk.lastRenderIndex =
    //   this.list.length - this.list.halfOfExistingSizeInDOM;
    // console.log('this.chunk.lastRenderIndex', this.chunk.lastRenderIndex);

    const renderProps = {
      halfOfExistingSizeInDOM: this.list.halfOfExistingSizeInDOM,
      lastRenderIndex: this.chunk.lastRenderIndex,
      listLength: this.list.length,
      chunkAmount: this.chunk.amount,
      tailingElementsAmount: this.list.tailingElementsAmount,
    };
    console.log(renderProps);
    if (isPropsUndefined(renderProps)) {
      throw new Error(errors.undefinedProps);
    }
    this.render = new RenderController(renderProps);
    this.domMngr.fillList(this.list);
    this.domMngr.setPaddingToList(this.list, this.chunk.htmlHeight);

    this.createVirtualScroll();

    // this.wrapperEl.addEventListener(
    // this.middleWrapper.addEventListener(
    //     'scroll',
    //     this.calcCurrentDOMRender.bind(this)
    // );
    this.middleWrapper.addEventListener('scroll', (e) => {
      if (this.isSyncing) {
        console.log('Отключаем стандартынй скролл эвент');
        return;
      }
      if (
        this.domMngr.targetElem.offsetHeight !==
          this.domMngr.targetElemSavedOffset &&
        this.vsb.isPageChanged &&
        this.vsb.currentPage === this.vsb.totalPages - 1 &&
        this.scroll.direction === 'up'
      ) {
        console.warn('Предпоследняя страница, надо всё чинить');

        const hightestIndexByPage =
          this.list.length * this.vsb.currentPage - this.list.existingSizeInDOM;

        this.domMngr.resetAllList(
          this.chunk,
          this.chunk.prevPageRenderIndex,
          hightestIndexByPage,
          this.list,
          this.scroll.direction,
          this.vsb
        );
        this.vsb.setScrollToOrigScrollElem();
        this.vsb.isPageChanged = false;
      }

      this.isSyncing = true;
      this.calcCurrentDOMRender();
      // console.log(e.target.scrollTop);
      this.vsb.setScrollFromOuterSrc(e.target.scrollTop, this.scroll.direction);
      setTimeout(() => {
        this.isSyncing = false;
      }, 0);
    });
    //
  }

  setDefaultStyles() {
    if (this.listWrapperHeight !== undefined) {
      this.wrapperEl.style.height = this.listWrapperHeight;
    }

    if (this.wrapperEl.offsetHeight < 10) {
      const msg = errors.zeroHeight;
      this.wrapperEl.innerHTML = `<h3>${msg}</h3>`;
      throw new Error(msg);
    }

    // this.wrapperEl.style.overflowY = 'scroll';
    this.wrapperEl.style.position = 'relative';
  }

  createInnerList(): HTMLElement {
    // Create middle wrapper

    this.middleWrapper = document.createElement('div');
    this.middleWrapper.classList.add('middleWrapper');

    this.wrapperEl.append(this.middleWrapper);

    const newEl = document.createElement(nameToTag[this.listType]);
    const newElClass = `${this.selectorId}_${this.listType
      .charAt(0)
      .toUpperCase()}${this.listType.slice(1)}`;
    newEl.setAttribute('class', newElClass);

    if (
      this.listType === 'table' &&
      this.tHeadNames &&
      this.tHeadNames.length > 0
    ) {
      const tbody = document.createElement('tbody');
      const thead = document.createElement('thead');

      const tHeadColsWithNames: string = this.tHeadNames?.reduce(
        (acc, name) => {
          const col = `<td>${name}</td>`;
          return acc + col;
        },
        ''
      );

      thead.innerHTML = `<tr class="${this.selectorId}__listItem">${tHeadColsWithNames}</tr>`;
      // this.wrapperEl.appendChild(newEl).appendChild(thead);
      this.middleWrapper.appendChild(newEl).appendChild(thead);
      return this.middleWrapper.appendChild(newEl).appendChild(tbody);
    }

    // return this.wrapperEl.appendChild(newEl);
    return this.middleWrapper.appendChild(newEl);
  }

  getAllSizes(): void {
    if (this.domMngr === undefined) {
      throw new Error(errors.domManagerIsUndefined);
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
        throw new Error(errors.dataIsUndefined);
      }
      const elemData = this.list.data[0];
      this.domMngr.targetElem.append(this.domMngr.createItem(elemData, 0));
      listItem = list.firstChild as HTMLElement;
    }

    // TODO: вынести в отдельную функцию?
    // Set required styles
    const innerElementClassName = `${this.selectorId}_${this.listType
      .charAt(0)
      .toUpperCase()}${this.listType.slice(1)}`;

    const mapOfChildSelector = {
      list: 'li',
      table: 'tbody > tr',
      div: 'div',
    };

    const childElementTagName = mapOfChildSelector[this.listType];

    const cssText = `.${this.selectorId}_List {
      overflow: hidden; 
      }
      
.${this.selectorId}_List li { 
      white-space: nowrap;
    }

    
.${innerElementClassName} > ${childElementTagName}${cssAnimationSkeletonText}`;

    const styleELem = document.createElement('style');
    styleELem.appendChild(document.createTextNode(cssText));
    this.wrapperEl.prepend(styleELem);
    // End - Set required styles

    this.list.itemHeight = listItem?.offsetHeight || this.list.wrapperHeight;

    this.chunk.amount = Math.ceil(
      this.list.wrapperHeight / this.list.itemHeight
    );

    this.list.existingSizeInDOM = this.chunk.amount * 4; // TODO: может быть ситуация, когда деток меньше чем (чанк * 4) - сделать сеттер или проверку (лучше сеттер)
    this.list.halfOfExistingSizeInDOM = this.list.existingSizeInDOM / 2;
    this.chunk.lastRenderIndex =
      this.list.length - this.list.halfOfExistingSizeInDOM;

    this.list.startIndexOfLastPart =
      this.list.length - this.list.existingSizeInDOM;
    this.chunk.lastOrderNumber = Math.floor(
      this.list.length / this.chunk.amount
    );

    this.chunk.htmlHeight = this.chunk.amount * this.list.itemHeight;

    this.list.tailingElementsAmount = this.list.length % this.chunk.amount; // TODO: возможно уже не нужно после включения VSB

    if (listItem) {
      this.domMngr.removeItem('firstChild');
    }
  }

  createVirtualScroll() {
    // TODO: эти расчёты уже сделаны внутри VSB?
    console.log('this.vsb.safeLimit', this.vsb.safeLimit);

    this.list.length = Math.round(this.vsb.safeLimit / this.list.itemHeight);
    if (this.list.length > this.list.fullLength) {
      this.list.length = this.list.fullLength;
    }
    console.log('this.list.itemHeight)', this.list.itemHeight);
    console.log('this.list.length', this.list.length);

    this.list.tailingElementsAmount = this.list.length % this.chunk.amount;
    console.log(
      'this.list.tailingElementsAmount',
      this.list.tailingElementsAmount
    );

    this.chunk.lastRenderIndex =
      this.list.length - this.list.halfOfExistingSizeInDOM;

    this.chunk.prevPageRenderIndex =
      this.chunk.lastRenderIndex +
      this.chunk.amount -
      (this.chunk.lastRenderIndex % this.chunk.amount);

    this.chunk.lastPageLastRenderIndex =
      this.list.lastPageLength > this.list.halfOfExistingSizeInDOM
        ? this.list.length - this.list.halfOfExistingSizeInDOM
        : 1;

    // this.list.length = newLength;
    // TODO: это важно и нужно
    if (this.render) {
      this.render.reInitValues(
        this.chunk.lastRenderIndex,
        this.list.length,
        this.list.tailingElementsAmount
      );
    }

    this.domMngr.setPaddingToList(this.list, this.chunk.htmlHeight);

    this.skeleton.setListHeight(this.list.fullLength);

    this.list.startIndexOfLastPart =
      this.list.length - this.list.existingSizeInDOM;

    this.list.lastPageStartIndexOfLastPart =
      this.list.lastPageLength - this.list.existingSizeInDOM;

    if (this.list.lastPageStartIndexOfLastPart < 0) {
      this.list.lastPageStartIndexOfLastPart = 0;
    }

    this.chunk.lastOrderNumber = Math.floor(
      this.list.length / this.chunk.amount
    );

    const totalHeight = this.list.getTotalListHeight();
    const realHeight = this.listEl.offsetHeight;
    console.log('realHeight', realHeight);
    this.vsb.init({
      totalHeight,
      realHeight,
      fullLength: this.list.fullLength,
      listLength: this.list.length,
      origScrollElem: this.middleWrapper,
    });
    // console.log(this.list.lengthByPage)
    // this.list.getPaginatedData(this.vsb.totalPages, this.vsb.safeLimit);
    this.middleWrapper?.after(this.vsb.elem);
  }

  async calcCurrentDOMRender(): Promise<void> {
    const eventTarget = this.middleWrapper;
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

    let resultIndex =
      newRenderIndex +
      (this.scroll.isGoingFromBottom ? this.list.tailingElementsAmount : 0);
    // console.log('resultIndex', resultIndex);
    // console.log('this.chunk.startRenderIndex', this.chunk.startRenderIndex);

    if (this.scroll.direction === 'up') {
      if (resultIndex > this.chunk.prevPageRenderIndex) {
        resultIndex = this.list.length - this.chunk.amount * 3;
        console.log('Перезаписываем resultIndex', resultIndex);
      }
    }

    // Если скролл слишком большой - рисуем всё заново
    const isBigDiff = this.checkBigDiff(renderIndexDiff);
    if (isBigDiff) {
      // console.log('Перезапускаем таймер, старый id', this.timerIdRefreshList);
      clearTimeout(this.timerIdRefreshList);
      this.setTimerToRefreshList();
    }

    // Если скролл поменялся - устанавливаем новый скролл и меняем ДОМ
    if (this.chunk.startRenderIndex !== resultIndex) {
      // this.chunk.startRenderIndex = resultIndex;
      this.chunk.setRenderIndex(
        resultIndex,
        this.vsb.currentPage,
        this.list.length
      );
      console.log(
        `====== startRenderIndex -> ${this.chunk.startRenderIndex} (${this.chunk.itemIndex}), page ${this.vsb.currentPage}, (${this.scroll.direction}) ======`
      );

      if (!this.render) {
        throw new Error(errors.renderControllerIsUndefined);
      }
      const isAllowRender = this.render.isAllowRenderNearBorder(
        this.scroll.direction,
        this.chunk.startRenderIndex
      );
      if (this.chunk.prevPageRenderIndex === this.chunk.startRenderIndex) {
        if (this.domMngr.targetElemSavedOffset <= 0) {
          const t = this.domMngr.targetElem;
          this.domMngr.targetElemSavedOffset = this.domMngr.targetElem.offsetHeight;
          console.warn(
            'Save targetElemSavedOffset',
            this.domMngr.targetElemSavedOffset
          );
          console.warn(
            t.offsetHeight,
            t.style.paddingBottom,
            t.style.transform
          );
        }
      }
      if (isAllowRender && this.domMngr) {
        const mainChunkProps = {
          // itemIndex is good
          itemIndex: this.chunk.itemIndex,
          startRenderIndex: this.chunk.startRenderIndex,
          amount: this.chunk.amount,
          htmlHeight: this.chunk.htmlHeight,
        };

        // Fetch new DATA
        if (this.isLazy && !isBigDiff) {
          const [sequenceStart, sequenceEnd] = this.getSequence(
            this.chunk.itemIndex
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
          this.list,
          this.scroll.direction,
          this.scroll.isGoingFromBottom,
          this.vsb
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
        // console.log('renderIndex', renderIndex);
        // itemIndex
        const [sequenceStart, sequenceEnd] = this.getSequence(
          this.chunk.itemIndex,
          // this.chunk.startRenderIndex,
          true
        );

        if (this.isLazy) {
          if (process.env.NODE_ENV === 'development') {
            // For tests - 2
            // await this.sleep(3000);
          }

          const ranges: NumRange = [sequenceStart, sequenceEnd];
          // console.log('ranges', ranges);

          this.fetchUnfoundedRanges([ranges]);
        }
        if (timerID !== this.timerIdRefreshList) {
          return;
        }
        console.log(
          'Восстанавливаем значение this.chunk.startRenderIndex (renderIndex)',
          renderIndex
        );
        // if(renderIndex === 94)  renderIndex = 90;
        this.chunk.setRenderIndex(
          renderIndex,
          this.vsb.currentPage,
          this.list.length
        );
        console.log(
          `====== this.chunk.startRenderIndex форсированно поменялся ${this.chunk.startRenderIndex} ======`
        );
        // END Fetch new DATA

        this.domMngr.resetAllList(
          this.chunk,
          renderIndex,
          sequenceStart,
          this.list,
          this.scroll.direction,
          this.vsb
        );
        if (process.env.NODE_ENV === 'development') {
          // For tests - 3
          // console.log('BEFORE checkIndexOrdering (reset list)');
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
      newLength = this.forcedListLength || (data && data.length);
    } else {
      const dataUrl = data as DataURLType;
      const [isDataUrlString, isDataUrlReturnString] = checkDataUrl(dataUrl);

      if (!isDataUrlString && !isDataUrlReturnString) {
        throw new Error(errors.notValidUrl);
      }

      if (!isDataUrlReturnString) {
        await getRemoteData(dataUrl as string).then((fetchedData): void => {
          const extractedData = this.extractResponse(fetchedData);
          this.list.data = extractedData;
          newLength =
            this.forcedListLength || (extractedData && extractedData.length);
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
      throw new Error(errors.notArray);
    }
    if (!newLength) {
      throw new Error(errors.zeroListSize);
    }

    console.log('newLength', newLength);
    this.list.fullLength = newLength;
    this.list.length = newLength;
    this.skeleton.setListHeight(this.list.length);
  }

  // TODO: renderIndex or itemIndex ??? -> truly this is itemIndex, but name is no difference?
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
      const lowestIndexByPage = this.list.length * (this.vsb.currentPage - 1);
      const hightestIndexByPage =
        this.list.length * this.vsb.currentPage - this.list.existingSizeInDOM;
      // console.log(lowestIndexByPage, hightestIndexByPage);
      sequenceStart =
        tempStartIndex > lowestIndexByPage ? tempStartIndex : lowestIndexByPage;
      // console.log(sequenceStart);

      if (sequenceStart > hightestIndexByPage) {
        sequenceStart = hightestIndexByPage;
      }
      sequenceEnd = sequenceStart + this.list.existingSizeInDOM;
    }
    const lastStartIndex = this.list.fullLength - this.list.existingSizeInDOM;
    const lastEndIndex = this.list.fullLength;
    // const lastStartIndex = this.list.length - this.list.existingSizeInDOM;
    // const lastEndIndex = this.list.length;

    // console.log(lastStartIndex, lastEndIndex);
    // TODO: возможно это всё еще нужно - проверить на разных тестах при одной большой странице
    // if (sequenceStart > lastStartIndex) {
    //   console.log('Случай сложный');
    //   [sequenceStart, sequenceEnd] = [lastStartIndex, lastEndIndex];
    // }
    return [sequenceStart, sequenceEnd];
  }

  fetchUnfoundedRanges(unfoundedRanges: NumRange[]): void {
    // console.log(`Try to fetch: ${unfoundedRanges.flat().join(' - ')}`);
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
        // console.log(`Loaded from: ${startFetchIndex}, to: ${endFetchIndex}`);
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
      throw new Error(errors.noTargetElem);
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
      throw new Error(errors.noDataUrl);
    }
    if (typeof this.dataUrl === 'string') {
      throw new Error(errors.dataUrlNotAFn);
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
      throw new Error(errors.fetchedIsNotArray);
    }
    return res;
  }
}

export { InfinityScroll };
