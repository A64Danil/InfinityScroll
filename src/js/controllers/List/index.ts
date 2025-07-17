import { Rec } from '../../types/utils';

type ListState = {
  name?: string;
  tailingElementsAmount: number;
  length: number;
};

export class ListController {
  // Массив данных для превращения в хтмл-ссписок
  public data: Rec[];

  // Длина списка (на все страиницы)
  fullLength = 0;

  // Длина списка (на одну страницу)
  length = 0;

  // Size of last page
  lastPageLength = 0;

  // Размер списка в ДОМ (вычисляется как "чанк * 4")
  existingSizeInDOM = 0;

  // Половина видимого размер списка
  halfOfExistingSizeInDOM = 0;

  wrapperHeight = 0;

  // TODO: какая-то шляпа, почему размер айтама хранится в контрллере списка?
  itemHeight = 0;

  // TODO: перенести в чанк?
  // Количество элементов в крайнем чанке
  tailingElementsAmount = 0;

  // Количество элементов в крайнем чанке любой не последней страницы
  pageTailingElementsAmount = 0;

  // Количество элементов в крайнем чанке на последней странице
  lastPageTailingElementsAmount = 0;

  // НА БУДУЩЕЕ
  // State for usual pages
  // 0: ListState = {
  //   name: "page",
  //   tailingElementsAmount: 0,
  //   length: 0,
  // };
  //
  // // State only for last page
  // 1: ListState = {
  //   name: "lastPage",
  //   tailingElementsAmount: 0,
  //   length: 0,
  // };

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

  setState(isLastPage: boolean) {
    if (!isLastPage) {
      this.tailingElementsAmount = this.pageTailingElementsAmount;
    } else {
      this.tailingElementsAmount = this.lastPageTailingElementsAmount;
    }
  }
}
