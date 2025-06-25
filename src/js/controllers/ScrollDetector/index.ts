import { IScrollDirection } from '../../types/IScrollDirection';

export class ScrollDetector {
  public direction: IScrollDirection = 'down';

  public isGoingFromBottom = false;

  public maxScroll = 0;

  public lastPageMaxScroll = 0;

  // Предыдущая позиция скролла (нужна чтобы сравнивать с новой)
  public prevScroll = 0;

  constructor() {
    console.log('start ScrollDetector');
  }

  setScrollDirection(
    scroll: number,
    isPageChanged: boolean,
    isLastPage?: boolean
  ): void {
    if (scroll === this.prevScroll) return;

    if (!isPageChanged) {
      if (scroll > this.prevScroll) {
        this.direction = 'down';
      } else {
        this.direction = 'up';
      }
    }

    this.prevScroll = scroll;

    if (isLastPage && scroll >= this.lastPageMaxScroll) {
      console.warn('last page set direction');
      this.direction = 'down';
    }
  }

  setGoingFromBottom(
    firstOrderNumber: number,
    lastOrderNumber: number,
    chunkOrderNumber: number
  ): void {
    if (this.direction === 'down' && chunkOrderNumber <= firstOrderNumber) {
      this.isGoingFromBottom = false;
    } else if (
      this.direction === 'up' &&
      chunkOrderNumber >= lastOrderNumber - 1
    ) {
      this.isGoingFromBottom = true;
    }
  }

  isBigDiff(
    renderIndexDiff: number,
    chunkAmount: number,
    tailingElementsAmount: number
  ): boolean {
    const isBigDiff =
      (this.isGoingFromBottom &&
        renderIndexDiff > chunkAmount + tailingElementsAmount) ||
      (!this.isGoingFromBottom && renderIndexDiff > chunkAmount);
    return isBigDiff;
  }
}
