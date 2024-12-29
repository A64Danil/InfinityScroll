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
