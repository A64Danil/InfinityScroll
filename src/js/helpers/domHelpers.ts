export function trFromString(itemLikeStr: string) {
  const tempContainer = document.createElement('table');
  tempContainer.innerHTML = `<tbody>${itemLikeStr}</tbody>`;
  const itemHTML = (tempContainer.firstElementChild as HTMLElement)
    .firstElementChild as HTMLElement;
  return itemHTML;
}

export function elemFromString(itemLikeStr: string) {
  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = itemLikeStr;
  const itemHTML = tempContainer.firstElementChild as HTMLElement;
  return itemHTML;
}

export function setPlaceholder(item: HTMLElement): void {
  item.classList.add('loading');
  // eslint-disable-next-line no-param-reassign
  item.innerHTML = item.innerHTML.replaceAll('undefined', 'Loading');
  // item.innerHTML = 'Loading<span class="dots">...</span>';
}

export function setTdPlaceholder(item: HTMLElement): void {
  item.classList.add('loading');
  // eslint-disable-next-line no-param-reassign
  item.innerHTML = '<td colspan="2">Loading<span class="dots">...</span></td>';
}

type ElemProps = {
  tagName?: string;
  className?: string[] | string;
  text?: string;
};

export function createElem({
  tagName = 'div',
  className,
  text,
}: ElemProps): HTMLElement {
  const element = document.createElement(tagName);

  if (Array.isArray(className)) {
    className.forEach((classNameItem) => {
      element.classList.add(classNameItem);
    });
  } else if (className) {
    element.classList.add(className);
  }

  if (text) element.textContent = text;
  return element;
}

export function addFadedClass(
  elem: HTMLElement,
  className: string,
  delay = 700
): void {
  elem.classList.add(className);
  setTimeout(() => {
    elem.classList.remove(className);
  }, delay);
}
