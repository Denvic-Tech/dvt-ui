import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '@/app/providers/store';
import type { ErrorRecord, ErrorJournalState } from './types';

export const selectErrorJournalState = (
  state: RootState
): ErrorJournalState => state.errorJournal;

export const selectErrorJournalStats = createSelector(
  selectErrorJournalState,
  state => state.stats
);

export const selectErrorJournalRecords = createSelector(
  selectErrorJournalState,
  state => state.order.map(key => state.byId[key]).filter(Boolean)
);

export const selectErrorRecordByFingerprint = (
  state: RootState,
  fingerprint: string
): ErrorRecord | undefined => state.errorJournal.byId[fingerprint];

export const selectNewErrorCount = createSelector(
  selectErrorJournalStats,
  stats => stats.byStatus.new
);
