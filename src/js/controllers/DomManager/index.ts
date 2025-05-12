import { ListController } from '../List';
import { ChunkController } from '../Chunk';
import { Skeleton } from '../Skeleton';
import { IScrollDirection } from '../../types/IScrollDirection';
import { TemplateStringFunction } from '../../types/TemplateStringFunction';
import {
  ChunkPropsToModifyDom,
  ListPropsToModifyDom,
} from '../../types/PropsToModifyDom';

import { Rec } from '../../types/utils';

import { checkChildrenAmount } from '../../helpers';

export class DomManager {
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

  private readonly skeleton: Skeleton;

  constructor(props: {
    skeleton: Skeleton;
    template: TemplateStringFunction;
    targetElem: HTMLElement;
  }) {
    // this.data = props.data;
    this.skeleton = props.skeleton;
    this.targetElem = props.targetElem;
    this.template = props.template;
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
    direction: IScrollDirection
  ): void {
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

  resetAllList(
    chunk: ChunkController,
    startRenderIndex: number,
    sequenceStart: number,
    list: ListController,
    direction: IScrollDirection
    // isAllowRenderNearBorder: boolean
  ): void {
    const templateFragment = document.createDocumentFragment();
    for (let i = 0; i < 1000 && i < list.existingSizeInDOM; i++) {
      // add items
      const elemNum = i + sequenceStart;
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
    this.setOffsetToList(
      chunk,
      startRenderIndex,
      list,
      direction
      // newOffset,
      // isAllowRenderNearBorder
    );
  }

  // Это важная функция, без нее конец списка тупит
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
      tailingElementsAmount !== 0 &&
      i + sequenceNumber >= tailingElementsAmount;

    const isReachBottomLimit =
      direction === 'down' && i + sequenceNumber >= listLength;

    // console.log(i + sequenceNumber, listLength);
    // Это нужно чтобы мы не риисовали лишние элементы в начале И в конце списка
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

  prepareItems(
    chunkAmount: number,
    direction: IScrollDirection,
    sequenceNumber: number,
    isGoingFromBottom: boolean,
    tailingElementsAmount: number,
    listLength: number,
    data: Rec[],
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
    this.changeItemsInList(chunk, list, direction, isGoingFromBottom);
    this.setOffsetToList(chunk, chunk.startRenderIndex, list, direction);

    if (process.env.NODE_ENV === 'development') {
      checkChildrenAmount(
        this.targetElem.childNodes.length,
        list.existingSizeInDOM
      );
    }
  }
}
