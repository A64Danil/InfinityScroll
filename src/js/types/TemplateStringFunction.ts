// TODO: превратить в дженерик для гибкости
export type TemplateStringFunction = (
  element: object,
  listLength?: number
) => string;
