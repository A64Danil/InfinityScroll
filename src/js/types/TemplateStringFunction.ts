// TODO: превратить в дженерик для гибкости
export type TemplateStringFunction = (
  element: { [key: string]: any },
  listLength?: number
) => string;
