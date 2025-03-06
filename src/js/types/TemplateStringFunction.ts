export type TemplateStringFunction = (obj: {
  item: { [key: string]: unknown };
  listLength?: number;
  idx?: number;
  templateCb?: Record<string, (arg: any) => any>;
}) => string;
