import { TemplateStringFunction } from '../../types/TemplateStringFunction';
import { elemFromString, trFromString } from '../../helpers/stringToDom';

export class Skeleton {
  // Содержит в себе хтмл-шаблон, в который мы положим данные из БД
  private readonly template;

  // TODO: 0 instead of undefined
  private listLength: number | undefined;

  private readonly makeItemFromString: (itemFromStrTpl: string) => HTMLElement;

  constructor(props: { template: TemplateStringFunction; listType: string }) {
    console.log('start Skeleton');
    this.template = props.template;
    this.makeItemFromString =
      props.listType !== 'table' ? elemFromString : trFromString;
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
    const itemLikeStrFromTpl = this.template(data, this.listLength, dataIndex);
    const itemHTML = this.makeItemFromString(itemLikeStrFromTpl);
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
    const itemLikeStrFromTpl = this.template(data, this.listLength, dataIndex);
    const itemHTML = this.makeItemFromString(itemLikeStrFromTpl);
    this.setRequiredAttrs({
      element: itemHTML,
      dataIndex,
    });
    return itemHTML;
  }
}
