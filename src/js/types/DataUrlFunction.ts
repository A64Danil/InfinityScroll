export type DataUrlFunction = ({
  start,
  end,
  page,
  limit,
}: {
  start?: number;
  end?: number;
  page?: number;
  limit?: number;
}) => string;
