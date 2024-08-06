import { TemplateStringFunction } from '../../types/TemplateStringFunction';

export class Skeleton {
  // Содержит в себе хтмл-шаблон, в который мы положим данные из БД
  private readonly template;

  private listLength: number | undefined;

  constructor(props: { template: TemplateStringFunction }) {
    console.log('start Skeleton');
    this.template = props.template;
  }

  setListHeight(listLength: number) {
    this.listLength = listLength;
  }

  // eslint-disable-next-line class-methods-use-this
  setRequiredAttrs({ element, id, dataIndex }) {
    element.setAttribute('aria-setsize', this.listLength);
    element.setAttribute('aria-posinset', id);
    element.setAttribute('data-id', dataIndex);
  }

  updateElement(srcElem, data, dataIndex) {
    console.log('log from skeleton');
    const tempContainer = document.createElement('div');
    const itemFromStrTpl = this.template(data, this.listLength, dataIndex);
    tempContainer.innerHTML = itemFromStrTpl;
    const itemHTML = tempContainer.firstElementChild;
    this.setRequiredAttrs({
      element: itemHTML,
      id: data.id,
      dataIndex,
    });
    console.log(itemHTML);
    srcElem.replaceWith(itemHTML);
  }

  createElement({ data, dataIndex }): HTMLElement {
    console.log('create from skeleton');
    const tempContainer = document.createElement('div');
    const itemFromStrTpl = this.template(data, this.listLength, dataIndex);
    tempContainer.innerHTML = itemFromStrTpl;
    const itemHTML = tempContainer.firstElementChild as HTMLElement;
    this.setRequiredAttrs({
      element: itemHTML,
      id: data.id,
      dataIndex,
    });
    // console.log(itemHTML);
    return itemHTML;
  }
}
