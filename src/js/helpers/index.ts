import { DataURLType } from '../types/DataURL';
import { DataUrlFunction } from '../types/DataUrlFunction';

export const checkChildrenAmount = (length: number, fullSize: number): void => {
  if (length !== fullSize) {
    console.error('%cКоличесвто деток: ', 'color: tomato', length);
  }
};

export function isPropsUndefined(obj: { [key: string]: unknown }): boolean {
  const keys = Object.keys(obj);
  return keys.some((key) => !obj[key] && obj[key] !== 0);
}

export function getRemoteData(url: string): Promise<[]> {
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

export function getRemoteDataByRange(
  dataUrl: DataUrlFunction,
  start = 0,
  end = 1
) {
  const fetchURL = dataUrl(start, end);
  return getRemoteData(fetchURL);
}

// TODO: значал проверяем, захватывается ли хвостовой индекс
export async function checkIncludeEnd(dataUrl: DataUrlFunction): boolean {
  const data = await getRemoteDataByRange(dataUrl, 1, 2);

  if (data.length === 2) {
    return true;
  }

  if (data.length === 1) {
    return false;
  }

  throw new Error("Can't define indlude end of range");
}

export async function checkBaseIndex(
  dataUrl: DataUrlFunction,
  includeEnd: boolean
): 0 | 1 {
  console.log();
  const endIndex = Number(!includeEnd);
  const nullBasedIndexes = [0, 0 + endIndex];
  const oneBasedIndexes = [1, 1 + endIndex];
  // console.log('nullBasedIndexes', nullBasedIndexes);
  // console.log('oneBasedIndexes', oneBasedIndexes);

  // if not include 0 - 1 and 1 - 2
  // if incldude 0 - 0 and 1 - 1

  const nullBased = await getRemoteDataByRange(dataUrl, 0, endIndex); // 0 - 1 || 0 - 0
  const oneBased = await getRemoteDataByRange(dataUrl, 1, 1 + endIndex); // 1 - 2 || 1 - 1

  if (nullBased.length === 1) {
    return 0;
  }
  if (oneBased.length === 1) {
    return 1;
  }

  throw new Error("Can't define base index");
}

// TODO: следующий шаг - переделать дефолтные параметры на основе того что приходит
export async function getListDataLazy(
  dataUrl: DataURLType,
  start = 0,
  end = 1
) {
  const fetchURL = typeof dataUrl !== 'string' ? dataUrl(start, end) : dataUrl;
  const fetchedData = await getRemoteData(fetchURL).then((data): object[] => {
    if (!Array.isArray(data)) {
      throw new Error('Your fetched data does not have Array type');
    }
    return data;
  });
  return fetchedData;
}

export function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function checkDataUrl(dataUrl: DataURLType): boolean[] {
  const isDataUrlString = typeof dataUrl === 'string' && isValidUrl(dataUrl);

  const isDataUrlReturnString =
    typeof dataUrl === 'function' && isValidUrl(dataUrl(1, 1));

  return [isDataUrlString, isDataUrlReturnString];
}

export async function getListLength(dataUrl: DataUrlFunction) {
  const CHECK_AMOUNT = 4;

  let isRightLimitFounded = false;
  let fetchIndex = 1;

  let leftIndex;
  let rightIndex;

  while (!isRightLimitFounded) {
    const start = fetchIndex;
    const end = fetchIndex + CHECK_AMOUNT;
    // eslint-disable-next-line no-await-in-loop
    const result = await getRemoteDataByRange(dataUrl, start, end);
    if (result.length > 0) {
      leftIndex = fetchIndex;
      fetchIndex *= 10;
    } else {
      isRightLimitFounded = true;
    }
  }

  rightIndex = fetchIndex;
  let isEndOfListFounded = false;
  let counter = 0;
  while (counter < 100 && !isEndOfListFounded) {
    const mid = Math.ceil((leftIndex + rightIndex) / 2);
    // eslint-disable-next-line no-await-in-loop
    const result = await getRemoteDataByRange(dataUrl, mid, mid + CHECK_AMOUNT);
    if (result.length > 0) {
      leftIndex = mid;
    } else {
      rightIndex = mid;
    }
    counter++;

    if (leftIndex + 1 === rightIndex) {
      isEndOfListFounded = true;
    }
  }

  return leftIndex;
}
