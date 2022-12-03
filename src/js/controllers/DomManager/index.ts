import { ListController } from '../List';
import { ChunkController } from '../Chunk';
import { IScrollDirection } from '../../types/IScrollDirection';
import { TemplateStringFunction } from '../../types/TemplateStringFunction';
import {
  ChunkPropsToModifyDom,
  ListPropsToModifyDom,
} from '../../types/PropsToModifyDom';

import { checkChildrenAmount } from '../../helpers';

export class DomManager {
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
    list: ListPropsToModifyDom,
    chunkHtmlHeight: number,
    offset = 0
  ): void {
    let paddingBottom =
      list.length * list.itemHeight - chunkHtmlHeight * 4 - offset;

    if (paddingBottom < 0) {
      paddingBottom = 0;
    }
    this.targetElem.style.paddingBottom = `${paddingBottom}px`;
  }

  // eslint-disable-next-line class-methods-use-this
  calcStartOffsetIndex(
    startRenderIndex: number,
    chunkAmount: number,
    direction: IScrollDirection,
    startIndexOfLastPart: number
  ): number {
    let startOffsetIndex = startRenderIndex - chunkAmount;
    if (startOffsetIndex < 0) {
      startOffsetIndex = 0;
    }
    if (direction === 'down' && startOffsetIndex > startIndexOfLastPart) {
      startOffsetIndex = startIndexOfLastPart;
    }
    return startOffsetIndex;
  }

  setOffsetToList(
    chunk: ChunkPropsToModifyDom,
    list: ListPropsToModifyDom,
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

    const startOffsetIndex = this.calcStartOffsetIndex(
      chunk.startRenderIndex,
      chunk.amount,
      direction,
      list.startIndexOfLastPart
    );
    const offset = startOffsetIndex * list.itemHeight;

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
    chunk: ChunkPropsToModifyDom,
    list: ListPropsToModifyDom,
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
    chunk: ChunkPropsToModifyDom,
    list: ListPropsToModifyDom,
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
