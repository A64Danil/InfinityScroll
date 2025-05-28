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

  // Current scroll offset in percents
  scrollPercent: number;

  // Amount of percents (from 100%) by one page
  sizeOfPercentByOnePage: number;

  // Amount of pixels (from 100% of fillerHeight) by one page
  sizeOfScrollByOnePage: number;

  // True is new page number is not like previous
  isPageChanged: boolean;

  constructor(scrollTrigger: (e: Event) => void) {
    console.log('start VSB');

    this.currentPage = 1;
    this.totalPages = 1;

    this.fillerHeight = 1;
    // this.totalHeight = 1;

    this.scroll = 1;

    // this.safeLimit = 10000000;
    // this.safeLimit = 8000000;
    // this.safeLimit = 111000;
    this.safeLimit = 11100;
    // this.safeLimit = 10;

    this.scrollPercent = 0;

    this.sizeOfPercentByOnePage = 1;

    this.sizeOfScrollByOnePage = 1;

    this.isPageChanged = false;

    this.elem = document.createElement('div');
    this.elem.classList.add('vSrcollbar');

    this.elem.addEventListener('scroll', scrollTrigger);

    // const totalHeight = this.listEl.offsetHeight;

    // this.middleWrapper.after(this.elem);
  }

  init({
    totalHeight,
    realHeight,
    fullLength,
    itemHeight,
    origScrollElem,
  }: {
    totalHeight: number;
    realHeight: number;
    fullLength: number;
    itemHeight: number;
    origScrollElem: HTMLElement;
  }) {
    console.log('totalHeight', totalHeight);
    console.log('this.safeLimit', this.safeLimit, itemHeight);

    // TODO: temportary, for tests
    // this.safeLimit = itemHeight * 100;

    console.log('this.safeLimit', this.safeLimit, itemHeight);

    this.origScrollElem = origScrollElem;
    this.createFiller(realHeight);
    this.countTotalPages(fullLength, itemHeight, totalHeight);
    this.sizeOfPercentByOnePage = 1 / this.totalPages;
    this.sizeOfScrollByOnePage = Math.ceil(this.fillerHeight / this.totalPages);
  }

  createFiller(realHeight: number) {
    const vsbFillerHTML = document.createElement('div');
    vsbFillerHTML.classList.add('vScrollbarFiller');
    vsbFillerHTML.style.height = `${realHeight}px`;

    this.fillerHeight = realHeight - this.origScrollElem?.clientHeight;
    // this.fillerHeight = realHeight;

    this.elem.append(vsbFillerHTML);
  }

  countTotalPages(fullLength: number, itemHeight: number, totalHeight: number) {
    // this.totalHeight = totalHeight;
    const formattedTotalListHeight = new Intl.NumberFormat('ru-RU').format(
      totalHeight
    );
    const standartLimit = new Intl.NumberFormat('ru-RU').format(33554400);
    const formattedSafeLimit = new Intl.NumberFormat('ru-RU').format(
      this.safeLimit
    );

    console.log('totalListHeight', formattedTotalListHeight);
    console.log({ standartLimit, formattedSafeLimit });

    // TODO: this is a fake, don't belive it
    this.totalPages = Math.ceil(totalHeight / this.safeLimit);
    console.log('(fake) this.totalPages', this.totalPages);

    let onePageSize = Math.round(this.safeLimit / itemHeight);
    if (onePageSize > fullLength) {
      onePageSize = fullLength;
    }
    const lastPageSize = fullLength % onePageSize;

    console.log('onePageSize', onePageSize);
    console.log('lastPageSize', lastPageSize);

    const additionalPageCounter = lastPageSize === 0 ? 0 : 1;

    console.log(fullLength);
    const computedTotalPages =
      (fullLength - lastPageSize) / onePageSize + additionalPageCounter;
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

  handleScroll(isSyncing?: boolean) {
    const scroll = this.elem.scrollTop;
    this.scroll = scroll;
    this.setScrollPercent();
    this.setCurrentPage();

    // 1 - 5% // 1
    // 19 - 95%
    // 20 - 100% // 1
    // 21 - 5% // 2
    // 40 - 100% // 2
    // 41 - 5% // 3

    // 20 / 1 = 20
    // 40 / 2 = 20
    // 60 / 3 = 20
    if (isSyncing) {
      return;
    }
    this.setScrollToOrigScrollElem();
  }

  setScroll(outerScroll: number) {
    const vsbPagedScroll =
      this.sizeOfScrollByOnePage * (this.currentPage - 1) +
      outerScroll / this.totalPages;

    let delta = 0;

    if (outerScroll >= this.fillerHeight) {
      console.log('Достигли конца списка — можно перелистнуть ВПЕРЁД');
      delta = 2;
    } else if (outerScroll <= 1) {
      console.log('Достигли начала списка — можно перелистнуть НАЗАД');
      delta = -1;
    }

    this.scroll = vsbPagedScroll + delta;
    this.elem.scrollTop = this.scroll;

    if (delta !== 0) {
      this.setScrollPercent();
      this.setCurrentPage();
      this.setScrollToOrigScrollElem();
    }
  }

  setCurrentPage() {
    const newCurrentPage = this.getPageByScroll();
    this.isPageChanged = this.currentPage !== newCurrentPage;
    this.currentPage = newCurrentPage;
    console.log(this.currentPage);
  }

  setScrollToOrigScrollElem() {
    // TODO: тут надо учитывать что последняя страница может быть иного размера

    /* Процент на страницы которые мы уже проошли  */
    const percentByPreviousPages =
      (this.currentPage - 1) * this.sizeOfPercentByOnePage; // (5 - 1) * 0.2 == 0.8 (80%)
    /* Оставшийся процент после учёта проёденных */
    const remainingPercent = this.scrollPercent - percentByPreviousPages; // 93% - 80% == 13%
    /* Процент на текущую страницу */
    const percentOnCurrentPage = remainingPercent * this.totalPages;
    /* Оставшийся скролл для VSB */
    // const remainingScroll = this.safeLimit * percentOnCurrentPage; // 20 * 2 = 40
    const remainingScroll = this.fillerHeight * percentOnCurrentPage; // 20 * 2 = 40
    // console.log(remainingScroll);
    this.origScrollElem.scrollTop = remainingScroll;
  }

  setScrollPercent() {
    this.scrollPercent = this.scroll / this.fillerHeight;
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

    const currentPage = Math.ceil(this.scrollPercent * this.totalPages) || 1;
    return currentPage;
  }
}
