import type {
  ProjectLastRunSchema,
  TaskExecutionStatus,
} from '@/shared/gatewayClient';

import type { HomeProject } from '../../model/types';

export type HomeRunTone = 'ok' | 'err' | 'warn' | 'run' | 'queue' | 'none';

export const RUN_TICKS_COUNT = 7;

export const getRunTone = (
  status: TaskExecutionStatus | null | undefined
): HomeRunTone => {
  switch (status) {
    case 'SUCCESS':
      return 'ok';
    case 'ERROR':
      return 'err';
    case 'CANCELLED':
    case 'CANCEL_REQUESTED':
      return 'warn';
    case 'RUNNING':
    case 'STARTED':
      return 'run';
    case 'QUEUED':
    case 'ASSIGNED':
    case 'PENDING':
      return 'queue';
    default:
      return 'none';
  }
};

const RUN_TONE_LABELS: Record<HomeRunTone, string> = {
  ok: 'успешно',
  err: 'ошибка',
  warn: 'отменён',
  run: 'выполняется',
  queue: 'в очереди',
  none: 'нет данных',
};

export const getRunToneLabel = (tone: HomeRunTone): string =>
  RUN_TONE_LABELS[tone];

/** Latest runs first, as returned by the backend. */
export const getRecentRuns = (project: HomeProject): ProjectLastRunSchema[] =>
  (project.last_runs ?? []).slice(0, RUN_TICKS_COUNT);

/** Oldest → newest, left-padded with `null` up to {@link RUN_TICKS_COUNT}. */
export const getRunTicks = (
  project: HomeProject
): (ProjectLastRunSchema | null)[] => {
  const runs = getRecentRuns(project).slice().reverse();
  const padding = Array.from<null>({
    length: Math.max(RUN_TICKS_COUNT - runs.length, 0),
  }).fill(null);

  return [...padding, ...runs];
};

export const isProjectRunning = (project: HomeProject): boolean =>
  getRunTone(project.last_runs?.[0]?.status) === 'run';

const toTime = (value: string | null | undefined): number | null => {
  if (!value) {
    return null;
  }

  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
};

export const getRunStartTime = (run: ProjectLastRunSchema): number | null =>
  toTime(run.started_at) ?? toTime(run.queued_at);

export const formatDuration = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));

  if (totalSeconds < 60) {
    return `${totalSeconds}с`;
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}ч ${String(minutes).padStart(2, '0')}м`;
  }

  return `${minutes}м ${String(seconds).padStart(2, '0')}с`;
};

export const getRunDuration = (
  run: ProjectLastRunSchema,
  now: number = Date.now()
): string | null => {
  const startedAt = toTime(run.started_at);

  if (startedAt == null) {
    return null;
  }

  const finishedAt = toTime(run.finished_at);

  if (finishedAt == null) {
    return getRunTone(run.status) === 'run'
      ? `идёт ${formatDuration(now - startedAt)}`
      : null;
  }

  return formatDuration(finishedAt - startedAt);
};

export const getRunErrorText = (run: ProjectLastRunSchema): string =>
  run.message?.trim() ||
  run.termination_reason?.trim() ||
  'Backend не вернул текст ошибки для этого запуска.';
