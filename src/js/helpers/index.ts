export const checkChildrenAmount = (length: number, fullSize: number): void => {
  if (length !== fullSize) {
    console.error('%cКоличесвто деток: ', 'color: tomato', length);
  }
};

export function isPropsUndefined(obj: { [key: string]: unknown }): boolean {
  const keys = Object.keys(obj);
  return keys.some((key) => !obj[key]);
}

export function getRemoteData(url: URL): Promise<unknown> {
  console.log('try to get data from', url);

  return fetch(url).then((response) =>
    response
      .json()
      .then((data) => data)
      .catch((err) => {
        console.log(err);
      })
  );
}

export async function getListDataLazy(dataUrl, start = 0, end = 1) {
  const fetchURL = dataUrl(start, end);
  const fetchedData = await getRemoteData(fetchURL).then((data): object[] => {
    if (!Array.isArray(data)) {
      throw new Error('Your fetched data does not have Array type');
    }
    return data;
  });
  return fetchedData;
}
