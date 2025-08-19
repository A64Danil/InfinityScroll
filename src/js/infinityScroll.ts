import {
  RenderController,
  ScrollDetector,
  ChunkController,
  ListController,
  DomManager,
  Skeleton,
  Vsb,
  IndexedTTLStoreManager,
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

import { iScrollTester } from './domTests';

import { errorMsg } from '../locales/errors';

import { NumRange, Rec } from './types/utils';

import { calcSequenceByDirection } from './helpers/calcSequence';

import { InfinityScrollPropTypes } from './types/InfinityScrollPropTypes';
import { DataURLType } from './types/DataURL';
import { DataUrlFunction } from './types/DataUrlFunction';
import { IScrollDirection } from './types/IScrollDirection';

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

  // Содержит генерируемый элемент внутри корневого для задания искусственного отступа
  private readonly offsetElem: HTMLElement | undefined;

  private readonly domMngr: DomManager;

  private scroll: ScrollDetector;

  private readonly chunk: ChunkController;

  private readonly list: ListController;

  private render: RenderController | undefined;

  private readonly skeleton: Skeleton;

  private readonly vsb: Vsb;

  private readonly dbmanager: IndexedTTLStoreManager;

  private readonly test: () => void;

  private tests: {
    name: string;
    errors: Map<string, string[]>;
  };

  private isDebugMode = false;

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

    this.isDebugMode = props.isDebugMode || false;
    // this.isDebugMode = props.isDebugMode || true;

    this.listEl = this.createInnerList();

    this.scroll = new ScrollDetector();

    this.chunk = new ChunkController();

    this.list = new ListController();

    this.vsb = new Vsb(this.isDebugMode, () => {
      if (this.isSyncing) {
        console.log('Внещний скролл, поэтому не тригерим handleScroll - 2.0');
        return;
      }
      this.vsb.isSyncing = true;

      this.scroll.setScrollDirection(
        this.vsb.elem.scrollTop,
        this.vsb.isPageChanged,
        this.vsb.isLastPage
      );
      this.vsb.handleScroll();
      this.calcCurrentDOMRender();

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (this.vsb.scroll !== this.vsb.elem.scrollTop) {
            this.vsb.handleScroll();
          }
          this.vsb.isSyncing = false;
        });
      });
    });

    this.dbmanager = new IndexedTTLStoreManager(this.selectorId);

    this.skeleton = new Skeleton({
      template: props.templateString,
      templateCb: props.templateCb,
      listType: this.listType,
    });

    const domChangerProps = {
      skeleton: this.skeleton,
      targetElem: this.listEl,
    };
    this.domMngr = new DomManager(domChangerProps);

    this.dataLoadPlace = Array.isArray(props.data) ? 'local' : 'remote';

    this.isLazy = false;

    this.includeEnd = false;

    this.basedIndex = 1;

    this.isSyncing = false;

    console.log(props.data);

    this.test = iScrollTester;

    this.tests = {
      name: '',
      errors: new Map(),
    };

    if (this.dataLoadPlace === 'remote') {
      this.dataUrl = props.data as DataURLType;
    }

    // TODO: проблема в том что мы "перекрываем" кешированные данные свежими
    // Решение будет после того как функция setInitialListData будет разбита на несколько функций

    // 1. получаем данные из IndexedDB
    // 2. если есть, устанавливаем их в список
    // 3. получаем параметры АПИ и начальные данные для отрисовки
    // 4. Стартуем список

    // проблема - пункты 1 и 3 - асинхронные

    // 2 всегда идёт после 1
    // 1 и 3 могут (и должны) выполняться параллельно
    // 4 идёт всегда последним

    // Если в кэше ничего нет, то ничего и не делаем
    // Если интернет не работате, то запускаем start без ожидания

    this.getSavedListData().then((data) => {
      if (data.length) {
        this.list.data = data;
        console.log(data);
        console.log(this);
      }
    });

    // return

    this.setInitialListData(props.data).then(() => {
      this.start();
    });
  }

  async start() {
    console.log(this);

    this.setDefaultStyles();
    this.getAllSizes();

    this.offsetElem = document.createElement('div');
    this.offsetElem.classList.add('offsetElem');
    this.middleWrapper.prepend(this.offsetElem);
    this.domMngr.offsetElem = this.offsetElem;

    if (this.isLazy) {
      const startIdx = this.basedIndex + 1;

      await this.getListDataLazy(startIdx, this.list.existingSizeInDOM).then(
        (data): void => {
          const shiftedArr = new Array(1).concat(data);
          this.setListData(shiftedArr);
        }
      );
    }

    this.vsb.setHeight = () => this.domMngr.setHeightToList(this.list);

    this.chunk.lastPageLastRenderIndex =
      this.list.lastPageLength > this.list.halfOfExistingSizeInDOM
        ? this.list.lastPageLength - this.list.halfOfExistingSizeInDOM
        : 1;

    const renderProps = {
      lastRenderIndex: this.chunk.lastRenderIndex,
      lastPageLastRenderIndex: this.chunk.lastPageLastRenderIndex,
      listLength: this.list.length,
      listlastPageLength: this.list.lastPageLength,
      chunkAmount: this.chunk.amount,
      // tailingElementsAmount: this.list.tailingElementsAmount,
    };
    console.log(renderProps);
    if (isPropsUndefined(renderProps)) {
      throw new Error(errors.undefinedProps);
    }
    this.render = new RenderController(renderProps);
    this.domMngr.fillList(this.list);
    this.domMngr.setHeightToList(this.list);

    this.scroll.maxScroll =
      this.list.length * this.list.itemHeight -
      this.middleWrapper?.clientHeight;

    this.scroll.lastPageMaxScroll =
      this.list.lastPageLength * this.list.itemHeight -
      this.middleWrapper?.clientHeight;

    this.createVirtualScroll();

    this.middleWrapper.addEventListener('scroll', (e) => {
      if (this.vsb.isSyncing) {
        console.log('Отменяемmain scroll listener - 1.0');
        return;
      }
      this.isSyncing = true;
      this.scroll.setScrollDirection(
        this.middleWrapper.scrollTop,
        this.vsb.isPageChanged,
        this.vsb.isLastPage
      );
      this.vsb.setScrollFromOuterSrc(e.target.scrollTop, this.scroll.direction);
      if (this.vsb.isPageChanged) {
        const [resultIndex] = this.calcRenderIndex(e.target.scrollTop);
        this.chunk.setRenderIndex(
          resultIndex,
          this.vsb.currentPage,
          this.list.length,
          this.vsb.isLastPage
        );
        console.log(
          'Before refreshList (main scroll listener), isLastPage',
          this.vsb.isLastPage,
          this.vsb.currentPage
        );
        this.refreshList();
      } else {
        this.calcCurrentDOMRender();
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.vsb.isPageChanged = false;
          this.isSyncing = false;
        });
      });
    });
    //
    // this.test();
    this.setIndexedDb();
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
    this.list.itemHeight = listItem?.offsetHeight || this.list.wrapperHeight;

    // Set required styles
    this.initializeBaseStyles();

    this.chunk.amount = Math.ceil(
      this.list.wrapperHeight / this.list.itemHeight
    );

    // TODO: сделать несколько проверок на случай если всего 1 страница и айтемов меньше чем амаунт * 4
    this.list.existingSizeInDOM = this.chunk.amount * 4; // TODO: может быть ситуация, когда деток меньше чем (чанк * 4) - сделать сеттер или проверку (лучше сеттер)
    this.list.halfOfExistingSizeInDOM = this.list.existingSizeInDOM / 2;

    this.list.length = Math.round(this.vsb.safeLimit / this.list.itemHeight);
    if (this.list.length > this.list.fullLength) {
      this.list.length = this.list.fullLength;
    }

    if (!this.isLazy && this.list.length > this.list.data.length) {
      this.list.length = this.list.data.length;
    } else if (this.list.length <= 0) {
      this.list.length = this.list.data.length;
    }

    this.list.lastPageLength = this.list.fullLength % this.list.length;

    if (this.list.lastPageLength === 0) {
      console.log('this.list.lastPageLength', this.list.lastPageLength);
      this.list.lastPageLength = this.list.length;
    }

    this.chunk.lastRenderIndex =
      this.list.length -
      this.list.halfOfExistingSizeInDOM -
      this.list.tailingElementsAmount;

    this.list.startIndexOfLastPart =
      this.list.length - this.list.existingSizeInDOM;
    // this.list.startIndexOfLastPart = this.list.length - this.chunk.amount * 3;

    this.chunk.lastOrderNumber = Math.floor(
      this.list.length / this.chunk.amount
    );

    this.chunk.htmlHeight = this.chunk.amount * this.list.itemHeight;

    if (listItem) {
      this.domMngr.removeItem('firstChild');
    }
  }

  initializeBaseStyles() {
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

    const innerElementClassName = `${this.selectorId}_${this.listType
      .charAt(0)
      .toUpperCase()}${this.listType.slice(1)}`;

    const childElementTagName = {
      list: 'li',
      table: 'tbody > tr',
      div: 'div',
    }[this.listType];

    const allStyles = `
    .${this.selectorId}_List {
      overflow: hidden; 
      margin: 0;
    }
    
    .${this.selectorId}_List li { 
      white-space: nowrap;
    }
    
    .${innerElementClassName} > ${childElementTagName}${cssAnimationSkeletonText}
    
    .${this.selectorId}_List li.loading { 
      min-height: ${this.list.itemHeight}px;
      box-sizing: border-box;
    }
    
    .${this.selectorId}_List li.loading img { 
      width: 100%;
      aspect-ratio: 1;
      background: #ccc;
      animation: opacityLoader 3s ease-in-out infinite alternate;
      border-radius: 10px;
    }
    
    @keyframes opacityLoader {
      from { opacity: 1; }
      to { opacity: 0.1; }
    }
  `;

    const styleElement = document.createElement('style');
    styleElement.textContent = allStyles.trim();
    this.wrapperEl.prepend(styleElement);
  }

  createVirtualScroll() {
    this.list.tailingElementsAmount = this.list.length % this.chunk.amount;
    this.list.pageTailingElementsAmount = this.list.length % this.chunk.amount;
    this.list.lastPageTailingElementsAmount =
      this.list.lastPageLength % this.chunk.amount;

    console.log(
      'this.list.tailingElementsAmount',
      this.list.tailingElementsAmount
    );

    this.chunk.prevPageRenderIndex =
      this.chunk.lastRenderIndex +
      this.chunk.amount -
      (this.chunk.lastRenderIndex % this.chunk.amount);

    if (this.render) {
      this.render.reInitValues(this.chunk.lastRenderIndex, this.list.length);
    }

    this.domMngr.setHeightToList(this.list);
    this.skeleton.setListLength(this.list.fullLength);

    this.list.lastPageStartIndexOfLastPart =
      this.list.lastPageLength - this.list.existingSizeInDOM;

    if (this.list.lastPageStartIndexOfLastPart < 0) {
      this.list.lastPageStartIndexOfLastPart = 0;
    }
    // ----- //

    this.chunk.lastOrderNumber = Math.floor(
      this.list.length / this.chunk.amount
    );

    this.chunk.lastPageLastOrderNumber = Math.floor(
      this.list.lastPageLength / this.chunk.amount
    );

    const totalHeight = this.list.getTotalListHeight();
    const realHeight = this.listEl.offsetHeight;
    console.log('realHeight', realHeight);
    this.vsb.init({
      totalHeight,
      realHeight,
      fullLength: this.list.fullLength,
      listLength: this.list.length,
      lastPageLength: this.list.lastPageLength,
      origScrollElem: this.middleWrapper,
    });
    // console.log(this.list.lengthByPage)
    // this.list.getPaginatedData(this.vsb.totalPages, this.vsb.safeLimit);
    this.middleWrapper?.after(this.vsb.elem);
  }

  calcRenderIndex(scroll: number) {
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

    const lastOrderNumber = this.vsb.isLastPage
      ? this.chunk.lastPageLastOrderNumber
      : this.chunk.lastOrderNumber;

    const maxScroll = this.vsb.isLastPage
      ? this.scroll.lastPageMaxScroll
      : this.scroll.maxScroll;

    // FUTURE?
    // const lastOrderNumberNEW = this.chunk[this.vsb.isLastPage].lastOrderNumber
    // const maxScrollNEW = this.scroll[this.vsb.isLastPage].maxScroll

    // Устанавливаем буль, если мы движемся вверх от самого низа списка (это важно)
    this.scroll.setGoingFromBottom(
      this.chunk.firstOrderNumber,
      lastOrderNumber,
      chunkOrderNumber,
      scroll,
      maxScroll
    );

    const tailingElementsAmount = !this.vsb.isLastPage
      ? this.list.pageTailingElementsAmount
      : this.list.lastPageTailingElementsAmount;

    // const tailingElementsAmount = this.list.tailingElementsAmount;
    // const tailingElementsAmount = this.list.lastPageTailingElementsAmount;

    // console.log('tailingElementsAmount', tailingElementsAmount, this.vsb.currentPage, this.vsb.isLastPage);

    let resultIndex =
      newRenderIndex +
      (this.scroll.isGoingFromBottom ? tailingElementsAmount : 0);
    // console.log('resultIndex', resultIndex, this.scroll.isGoingFromBottom);
    // console.log('this.chunk.startRenderIndex', this.chunk.startRenderIndex);

    if (
      this.chunk.startRenderIndex !== resultIndex &&
      this.scroll.direction === 'up'
    ) {
      if (resultIndex > this.chunk.prevPageRenderIndex) {
        resultIndex = this.list.length - this.chunk.amount * 3;
      }
    }
    return [resultIndex, newRenderIndex];
  }

  async calcCurrentDOMRender(): Promise<void> {
    const eventTarget = this.middleWrapper;
    const scroll = eventTarget.scrollTop;

    const [resultIndex, newRenderIndex] = this.calcRenderIndex(scroll);

    const newItemIndex =
      this.list.length * (this.vsb.currentPage - 1) + resultIndex;

    // const renderIndexDiff = this.chunk.getRenderIndexDiff(newRenderIndex);
    // const renderIndexDiff = this.chunk.getRenderIndexDiff(resultIndex);
    const renderIndexDiff = this.chunk.getRenderIndexDiff(newItemIndex);

    // Если скролл слишком большой - рисуем всё заново
    const isBigDiff = this.checkBigDiff(renderIndexDiff);
    if (isBigDiff || this.vsb.isPageChanged) {
      console.log('isBigDiff', isBigDiff, renderIndexDiff);
      clearTimeout(this.timerIdRefreshList);
      this.setTimerToRefreshList();
    }

    // Если скролл поменялся - устанавливаем новый скролл и меняем ДОМ
    if (this.chunk.startRenderIndex !== resultIndex) {
      const oldIndex = this.chunk.startRenderIndex;
      this.chunk.setRenderIndex(
        resultIndex,
        this.vsb.currentPage,
        this.list.length,
        this.vsb.isLastPage
      );

      if (!this.render) {
        throw new Error(errors.renderControllerIsUndefined);
      }
      const isAllowRender = this.render.isAllowRenderNearBorder(
        this.scroll.direction,
        this.chunk.startRenderIndex,
        this.vsb.currentPage !== 1 && this.vsb.isLastPage
      );

      // console.log(
      //   ` startRenderIndex -> ${this.chunk.startRenderIndex}, был ${oldIndex}, resultIndex ${resultIndex}, itemIndex: ${this.chunk.itemIndex}, newItemIndex: ${newItemIndex}`
      // );
      if (isAllowRender && this.domMngr) {
        let tempDirection: IScrollDirection;
        // TODO: false убрать или всё убрать?
        if (!this.timerIdRefreshList) {
          if (this.chunk.startRenderIndex < oldIndex) {
            tempDirection = 'up';
          } else {
            tempDirection = 'down';
          }

          if (tempDirection && tempDirection !== this.scroll.direction) {
            console.warn('================ Направления не совпадают!');
            this.scroll.direction = tempDirection;
          }
        }

        console.log(
          `====== startRenderIndex -> ${this.chunk.startRenderIndex} (${this.chunk.itemIndex}), page ${this.vsb.currentPage}, (real: ${this.scroll.direction}, temp: ${tempDirection} ), isGoingFromBottom: ${this.scroll.isGoingFromBottom}, ${renderIndexDiff} ======`
        );

        const mainChunkProps = {
          itemIndex: this.chunk.itemIndex,
          startRenderIndex: this.chunk.startRenderIndex,
          amount: this.chunk.amount,
          htmlHeight: this.chunk.htmlHeight,
        };

        // Read from indexedDB or Fetch new DATA
        if (this.isLazy && !isBigDiff) {
          const [sequenceStart, sequenceEnd] = this.getSequence(
            this.chunk.itemIndex
          );

          await this.loadDataFromSources(sequenceStart, sequenceEnd);
        }
        // END  Read from indexedDB or Fetch new DATA

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
            this.checkIndexOrdering(this.scroll.isGoingFromBottom);
          }
        }
      }
    }
  }

  checkBigDiff(scrollDiff: number): boolean {
    const tailingElementsAmount = !this.vsb.isLastPage
      ? this.list.pageTailingElementsAmount
      : this.list.lastPageTailingElementsAmount;

    return this.scroll.isBigDiff(
      scrollDiff,
      this.chunk.amount,
      tailingElementsAmount
    );
  }

  async loadDataFromSources(sequenceStart: number, sequenceEnd: number) {
    const sources = [
      {
        name: 'DB',
        loader: async () => {
          await this.getItemsFromDB(sequenceStart, sequenceEnd);
          return this.checkItemForLoad(sequenceStart, sequenceEnd);
        },
      },
      {
        name: 'fetch',
        loader: async (ranges: NumRange[]) => {
          this.fetchUnfoundedRanges(ranges);
          return [];
        },
      },
    ];

    let unfoundedRanges = this.checkItemForLoad(sequenceStart, sequenceEnd);

    await sources.reduce(async (promise, source) => {
      await promise;
      if (unfoundedRanges.length === 0) {
        return Promise.resolve();
      }

      console.log(`Unfounded (for ${source.name})`, unfoundedRanges);
      unfoundedRanges = await source.loader(unfoundedRanges);

      return Promise.resolve();
    }, Promise.resolve());
  }

  sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  refreshList(timerID?: number) {
    if (this.render) {
      const renderIndex = this.chunk.startRenderIndex;

      // if (
      //   this.vsb.currentPage === this.vsb.totalPages &&
      //   renderIndex > this.chunk.lastPageLastRenderIndex - this.chunk.amount
      // ) {
      //   renderIndex = this.chunk.lastPageLastRenderIndex - this.chunk.amount;
      //   console.log('last page rendex index fixed', renderIndex);
      // } else if (renderIndex > this.chunk.lastRenderIndex) {
      //   renderIndex = this.chunk.lastRenderIndex;
      // }

      this.chunk.setRenderIndex(
        renderIndex,
        this.vsb.currentPage,
        this.list.length,
        this.vsb.isLastPage
      );

      if (
        this.vsb.currentPage === this.vsb.totalPages &&
        !this.vsb.isLastPage
      ) {
        console.error(
          this.vsb.currentPage,
          this.vsb.currentPage === this.vsb.totalPages,
          this.vsb.isLastPage
        );
      }
      // itemIndex
      const [sequenceStart, sequenceEnd] = this.getSequence(
        this.chunk.itemIndex,
        true,
        this.vsb.isLastPage
      );

      if (this.isLazy) {
        if (process.env.NODE_ENV === 'development') {
          // For tests - 2
          // await this.sleep(3000);
        }

        const ranges: NumRange = [sequenceStart, sequenceEnd];

        this.fetchUnfoundedRanges([ranges]);
      }
      if (timerID && timerID !== this.timerIdRefreshList) {
        return;
      }
      // TODO: проверить с выключенным fixOrdering
      // END Fetch new DATA

      console.log(renderIndex);
      this.domMngr.resetAllList(
        this.chunk,
        renderIndex,
        sequenceStart,
        this.list,
        this.scroll.direction,
        this.vsb
      );
      this.timerIdRefreshList = null;
      if (process.env.NODE_ENV === 'development') {
        // For tests - 3
        // console.log('BEFORE checkIndexOrdering (reset list)');
        this.checkIndexOrdering();
        // console.clear();
        console.log(
          'AFTER checkIndexOrdering  (reset list)',
          this.scroll.direction,
          timerID,
          `renderIndex: ${renderIndex}`
        );
      }
    }
  }

  setTimerToRefreshList() {
    const timerID = window.setTimeout(async () => {
      this.refreshList(timerID);
    }, 0);
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

  setListData(data: ListController['data']) {
    data.forEach((obj, i) => this.setListDataByIndex(obj, i));
    this.saveListData(data);
  }

  saveListData(data: ListController['data']) {
    const indexedDBentries = this.list.data.map((value, index) => ({
      index,
      value,
    }));
    this.dbmanager.writeMany(indexedDBentries);
  }

  setListDataByIndex(dataObj: ListController['data'][number], index: number) {
    this.list.data[index] = dataObj;
  }

  saveListDataByIndex(dataObj: ListController['data'][number], index: number) {
    this.dbmanager.write(index, dataObj);
  }

  async getSavedListData() {
    const size = await this.dbmanager.getStoreSize();

    // TODO: change this
    // const safeDataSize = 100000;
    const safeDataSize = 10;
    const dataSizeLimit = this.isLazy ? safeDataSize : size;
    // const dataSizeLimit = 10; // for tests
    console.log(size);
    let listData;
    if (size <= dataSizeLimit) {
      listData = await this.dbmanager.readAll();
    } else {
      console.warn('Объем закешированных данных слишком большой');
      listData = await this.dbmanager.readRange(0, safeDataSize - 1);
    }

    return listData;
  }

  /*
   * Define length of list and length of last page;
   * Also define apiSettings, html-height and fetch initial data
   * */

  // TODO: кажеься надо разбить на несколько отдельных функций
  async setInitialListData(data: object[] | DataURLType) {
    console.log('---- setInitialListData ----');
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
          // this.list.data = extractedData;
          console.log('after get remote data');
          this.setListData(extractedData);
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
        // this.list.data = fetchedData;
        this.setListData(fetchedData);

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
    this.skeleton.setListLength(this.list.length);
  }

  // TODO: renderIndex or itemIndex ??? -> truly this is itemIndex, but name is no difference?
  getSequence(
    renderIndex: number,
    isFetchToReset = false,
    isLastPage = false
  ): number[] {
    let sequenceStart;
    let sequenceEnd;

    let hightestEndIndexByPage;

    if (!isLastPage) {
      hightestEndIndexByPage = this.list.length * this.vsb.currentPage;
    } else {
      const nonLastPagesSize = this.list.length * (this.vsb.totalPages - 1);
      hightestEndIndexByPage = nonLastPagesSize + this.list.lastPageLength;
    }

    if (!isFetchToReset) {
      sequenceStart = calcSequenceByDirection(
        this.scroll.direction,
        this.list.halfOfExistingSizeInDOM,
        renderIndex,
        this.chunk.amount
      );
      sequenceEnd = sequenceStart + this.chunk.amount;

      if (sequenceEnd > hightestEndIndexByPage) {
        console.log('fix sequenceEnd');
        sequenceEnd = hightestEndIndexByPage;
      }
    } else {
      const tempStartIndex = renderIndex - this.chunk.amount;

      const lowestIndexByPage = this.list.length * (this.vsb.currentPage - 1);

      // const pageLength = !isLastPage ? this.list.length : this.list.lastPageLength;
      let hightestIndexByPage;

      if (!isLastPage) {
        hightestIndexByPage =
          this.list.length * this.vsb.currentPage - this.list.existingSizeInDOM;
      } else {
        const nonLastPagesSize = this.list.length * (this.vsb.totalPages - 1);
        let lastPageSize =
          this.list.lastPageLength - this.list.existingSizeInDOM;
        if (lastPageSize < 0) lastPageSize = 0;
        hightestIndexByPage = nonLastPagesSize + lastPageSize;
      }

      // console.log({ isFetchToReset, hightestIndexByPage, isLastPage });
      sequenceStart =
        tempStartIndex > lowestIndexByPage ? tempStartIndex : lowestIndexByPage;

      if (sequenceStart > hightestIndexByPage) {
        sequenceStart = hightestIndexByPage;
      }

      // console.log('sequenceStart', sequenceStart);
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
    unfoundedRanges.forEach(([sequenceStart, sequenceEnd]) => {
      const [startFetchIndex, endFetchIndex] = [
        sequenceStart + this.basedIndex,
        sequenceEnd + this.basedIndex - Number(this.includeEnd),
      ];

      getRemoteDataByRange(
        this.dataUrl as DataUrlFunction,
        startFetchIndex,
        endFetchIndex
      ).then((data): void => {
        if (data.length === 0) return;
        const extractedData = this.extractResponse(data);
        this.addNewItemsToDataList(sequenceStart, extractedData);
        this.updateSkeletonItems(sequenceStart, extractedData);
      });
    });
  }

  addNewItemsToDataList(sequenceStart: number, data: Rec[]) {
    const loopLength = data.length;
    for (let i = 0; i < loopLength; i++) {
      const currentIndex = sequenceStart + i;
      this.setListDataByIndex(data[i], currentIndex);
      this.saveListDataByIndex(data[i], currentIndex);
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
      if (element) this.skeleton.updateElement(element, data[i], dataIndex);
    }
  }

  // TODO: useless?
  async getListItem(index): Promise<Rec | undefined> {
    let elem;
    if (this.list.data[index] !== undefined) {
      elem = this.list.data[index];
    } else {
      console.log('Элемента в быстром доступе нет. Будем искать в БД', index);
      if (await this.dbmanager.has(index)) {
        console.log('Нашли его в БД');
        elem = await this.dbmanager.get(index);
        console.log(elem);
      } else {
        console.log('Элемента в БД нет, вот что отдаёт БД');
        console.log(await this.dbmanager.get(index));
      }
    }
    return elem;
  }

  async getItemsFromDB(sequenceStart: number, sequenceEnd: number) {
    const result = await this.dbmanager.readRange(
      sequenceStart,
      sequenceEnd - 1
    );
    console.log(result);
    this.list.data.splice(sequenceStart, this.chunk.amount, ...result);
  }

  checkItemForLoad(sequenceStart: number, sequenceEnd: number): unknown[] {
    const unfoundedItems: NumRange[] = [];
    let isUndefined = false;
    const buffer: number[] = [];
    const lastIndex = sequenceEnd - 1;
    for (let i = sequenceStart; i < sequenceEnd; i++) {
      const currentElem = this.list.data[i];
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

  checkIndexOrdering(isGoingFromBottom: boolean) {
    const list = this.domMngr?.targetElem;

    if (!list) {
      throw new Error(errors.noTargetElem);
    }

    let prevIndex: number | null = null;

    let isGoodOrdering = true;
    [...list.children].forEach((elem) => {
      const elemIndex = Number(elem.getAttribute('aria-posinset'));
      if (prevIndex !== null) {
        if (prevIndex + 1 !== elemIndex) {
          const errorText = `Индексы поломались на элементе ${elemIndex} (ожидали ${
            prevIndex + 1
          }), isGoingFromBottom - ${isGoingFromBottom}`;
          console.error(`${this.tests.name} -- ${errorText})`);

          if (!Array.isArray(this.tests.errors.get(this.tests.name))) {
            this.tests.errors.set(this.tests.name, []);
          }
          this.tests.errors.get(this.tests.name).push(errorText);
          isGoodOrdering = false;
        }
        prevIndex = elemIndex;
      } else {
        prevIndex = elemIndex;
      }
    });

    return isGoodOrdering;
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

  async setIndexedDb() {
    console.log('setIndexedDb');

    // Установка TTL на сутки
    // await this.dbmanager.setTTL(24 * 60 * 60 * 1000);

    const oneDayTimeMS = 24 * 60 * 60 * 1000;
    const days = 7;

    const totalDaysTTL = days * oneDayTimeMS;
    await this.dbmanager.setTTL(totalDaysTTL);

    // // Получение всех данных
    // const all = await this.dbmanager.readAll();
    // console.log('🧾 All companies:', all);
  }
}

export { InfinityScroll };
