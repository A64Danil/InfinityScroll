import { IScrollDirection } from '../types/IScrollDirection';

export function calcSequenceByDirection(
  direction: IScrollDirection,
  halfOfExistingSizeInDOM: number,
  startRenderIndex: number,
  chunkAmount: number
) {
  let precalcSequence =
    direction === 'down'
      ? startRenderIndex + halfOfExistingSizeInDOM
      : startRenderIndex - chunkAmount;

  if (precalcSequence < 0) precalcSequence = 0;
  console.log('precalcSequence', precalcSequence);
  return precalcSequence;
}

export function recalcSequence(sequence: number, startIndexOfLastPart: number) {
  let newSequence =
    sequence > startIndexOfLastPart ? startIndexOfLastPart : sequence;

  if (newSequence < 0) newSequence = 0;

  return newSequence;
}
