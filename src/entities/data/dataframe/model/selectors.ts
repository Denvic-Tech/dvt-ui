import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '@/app/providers/store';

import type { DataFrameCacheEntry, DataFrameSliceState } from './slice.ts';

export const selectDataFrameState = (state: RootState): DataFrameSliceState =>
  state.dataframe;

const selectDataFrameEntries = (state: RootState) => state.dataframe.entries;

export const selectDataFrameEntryByKey = createSelector(
  [
    selectDataFrameEntries,
    (_: RootState, key: string | null | undefined) => key,
  ],
  (entries, key): DataFrameCacheEntry | undefined =>
    key ? entries[key] : undefined
);

export const selectDataFrameDataByKey = createSelector(
  [selectDataFrameEntryByKey],
  entry => entry?.data ?? null
);

export const selectDataFrameStatusByKey = createSelector(
  [selectDataFrameEntryByKey],
  entry => entry?.status ?? 'idle'
);

export const selectDataFrameErrorByKey = createSelector(
  [selectDataFrameEntryByKey],
  entry => entry?.error ?? null
);

export const selectDataFrameLastUpdatedAtByKey = createSelector(
  [selectDataFrameEntryByKey],
  entry => entry?.lastUpdatedAt ?? null
);
