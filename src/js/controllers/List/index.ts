export class ListController {
  // Массив данных для превращения в хтмл-ссписок
  public data: object[] | undefined;

  // Длина списка
  length = 0;

  // Размер списка в ДОМ (вычисляется как "чанк * 4")
  existingSizeInDOM = 0;

  // Половина видимого размер списка
  halfOfExistingSizeInDOM = 0;

  wrapperHeight = 0;

  itemHeight = 0;

  // TODO: перенести в чанк?
  // Количество элементов в крайнем чанке
  tailingElementsAmount = 0;

  // Стартовый индекс последней части списка
  public startIndexOfLastPart = 0;

  constructor() {
    console.log('Start List Controller', this);
  }
}
