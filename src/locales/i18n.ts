export const i18n: Record<string, any> = {
  en: {
    error: {
      cantFetchData:
        'Failed to load data from server. Please check server availability or try again later',
      zeroHeight:
        'Your list height is less than 10px. You need to set your list-height from STYLES (by css) or pass like property in JS',
      elementNotExist: 'This element does not exist in DOM',
      undefinedProps: 'Some of props for RenderController is undefined',
      domManagerIsUndefined: 'Your DomManager is undefined',
      renderControllerIsUndefined:
        'RenderController (this.render) is not exist',
      dataIsUndefined: 'You does not have list.data',
      notValidUrl:
        'Your dataUrl is not a valid URL; or returned value is not a  valid URL',
      notArray: 'Your list does not have Array type',
      zeroListSize: 'Your list does not have length or length is 0',
      noTargetElem: 'You do not have HTML-element for your list',
      noDataUrl: 'You try to call getListDataLazy, but you dont have dataUrl',
      dataUrlNotAFn:
        'You try to call getListDataLazy, but your dataUrl is a string type',
      fetchedIsNotArray: 'Your fetched data does not have Array type',
    },
    message: {
      localMode:
        'Failed to load data from server. \nUsing previously saved data',
      tryLoadData: 'Try to load data again',
    },
  },
  ru: {
    error: {
      cantFetchData:
        'Не удалось загрузить данные с сервера. Проверьте доступность сервера или попробуйте позже',
      zeroHeight:
        'Высота вашего списка меньше чем 10px. Вам нужно установить высоту вашего списка из СТИЛЕЙ (через CSS) или передавать как свойство в JS',
      elementNotExist: 'Такого элемента не существует в DOM',
      undefinedProps: 'Некоторые свойства для RenderController не определены',
      domManagerIsUndefined: 'Ваш DomManager не определён',
      renderControllerIsUndefined:
        'RenderController (this.render) не существует',
      dataIsUndefined: 'У вас отсутствует list.data',
      notValidUrl:
        'Ваш dataUrl не является правильной URL-ссылкой или возвращает неправильную ссылку (исправьте dataUrl в свойствах при запуске InfinityScroll)',
      notArray:
        'Ваш список не является массивом (Array). Проверьте, что вы передаёте внутрь InfinityScroll',
      zeroListSize: 'Ваш список пуст или его размер равен 0',
      noTargetElem: 'Вы не указали HTML-элемент для вашего списка',
      noDataUrl:
        'Вы пытаетесь вызвать getListDataLazy, но у вас нет dataUrl (ссылки)',
      dataUrlNotAFn:
        'Вы пытаетесь вызвать getListDataLazy, но ваш dataUrl является строкой',
      fetchedIsNotArray: 'Ваши загруженные данные не являются Массивом (Array)',
    },
    message: {
      localMode:
        'Не удалось загрузить данные с сервера. \nИспользуются ранее сохранённые данные',
      tryLoadData: 'Попробовать загрузить данные ещё раз',
    },
  },
};
