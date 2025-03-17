// Virtual Scroll Bar
export class Vsb {
  // Содержит в себе хтмл-шаблон, в который мы положим данные из БД
  public readonly elem;

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

    this.safeLimit = 10000000;

    this.elem = document.createElement('div');
    this.elem.classList.add('vSrcollbar');

    this.elem.addEventListener('scroll', this.handleScroll.bind(this));

    // const totalHeight = this.listEl.offsetHeight;

    // this.middleWrapper.after(this.elem);
  }

  init({
    totalHeight,
    realHeight,
  }: {
    totalHeight: number;
    realHeight: number;
  }) {
    console.log('totalHeight', totalHeight);
    this.createFiller(realHeight);
    this.countTotalPages(totalHeight);
  }

  createFiller(realHeight: number) {
    const vsbFillerHTML = document.createElement('div');
    vsbFillerHTML.classList.add('vScrollbarFiller');
    vsbFillerHTML.style.height = `${realHeight}px`;

    this.fillerHeight = realHeight;

    this.elem.append(vsbFillerHTML);
  }

  countTotalPages(totalHeight: number) {
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

    this.totalPages = Math.round(totalHeight / this.safeLimit);
  }

  handleScroll(e) {
    const eventTarget = e.target as HTMLElement;
    const scroll = eventTarget.scrollTop;
    this.scroll = scroll;
    this.getPageByScroll();
  }

  setScroll(outerScroll: number) {
    this.scroll = outerScroll / this.totalPages;
    this.elem.scrollTop = this.scroll;
    this.getPageByScroll();
  }

  getPageByScroll() {
    // this.scroll

    // 0 - 1
    // 0.5 - 77
    // 1 - 153

    // console.log(this.fillerHeight, this.scroll);

    const percent = this.scroll / this.fillerHeight;
    // console.log('percent', percent);

    const currentPage = Math.floor(percent * this.totalPages + 1);

    console.log('currentPage', currentPage);
  }
}
