import { IScrollDirection } from '../../types/IScrollDirection';

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

  // Amount of percents (from 100%) by last page
  sizeOfPercentByLastPage = 0;

  // Amount of pixels (from 100% of fillerHeight) by one page
  sizeOfScrollByOnePage: number;

  // Amount of pixels (from 100% of fillerHeight) by last page
  sizeOfScrollByLastPage = 0;

  // True is new page number is not like previous
  isPageChanged = false;

  isLastPage = false;

  // Ration of full and not_full pages to have good scroll length
  scrollRatio: number;

  // Callback to set height to offsetElement
  setHeight: (() => void) | undefined;

  constructor(isDebugMode: boolean, scrollTrigger: (e: Event) => void) {
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

    this.scrollRatio = 1;

    this.elem = document.createElement('div');
    this.elem.classList.add('vSrcollbar');
    if (isDebugMode) this.elem.classList.add('vSrcollbar_debugMode');

    this.elem.addEventListener('scroll', scrollTrigger);

    // const totalHeight = this.listEl.offsetHeight;

    // this.middleWrapper.after(this.elem);
  }

  init({
    totalHeight,
    realHeight,
    fullLength,
    listLength,
    lastPageLength,
    origScrollElem,
  }: {
    totalHeight: number;
    realHeight: number;
    fullLength: number;
    listLength: number;
    lastPageLength: number;
    origScrollElem: HTMLElement;
  }) {
    console.log('totalHeight', totalHeight);

    this.origScrollElem = origScrollElem;
    this.createFiller(realHeight);
    this.countTotalPages(fullLength, listLength, totalHeight);

    this.setScrollRatio(fullLength, listLength, lastPageLength);

    this.sizeOfPercentByOnePage = (1 / this.totalPages) * this.scrollRatio;

    this.sizeOfScrollByOnePage =
      (this.fillerHeight / this.totalPages) * this.scrollRatio;
  }

  createFiller(realHeight: number) {
    const vsbFillerHTML = document.createElement('div');
    vsbFillerHTML.classList.add('vScrollbarFiller');
    vsbFillerHTML.style.height = `${realHeight}px`;

    this.fillerHeight = realHeight - this.origScrollElem?.clientHeight;
    console.log(realHeight, this.origScrollElem?.clientHeight);
    // this.fillerHeight = realHeight;

    this.elem.append(vsbFillerHTML);
  }

  countTotalPages(fullLength: number, listLength: number, totalHeight: number) {
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

    let onePageSize = listLength;
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

  handleScroll() {
    this.scroll = this.elem.scrollTop;
    this.syncScrollState();
  }

  setScrollFromOuterSrc(outerScroll: number, direction: IScrollDirection) {
    const vsbPagedScroll =
      this.sizeOfScrollByOnePage * (this.currentPage - 1) +
      (outerScroll * this.scrollRatio) / this.totalPages;

    let needToChangePage = false;

    // TODO: размеры +1 и -1 в сравнении могут быть динамическими и использованы для плавного скролла
    if (
      direction === 'down' &&
      outerScroll >= this.fillerHeight &&
      this.currentPage < this.totalPages
    ) {
      console.log(
        'Достигли конца списка — можно перелистнуть ВПЕРЁД',
        outerScroll
      );
      needToChangePage = true;
      this.currentPage++;
    } else if (direction === 'up' && outerScroll <= 1 && this.currentPage > 1) {
      console.log('Достигли начала списка — можно перелистнуть НАЗАД');
      needToChangePage = true;
      this.currentPage--;
    }

    this.scroll = vsbPagedScroll;
    this.elem.scrollTop = this.scroll;
    this.isLastPage = this.currentPage === this.totalPages;

    if (needToChangePage) {
      this.setScrollPercent();
      this.isPageChanged = true;
      const isBackFromLastPage =
        direction === 'up' && this.currentPage === this.totalPages - 1;
      if (this.setHeight && isBackFromLastPage) {
        this.setHeight();
      }
      this.setScrollToOrigScrollElem(direction, needToChangePage);
    }
  }

  syncScrollState(direction?: IScrollDirection) {
    this.setScrollPercent();

    // console.log(this.scrollPercent);
    // console.log(this.currentPage);
    this.setCurrentPage();

    // console.log(this.currentPage);
    this.setScrollToOrigScrollElem(direction);
  }

  setCurrentPage() {
    const newCurrentPage = this.getPageByScroll();
    this.isPageChanged = this.currentPage !== newCurrentPage;
    this.currentPage = newCurrentPage;
    this.isLastPage = this.currentPage === this.totalPages;
  }

  setScrollToOrigScrollElem(
    direction?: IScrollDirection,
    forceChange?: boolean
  ) {
    // TODO: попробовать статические данные вместо динамики?
    // console.log('this.isPageChanged', this.isPageChanged);

    if (forceChange) {
      if (direction === 'down') {
        this.origScrollElem.scrollTop = 1;
      } else {
        this.origScrollElem.scrollTop = this.fillerHeight - 1;
      }
      return;
    }

    /* Процент на страницы которые мы уже проошли  */
    const percentByPreviousPages =
      (this.currentPage - 1) * this.sizeOfPercentByOnePage; // (5 - 1) * 0.2 == 0.8 (80%)
    /* Оставшийся процент после учёта проёденных */
    const remainingPercent = this.scrollPercent - percentByPreviousPages; // 93% - 80% == 13%
    /* Процент на текущую страницу */
    const percentOnCurrentPage = remainingPercent * this.totalPages;
    /* Оставшийся скролл для VSB */
    // const remainingScroll = this.safeLimit * percentOnCurrentPage; // 20 * 2 = 40
    const remainingScroll =
      (this.fillerHeight * percentOnCurrentPage) / this.scrollRatio; // 20 * 2 = 40
    // console.log('remainingScroll', remainingScroll);
    // console.log('this.origScrollElem.scrollTop', this.origScrollElem.scrollTop);
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

    // const delta = direction === 'down' ? 1 : 0;

    // 0.000007286922940556722 = 0.07680416779346785 / 10540
    // console.log(this.scroll, this.fillerHeight);

    const origPageNum =
      (this.scrollPercent * this.totalPages) / this.scrollRatio;
    // console.log('Orig page num', origPageNum);

    const currentPage = Math.ceil(origPageNum) || 1;
    return currentPage;
  }

  setScrollRatio(
    fullLength: number,
    listLength: number,
    lastPageLength: number
  ) {
    const completedPagesLength = listLength * this.totalPages;
    const incompletedPagesLength = fullLength;
    console.log(completedPagesLength, incompletedPagesLength);
    this.scrollRatio = completedPagesLength / incompletedPagesLength;
    console.log('set scroll ratio', this.scrollRatio);
  }
}
