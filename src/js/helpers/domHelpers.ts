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
  // item.innerHTML = 'Loading<span class="dots">...</span>';
}

export function setTdPlaceholder(item: HTMLElement): void {
  item.classList.add('loading');
  // eslint-disable-next-line no-param-reassign
  item.innerHTML = '<td colspan="2">Loading<span class="dots">...</span></td>';
}
