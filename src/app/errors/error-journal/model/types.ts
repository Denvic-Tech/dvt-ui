import type {
  ApiErrorPayload,
  ErrorEvent,
  ErrorEventContext,
  ErrorSeverity,
  ErrorSource,
} from '@/shared/lib/errors';

export type ErrorJournalSeverity = ErrorSeverity;

export type ErrorJournalStatus = 'new' | 'ack' | 'muted' | 'resolved';

export type ErrorJournalSource = ErrorSource;

export interface ErrorRecord {
  id: string;
  fingerprint: string;
  severity: ErrorJournalSeverity;
  source: ErrorJournalSource;
  message: string;
  payload: ApiErrorPayload;
  context?: ErrorEventContext;
  occurrences: number;
  firstOccurrenceAt: number;
  lastOccurrenceAt: number;
  lastNotifiedAt?: number;
  alertIds: string[];
  status: ErrorJournalStatus;
  snoozedUntil?: number | undefined;
  metadata?: Record<string, unknown>;
}

export interface ErrorJournalStats {
  total: number;
  bySeverity: Record<ErrorJournalSeverity, number>;
  byStatus: Record<ErrorJournalStatus, number>;
}

export interface ErrorJournalState {
  byId: Record<string, ErrorRecord>;
  order: string[];
  stats: ErrorJournalStats;
  lastShownAtByFingerprint: Record<string, number>;
}

export interface IngestErrorActionPayload {
  event: ErrorEvent;
}

export interface AcknowledgeErrorPayload {
  fingerprint: string;
}

export interface SnoozeErrorPayload {
  fingerprint: string;
  until: number;
}

export interface DismissErrorPayload {
  fingerprint: string;
}
