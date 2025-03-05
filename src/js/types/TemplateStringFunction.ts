export type TemplateStringFunction = (
  element: { [key: string]: unknown },
  listLength?: number,
  elemNum?: number,
  templateCb?: Record<string, (arg: any) => any>
) => string;
