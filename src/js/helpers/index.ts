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

export function getRemoteData(
  url: string
): Promise<[]> | Promise<Record<string, any>> {
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
  end = 1,
  limit = end - start
) {
  const fetchURL = dataUrl({ start, end, limit });
  console.log(fetchURL);
  return getRemoteData(fetchURL);
}

export async function checkIncludeEnd(
  dataUrl: DataUrlFunction,
  subDir?: string
): Promise<boolean> {
  const resp = await getRemoteDataByRange(dataUrl, 1, 2);

  const data = Array.isArray(resp) ? resp : subDir && resp[subDir];

  if (data.length === 2) {
    return true;
  }

  if (data.length === 1) {
    return false;
  }

  throw new Error("Can't define include end of range");
}

export async function checkBaseIndex(
  dataUrl: DataUrlFunction,
  includeEnd: boolean,
  subDir?: string
): Promise<0 | 1> {
  const endIndex = Number(!includeEnd);

  const nullBasedResp = await getRemoteDataByRange(dataUrl, 0, endIndex);
  const oneBasedResp = await getRemoteDataByRange(dataUrl, 1, 1 + endIndex); // 1 - 2 || 1 - 1

  const nullBasedData = Array.isArray(nullBasedResp)
    ? nullBasedResp
    : subDir && nullBasedResp[subDir];
  const oneBasedData = Array.isArray(oneBasedResp)
    ? oneBasedResp
    : subDir && oneBasedResp[subDir];

  if (nullBasedData.length === 1) {
    return 0;
  }
  if (oneBasedData.length === 1) {
    return 1;
  }

  throw new Error("Can't define base index");
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
    typeof dataUrl === 'function' && isValidUrl(dataUrl({ start: 1, end: 2 }));

  return [isDataUrlString, isDataUrlReturnString];
}

export async function getListLength(dataUrl: DataUrlFunction, subDir?: string) {
  const CHECK_AMOUNT = 4;

  let isRightLimitFounded = false;
  let fetchIndex = 1;

  let leftIndex = 0;
  let rightIndex;

  while (!isRightLimitFounded) {
    const start = fetchIndex;
    const end = fetchIndex + CHECK_AMOUNT;
    // eslint-disable-next-line no-await-in-loop
    const data = await getRemoteDataByRange(dataUrl, start, end);
    const result = Array.isArray(data) ? data : subDir && data[subDir];
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
    console.log(leftIndex, rightIndex);
    const mid = Math.ceil((leftIndex + rightIndex) / 2);
    console.log(mid);
    // eslint-disable-next-line no-await-in-loop
    const data = await getRemoteDataByRange(dataUrl, mid, mid + CHECK_AMOUNT);
    const result = Array.isArray(data) ? data : subDir && data[subDir];
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
