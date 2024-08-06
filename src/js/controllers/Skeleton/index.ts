import { TemplateStringFunction } from '../../types/TemplateStringFunction';

export class Skeleton {
  // TODO: перенести сюда размер списка чтобы каждый раз нен передавать

  // Содержит в себе хтмл-шаблон, в который мы положим данные из БД
  private readonly template;

  constructor(props: { template: TemplateStringFunction }) {
    console.log('start Skeleton');
    this.template = props.template;
  }

  // eslint-disable-next-line class-methods-use-this
  setRequiredAttrs({ element, id, listLength, dataIndex }) {
    element.setAttribute('aria-setsize', listLength);
    element.setAttribute('aria-posinset', id);
    element.setAttribute('data-id', dataIndex);
  }

  updateElement(srcElem, data, dataIndex, listLength) {
    console.log('log from skeleton');
    const tempContainer = document.createElement('div');
    const itemFromStrTpl = this.template(data, listLength, dataIndex);
    tempContainer.innerHTML = itemFromStrTpl;
    const itemHTML = tempContainer.firstElementChild;
    this.setRequiredAttrs({
      element: itemHTML,
      id: data.id,
      listLength,
      dataIndex,
    });
    console.log(itemHTML);
    srcElem.replaceWith(itemHTML);
  }

  createElement({ data, dataIndex, listLength }) {
    console.log('create from skeleton');
    const tempContainer = document.createElement('div');
    const itemFromStrTpl = this.template(data, listLength, dataIndex);
    tempContainer.innerHTML = itemFromStrTpl;
    const itemHTML = tempContainer.firstElementChild;
    this.setRequiredAttrs({
      element: itemHTML,
      id: data.id,
      listLength,
      dataIndex,
    });
    console.log(itemHTML);
    return itemHTML;
  }
}
