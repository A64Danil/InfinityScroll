import { DataURLType } from '../types/DataURL';
import { DataUrlFunction } from '../types/DataUrlFunction';
import { Rec } from '../types/utils';

export const checkChildrenAmount = (length: number, fullSize: number): void => {
  // if (length !== fullSize) {
  //   console.error('%cКоличесвто деток: ', 'color: tomato', length);
  // }
};

export function isPropsUndefined(obj: { [key: string]: unknown }): boolean {
  const keys = Object.keys(obj);
  return keys.some((key) => !obj[key] && obj[key] !== 0);
}

export function getRemoteData(url: string): Promise<Rec[]> {
  return fetch(url).then((response) =>
    response
      .json()
      .then((data) => data)
      .catch((err) => {
        console.log(err);
      })
  );
  // .catch(() => []);
}

export function getRemoteDataByRange(
  dataUrl: DataUrlFunction,
  start = 0,
  end = 1,
  limit = end - start
) {
  const fetchURL = dataUrl({ start, end, limit });
  // console.log(fetchURL);
  return getRemoteData(fetchURL);
}

export async function checkIncludeEnd(
  dataUrl: DataUrlFunction,
  subDir?: string
): Promise<boolean> {
  const resp = await getRemoteDataByRange(dataUrl, 1, 2);

  const data = Array.isArray(resp) ? resp : subDir && resp[subDir];

  if (data?.length === 2) {
    return true;
  }

  if (data?.length === 1) {
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

  if (nullBasedData?.length === 1) {
    return 0;
  }
  if (oneBasedData?.length === 1) {
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

function isBoundaryFound(leftIndex: number, rightIndex: number): boolean {
  return leftIndex + 1 === rightIndex;
}

async function checkDataExists(data: any, subDir?: string): Promise<boolean> {
  const result = Array.isArray(data) ? data : subDir && data[subDir];
  return result && result.length > 0;
}

async function findRightBoundary(
  dataUrl: DataUrlFunction,
  subDir: string | undefined,
  checkAmount: number
): Promise<{ leftIndex: number; rightIndex: number }> {
  let fetchIndex = 1;
  let leftIndex = 0;

  while (true) {
    const start = fetchIndex;
    const end = fetchIndex + checkAmount;

    // eslint-disable-next-line no-await-in-loop
    const data = await getRemoteDataByRange(dataUrl, start, end);
    // eslint-disable-next-line no-await-in-loop
    const hasData = await checkDataExists(data, subDir);

    if (hasData) {
      leftIndex = fetchIndex;
      fetchIndex *= 10;
    } else {
      return { leftIndex, rightIndex: fetchIndex };
    }
  }
}

async function binarySearchExactLength(
  dataUrl: DataUrlFunction,
  subDir: string | undefined,
  initialLeft: number,
  initialRight: number,
  checkAmount: number,
  maxIterations: number
): Promise<number> {
  let leftIndex = initialLeft;
  let rightIndex = initialRight;
  let counter = 0;

  while (counter < maxIterations && !isBoundaryFound(leftIndex, rightIndex)) {
    console.log(leftIndex, rightIndex);

    const mid = Math.ceil((leftIndex + rightIndex) / 2);
    console.log(mid);

    // eslint-disable-next-line no-await-in-loop
    const data = await getRemoteDataByRange(dataUrl, mid, mid + checkAmount);
    // eslint-disable-next-line no-await-in-loop
    const hasData = await checkDataExists(data, subDir);

    if (hasData) {
      leftIndex = mid;
    } else {
      rightIndex = mid;
    }

    counter++;
  }

  return leftIndex;
}

export async function getListLength(
  dataUrl: DataUrlFunction,
  subDir?: string
): Promise<number> {
  const CHECK_AMOUNT = 4;
  const MAX_BINARY_SEARCH_ITERATIONS = 100;

  const rightBoundary = await findRightBoundary(dataUrl, subDir, CHECK_AMOUNT);
  const exactLength = await binarySearchExactLength(
    dataUrl,
    subDir,
    rightBoundary.leftIndex,
    rightBoundary.rightIndex,
    CHECK_AMOUNT,
    MAX_BINARY_SEARCH_ITERATIONS
  );

  return exactLength;
}

export const wait = (time = 0) =>
  new Promise<void>((resolve) => {
    setTimeout(() => resolve(), time);
  });
