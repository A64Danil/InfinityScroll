import { TemplateStringFunction } from '../../types/TemplateStringFunction';

export class Skeleton {
  // Содержит в себе хтмл-шаблон, в который мы положим данные из БД
  private readonly template;

  // TODO: 0 instead of undefined
  private listLength: number | undefined;

  constructor(props: { template: TemplateStringFunction }) {
    console.log('start Skeleton');
    this.template = props.template;
  }

  // TODO: need to rename?
  setListHeight(listLength: number) {
    this.listLength = listLength;
  }

  // eslint-disable-next-line class-methods-use-this
  setRequiredAttrs({
    element,
    dataIndex,
  }: {
    element: HTMLElement;
    dataIndex: number;
  }) {
    element.setAttribute('aria-setsize', this.listLength.toString());
    element.setAttribute('aria-posinset', dataIndex.toString());
  }

  updateElement(
    srcElem: HTMLElement,
    data: Record<string, unknown>,
    dataIndex: number
  ) {
    const tempContainer = document.createElement('div');
    const itemFromStrTpl = this.template(data, this.listLength, dataIndex);
    tempContainer.innerHTML = itemFromStrTpl;
    const itemHTML = tempContainer.firstElementChild as HTMLElement;
    this.setRequiredAttrs({
      element: itemHTML,
      dataIndex,
    });
    srcElem.replaceWith(itemHTML);
  }

  createElement({
    data,
    dataIndex,
  }: {
    data: Record<string, unknown>;
    dataIndex: number;
  }): HTMLElement {
    const tempContainer = document.createElement('div');
    const itemFromStrTpl = this.template(data, this.listLength, dataIndex);
    tempContainer.innerHTML = itemFromStrTpl;
    const itemHTML = tempContainer.firstElementChild as HTMLElement;
    this.setRequiredAttrs({
      element: itemHTML,
      dataIndex,
    });
    return itemHTML;
  }
}
