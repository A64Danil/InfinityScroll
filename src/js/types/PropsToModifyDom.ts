import { Rec } from './utils';

type ChunkPropsToModifyDom = {
  startRenderIndex: number;
  amount: number;
  htmlHeight: number;
};

type ListPropsToModifyDom = {
  existingSizeInDOM: number;
  halfOfExistingSizeInDOM: number;
  tailingElementsAmount: number;
  length: number;
  data: Rec[] | undefined;
  startIndexOfLastPart: number;
  itemHeight: number;
};

export { ChunkPropsToModifyDom, ListPropsToModifyDom };
