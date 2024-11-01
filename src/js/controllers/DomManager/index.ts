import { ListController } from '../List';
import { ChunkController } from '../Chunk';
import { Skeleton } from '../Skeleton';
import { IScrollDirection } from '../../types/IScrollDirection';
import { TemplateStringFunction } from '../../types/TemplateStringFunction';
import {
  ChunkPropsToModifyDom,
  ListPropsToModifyDom,
} from '../../types/PropsToModifyDom';

import { checkChildrenAmount } from '../../helpers';

export class DomManager {
  // private scrollTemp = 0;

  public isStopRender = false;

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

  private readonly skeleton: Skeleton;

  constructor(props: {
    skeleton: Skeleton;
    template: TemplateStringFunction;
    targetElem: HTMLElement;
    listLength: number;
  }) {
    // this.data = props.data;
    this.skeleton = props.skeleton;
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

  /**
   * Set certain scroll to list (transform and padding)
   */
  setOffsetToList(
    chunk: ChunkPropsToModifyDom,
    startRenderIndex: number,
    list: ListPropsToModifyDom,
    direction: IScrollDirection,
    forcedOffset: number | undefined = undefined,
    isAllowRenderNearBorder = false
  ): void {
    if (forcedOffset !== undefined) {
      this.targetElem.style.transform = `translate(0,${forcedOffset}px)`;
      if (isAllowRenderNearBorder) {
        this.setEvenScrollToList(forcedOffset, chunk.htmlHeight);
      }
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

  // TODO: сделать условия чтобы в крайних точках оффсет не выставлялся
  /**
   * Set certain scroll when forced offset
   */
  setEvenScrollToList(offset: number, height: number) {
    const parent = this.targetElem.parentElement;
    if (parent) {
      const scroll = parent.scrollTop;
      console.log('Реальный скролл', scroll);
      // TODO: делать правильные рассчеты из размера чанка
      const calc = offset + height;
      console.log('Примерный скролл', calc);
      // if (this.scrollTemp !== 0 && this.scrollTemp === calc) {
      //   console.warn('== Calc равен прерыдущему значению! ==');
      // } else {
      //   console.warn('== Calc не равен прерыдущему значению (все ок) ==');
      // }
      // this.scrollTemp = calc;
      this.isStopRender = true;
      parent.scrollTop = calc;
    }
  }

  // TODO: переработать приём elemNum
  createItem(elemData: object, elemNum: number): HTMLElement {
    return this.skeleton.createElement({
      data: elemData,
      dataIndex: elemNum + 1,
    });
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

    const templateFragment = document.createDocumentFragment();
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
      templateFragment.append(
        this.createItem(elemData, this.GLOBAL_ITEM_COUNTER)
      );
      this.GLOBAL_ITEM_COUNTER++;
    }

    this.targetElem.append(templateFragment);

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
  recalcSequence(sequence: number, startIndexOfLastPart: number) {
    let newSequence =
      sequence > startIndexOfLastPart ? startIndexOfLastPart : sequence;

    if (newSequence < 0) newSequence = 0;

    return newSequence;
  }

  resetAllList(
    chunk: ChunkController,
    startRenderIndex: number,
    chunkAmount: number,
    list: ListController,
    direction: IScrollDirection,
    isAllowRenderNearBorder: boolean
  ): void {
    console.log('=====RESET LIST=====', startRenderIndex);
    const calculatedSequence = startRenderIndex - chunkAmount;

    const sequenceNumber = this.recalcSequence(
      calculatedSequence,
      list.startIndexOfLastPart
    );

    const templateFragment = document.createDocumentFragment();
    for (let i = 0; i < 1000 && i < list.existingSizeInDOM; i++) {
      // add items
      const elemNum = i + sequenceNumber;
      // console.log(elemNum);
      if (list.data === undefined) {
        throw new Error('Your list.data is undefined');
      }
      const elemData = list.data[elemNum];
      // console.log(elemData);
      templateFragment.append(this.createItem(elemData, elemNum));
    }

    const newOffset = sequenceNumber * list.itemHeight;

    this.targetElem.innerHTML = '';
    this.targetElem.append(templateFragment);
    console.log('before setOffset', startRenderIndex, newOffset);
    this.setOffsetToList(
      chunk,
      startRenderIndex,
      list,
      direction,
      newOffset,
      isAllowRenderNearBorder
    );

    // TODO: убрать после тестов
    const allTime = this.avrTimeArr.reduce((acc, el) => acc + el);
    // console.log('среднее время рендера:', allTime / this.avrTimeArr.length);

    // this.isWaitRender = false;
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
      direction === 'down' && i + sequenceNumber >= listLength;

    // console.log(i + sequenceNumber, listLength);
    // TODO: протестировать эту часть и понять зачем она на самом деле нужна
    // const isAllowToChange = !isReachTopLimit && !isReachBottomLimit;
    const isAllowToChange = !isReachBottomLimit;

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
  ): DocumentFragment {
    const templateFragment = document.createDocumentFragment();

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
        // console.log('elemNum', elemNum);
        const elemData = data[elemNum];
        templateFragment.append(this.createItem(elemData, elemNum));
        // remove items
        this.removeItem(childPosition);
      }
    }

    return templateFragment;
  }

  putElementsToList(
    direction: IScrollDirection,
    htmlFragment: DocumentFragment
  ) {
    if (direction === 'down') {
      this.targetElem.append(htmlFragment);
    } else {
      this.targetElem.prepend(htmlFragment);
    }
  }

  // TODO: Доделать это №3
  changeItemsInList(
    chunk: ChunkPropsToModifyDom,
    list: ListPropsToModifyDom,
    direction: IScrollDirection,
    isGoingFromBottom: boolean
  ): void {
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

  /**
   * Change list in DOM, change offset of list
   */
  modifyCurrentDOM(
    chunk: ChunkPropsToModifyDom,
    list: ListPropsToModifyDom,
    direction: IScrollDirection,
    isGoingFromBottom: boolean
  ): void {
    // TODO: Доделать это №4
    this.changeItemsInList(chunk, list, direction, isGoingFromBottom);
    this.setOffsetToList(chunk, chunk.startRenderIndex, list, direction);

    checkChildrenAmount(
      this.targetElem.childNodes.length,
      list.existingSizeInDOM
    );
  }
}
