import BigDataList from '../../mocks/bigList100.json'; // import mock data

console.log('TS file loaded');

const InfinityList: HTMLOListElement | null = document.querySelector<HTMLElement>(
  '#infinityScrollList'
);

const addDataToList = function (list): void {
  console.log('fn start here');
  if (!InfinityList) return;

  list.data.forEach((element) => {
    const template = `<li class="infinityScroll__listItem">${element.name} ${element.number}</li>`;
    // InfinityList?.append(template);
    InfinityList.innerHTML += template;
  });
};

console.log(InfinityList);

addDataToList(BigDataList);
