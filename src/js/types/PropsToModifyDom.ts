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
  data: object[] | undefined;
  startIndexOfLastPart: number;
  itemHeight: number;
};

export { ChunkPropsToModifyDom, ListPropsToModifyDom };
