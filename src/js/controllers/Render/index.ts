import { IScrollDirection } from '../../types/IScrollDirection';

export class RenderController {
  private lastRenderIndex: number;

  private readonly lastPageLastRenderIndex: number;

  private listLength: number;

  private readonly listlastPageLength: number;

  private readonly chunkAmount: number;

  constructor(renderProps: {
    lastRenderIndex: number;
    lastPageLastRenderIndex: number;
    listLength: number;
    listlastPageLength: number;
    chunkAmount: number;
  }) {
    this.lastRenderIndex = renderProps.lastRenderIndex;
    this.lastPageLastRenderIndex = renderProps.lastPageLastRenderIndex;
    this.listLength = renderProps.listLength;
    this.listlastPageLength = renderProps.listlastPageLength;
    this.chunkAmount = renderProps.chunkAmount;
    console.log(this);
  }

  reInitValues(lastRenderIndex: number, length: number) {
    this.lastRenderIndex = lastRenderIndex;
    this.listLength = length;
  }

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
    return startRenderIndex >= this.lastRenderIndex;
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

  /**
   * Косаемся конца списка двигаясь снизу на последней странице
   */
  isEndOfListLastPageFromBottom(startRenderIndex: number): boolean {
    return startRenderIndex >= this.listlastPageLength - this.chunkAmount * 3;
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
        this.isEndOfListFromBottom(startRenderIndex) ||
        (isLastPage && this.isEndOfListLastPageFromBottom(startRenderIndex)))
    ) {
      console.log('Двигались наверх от самого низа - пока рендерить не надо');
      return false;
    }

    return true;
  }
}
