import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { type ErrorEvent } from '@/shared/lib/errors';

import {
  type AcknowledgeErrorPayload,
  type DismissErrorPayload,
  type ErrorJournalSeverity,
  type ErrorJournalState,
  type ErrorJournalStatus,
  type ErrorRecord,
  type IngestErrorActionPayload,
  type SnoozeErrorPayload,
} from './types';

const makeInitialStats = () => ({
  total: 0,
  bySeverity: {
    critical: 0,
    error: 0,
    warning: 0,
    info: 0,
  } as Record<ErrorJournalSeverity, number>,
  byStatus: {
    new: 0,
    ack: 0,
    muted: 0,
    resolved: 0,
  } as Record<ErrorJournalStatus, number>,
});

const initialState: ErrorJournalState = {
  byId: {},
  order: [],
  stats: makeInitialStats(),
  lastShownAtByFingerprint: {},
};

const ensureUniqueOrder = (order: string[], fingerprint: string) => {
  const idx = order.indexOf(fingerprint);
  if (idx >= 0) {
    order.splice(idx, 1);
  }
  order.unshift(fingerprint);
};

const incrementSeverityStats = (
  state: ErrorJournalState,
  severity: ErrorJournalSeverity
) => {
  state.stats.total += 1;
  state.stats.bySeverity[severity] += 1;
};

const transitionSeverityStats = (
  state: ErrorJournalState,
  prev: ErrorJournalSeverity,
  next: ErrorJournalSeverity
) => {
  if (prev === next) return;
  state.stats.bySeverity[prev] = Math.max(0, state.stats.bySeverity[prev] - 1);
  state.stats.bySeverity[next] += 1;
};

const incrementStatusStats = (
  state: ErrorJournalState,
  status: ErrorJournalStatus
) => {
  state.stats.byStatus[status] += 1;
};

const transitionStatusStats = (
  state: ErrorJournalState,
  prev: ErrorJournalStatus,
  next: ErrorJournalStatus
) => {
  if (prev === next) return;
  state.stats.byStatus[prev] = Math.max(0, state.stats.byStatus[prev] - 1);
  state.stats.byStatus[next] += 1;
};

const toRecordFromEvent = (event: ErrorEvent): ErrorRecord => ({
  id: event.fingerprint,
  fingerprint: event.fingerprint,
  severity: event.severity,
  source: event.source,
  message: event.message,
  payload: event.payload,
  ...(event.context === undefined ? {} : { context: event.context }),
  occurrences: 1,
  firstOccurrenceAt: event.timestamp,
  lastOccurrenceAt: event.timestamp,
  ...(event.notify && event.timestamp
    ? { lastNotifiedAt: event.timestamp }
    : {}),
  alertIds: event.alertId ? [event.alertId] : [],
  status: 'new',
  ...(event.metadata === undefined ? {} : { metadata: event.metadata }),
});

export const errorJournalSlice = createSlice({
  name: 'errorJournal',
  initialState,
  reducers: {
    ingest: (state, action: PayloadAction<IngestErrorActionPayload>) => {
      const { event } = action.payload;
      const fingerprint = event.fingerprint;
      const existing = state.byId[fingerprint];

      if (!existing) {
        const record = toRecordFromEvent(event);
        state.byId[fingerprint] = record;
        ensureUniqueOrder(state.order, fingerprint);
        incrementSeverityStats(state, record.severity);
        incrementStatusStats(state, record.status);
        if (event.notify) {
          state.lastShownAtByFingerprint[fingerprint] = event.timestamp;
        }
        return;
      }

      const previousSeverity = existing.severity;
      const previousStatus = existing.status;

      existing.severity = event.severity;
      existing.message = event.message;
      existing.payload = event.payload;
      existing.context = {
        ...(existing.context ?? {}),
        ...(event.context ?? {}),
      };
      existing.metadata = {
        ...(existing.metadata ?? {}),
        ...(event.metadata ?? {}),
      };
      existing.occurrences += 1;
      existing.lastOccurrenceAt = event.timestamp;
      if (event.notify) {
        existing.lastNotifiedAt = event.timestamp;
        state.lastShownAtByFingerprint[fingerprint] = event.timestamp;
      }
      if (event.alertId) {
        if (!existing.alertIds.includes(event.alertId)) {
          existing.alertIds.unshift(event.alertId);
        }
      }

      const shouldResetStatus = existing.status !== 'muted';
      if (shouldResetStatus) {
        existing.status = 'new';
      }

      transitionSeverityStats(state, previousSeverity, existing.severity);
      if (shouldResetStatus) {
        transitionStatusStats(state, previousStatus, existing.status);
      }

      ensureUniqueOrder(state.order, fingerprint);
    },

    acknowledge: (state, action: PayloadAction<AcknowledgeErrorPayload>) => {
      const record = state.byId[action.payload.fingerprint];
      if (!record) return;
      const prevStatus = record.status;
      record.status = 'ack';
      transitionStatusStats(state, prevStatus, record.status);
    },

    snooze: (state, action: PayloadAction<SnoozeErrorPayload>) => {
      const record = state.byId[action.payload.fingerprint];
      if (!record) return;
      const prevStatus = record.status;
      record.status = 'muted';
      record.snoozedUntil = action.payload.until;
      transitionStatusStats(state, prevStatus, record.status);
    },

    dismiss: (state, action: PayloadAction<DismissErrorPayload>) => {
      const record = state.byId[action.payload.fingerprint];
      if (!record) return;
      const prevStatus = record.status;
      record.status = 'resolved';
      record.snoozedUntil = undefined;
      transitionStatusStats(state, prevStatus, record.status);
    },

    clear: state => {
      state.byId = {};
      state.order = [];
      state.lastShownAtByFingerprint = {};
      state.stats = makeInitialStats();
    },
  },
});

export const { ingest, acknowledge, snooze, dismiss, clear } =
  errorJournalSlice.actions;

export const errorJournalReducer = errorJournalSlice.reducer;
