export class CustomScrollbar {
  private srcElement!: HTMLElement;

  private options: {
    width: number;
    thumbColor: string;
    hoverThumbColor: string;
    trackColor: string;
    hideDelay: number;
    autoHide: boolean;
  };

  private isDragging: boolean;

  private dragStartY: number;

  private dragStartScrollTop: number;

  private hideTimer: ReturnType<typeof setTimeout> | null;

  // Scrollbar wrapper
  private scrollBarWrp!: HTMLElement;

  // Scrollbar tracks
  private track!: HTMLElement;

  // Scrollbar thumb
  private thumb!: HTMLElement;

  constructor(element: HTMLElement | string, options = {}) {
    this.srcElement =
      typeof element === 'string'
        ? (document.querySelector(element) as HTMLElement)
        : element;
    if (!this.srcElement) throw new Error('Element not found');

    this.options = {
      width: 8,
      thumbColor: '#888',
      hoverThumbColor: '#555',
      trackColor: '#f1f1f1',
      hideDelay: 1000,
      autoHide: true,
      ...options,
    };

    this.isDragging = false;
    this.dragStartY = 0;
    this.dragStartScrollTop = 0;
    this.hideTimer = null;

    this.init();
  }

  init() {
    this.createWrapper();
    this.createScrollbar();
    this.addEventListeners();
    this.updateScrollbar();
  }

  createWrapper() {
    // Создаем обертку
    this.scrollBarWrp = document.createElement('div');
    this.scrollBarWrp.className = 'iScrollBar-wrapper';
    // this.wrapper.style.cssText = `
    //   position: relative;
    //   overflow: hidden;
    //   height: 100%;
    //   width: 100%;
    // `;

    console.log(this.srcElement);
    console.log(this.srcElement.parentNode);
    if (!this.srcElement.parentNode) {
      throw new Error('Element must be in the DOM and have a parent node');
    }
    // Оборачиваем оригинальный элемент
    this.srcElement.parentNode.insertBefore(this.scrollBarWrp, this.srcElement);
    this.scrollBarWrp.appendChild(this.srcElement);

    // Скрываем нативный скроллбар
    // this.srcElement.style.cssText += `
    //   overflow-y: scroll;
    //   overflow-x: hidden;
    //   -webkit-overflow-scrolling: touch;
    //   scrollbar-width: none;
    //   -ms-overflow-style: none;
    //   padding-right: 17px;
    //   margin-right: -17px;
    // `;
    //
    // // Для webkit браузеров
    // const style = document.createElement('style');
    // style.textContent = `
    //   .iScrollBar-wrapper .iScrollBar-srcElem::-webkit-scrollbar {
    //     display: none;
    //   }
    // `;
    // document.head.appendChild(style);
    this.srcElement.className += ' iScrollBar-srcElem';
  }

  createScrollbar() {
    // Создаем трек скроллбара
    this.track = document.createElement('div');
    this.track.className = 'iScrollBar-track';
    this.track.style.cssText = `
      width: ${this.options.width}px;
      background: ${this.options.trackColor};
      border-radius: ${this.options.width / 2}px;
      opacity: ${this.options.autoHide ? '0' : '1'};
    `;

    // Создаем ползунок
    this.thumb = document.createElement('div');
    this.thumb.className = 'iScrollBar-thumb';
    this.thumb.style.cssText = `
      background: ${this.options.thumbColor};
      border-radius: ${this.options.width / 2}px;
    `;

    this.track.appendChild(this.thumb);
    this.scrollBarWrp.appendChild(this.track);
  }

  addEventListeners() {
    // Скролл контента
    this.srcElement.addEventListener('scroll', () => this.updateScrollbar());

    // Ресайз
    window.addEventListener('resize', () => this.updateScrollbar());

    // Mouse события для ползунка
    this.thumb.addEventListener('mousedown', (e) => this.startDrag(e));
    document.addEventListener('mousemove', (e) => this.onDrag(e));
    document.addEventListener('mouseup', () => this.endDrag());

    // Touch события для мобильных
    this.thumb.addEventListener('touchstart', (e) =>
      this.startDrag(e.touches[0])
    );
    document.addEventListener(
      'touchmove',
      (e) => {
        if (this.isDragging) {
          e.preventDefault();
          this.onDrag(e.touches[0]);
        }
      },
      { passive: false }
    );
    document.addEventListener('touchend', () => this.endDrag());

    // Клик по треку
    this.track.addEventListener('click', (e) => this.onTrackClick(e));

    // Показ/скрытие при наведении
    if (this.options.autoHide) {
      this.scrollBarWrp.addEventListener('mouseenter', () =>
        this.showScrollbar()
      );
      this.scrollBarWrp.addEventListener('mouseleave', () =>
        this.hideScrollbar()
      );
      this.srcElement.addEventListener('scroll', () => {
        this.showScrollbar();
        this.scheduleHide();
      });
    }

    // Hover эффект для ползунка
    this.thumb.addEventListener('mouseenter', () => {
      this.thumb.style.backgroundColor = this.options.hoverThumbColor;
    });
    this.thumb.addEventListener('mouseleave', () => {
      this.thumb.style.backgroundColor = this.options.thumbColor;
    });
  }

  updateScrollbar() {
    const { scrollTop, scrollHeight, clientHeight } = this.srcElement;

    // Показать/скрыть скроллбар в зависимости от необходимости
    if (scrollHeight <= clientHeight) {
      this.track.style.display = 'none';
      return;
    }
    this.track.style.display = 'block';

    // Вычисляем размер и позицию ползунка
    const thumbHeight = Math.max(
      (clientHeight / scrollHeight) * clientHeight,
      20
    );
    const thumbTop =
      (scrollTop / (scrollHeight - clientHeight)) *
      (clientHeight - thumbHeight);

    this.thumb.style.height = `${thumbHeight}px`;
    this.thumb.style.transform = `translateY(${thumbTop}px)`;
  }

  startDrag(e) {
    this.isDragging = true;
    this.dragStartY = e.clientY || e.pageY;
    this.dragStartScrollTop = this.srcElement.scrollTop;

    document.body.style.userSelect = 'none';
    this.thumb.style.backgroundColor = this.options.hoverThumbColor;
  }

  onDrag(e) {
    if (!this.isDragging) return;

    const deltaY = (e.clientY || e.pageY) - this.dragStartY;
    const { scrollHeight, clientHeight } = this.srcElement;
    const thumbHeight = parseFloat(this.thumb.style.height);

    // Вычисляем новую позицию скролла
    const scrollRatio = deltaY / (clientHeight - thumbHeight);
    const newScrollTop =
      this.dragStartScrollTop + scrollRatio * (scrollHeight - clientHeight);

    // Применяем ограничения
    this.srcElement.scrollTop = Math.max(
      0,
      Math.min(scrollHeight - clientHeight, newScrollTop)
    );
  }

  endDrag() {
    this.isDragging = false;
    document.body.style.userSelect = '';
    this.thumb.style.backgroundColor = this.options.thumbColor;
  }

  onTrackClick(e) {
    if (e.target === this.thumb) return;

    const rect = this.track.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const { scrollHeight, clientHeight } = this.srcElement;
    const thumbHeight = parseFloat(this.thumb.style.height);

    // Вычисляем целевую позицию
    const targetRatio =
      (clickY - thumbHeight / 2) / (clientHeight - thumbHeight);
    const targetScrollTop = targetRatio * (scrollHeight - clientHeight);

    // Плавная прокрутка
    this.smoothScrollTo(
      Math.max(0, Math.min(scrollHeight - clientHeight, targetScrollTop))
    );
  }

  smoothScrollTo(target) {
    const start = this.srcElement.scrollTop;
    const distance = target - start;
    const duration = 300;
    let startTime = null;

    const animate = (currentTime) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);

      // Easing function (easeOutCubic)
      const easeProgress = 1 - (1 - progress) ** 3;

      this.srcElement.scrollTop = start + distance * easeProgress;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  showScrollbar() {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
    this.track.style.opacity = '1';
  }

  hideScrollbar() {
    if (this.options.autoHide && !this.isDragging) {
      this.track.style.opacity = '0';
    }
  }

  scheduleHide() {
    if (!this.options.autoHide) return;

    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(
      () => this.hideScrollbar(),
      this.options.hideDelay
    );
  }

  refresh() {
    this.updateScrollbar();
  }

  scrollTo(position) {
    this.srcElement.scrollTop = position;
  }

  scrollToTop() {
    this.smoothScrollTo(0);
  }

  scrollToBottom() {
    this.smoothScrollTo(this.srcElement.scrollHeight);
  }
}
