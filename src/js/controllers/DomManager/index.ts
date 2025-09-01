import { ListController } from '../List';
import { ChunkController } from '../Chunk';
import { Skeleton } from '../Skeleton';
import { Vsb } from '../VirtualScrollbar';
import { IScrollDirection } from '../../types/IScrollDirection';
import {
  ChunkPropsToModifyDom,
  ListPropsToModifyDom,
} from '../../types/PropsToModifyDom';

import { Rec } from '../../types/utils';

import { checkChildrenAmount } from '../../helpers';

export class DomManager {
  readonly targetElem;

  // Общий счётчик элементов (создан для рекурсивной функции чтобы она не добавляла слишком много за раз)
  private GLOBAL_ITEM_COUNTER = 0;

  private readonly skeleton: Skeleton;

  offsetElem: HTMLElement | null;

  constructor(props: { skeleton: Skeleton; targetElem: HTMLElement }) {
    // this.data = props.data;
    this.skeleton = props.skeleton;
    this.targetElem = props.targetElem;
    this.offsetElem = null;
  }

  setHeightToList(list: ListPropsToModifyDom, vsb?: Vsb, offset = 0): void {
    let { length } = list;

    if (vsb && vsb.currentPage !== 1 && vsb.currentPage === vsb.totalPages) {
      length = list.lastPageLength;
    }

    const height = length * list.itemHeight - offset;
    this.targetElem.style.height = `${height}px`;
  }

  // eslint-disable-next-line class-methods-use-this
  calcStartOffsetIndex(
    startRenderIndex: number,
    chunkAmount: number,
    direction: IScrollDirection,
    list: ListController,
    vsb: Vsb
  ): number {
    let startOffsetIndex = startRenderIndex - chunkAmount;
    if (startOffsetIndex < 0) {
      startOffsetIndex = 0;
    }

    // if (direction === 'down') {
    if (
      vsb.currentPage === vsb.totalPages &&
      startOffsetIndex > list.lastPageStartIndexOfLastPart
    ) {
      // console.log('last page');
      startOffsetIndex = list.lastPageStartIndexOfLastPart;
    } else if (startOffsetIndex > list.startIndexOfLastPart) {
      startOffsetIndex = list.startIndexOfLastPart;
    }
    // }
    return startOffsetIndex;
  }

  /**
   * Set certain scroll to list (transform and padding)
   */
  setOffsetToList(
    chunk: ChunkPropsToModifyDom,
    startRenderIndex: number,
    list: ListController,
    direction: IScrollDirection,
    vsb: Vsb
  ): void {
    const startOffsetIndex = this.calcStartOffsetIndex(
      startRenderIndex,
      chunk.amount,
      direction,
      list,
      vsb
    );
    const offset = startOffsetIndex * list.itemHeight;
    // this.targetElem.style.transform = `translate(0,${offset}px)`;

    // if (startRenderIndex > 60) {
    // console.log('startOffsetIndex', startOffsetIndex);
    // // 98 - 78
    // // 100 - 76
    // console.log('startRenderIndex', startRenderIndex);
    // // 98 - 84
    // // 100 - 84
    // console.log('offset', offset);
    // 98 - offset 8658
    // 100 - offset 8436
    // }

    this.offsetElem.style.height = `${offset}px`;
    this.setHeightToList(list, vsb, offset);
  }

  createItem(elemData: Rec, elemNum: number): HTMLElement {
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
      i < list.length &&
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

  resetAllList(
    chunk: ChunkController,
    startRenderIndex: number,
    sequenceStart: number,
    list: ListController,
    direction: IScrollDirection,
    vsb: Vsb
    // isAllowRenderNearBorder: boolean
  ): void {
    const templateFragment = document.createDocumentFragment();
    let fillLimit = list.existingSizeInDOM;
    if (
      vsb.currentPage !== 1 &&
      vsb.currentPage === vsb.totalPages &&
      list.lastPageLength < list.existingSizeInDOM
    ) {
      fillLimit = list.lastPageLength;
    }
    for (let i = 0; i < 1000 && i < fillLimit; i++) {
      // add items
      // console.log('sequenceStart', sequenceStart);
      const elemNum = i + sequenceStart;
      // if (vsb.currentPage > 1) {
      //   elemNum = elemNum - ((chunk.amount * (vsb.currentPage - 1)));
      // }
      if (list.data === undefined) {
        throw new Error('Your list.data is undefined');
      }
      const elemData = list.data[elemNum];
      templateFragment.append(this.createItem(elemData, elemNum));
    }

    // const newOffset = sequenceStart * list.itemHeight;

    this.targetElem.innerHTML = '';
    this.targetElem.append(templateFragment);
    // console.log('before setOffset', startRenderIndex, newOffset);
    // console.log('this.targetElem.offsetHeight', this.targetElem.offsetHeight);
    this.setOffsetToList(
      chunk,
      startRenderIndex,
      list,
      direction,
      vsb
      // newOffset,
      // isAllowRenderNearBorder
    );
    // console.log('this.targetElem.offsetHeight', this.targetElem.offsetHeight);
  }

  // Это важная функция, без нее конец списка тупит
  // eslint-disable-next-line class-methods-use-this
  checkAllowToChangeList(
    direction: IScrollDirection,
    sequenceNumber: number,
    isGoingFromBottom: boolean,
    i: number,
    list: ListController,
    vsb: Vsb
  ): boolean {
    const currentPosition = i + sequenceNumber;

    const isReachTopLimit = this.checkTopLimit(
      direction,
      sequenceNumber,
      isGoingFromBottom,
      currentPosition,
      list,
      vsb
    );

    const isReachBottomLimit = this.checkBottomLimit(
      direction,
      currentPosition,
      list,
      vsb
    );

    const isAllowToChange = !isReachTopLimit && !isReachBottomLimit;

    if (process.env.NODE_ENV === 'development') {
      // for tests
      if (isReachBottomLimit) {
        console.warn('Выходим за пределы списка в его нижней части');
      } else if (isReachTopLimit) {
        console.warn('Выходим за пределы списка в его ВЕРХНЕЙ части');
      }
    }

    return isAllowToChange;
  }

  // eslint-disable-next-line class-methods-use-this
  private checkTopLimit(
    direction: IScrollDirection,
    sequenceNumber: number,
    isGoingFromBottom: boolean,
    currentPosition: number,
    list: ListController,
    vsb: Vsb
  ): boolean {
    const isStartOfList = direction === 'up' && sequenceNumber === 0;

    if (!isGoingFromBottom || !isStartOfList) {
      return false;
    }

    const tailingElementsAmount = vsb.isLastPage
      ? list.lastPageTailingElementsAmount
      : list.pageTailingElementsAmount;

    return (
      tailingElementsAmount !== 0 && currentPosition >= tailingElementsAmount
    );
  }

  // eslint-disable-next-line class-methods-use-this
  private checkBottomLimit(
    direction: IScrollDirection,
    currentPosition: number,
    list: ListController,
    vsb: Vsb
  ): boolean {
    if (direction !== 'down') {
      return false;
    }

    // Проверяем общий лимит списка
    if (currentPosition >= list.length) {
      return true;
    }

    // Проверяем лимит для последней страницы
    if (vsb.isLastPage && currentPosition >= list.lastPageLength) {
      console.log('last page case');
      return true;
    }

    return false;
  }

  prepareItems(
    chunkAmount: number,
    direction: IScrollDirection,
    sequenceNumber: number,
    isGoingFromBottom: boolean,
    list: ListController,
    // tailingElementsAmount: number,
    // listLength: number,
    // data: Rec[],
    vsb: Vsb,
    childPosition: 'firstChild' | 'lastChild',
    itemIndex: number
  ): DocumentFragment {
    const templateFragment = document.createDocumentFragment();

    for (let i = 0; i < 1000 && i < chunkAmount; i++) {
      const allowToChange = this.checkAllowToChangeList(
        direction,
        sequenceNumber,
        isGoingFromBottom,
        i,
        list,
        // tailingElementsAmount,
        // listLength
        vsb
      );

      if (allowToChange) {
        // add items
        const elemNum = i + itemIndex;
        const elemData = list.data[elemNum];
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

  changeItemsInList(
    chunk: ChunkPropsToModifyDom,
    list: ListController,
    direction: IScrollDirection,
    isGoingFromBottom: boolean,
    vsb: Vsb
  ): void {
    // for removeItems
    const childPosition = direction === 'down' ? 'firstChild' : 'lastChild';

    const sequenceNumber = this.calcSequenceByDirection(
      direction,
      list.halfOfExistingSizeInDOM,
      chunk.startRenderIndex,
      chunk.amount
    );
    const sequenceNumberByPage =
      (vsb.currentPage - 1) * list.length + sequenceNumber;

    // console.log(vsb.currentPage);
    // if (vsb.currentPage > 1) {
    //   sequenceNumberByPage = sequenceNumberByPage - (chunk.amount - 1);
    // }

    if (list.data === undefined) {
      throw new Error('Your list.data is undefined');
    }

    const templateFragments = this.prepareItems(
      chunk.amount,
      direction,
      sequenceNumber,
      isGoingFromBottom,
      list,
      // list.tailingElementsAmount,
      // list.length,
      // list.data,
      vsb,
      childPosition,
      sequenceNumberByPage
    );

    this.putElementsToList(direction, templateFragments);
  }

  /**
   * Change list in DOM, change offset of list
   */
  modifyCurrentDOM(
    chunk: ChunkPropsToModifyDom,
    list: ListController,
    direction: IScrollDirection,
    isGoingFromBottom: boolean,
    vsb: Vsb
  ): void {
    this.changeItemsInList(chunk, list, direction, isGoingFromBottom, vsb);
    this.setOffsetToList(chunk, chunk.startRenderIndex, list, direction, vsb);

    if (process.env.NODE_ENV === 'development') {
      checkChildrenAmount(
        this.targetElem.childNodes.length,
        list.existingSizeInDOM
      );
    }
  }
}
