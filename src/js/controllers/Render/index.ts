import { IScrollDirection } from '../../types/IScrollDirection';

export class RenderController {
  private readonly halfOfExistingSizeInDOM: number;

  private lastRenderIndex: number;

  private readonly lastPageLastRenderIndex: number;

  private listLength: number;

  private readonly chunkAmount: number;

  private tailingElementsAmount: number;

  constructor(renderProps: {
    halfOfExistingSizeInDOM: number;
    lastRenderIndex: number;
    lastPageLastRenderIndex: number;
    listLength: number;
    chunkAmount: number;
    tailingElementsAmount: number;
  }) {
    this.halfOfExistingSizeInDOM = renderProps.halfOfExistingSizeInDOM; // TODO: now - useless?
    this.lastRenderIndex = renderProps.lastRenderIndex;
    this.lastPageLastRenderIndex = renderProps.lastPageLastRenderIndex;
    this.listLength = renderProps.listLength;
    this.chunkAmount = renderProps.chunkAmount;
    this.tailingElementsAmount = renderProps.tailingElementsAmount;
    console.log(this);
  }

  reInitValues(
    lastRenderIndex: number,
    length: number,
    tailingElementsAmount: number
  ) {
    this.lastRenderIndex = lastRenderIndex;
    this.listLength = length;
    this.tailingElementsAmount = tailingElementsAmount;
  }

  // TODO: провести тесты, где startRenderIndex равен сравниваемым значениям - скорее всего надо писать "больше или равно"
  /**
   * Косаемся начала списка двигаясь сверху
   */
  isBeginOfListFromTop(startRenderIndex: number): boolean {
    return startRenderIndex <= this.chunkAmount;
  }

  /**
   * Косаемся конца списка двигаясь сверху
   */
  isEndOfListFromTop(startRenderIndex: number): boolean {
    return startRenderIndex > this.lastRenderIndex;
  }

  /**
   * Косаемся конца списка двигаясь сверху
   */
  isEndOfListLastPageFromTop(startRenderIndex: number): boolean {
    return startRenderIndex >= this.lastPageLastRenderIndex;
  }

  /**
   * Косаемся начала списка двигаясь снизу
   */
  // eslint-disable-next-line class-methods-use-this
  isBeginOfListFromBottom(startRenderIndex: number): boolean {
    return (
      // startRenderIndex === 0 || startRenderIndex < this.tailingElementsAmount;
      startRenderIndex === 0 || startRenderIndex < 0
    );
  }

  /**
   * Косаемся конца списка двигаясь снизу
   */
  isEndOfListFromBottom(startRenderIndex: number): boolean {
    return startRenderIndex >= this.listLength - this.chunkAmount * 3;
  }

  isAllowRenderNearBorder(
    direction: IScrollDirection,
    startRenderIndex: number,
    isLastPage: boolean
  ): boolean {
    if (direction === 'down' && this.isBeginOfListFromTop(startRenderIndex)) {
      console.log('Пока рендерить не надо. Вы в самом верху списка.');
      return false;
    }

    if (direction === 'down' && this.isEndOfListFromTop(startRenderIndex)) {
      console.log('УЖЕ рендерить не надо.  Вы в самом низу списка.');
      return false;
    }

    if (
      direction === 'down' &&
      isLastPage &&
      this.isEndOfListLastPageFromTop(startRenderIndex)
    ) {
      console.log(
        'УЖЕ рендерить не надо.  Вы в самом низу последней страницы списка.'
      );
      return false;
    }

    // if (
    //   direction === 'down' &&
    //   (this.isEndOfListFromTop(startRenderIndex) ||
    //     this.isBeginOfListFromTop(startRenderIndex))
    // ) {
    //   console.log('двигались вниз от самого верха, но рендерить не надо');
    //   return false;
    // }

    //
    // if (direction === 'up' && this.isBeginOfListFromBottom(startRenderIndex)) {
    //   console.log(
    //     'Пока рендерить не надо (up). Вы в самом низу списка. Это сообщение мы должны видеть 2 раза'
    //   );
    //   return false;
    // }

    // if (direction === 'up' && this.isEndOfListFromBottom(startRenderIndex)) {
    //   console.log('Уже рендерить не надо (up). Вы в самом верху списка.');
    //   return false;
    // }

    if (
      direction === 'up' &&
      (this.isBeginOfListFromBottom(startRenderIndex) ||
        this.isEndOfListFromBottom(startRenderIndex))
    ) {
      console.log('Двигались наверх от самого низа - пока рендерить не надо');
      return false;
    }

    return true;
  }
}
