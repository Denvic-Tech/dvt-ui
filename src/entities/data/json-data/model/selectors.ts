import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '@/app/providers/store';

import type { JsonDataCacheEntry, JsonDataSliceState } from './slice.ts';

export const selectJsonDataState = (state: RootState): JsonDataSliceState =>
  state.jsonData;

const selectJsonDataEntries = (state: RootState) => state.jsonData.entries;

export const selectJsonDataEntryByKey = createSelector(
  [
    selectJsonDataEntries,
    (_: RootState, key: string | null | undefined) => key,
  ],
  (entries, key): JsonDataCacheEntry | undefined =>
    key ? entries[key] : undefined
);

export const selectJsonDataByKey = createSelector(
  [selectJsonDataEntryByKey],
  entry => entry?.data ?? null
);

export const selectJsonDataStatusByKey = createSelector(
  [selectJsonDataEntryByKey],
  entry => entry?.status ?? 'idle'
);

export const selectJsonDataErrorByKey = createSelector(
  [selectJsonDataEntryByKey],
  entry => entry?.error ?? null
);

export const selectJsonDataLastUpdatedAtByKey = createSelector(
  [selectJsonDataEntryByKey],
  entry => entry?.lastUpdatedAt ?? null
);
