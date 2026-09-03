export {
  errorJournalReducer,
  errorJournalSlice,
  ingest as ingestError,
  acknowledge as acknowledgeError,
  snooze as snoozeError,
  dismiss as dismissError,
  clear as clearErrorJournal,
} from './model/slice';

export type {
  ErrorJournalState,
  ErrorRecord,
  ErrorJournalSeverity,
  ErrorJournalStatus,
  ErrorJournalSource,
  IngestErrorActionPayload,
  AcknowledgeErrorPayload,
  SnoozeErrorPayload,
  DismissErrorPayload,
} from './model/types';

export * from './model/selectors';

export { errorListener, errorListenerMiddleware } from './model/listener';
