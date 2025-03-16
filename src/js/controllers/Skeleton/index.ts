import { TemplateStringFunction } from '../../types/TemplateStringFunction';
import {
  elemFromString,
  trFromString,
  setPlaceholder,
  setTdPlaceholder,
} from '../../helpers/domHelpers';

export class Skeleton {
  // Содержит в себе хтмл-шаблон, в который мы положим данные из БД
  private readonly template;

  private readonly templateCb: Record<string, (arg: any) => any> | undefined;

  // TODO: 0 instead of undefined
  private listLength: number | undefined;

  private readonly makeItemFromString: (itemFromStrTpl: string) => HTMLElement;

  private readonly setLoadingPlaceholder: (item: HTMLElement) => void;

  constructor(props: {
    template: TemplateStringFunction;
    templateCb: Record<string, (arg: any) => any> | undefined;
    listType: string;
  }) {
    console.log('start Skeleton');
    this.template = props.template;
    this.templateCb = props.templateCb;
    this.makeItemFromString =
      props.listType !== 'table' ? elemFromString : trFromString;
    this.setLoadingPlaceholder =
      props.listType !== 'table' ? setPlaceholder : setTdPlaceholder;
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
    const itemLikeStrFromTpl = this.template({
      item: data,
      listLength: this.listLength,
      idx: dataIndex,
      templateCb: this.templateCb,
    });
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
    const itemLikeStrFromTpl = this.template({
      item: data || {},
      listLength: this.listLength,
      idx: dataIndex,
      templateCb: this.templateCb,
    });
    const itemHTML = this.makeItemFromString(itemLikeStrFromTpl);
    if (!data) {
      this.setLoadingPlaceholder(itemHTML);
    }
    this.setRequiredAttrs({
      element: itemHTML,
      dataIndex,
    });
    return itemHTML;
  }
}
