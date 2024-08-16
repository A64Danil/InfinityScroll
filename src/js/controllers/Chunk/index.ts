export class ChunkController {
  // Размер чанка (чанк - видимая часть элементов в спике)
  public amount = 2;

  public htmlHeight = 0;

  public firstOrderNumber = 0;

  // Порядковый номер последнего чанка в списке
  public lastOrderNumber = 1;

  // Номер, с которого начинается последний чанк
  public lastRenderIndex = 0;

  // Номер, c которого мы будем рендерить следующуй чанк
  public startRenderIndex = 0;

  constructor() {
    console.log('start ChunkController');
  }

  getOrderNumber(scroll: number): number {
    const chunkOrderNumber = Math.floor(scroll / this.htmlHeight);
    return chunkOrderNumber;
  }

  getRenderIndexDiff(newRenderIndex: number): number {
    return Math.abs(this.startRenderIndex - newRenderIndex);
  }

  calcRenderIndex(chunkOrderNumber: number): number {
    const renderIndex = chunkOrderNumber * this.amount;
    return renderIndex;
  }
}
