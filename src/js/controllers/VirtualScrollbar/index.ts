// Virtual Scroll Bar
export class Vsb {
  // Ссылка на html элемент со скроллом (виртуал скролл)
  public readonly elem;

  // Ссылка на элмент с оригинальным скроллом
  public origScrollElem: HTMLElement | undefined;

  // private readonly vsbFillerHTML;

  currentPage: number;

  // Коэффициент расчета индекса с учётом пагинации
  totalPages: number;

  fillerHeight: number;

  // private totalHeight: number;

  // Current scroll offset
  scroll: number;

  // Size of one page - height of list in PX
  safeLimit: number;

  constructor() {
    console.log('start VSB');

    this.currentPage = 1;
    this.totalPages = 1;

    this.fillerHeight = 1;
    // this.totalHeight = 1;

    this.scroll = 1;

    // this.safeLimit = 10000000;
    this.safeLimit = 11100;

    this.elem = document.createElement('div');
    this.elem.classList.add('vSrcollbar');

    this.elem.addEventListener('scroll', this.handleScroll.bind(this));

    // const totalHeight = this.listEl.offsetHeight;

    // this.middleWrapper.after(this.elem);
  }

  init({
    totalHeight,
    realHeight,
    listLength,
    itemHeight,
    origScrollElem,
  }: {
    totalHeight: number;
    realHeight: number;
    listLength: number;
    itemHeight: number;
    origScrollElem: HTMLElement;
  }) {
    console.log('totalHeight', totalHeight);

    this.origScrollElem = origScrollElem;
    this.createFiller(realHeight);
    this.countTotalPages(listLength, itemHeight, totalHeight);
    // this.splitDataByPages();
  }

  createFiller(realHeight: number) {
    const vsbFillerHTML = document.createElement('div');
    vsbFillerHTML.classList.add('vScrollbarFiller');
    vsbFillerHTML.style.height = `${realHeight}px`;

    this.fillerHeight = realHeight;

    this.elem.append(vsbFillerHTML);
  }

  countTotalPages(listLength: number, itemHeight: number, totalHeight: number) {
    // this.totalHeight = totalHeight;
    const formattedTotalListHeight = new Intl.NumberFormat('ru-RU').format(
      totalHeight
    );
    const standartLimit = new Intl.NumberFormat('ru-RU').format(33554400);
    const formattedSafeLimit = new Intl.NumberFormat('ru-RU').format(
      this.safeLimit
    );

    console.log('totalListHeight', formattedTotalListHeight);
    console.log(typeof formattedSafeLimit);
    console.log({ standartLimit, formattedSafeLimit });

    // TODO: this is a fake, don't belive it
    this.totalPages = Math.ceil(totalHeight / this.safeLimit);
    console.log('(fake) this.totalPages', this.totalPages);

    const onePageSize = Math.round(this.safeLimit / itemHeight);
    const lastPageSize = listLength % onePageSize;

    console.log('onePageSize', onePageSize);
    console.log('lastPageSize', lastPageSize);

    const additionalPageCounter = lastPageSize === 0 ? 0 : 1;

    const computedTotalPages =
      (listLength - lastPageSize) / onePageSize + additionalPageCounter;
    // 500 - 0 / 100 == 5 + 1 = 6
    // 420 - 20 / 100 == 4 + 1 =  5
    // 287 - 87 / 100 == 2 + 1 = 3
    console.log('computedTotalPages', computedTotalPages, this.totalPages);

    const controlCheck = computedTotalPages === this.totalPages;

    // 500 === 100 * 5 + 0
    // 500 === 100 * 5 - 0

    // 420 == 100 * 4 + 20
    // 480 == 100 * 5 - 20

    console.log('controlCheck', controlCheck);

    if (controlCheck) {
      console.log('Всё сходится');
    } else {
      console.warn('controlCheck не пройден!!!');
    }

    this.totalPages = computedTotalPages;

    return computedTotalPages;
  }

  handleScroll(e) {
    const eventTarget = e.target as HTMLElement;
    const scroll = eventTarget.scrollTop;
    console.log(scroll);
    this.scroll = scroll;
    this.getPageByScroll();
    console.log(this.safeLimit);
    console.log(this.origScrollElem);

    // 1 - 5% // 1
    // 19 - 95%
    // 20 - 100% // 1
    // 21 - 5% // 2
    // 40 - 100% // 2
    // 41 - 5% // 3

    // 20 / 1 = 20
    // 40 / 2 = 20
    // 60 / 3 = 20

    const fullScroll = scroll * this.totalPages; // 20 * 5 === 100
    const pagedOffsetScroll = this.safeLimit * (this.currentPage - 1);
    const remainingScroll = fullScroll - pagedOffsetScroll; // 20 * 2 = 40
    console.log(fullScroll, remainingScroll);
    this.origScrollElem.scrollTop = remainingScroll;
  }

  setScroll(outerScroll: number) {
    this.scroll = outerScroll / this.totalPages;
    this.elem.scrollTop = this.scroll;
    this.getPageByScroll();
  }

  getPageByScroll() {
    // this.scroll

    // 0 = 1
    // 0.01 = 1 === 0.01 * 5 = 0.05
    // 0.19 = 1 === 0.19 * 5 = 0.95
    // 0.20 = 2 === 0.2 * 5 = 1
    // 0.39 = 2
    // 0.4 = 3  === 0.4 * 5 = 2
    // 0.59 = 3
    // 0.6 = 4 --- 0.6 * 5 = 3
    // 0.79 = 4           3.95
    // 0.8 = 5 --- 0.8 * 5 = 4
    // 1 = 5 --- 1 * 5 = 5

    // console.log(this.fillerHeight, this.scroll);

    const percent = this.scroll / this.fillerHeight;
    // console.log('percent', percent);

    this.currentPage = Math.ceil(percent * this.totalPages) || 1;

    console.log('currentPage', this.currentPage);
  }
}
