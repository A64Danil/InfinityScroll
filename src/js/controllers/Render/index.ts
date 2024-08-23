import { IScrollDirection } from '../../types/IScrollDirection';

export class RenderController {
  private readonly halfOfExistingSizeInDOM: number;

  private readonly lastRenderIndex: number;

  private readonly listLength: number;

  private readonly chunkAmount: number;

  private readonly tailingElementsAmount: number;

  constructor(renderProps: {
    halfOfExistingSizeInDOM: number;
    lastRenderIndex: number;
    listLength: number;
    chunkAmount: number;
    tailingElementsAmount: number;
  }) {
    this.halfOfExistingSizeInDOM = renderProps.halfOfExistingSizeInDOM;
    this.lastRenderIndex = renderProps.lastRenderIndex;
    this.listLength = renderProps.listLength;
    this.chunkAmount = renderProps.chunkAmount;
    this.tailingElementsAmount = renderProps.tailingElementsAmount;
    console.log(this);
  }

  // TODO: провести тесты, где startRenderIndex равен сравниваемым значениям
  /**
   * Косаемся начала списка двигаясь сверху
   */
  isBeginOfListFromTop(startRenderIndex: number): boolean {
    return startRenderIndex < this.halfOfExistingSizeInDOM;
  }

  /**
   * Косаемся конца списка двигаясь сверху
   */
  isEndOfListFromTop(startRenderIndex: number): boolean {
    return startRenderIndex > this.lastRenderIndex;
  }

  /**
   * Косаемся начала списка двигаясь снизу
   */
  isBeginOfListFromBottom(startRenderIndex: number): boolean {
    return startRenderIndex >= this.listLength - this.chunkAmount * 3;
  }

  /**
   * Косаемся конца списка двигаясь снизу
   */
  isEndOfListFromBottom(startRenderIndex: number): boolean {
    return (
      startRenderIndex === 0 || startRenderIndex < this.tailingElementsAmount
    );
  }

  isAllowRenderNearBorder(
    direction: IScrollDirection,
    startRenderIndex: number
  ): boolean {
    if (direction === 'down' && this.isBeginOfListFromTop(startRenderIndex)) {
      console.log('Пока рендерить не надо. Вы в самом верху списка.');
      return false;
    }

    if (direction === 'down' && this.isEndOfListFromTop(startRenderIndex)) {
      console.log('УЖЕ рендерить не надо.  Вы в самом низу списка.');
      return false;
    }

    if (direction === 'up' && this.isBeginOfListFromBottom(startRenderIndex)) {
      console.log(
        'Пока рендерить не надо (up). Вы в самом низу списка. Это сообщение мы должны видеть 2 раза'
      );
      return false;
    }

    if (direction === 'up' && this.isEndOfListFromBottom(startRenderIndex)) {
      console.log('Уже рендерить не надо (up). Вы в самом верху списка.');
      return false;
    }

    return true;
  }
}
