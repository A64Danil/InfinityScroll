import { Rec } from '../../types/utils';

export class ListController {
  // Массив данных для превращения в хтмл-ссписок
  public data: Rec[];

  // Длина списка (на все страиницы)
  fullLength = 0;

  // Длина списка (на одну страницу)
  length = 0;

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

  // Стартовый индекс последней части списка
  public startIndexOfLastPart = 0;

  constructor() {
    console.log('Start List Controller', this);
    this.data = [];
  }

  getTotalListHeight(): number {
    const totalListHeight = this.itemHeight * this.length;
    return totalListHeight;
  }
}
