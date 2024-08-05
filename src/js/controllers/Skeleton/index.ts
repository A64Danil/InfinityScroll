import { TemplateStringFunction } from '../../types/TemplateStringFunction';

export class Skeleton {
  // Размер чанка (чанк - видимая часть элементов в спике)

  // Содержит в себе хтмл-шаблон, в который мы положим данные из БД
  private readonly template;

  constructor(props: { template: TemplateStringFunction }) {
    console.log('start Skeleton');
    this.template = props.template;
  }

  updateElement(srcElem, data, dataIndex, listLength) {
    console.log('log from skeleton');
    const tempContainer = document.createElement('div');
    const itemFromStrTpl = this.template(data, listLength, dataIndex);
    tempContainer.innerHTML = itemFromStrTpl;
    const itemHTML = tempContainer.firstElementChild;
    console.log(itemHTML);
    // skeleton.insertAdjacentHTML('beforebegin', res);
    // skeleton.remove();
    srcElem.replaceWith(itemHTML);
  }
}
