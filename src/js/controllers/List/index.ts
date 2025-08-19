import { Rec } from '../../types/utils';

export class ListController {
  // Массив данных для превращения в хтмл-ссписок
  public data: Rec[];

  // Длина списка (на все страиницы)
  public fullLength = 0;

  // Длина списка (на одну страницу)
  public length = 0;

  // Size of last page
  public lastPageLength = 0;

  // Размер списка в ДОМ (вычисляется как "чанк * 4")
  public existingSizeInDOM = 0;

  // Половина видимого размер списка
  public halfOfExistingSizeInDOM = 0;

  // Height of wrappet html-element
  public wrapperHeight = 0;

  // Height of one list item (in px)
  public itemHeight = 0;

  // Количество элементов в крайнем чанке
  public tailingElementsAmount = 0;

  // Количество элементов в крайнем чанке любой не последней страницы
  public pageTailingElementsAmount = 0;

  // Количество элементов в крайнем чанке на последней странице
  public lastPageTailingElementsAmount = 0;

  // Стартовый индекс последней части списка
  public startIndexOfLastPart = 0;

  // Стартовый индекс последней части списка
  public lastPageStartIndexOfLastPart = 0;

  constructor() {
    console.log('Start List Controller', this);
    this.data = [];
  }

  getTotalListHeight(): number {
    const totalListHeight = this.itemHeight * this.fullLength;
    return totalListHeight;
  }

  setExistingSizeInDOM(chunkAmount: number): void {
    this.existingSizeInDOM = Math.min(this.length, chunkAmount * 4);
  }
}
