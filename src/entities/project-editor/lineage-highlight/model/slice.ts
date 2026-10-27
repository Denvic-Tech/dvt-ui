import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface LineageHighlight {
  /** Ноды цепочки происхождения колонки на холсте. */
  nodeIDs: string[];
  /** Рёбра графа между нодами цепочки. */
  edgeIDs: string[];
  /** Колонка, чья цепочка подсвечена. */
  column: string;
  /** Нода, у которой смотрели колонку. */
  nodeName: string;
  /**
   * Растёт с каждым показом: холст по нему понимает, что цепочку нужно
   * заново вписать во вьюпорт, даже если набор нод не изменился.
   */
  requestID: number;
}

export interface LineageHighlightState {
  highlight: LineageHighlight | null;
  lastRequestID: number;
}

const initialState: LineageHighlightState = {
  highlight: null,
  lastRequestID: 0,
};

const lineageHighlightSlice = createSlice({
  name: 'lineageHighlight',
  initialState,
  reducers: {
    show(
      state,
      { payload }: PayloadAction<Omit<LineageHighlight, 'requestID'>>
    ) {
      state.lastRequestID += 1;
      state.highlight = { ...payload, requestID: state.lastRequestID };
    },
    clear(state) {
      state.highlight = null;
    },
  },
});

export const lineageHighlightActions = lineageHighlightSlice.actions;
export const lineageHighlightReducer = lineageHighlightSlice.reducer;
