import {
  RenderController,
  ScrollDetector,
  ChunkController,
  ListController,
  DomManager,
} from './controllers';

import {
  checkChildrenAmount,
  isPropsUndefined,
  getRemoteData,
  getListDataLazy,
} from './helpers';

import {
  calcSequenceByDirection,
  recalcSequence,
} from './helpers/calcSequence';

import { InfinityScrollPropTypes } from './types/InfinityScrollPropTypes';
import { DataURLType } from './types/DataURL';

// http://localhost:3000/data?_page=1&_limit=20

console.log('Main TS file loaded');

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

// START OF CLASS REALIZATION OF INFINITYSCROLL

class InfinityScroll {
  // хранит в себе id сетТаймаута
  private timerIdRefreshList: number | undefined;

  // ввёл, но пока не использовал
  private name: string;

  // хранит html-id главного корневого элемента
  private readonly selectorId: string;

  // хранит ссылку на корневой html-элеент
  private readonly wrapperEl: HTMLElement;

  private readonly forcedListLength: number | 'auto';

  // Тип списка (список или таблица)
  private readonly listType: string;

  // Тип списка (список или таблица)
  private readonly listWrapperHeight: string;

  // Тип загрузки (список доступен локально или надо качать с интернета)
  private readonly dataLoadPlace: 'local' | 'remote';

  // Скорость загрузки при асинхронном типе (сразу всё или по частям)
  private readonly dataLoadSpeed: 'instant' | 'lazy';

  private readonly dataUrl: DataURLType;

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

    this.forcedListLength = props.forcedListLength || 'auto';

    this.listType = props.listType;

    this.listWrapperHeight = props.listWrapperHeight;

    this.listEl = this.createInnerList();

    this.scroll = new ScrollDetector();

    this.chunk = new ChunkController();

    this.list = new ListController();

    const domChangerProps = {
      targetElem: this.listEl,
      listLength: 0,
      template: props.templateString,
    };

    this.dataLoadPlace = props.dataLoadPlace;

    this.dataLoadSpeed = props.dataLoadSpeed;

    this.dataUrl = props.dataUrl;

    this.setListData(props.data, props.dataUrl).then(() => {
      domChangerProps.listLength = this.list.length;
      this.domMngr = new DomManager(domChangerProps);
      this.start();
    });
  }

  async start() {
    if (this.domMngr === undefined) {
      throw new Error('Your DomManager is undefined');
    }
    console.log(this);
    if (this.dataLoadPlace === 'remote') {
      console.log(this.list.data);
      // return;
    }
    this.setDefaultStyles();
    this.getAllSizes();

    if (this.dataLoadSpeed === 'lazy') {
      console.log('Заполняем первичный раз');
      console.log(this.list.data);
      await getListDataLazy(this.dataUrl, 1, this.list.existingSizeInDOM).then(
        (data): void => {
          console.log('Вот что стянули');
          console.log(data);
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
    // ID-то наверное и не нужен вообще, если есть доступ к списку итак?
    const newElClass = `${this.selectorId}_${this.listType
      .charAt(0)
      .toUpperCase()}${this.listType.slice(1)}`;
    // newEl.setAttribute('id', newElID);
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

  async calcCurrentDOMRender(e: Event): void {
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
    this.scroll.setGoingFromBottom(
      this.chunk.firstOrderNumber,
      this.chunk.lastOrderNumber,
      chunkOrderNumber
    );
    // Если скролл слишком большой - рисуем всё заново
    const isBigDiff = this.checkBigDiff(renderIndexDiff);
    if (isBigDiff && this.domMngr && this.domMngr.isWaitRender === false) {
      this.domMngr.isWaitRender = true;
      this.setTimerToRefreshList();
    }

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
        const mainChunkProps = {
          startRenderIndex: this.chunk.startRenderIndex,
          amount: this.chunk.amount,
          htmlHeight: this.chunk.htmlHeight,
        };
        console.log(
          'mainChunkProps.startRenderIndex',
          mainChunkProps.startRenderIndex
        );
        // TODO: донастроить правильный фетч
        // Fetch new DATA
        if (this.dataLoadSpeed === 'lazy') {
          await this.lazyOrderedFetch();
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

  checkBigDiff(scrollDiff: number): boolean {
    const isBigDiff: boolean = this.scroll.isBigDiff(
      scrollDiff,
      this.chunk.amount,
      this.list.tailingElementsAmount
    );
    return isBigDiff;
  }

  setTimerToRefreshList() {
    this.timerIdRefreshList = window.setTimeout(async () => {
      if (this.domMngr) {
        // Fetch new DATA
        console.log('before fetch in bigDiff');
        if (this.dataLoadSpeed === 'lazy') {
          await this.lazyOrderedFetch(true);
        }
        // END Fetch new DATA
        this.domMngr.resetAllList(this.chunk, this.list, this.scroll.direction);
      }
    }, 30);
  }

  async setListData(listData: object[], dataUrl?: DataURLType) {
    let newLength = null;
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
        await getListDataLazy(dataUrl).then((data) => {
          console.log(data);
          console.log('Будущий функционал для лейзи');
          console.log(this.list.existingSizeInDOM);
          this.list.data = data;
          if (this.forcedListLength) {
            // TODO: не забыть написать функцию для определения длины списка
            newLength =
              this.forcedListLength === 'auto' ? 1000 : this.forcedListLength;
          } else {
            newLength = data && data.length;
          }
        });
      }
    }
    if (!Array.isArray(this.list.data)) {
      throw new Error('Your list does not have Array type');
    }
    if (!newLength) {
      throw new Error('Your list does not have length or length is 0');
    }
    this.list.length = newLength;
  }

  async lazyOrderedFetch(isFetchToReset = false) {
    let [startFetchIndex, endFetchIndex] = [0, 1];
    const lastStartIndex = this.list.length - this.chunk.amount;
    const lastEndIndex = this.list.length;
    let sequenceStart;
    let sequenceEnd;
    // console.log('lastStartIndex', lastStartIndex);
    if (!isFetchToReset) {
      sequenceStart = calcSequenceByDirection(
        this.scroll.direction,
        this.list.halfOfExistingSizeInDOM,
        this.chunk.startRenderIndex,
        this.chunk.amount
      );
      sequenceEnd = sequenceStart + this.chunk.amount;
    } else {
      const baseStyles = [
        'color: #fff',
        'background-color: #900',
        'padding: 2px 4px',
        'border-radius: 2px',
      ].join(';');
      console.log('%c============= Фетч всего списка', baseStyles);
      sequenceStart = this.chunk.startRenderIndex - this.chunk.amount;
      sequenceEnd = sequenceStart + this.list.existingSizeInDOM;
    }
    console.log('sequenceStart', sequenceStart, sequenceEnd);
    [startFetchIndex, endFetchIndex] =
      sequenceStart < lastStartIndex
        ? [sequenceStart, sequenceEnd]
        : [lastStartIndex, lastEndIndex];
    console.log(`${startFetchIndex} - ${endFetchIndex}`);
    await getRemoteData(this.dataUrl(startFetchIndex, endFetchIndex)).then(
      (data): void => {
        if (!Array.isArray(data)) {
          throw new Error('Your fetched data does not have Array type');
        }
        console.log('startFetchIndex', startFetchIndex);
        this.addNewItemsToDataList(startFetchIndex, data);
        console.log(this.list.data);
      }
    );
  }

  // TODO: выяснить почему не все данные берутся из массива
  addNewItemsToDataList(startFetchIndex: number, data: Array<object>) {
    const loopLength = data.length;
    for (let i = 0; i < loopLength; i++) {
      const currentIndex = startFetchIndex + i;
      console.log(currentIndex);
      this.list.data[currentIndex] = data[i];
    }
  }
}

export { InfinityScroll };
