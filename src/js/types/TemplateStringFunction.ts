export type TemplateStringFunction = (
  element: { [key: string]: unknown },
  listLength?: number,
  elemNum?: number
) => string;
