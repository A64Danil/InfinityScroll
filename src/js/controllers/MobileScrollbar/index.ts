import { createElem } from '../../helpers/domHelpers';

export class MobileScrollbar {
  private srcElement!: HTMLElement;

  // Scrollbar wrapper
  private scrollBarWrp!: HTMLElement;

  // Scrollbar tracks
  private track!: HTMLElement;

  // Scrollbar thumb
  private thumb!: HTMLElement;

  private thumbHeight = 0;

  private dragStartY = 0;

  private dragStartScrollTop = 0;

  private isDragging = false;

  constructor(element: HTMLElement | string) {
    this.srcElement =
      typeof element === 'string'
        ? (document.querySelector(element) as HTMLElement)
        : element;
    if (!this.srcElement) throw new Error('Element not found');

    this.init();
  }

  init() {
    this.createWrapper();
    this.createScrollbar();
    this.addEventListeners();
    this.updateScrollbar();
  }

  createWrapper() {
    this.scrollBarWrp = createElem({
      className: 'mobileScrollbar-wrapper',
    });

    if (!this.srcElement.parentNode) {
      throw new Error('Element must be in the DOM and have a parent node');
    }
    // Оборачиваем оригинальный элемент
    this.srcElement.parentNode.insertBefore(this.scrollBarWrp, this.srcElement);
    this.scrollBarWrp.appendChild(this.srcElement);
    this.srcElement.className += ' mobileScrollbar-srcElem';
  }

  createScrollbar() {
    // Создаем трек скроллбара
    this.track = createElem({
      className: 'mobileScrollbar-track',
    });

    // Создаем ползунок
    this.thumb = createElem({
      className: 'mobileScrollbar-thumb',
    });

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
    this.thumbHeight = Math.max(
      (clientHeight / scrollHeight) * clientHeight,
      20
    );
    const thumbTop =
      (scrollTop / (scrollHeight - clientHeight)) *
      (clientHeight - this.thumbHeight);

    this.thumb.style.height = `${this.thumbHeight}px`;
    this.thumb.style.transform = `translateY(${thumbTop}px)`;
  }

  startDrag(e: Touch | MouseEvent) {
    this.isDragging = true;
    this.dragStartY = e.clientY || e.pageY;
    this.dragStartScrollTop = this.srcElement.scrollTop;

    document.body.style.userSelect = 'none';
  }

  onDrag(e: Touch | MouseEvent) {
    if (!this.isDragging) return;

    const deltaY = (e.clientY || e.pageY) - this.dragStartY;
    const { scrollHeight, clientHeight } = this.srcElement;

    // Вычисляем новую позицию скролла
    const scrollRatio = deltaY / (clientHeight - this.thumbHeight);
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
  }

  onTrackClick(e: MouseEvent) {
    if (e.target === this.thumb) return;

    const rect = this.track.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const { scrollHeight, clientHeight } = this.srcElement;

    // Вычисляем целевую позицию
    const targetRatio =
      (clickY - this.thumbHeight / 2) / (clientHeight - this.thumbHeight);
    const targetScrollTop = targetRatio * (scrollHeight - clientHeight);

    // Плавная прокрутка
    this.smoothScrollTo(
      Math.max(0, Math.min(scrollHeight - clientHeight, targetScrollTop))
    );
  }

  smoothScrollTo(target: number) {
    const start = this.srcElement.scrollTop;
    const distance = target - start;
    const duration = 300;
    let startTime: DOMHighResTimeStamp | null = null;

    const animate = (currentTime: DOMHighResTimeStamp) => {
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

  refresh() {
    this.updateScrollbar();
  }

  scrollTo(position: number) {
    this.srcElement.scrollTop = position;
  }

  scrollToTop() {
    this.smoothScrollTo(0);
  }

  scrollToBottom() {
    this.smoothScrollTo(this.srcElement.scrollHeight);
  }
}
