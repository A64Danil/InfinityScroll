import { IScrollDirection } from '../../types/IScrollDirection';
import { ChunkController } from '../Chunk';

export class ScrollDetector {
  public direction: IScrollDirection = 'down';

  public isGoingFromBottom = false;

  // Предыдущая позиция скролла (нужна чтобы сравнивать с новой)
  public prevScroll = 0;

  constructor() {
    console.log('start ScrollDetector');
  }

  setScrollDirection(scroll: number): void {
    if (scroll > this.prevScroll) {
      this.direction = 'down';
    } else {
      this.direction = 'up';
    }
  }

  // TODO: говорит, нужен this
  // eslint-disable-next-line class-methods-use-this
  isSmallDiff(renderIndexDiff: number, tailingElementsAmount: number): boolean {
    if (renderIndexDiff !== 0 && renderIndexDiff <= tailingElementsAmount) {
      return true;
    }
    return false;
  }

  setGoingFromBottom(chunk: ChunkController, chunkOrderNumber: number): void {
    if (
      this.direction === 'down' &&
      chunkOrderNumber <= chunk.firstOrderNumber
    ) {
      this.isGoingFromBottom = false;
    } else if (
      this.direction === 'up' &&
      chunkOrderNumber >= chunk.lastOrderNumber - 1
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
