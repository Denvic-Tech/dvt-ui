import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Close as CloseIcon } from '@mui/icons-material';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import {
  Box,
  CircularProgress,
  Dialog,
  Menu,
  Stack,
  Tooltip,
} from '@mui/material';

import { useAlert } from '@/app/notifications';

import {
  buildRetryPayload,
  buildRetrySettings,
  DEFAULT_RETRY_SETTINGS,
  isRetrySettingsValid,
  type RetrySettingsFormData,
} from '@/widgets/profile/schedule-panel/model/retrySettings';
import { CronBuilder } from '@/widgets/profile/schedule-panel/ui/CronBuilder';

import { normalizeRole, useCurrentUser } from '@/entities/user';

import {
  client,
  type ProjectReadSchema,
  type ProjectSchedulePatchRequest,
  type ProjectScheduleRequest,
  type ProjectScheduleResponse,
  type ProjectScheduleRunResponse,
  type TaskExecutionStatus,
} from '@/shared/gatewayClient';
import { isApiError } from '@/shared/lib/errors';
import { useConfirmDialog } from '@/shared/ui/confirm-dialog';
import { SingleOptionDropdownSelect } from '@/shared/ui/select/SingleOptionDropdownSelect';

import * as S from './styles';

type ScheduleEntry = ProjectScheduleResponse;
type ScheduleFormData = ProjectScheduleRequest;
type SchedulePatchData = ProjectSchedulePatchRequest;
type ProjectOption = Pick<ProjectReadSchema, 'id' | 'name' | 'user_email'>;
type RunStatus = 'SUCCESS' | 'FAILED' | 'RUNNING' | 'TERMINATED';
type HistoryRun = ProjectScheduleRunResponse & { historyStatus: RunStatus };
type RunGroup = {
  status: RunStatus;
  count: number;
  runs: HistoryRun[];
};
type LastRunInfo = {
  status: RunStatus;
  timestamp: string;
  startedAt: string | null;
  finishedAt: string | null;
};

const MAX_RUN_CIRCLES = 10;

const RETRY_BACKOFF_OPTIONS = [
  { value: 'fixed', label: 'Фиксированная' },
  { value: 'exponential', label: 'Экспоненциальная' },
];

type RetryFieldLabelProps = {
  children: React.ReactNode;
  htmlFor?: string;
  tooltip: string;
};

const RetryFieldLabel: React.FC<RetryFieldLabelProps> = ({
  children,
  htmlFor,
  tooltip,
}) => (
  <S.RetryFieldLabel htmlFor={htmlFor}>
    {children}
    <Tooltip title={tooltip} placement='top' arrow>
      <S.RetryHelpIcon
        tabIndex={0}
        aria-label={`Подсказка: ${String(children).toLowerCase()}`}
      >
        <HelpOutlineRoundedIcon sx={{ fontSize: 14 }} />
      </S.RetryHelpIcon>
    </Tooltip>
  </S.RetryFieldLabel>
);

const STATUS_CONFIG: Record<
  RunStatus,
  { bg: string; bgHover: string; label: string }
> = {
  SUCCESS: { bg: '#10b981', bgHover: '#059669', label: 'SUCCESS' },
  FAILED: { bg: '#ef4444', bgHover: '#dc2626', label: 'FAILED' },
  RUNNING: { bg: '#6366f1', bgHover: '#4f46e5', label: 'RUNNING' },
  TERMINATED: { bg: '#9ca3af', bgHover: '#6b7280', label: 'TERMINATED' },
};

const CalendarSvg: React.FC<{ active: boolean }> = ({ active }) => (
  <svg
    width='18'
    height='18'
    viewBox='0 0 18 18'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    style={{ color: active ? '#6366f1' : '#9ca3af' }}
  >
    <rect
      x='2'
      y='3'
      width='14'
      height='13'
      rx='2'
      stroke='currentColor'
      strokeWidth='1.3'
      fill='none'
    />
    <path d='M2 7h14' stroke='currentColor' strokeWidth='1.3' />
    <path
      d='M6 1v3M12 1v3'
      stroke='currentColor'
      strokeWidth='1.3'
      strokeLinecap='round'
    />
  </svg>
);

const ClockSvg: React.FC<{ active: boolean }> = ({ active }) => (
  <svg
    width='11'
    height='11'
    viewBox='0 0 12 12'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    style={{ color: active ? '#10b981' : '#9ca3af' }}
  >
    <circle
      cx='6'
      cy='6'
      r='5'
      stroke='currentColor'
      strokeWidth='1.2'
      fill='none'
    />
    <path
      d='M6 3v3.5l2 1.5'
      stroke='currentColor'
      strokeWidth='1.2'
      strokeLinecap='round'
    />
  </svg>
);

const EditSvg = () => (
  <svg
    width='15'
    height='15'
    viewBox='0 0 16 16'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      d='M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z'
      stroke='#9ca3af'
      strokeWidth='1.3'
      strokeLinejoin='round'
      fill='none'
    />
  </svg>
);

const TrashSvg = () => (
  <svg
    width='15'
    height='15'
    viewBox='0 0 16 16'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      d='M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1'
      stroke='#9ca3af'
      strokeWidth='1.3'
      strokeLinecap='round'
    />
    <path
      d='M4 4l.5 9a1 1 0 001 1h5a1 1 0 001-1L12 4'
      stroke='#9ca3af'
      strokeWidth='1.3'
      fill='none'
    />
  </svg>
);

const PlusSvg = () => (
  <svg
    width='14'
    height='14'
    viewBox='0 0 14 14'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      d='M7 2v10M2 7h10'
      stroke='white'
      strokeWidth='2'
      strokeLinecap='round'
    />
  </svg>
);

const defaultFormData: ScheduleFormData = {
  project_id: '',
  cron: '0 0 * * *',
  mode: 'full',
  force_exec: false,
};

const buildSchedulePayload = (
  schedule: Pick<
    ScheduleEntry,
    'project_id' | 'cron' | 'mode' | 'force_exec' | 'next_run_time'
  >
): ScheduleFormData => ({
  project_id: schedule.project_id,
  cron: schedule.cron,
  mode: schedule.mode ?? 'full',
  force_exec: schedule.force_exec ?? false,
  ...(schedule.next_run_time ? { next_run_time: schedule.next_run_time } : {}),
});

const buildSchedulePatchPayload = (
  schedule: Pick<
    ScheduleEntry,
    'cron' | 'mode' | 'force_exec' | 'next_run_time' | 'disabled'
  >
): SchedulePatchData => ({
  cron: schedule.cron,
  mode: schedule.mode ?? 'full',
  force_exec: schedule.force_exec ?? false,
  disabled: schedule.disabled ?? false,
  ...(schedule.next_run_time ? { next_run_time: schedule.next_run_time } : {}),
});

const resolveEnabled = (schedule: ScheduleEntry) => !schedule.disabled;

const formatNextRun = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { date: value, time: '' };
  }

  const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const dateText = dateFormatter.format(date).replace(/\.$/, '');
  const normalizedDateText =
    dateText.length > 0
      ? `${dateText.charAt(0).toUpperCase()}${dateText.slice(1)}`
      : dateText;

  return {
    date: normalizedDateText,
    time: timeFormatter.format(date),
  };
};

const normalizeRunStatus = (
  status: TaskExecutionStatus | null | undefined
): RunStatus | null => {
  switch (status) {
    case 'SUCCESS':
      return 'SUCCESS';
    case 'ERROR':
      return 'FAILED';
    case 'CANCELLED':
    case 'CANCEL_REQUESTED':
      return 'TERMINATED';
    case 'QUEUED':
    case 'ASSIGNED':
    case 'PENDING':
    case 'STARTED':
    case 'RUNNING':
      return 'RUNNING';
    default:
      return null;
  }
};

const resolveRunTimestamp = (run: ProjectScheduleRunResponse): string =>
  run.started_at ?? run.queued_at;

const toTimestamp = (value: string | null | undefined): number => {
  if (!value) {
    return Number.NEGATIVE_INFINITY;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
};

const sortRunsNewestFirst = (
  runs: Array<ProjectScheduleRunResponse> | null | undefined
): HistoryRun[] =>
  [...(runs ?? [])]
    .sort(
      (left, right) =>
        toTimestamp(resolveRunTimestamp(right)) -
        toTimestamp(resolveRunTimestamp(left))
    )
    .reduce<HistoryRun[]>((acc, run) => {
      const historyStatus = normalizeRunStatus(run.status);
      if (!historyStatus) {
        return acc;
      }

      acc.push({ ...run, historyStatus });
      return acc;
    }, []);

const groupRuns = (runs: HistoryRun[]): RunGroup[] => {
  const groups: RunGroup[] = [];

  for (const run of runs) {
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && lastGroup.status === run.historyStatus) {
      lastGroup.count += 1;
      lastGroup.runs.push(run);
      continue;
    }

    groups.push({
      status: run.historyStatus,
      count: 1,
      runs: [run],
    });
  }

  return groups;
};

const getDisplayRunGroups = (
  runs: Array<ProjectScheduleRunResponse> | null | undefined
): RunGroup[] =>
  groupRuns(sortRunsNewestFirst(runs)).slice(0, MAX_RUN_CIRCLES).reverse();

const getLastRunInfo = (schedule: ScheduleEntry): LastRunInfo | null => {
  const latestRun = sortRunsNewestFirst(schedule.recent_runs)[0];

  if (latestRun) {
    return {
      status: latestRun.historyStatus,
      timestamp: resolveRunTimestamp(latestRun),
      startedAt: latestRun.started_at ?? latestRun.queued_at,
      finishedAt: latestRun.finished_at ?? null,
    };
  }

  const fallbackStatus = normalizeRunStatus(schedule.last_run_status);

  if (!fallbackStatus || !schedule.last_run_time) {
    return null;
  }

  return {
    status: fallbackStatus,
    timestamp: schedule.last_run_time,
    startedAt: null,
    finishedAt: null,
  };
};

const formatRelative = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);

  if (diffMin < 1) {
    return 'только что';
  }

  if (diffMin < 60) {
    return `${diffMin} мин назад`;
  }

  if (diffHr < 24) {
    return `${diffHr} ч назад`;
  }

  return date
    .toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
    .replace(',', '');
};

const formatDuration = (
  start: string | null | undefined,
  end: string | null | undefined,
  fallbackEndMs?: number
): string | null => {
  if (!start) {
    return null;
  }

  const startMs = new Date(start).getTime();
  if (Number.isNaN(startMs)) {
    return null;
  }

  const endMs =
    end == null
      ? fallbackEndMs
      : Number.isNaN(new Date(end).getTime())
        ? null
        : new Date(end).getTime();
  if (endMs == null) {
    return null;
  }

  const durationMs = endMs - startMs;
  if (durationMs < 0) {
    return null;
  }

  if (durationMs < 1000) {
    return `${durationMs}мс`;
  }

  if (durationMs < 60000) {
    return `${(durationMs / 1000).toFixed(1)}с`;
  }

  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);

  return `${minutes}м ${seconds}с`;
};

const formatRunDateTime = (value: string | null | undefined): string => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date
    .toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    .replace(',', '');
};

export const SchedulePanel: React.FC = () => {
  const { showAlert } = useAlert();
  const { confirm } = useConfirmDialog();
  const { user: currentUser } = useCurrentUser();
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [schedulerUnavailableMessage, setSchedulerUnavailableMessage] =
    useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ScheduleEntry | null>(null);
  const [projectMenuAnchor, setProjectMenuAnchor] =
    useState<HTMLElement | null>(null);
  const [projectMenuWidth, setProjectMenuWidth] = useState<
    number | undefined
  >();
  const [projectSearch, setProjectSearch] = useState('');
  const [pendingByProjectId, setPendingByProjectId] = useState<
    Record<string, boolean>
  >({});
  const [formData, setFormData] = useState<ScheduleFormData>(defaultFormData);
  const [retrySettings, setRetrySettings] = useState<RetrySettingsFormData>(
    DEFAULT_RETRY_SETTINGS
  );
  const [selectedRunGroup, setSelectedRunGroup] = useState<RunGroup | null>(
    null
  );
  const [selectedRunGroupOpenedAtMs, setSelectedRunGroupOpenedAtMs] = useState<
    number | null
  >(null);

  const currentUserRole = normalizeRole(currentUser?.role);
  const canShowProjectAuthor =
    currentUserRole === 'admin' || currentUserRole === 'superadmin';

  const projectNames = useMemo(
    () =>
      Object.fromEntries(
        projects.map(project => [project.id, project.name || project.id])
      ),
    [projects]
  );
  const filteredProjects = useMemo(() => {
    const normalizedQuery = projectSearch.trim().toLowerCase();

    if (!normalizedQuery) {
      return projects;
    }

    return projects.filter(project => {
      const name = (project.name || project.id).toLowerCase();
      const email = project.user_email?.toLowerCase() ?? '';
      const id = project.id.toLowerCase();

      return (
        name.includes(normalizedQuery) ||
        email.includes(normalizedQuery) ||
        id.includes(normalizedQuery)
      );
    });
  }, [projectSearch, projects]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setSchedulerUnavailableMessage(null);
    try {
      const projResp = await client.projects.get();
      const projectsList = (projResp as { data?: unknown })?.data ?? projResp;
      const validProjects = Array.isArray(projectsList) ? projectsList : [];
      setProjects(validProjects as ProjectOption[]);

      if (validProjects.length > 0) {
        try {
          const resp = await client.projects.scheduler.scheduled.get(
            {},
            {
              requestValidator: async data => data,
              silent: true,
            }
          );

          const taskData = (resp as { data?: unknown })?.data ?? resp;
          setSchedules(
            Array.isArray(taskData) ? (taskData as ScheduleEntry[]) : []
          );
        } catch (error) {
          setSchedules([]);

          if (isApiError(error) && error.payload.status === 503) {
            setSchedulerUnavailableMessage(
              error.payload.description ??
                'Сервис расписаний временно недоступен. Попробуйте позже.'
            );
          } else {
            throw error;
          }
        }
      } else {
        setSchedules([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleOpenDialog = (entry?: ScheduleEntry) => {
    if (!entry && schedulerUnavailableMessage) {
      return;
    }

    if (entry) {
      setEditingEntry(entry);
      setFormData(buildSchedulePayload(entry));
      setRetrySettings(buildRetrySettings(entry));
    } else {
      setEditingEntry(null);
      setFormData(defaultFormData);
      setRetrySettings(buildRetrySettings());
    }
    setDialogOpen(true);
  };

  const handleOpenProjectMenu = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (editingEntry) {
      return;
    }

    if (projectMenuAnchor) {
      handleCloseProjectMenu();
      return;
    }

    setProjectSearch('');
    setProjectMenuWidth(event.currentTarget.clientWidth);
    setProjectMenuAnchor(event.currentTarget);
  };

  const handleCloseProjectMenu = () => {
    setProjectMenuAnchor(null);
    setProjectSearch('');
  };

  const handleOpenRunGroup = (group: RunGroup) => {
    setSelectedRunGroup(group);
    setSelectedRunGroupOpenedAtMs(Date.now());
  };

  const handleCloseRunGroup = () => {
    setSelectedRunGroup(null);
    setSelectedRunGroupOpenedAtMs(null);
  };

  const handleSave = async () => {
    try {
      if (editingEntry) {
        await client.projects.scheduler.schedule
          .projectId(editingEntry.project_id)
          .patch({
            body: {
              ...buildSchedulePatchPayload(editingEntry),
              cron: formData.cron,
              mode: formData.mode ?? 'full',
              force_exec: formData.force_exec ?? false,
              ...buildRetryPayload(retrySettings),
            },
          });
      } else {
        await client.projects.scheduler.schedule.post({
          body: {
            ...formData,
            ...buildRetryPayload(retrySettings),
          },
        });
      }
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Ошибка при сохранении:', error);
      alert('Ошибка при сохранении');
    }
  };

  const handleDelete = async (projectId: string) => {
    const confirmed = await confirm({
      title: 'Удалить расписание?',
      message: 'Расписание будет удалено без возможности восстановления.',
      confirmLabel: 'Удалить',
      cancelLabel: 'Отмена',
      confirmColor: 'error',
    });
    if (!confirmed) return;

    try {
      await client.projects.scheduler.schedule.projectId(projectId).delete();
      setSchedules(prev =>
        prev.filter(schedule => schedule.project_id !== projectId)
      );
    } catch (error) {
      console.error('Ошибка при удалении:', error);
      alert('Ошибка при удалении');
    }
  };

  const handleToggle = useCallback(
    async (schedule: ScheduleEntry) => {
      const projectId = schedule.project_id;
      const currentlyEnabled = resolveEnabled(schedule);

      setPendingByProjectId(prev => ({ ...prev, [projectId]: true }));
      setSchedules(prev =>
        prev.map(item =>
          item.project_id === projectId
            ? { ...item, disabled: currentlyEnabled }
            : item
        )
      );

      try {
        await client.projects.scheduler.schedule.projectId(projectId).patch({
          body: {
            disabled: currentlyEnabled,
          },
        });
      } catch (error) {
        console.error('Failed to toggle schedule:', error);
        setSchedules(prev =>
          prev.map(item =>
            item.project_id === projectId
              ? { ...item, disabled: !currentlyEnabled }
              : item
          )
        );
        showAlert({
          type: 'error',
          title: 'Не удалось обновить расписание.',
          description: currentlyEnabled
            ? 'Выключение расписания завершилось ошибкой.'
            : 'Включение расписания завершилось ошибкой.',
        });
      } finally {
        setPendingByProjectId(prev => {
          const next = { ...prev };
          delete next[projectId];
          return next;
        });
      }
    },
    [showAlert]
  );

  return (
    <Box sx={{ width: '100%', height: '100%', minHeight: 0 }}>
      <S.Container>
        <S.Content>
          <S.PanelHeader>
            <S.PanelHeaderCopy>
              <S.PanelTitle>Активные расписания</S.PanelTitle>
              <S.PanelDescription>
                Управление расписаниями запуска проектов.
              </S.PanelDescription>
            </S.PanelHeaderCopy>
            <S.CreateActionButton
              onClick={() => handleOpenDialog()}
              disabled={Boolean(schedulerUnavailableMessage)}
            >
              <PlusSvg />
              <span>Создать запуск</span>
            </S.CreateActionButton>
          </S.PanelHeader>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress size={24} sx={{ color: S.colors.indigo500 }} />
            </Box>
          ) : (
            <S.ScheduleList>
              {schedulerUnavailableMessage ? (
                <S.SchedulerWarning>
                  <S.SchedulerWarningTitle>
                    Сервис расписаний недоступен
                  </S.SchedulerWarningTitle>
                  <S.SchedulerWarningText>
                    {schedulerUnavailableMessage}
                  </S.SchedulerWarningText>
                </S.SchedulerWarning>
              ) : null}
              {schedules.length === 0 ? (
                <Box
                  sx={{ textAlign: 'center', py: 8, color: S.colors.gray400 }}
                >
                  <p style={{ fontSize: '13px', margin: 0 }}>
                    {schedulerUnavailableMessage
                      ? 'Пока невозможно загрузить список расписаний.'
                      : 'Нет активных запланированных задач'}
                  </p>
                </Box>
              ) : (
                schedules.map(schedule => {
                  const enabled = resolveEnabled(schedule);
                  const nextRun = formatNextRun(schedule.next_run_time);
                  const isPending =
                    pendingByProjectId[schedule.project_id] === true;
                  const runGroups = getDisplayRunGroups(schedule.recent_runs);
                  const lastRunInfo = getLastRunInfo(schedule);
                  const lastRunDuration =
                    lastRunInfo && lastRunInfo.finishedAt
                      ? formatDuration(
                          lastRunInfo.startedAt,
                          lastRunInfo.finishedAt
                        )
                      : null;

                  return (
                    <S.ScheduleCard
                      key={`${schedule.project_id}-${schedule.cron}`}
                      disabled={!enabled}
                    >
                      <S.ScheduleTopRow>
                        <S.CalendarIconBox active={enabled}>
                          <CalendarSvg active={enabled} />
                        </S.CalendarIconBox>

                        <S.InfoBlock>
                          <S.NameRow>
                            <S.ScheduleName
                              title={projectNames[schedule.project_id]}
                            >
                              {projectNames[schedule.project_id] ||
                                schedule.project_id}
                            </S.ScheduleName>
                            <S.ModePill>{schedule.mode ?? 'full'}</S.ModePill>
                          </S.NameRow>

                          <S.MetaRow>
                            <S.CronText>{schedule.cron}</S.CronText>
                            <S.InlineDivider />
                            <S.NextRunText active={enabled && !!nextRun}>
                              <ClockSvg active={enabled && !!nextRun} />
                              {enabled ? (
                                nextRun ? (
                                  <S.NextRunValue>
                                    <span>{nextRun.date}</span>
                                    {nextRun.time ? (
                                      <span>{nextRun.time}</span>
                                    ) : null}
                                  </S.NextRunValue>
                                ) : (
                                  <span>Не рассчитано</span>
                                )
                              ) : (
                                <span>Отключено</span>
                              )}
                            </S.NextRunText>
                            {schedule.force_exec ? (
                              <S.Badge variant='warning'>FORCE</S.Badge>
                            ) : null}
                          </S.MetaRow>
                        </S.InfoBlock>

                        <S.ActionsGroup>
                          <S.ToggleTrack
                            type='button'
                            enabled={enabled}
                            aria-label={
                              enabled
                                ? 'Выключить расписание'
                                : 'Включить расписание'
                            }
                            aria-pressed={enabled}
                            onClick={() => void handleToggle(schedule)}
                            style={{
                              opacity: isPending ? 0.5 : 1,
                              pointerEvents: isPending ? 'none' : 'auto',
                            }}
                          >
                            <S.ToggleThumb enabled={enabled} />
                          </S.ToggleTrack>

                          <S.ActionsDivider />

                          <S.ActionsRow>
                            <Tooltip title='Редактировать'>
                              <S.ScheduleActionButton
                                type='button'
                                onClick={() => handleOpenDialog(schedule)}
                              >
                                <EditSvg />
                              </S.ScheduleActionButton>
                            </Tooltip>
                            <Tooltip title='Удалить'>
                              <S.ScheduleActionButton
                                type='button'
                                danger
                                onClick={() =>
                                  handleDelete(schedule.project_id)
                                }
                              >
                                <TrashSvg />
                              </S.ScheduleActionButton>
                            </Tooltip>
                          </S.ActionsRow>
                        </S.ActionsGroup>
                      </S.ScheduleTopRow>

                      <S.ScheduleBottomRow>
                        <S.HistorySection>
                          <S.HistoryLabel>History</S.HistoryLabel>
                          <S.RunCirclesViewport>
                            <S.RunCirclesRow>
                              {runGroups.map((group, index) => {
                                const statusConfig =
                                  STATUS_CONFIG[group.status];

                                return (
                                  <S.RunCircleButton
                                    key={`${schedule.project_id}-${group.status}-${index}`}
                                    type='button'
                                    statusColor={statusConfig.bg}
                                    statusColorHover={statusConfig.bgHover}
                                    isRunning={group.status === 'RUNNING'}
                                    title={`${statusConfig.label}${
                                      group.count > 1 ? ` × ${group.count}` : ''
                                    }`}
                                    aria-label={`Run details: ${statusConfig.label}${
                                      group.count > 1 ? ` × ${group.count}` : ''
                                    }`}
                                    onClick={event => {
                                      event.stopPropagation();
                                      handleOpenRunGroup(group);
                                    }}
                                  >
                                    {group.count > 1 ? group.count : ''}
                                  </S.RunCircleButton>
                                );
                              })}
                            </S.RunCirclesRow>
                          </S.RunCirclesViewport>
                        </S.HistorySection>

                        {lastRunInfo ? (
                          <S.LastRunInfoBlock>
                            <S.StatusDot
                              statusColor={STATUS_CONFIG[lastRunInfo.status].bg}
                            />
                            <span>last run</span>
                            <S.LastRunSeparator>·</S.LastRunSeparator>
                            <span>{formatRelative(lastRunInfo.timestamp)}</span>
                            {lastRunDuration ? (
                              <>
                                <S.LastRunSeparator>·</S.LastRunSeparator>
                                <S.LastRunDuration>
                                  {lastRunDuration}
                                </S.LastRunDuration>
                              </>
                            ) : null}
                          </S.LastRunInfoBlock>
                        ) : (
                          <S.NoRunsHint>Запусков ещё не было</S.NoRunsHint>
                        )}
                      </S.ScheduleBottomRow>
                    </S.ScheduleCard>
                  );
                })
              )}
            </S.ScheduleList>
          )}
        </S.Content>
      </S.Container>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        PaperProps={{
          style: {
            borderRadius: 16,
            overflow: 'hidden',
            width: '100%',
            maxWidth: 500,
            maxHeight: 'calc(100vh - 32px)',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <S.Header>
          <S.HeaderTitle>
            {editingEntry ? 'Настройка' : 'Новый запуск'}
          </S.HeaderTitle>
          <S.IconButton onClick={() => setDialogOpen(false)}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </S.IconButton>
        </S.Header>
        <S.Content style={{ overflowY: 'auto', minHeight: 0 }}>
          <Stack spacing={2.5}>
            <Box>
              <S.Label>ПРОЕКТ</S.Label>
              <S.ProjectSelectButton
                type='button'
                disabled={!!editingEntry}
                onClick={handleOpenProjectMenu}
              >
                <S.ProjectSelectText placeholder={!formData.project_id}>
                  {formData.project_id
                    ? projectNames[formData.project_id] || formData.project_id
                    : 'Выберите проект...'}
                </S.ProjectSelectText>
                <S.ChevronIcon
                  open={Boolean(projectMenuAnchor)}
                  hidden={!!editingEntry}
                >
                  <svg
                    width='16'
                    height='16'
                    viewBox='0 0 16 16'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path
                      d='M4 6.5L8 10L12 6.5'
                      stroke='currentColor'
                      strokeWidth='1.6'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                </S.ChevronIcon>
              </S.ProjectSelectButton>
              <Menu
                anchorEl={projectMenuAnchor}
                open={Boolean(projectMenuAnchor)}
                onClose={handleCloseProjectMenu}
                variant='menu'
                disableAutoFocusItem
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                MenuListProps={{ disablePadding: true }}
                PaperProps={{
                  style: {
                    width: projectMenuWidth,
                    borderRadius: 12,
                    border: `1px solid ${S.colors.gray200}`,
                    boxShadow: '0 12px 32px rgba(15, 23, 42, 0.12)',
                    marginTop: 6,
                    overflow: 'hidden',
                    maxHeight: 340,
                  },
                }}
              >
                <S.ProjectMenuContent>
                  <S.ProjectSearchWrap>
                    <S.ProjectSearchInput
                      autoFocus={Boolean(projectMenuAnchor)}
                      type='text'
                      value={projectSearch}
                      placeholder='Поиск проекта...'
                      onChange={event => setProjectSearch(event.target.value)}
                      onKeyDown={event => event.stopPropagation()}
                    />
                  </S.ProjectSearchWrap>
                  <S.ProjectMenuScrollArea>
                    {filteredProjects.length > 0 ? (
                      filteredProjects.map(project => (
                        <S.ProjectMenuButton
                          key={project.id}
                          type='button'
                          selected={formData.project_id === project.id}
                          onClick={() => {
                            setFormData({
                              ...formData,
                              project_id: project.id,
                            });
                            handleCloseProjectMenu();
                          }}
                        >
                          <S.ProjectMenuLabel>
                            {project.name || project.id}
                          </S.ProjectMenuLabel>
                          {canShowProjectAuthor && project.user_email ? (
                            <S.ProjectAuthorBadge title={project.user_email}>
                              {project.user_email}
                            </S.ProjectAuthorBadge>
                          ) : null}
                        </S.ProjectMenuButton>
                      ))
                    ) : (
                      <S.ProjectMenuEmptyState>
                        Ничего не найдено
                      </S.ProjectMenuEmptyState>
                    )}
                  </S.ProjectMenuScrollArea>
                </S.ProjectMenuContent>
              </Menu>
            </Box>
            <S.RetrySection>
              <S.RetryToggleRow>
                <S.RetryToggleCopy>
                  <S.RetryToggleTitle>Повторять при ошибке</S.RetryToggleTitle>
                  <S.RetryToggleDescription>
                    Повторно запускать задачу после неудачного выполнения.
                  </S.RetryToggleDescription>
                </S.RetryToggleCopy>
                <S.ToggleTrack
                  type='button'
                  enabled={retrySettings.enabled}
                  aria-label='Повторять при ошибке'
                  aria-pressed={retrySettings.enabled}
                  onClick={() =>
                    setRetrySettings(current => ({
                      ...current,
                      enabled: !current.enabled,
                    }))
                  }
                >
                  <S.ToggleThumb enabled={retrySettings.enabled} />
                </S.ToggleTrack>
              </S.RetryToggleRow>

              {retrySettings.enabled ? (
                <S.RetrySettingsGrid>
                  <S.RetryField>
                    <RetryFieldLabel
                      htmlFor='schedule-max-retries'
                      tooltip='Сколько раз система повторит запуск после неудачного основного запуска.'
                    >
                      КОЛИЧЕСТВО ПОВТОРОВ
                    </RetryFieldLabel>
                    <S.Input
                      id='schedule-max-retries'
                      type='number'
                      min={1}
                      max={10}
                      step={1}
                      value={retrySettings.maxRetries}
                      onChange={event =>
                        setRetrySettings(current => ({
                          ...current,
                          maxRetries: event.target.value,
                        }))
                      }
                    />
                  </S.RetryField>

                  <S.RetryField>
                    <RetryFieldLabel
                      tooltip={
                        'Фиксированная задержка — одинаковая пауза перед ' +
                        'каждой повторной попыткой. Экспоненциальная — ' +
                        'пауза удваивается после каждой неудачной попытки.'
                      }
                    >
                      ТИП ЗАДЕРЖКИ
                    </RetryFieldLabel>
                    <SingleOptionDropdownSelect
                      ariaLabel='Тип задержки'
                      value={retrySettings.backoff}
                      options={RETRY_BACKOFF_OPTIONS}
                      popperMinWidth={0}
                      textFieldSx={{
                        height: 38,
                        minHeight: 38,
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: 13,
                      }}
                      onChange={backoff =>
                        setRetrySettings(current => ({
                          ...current,
                          backoff: backoff as 'fixed' | 'exponential',
                        }))
                      }
                    />
                  </S.RetryField>

                  <S.RetryField>
                    <RetryFieldLabel
                      htmlFor='schedule-retry-delay'
                      tooltip={
                        'Через сколько секунд выполнить первую повторную ' +
                        'попытку. При фиксированной задержке это время ' +
                        'используется для всех повторов.'
                      }
                    >
                      ЗАДЕРЖКА, СЕКУНДЫ
                    </RetryFieldLabel>
                    <S.Input
                      id='schedule-retry-delay'
                      type='number'
                      min={1}
                      max={86400}
                      step={1}
                      value={retrySettings.delaySeconds}
                      onChange={event =>
                        setRetrySettings(current => ({
                          ...current,
                          delaySeconds: event.target.value,
                        }))
                      }
                    />
                  </S.RetryField>

                  {retrySettings.backoff === 'exponential' ? (
                    <S.RetryField>
                      <RetryFieldLabel
                        htmlFor='schedule-retry-max-delay'
                        tooltip='Максимальная пауза между повторными попытками при экспоненциальной задержке.'
                      >
                        МАКС. ЗАДЕРЖКА, СЕКУНДЫ
                      </RetryFieldLabel>
                      <S.Input
                        id='schedule-retry-max-delay'
                        type='number'
                        min={1}
                        max={86400}
                        step={1}
                        value={retrySettings.maxDelaySeconds}
                        onChange={event =>
                          setRetrySettings(current => ({
                            ...current,
                            maxDelaySeconds: event.target.value,
                          }))
                        }
                      />
                    </S.RetryField>
                  ) : null}
                </S.RetrySettingsGrid>
              ) : null}
            </S.RetrySection>
            <Box>
              <S.Label style={{ marginBottom: 8 }}>РАСПИСАНИЕ</S.Label>
              <CronBuilder
                value={formData.cron}
                onChange={newCron =>
                  setFormData({ ...formData, cron: newCron })
                }
              />
            </Box>
          </Stack>
        </S.Content>
        <S.Footer>
          <S.PrimaryButton
            onClick={handleSave}
            disabled={
              !formData.project_id || !isRetrySettingsValid(retrySettings)
            }
          >
            {editingEntry ? 'Сохранить изменения' : 'Создать'}
          </S.PrimaryButton>
        </S.Footer>
      </Dialog>

      <S.RunDetailsDialog
        open={selectedRunGroup !== null}
        onClose={handleCloseRunGroup}
        fullWidth
      >
        {selectedRunGroup ? (
          <>
            <S.RunDetailsHeader>
              <S.RunDetailsHeaderMeta>
                <S.RunDetailsStatusBadge
                  statusColor={STATUS_CONFIG[selectedRunGroup.status].bg}
                >
                  {STATUS_CONFIG[selectedRunGroup.status].label}
                </S.RunDetailsStatusBadge>
                {selectedRunGroup.count > 1 ? (
                  <S.RunDetailsCount>
                    × {selectedRunGroup.count} подряд
                  </S.RunDetailsCount>
                ) : null}
              </S.RunDetailsHeaderMeta>
              <S.IconButton
                type='button'
                aria-label='Close'
                onClick={handleCloseRunGroup}
              >
                <CloseIcon sx={{ fontSize: 18 }} />
              </S.IconButton>
            </S.RunDetailsHeader>

            <S.RunDetailsBody>
              {selectedRunGroup.runs.map(run => {
                const duration = formatDuration(
                  run.started_at ?? run.queued_at,
                  run.finished_at,
                  selectedRunGroupOpenedAtMs ?? undefined
                );

                return (
                  <S.RunCard key={run.task_id}>
                    <S.RunCardTopRow>
                      <S.RunTaskId title={run.task_id}>
                        {run.task_id}
                      </S.RunTaskId>
                      {duration ? (
                        <S.RunDuration>{duration}</S.RunDuration>
                      ) : null}
                    </S.RunCardTopRow>

                    <S.RunTimeGrid>
                      <S.RunTimeBlock>
                        <div className='label'>Started:</div>
                        <div className='value'>
                          {formatRunDateTime(run.started_at ?? run.queued_at)}
                        </div>
                      </S.RunTimeBlock>
                      <S.RunTimeBlock>
                        <div className='label'>Finished:</div>
                        <div className='value'>
                          {formatRunDateTime(run.finished_at)}
                        </div>
                      </S.RunTimeBlock>
                    </S.RunTimeGrid>

                    {run.historyStatus === 'FAILED' && run.message ? (
                      <S.RunErrorBlock>{run.message}</S.RunErrorBlock>
                    ) : null}

                    {run.historyStatus === 'TERMINATED' &&
                    run.termination_reason ? (
                      <S.RunReasonText>
                        Reason:{' '}
                        <span className='value'>{run.termination_reason}</span>
                      </S.RunReasonText>
                    ) : null}
                  </S.RunCard>
                );
              })}
            </S.RunDetailsBody>
          </>
        ) : null}
      </S.RunDetailsDialog>
    </Box>
  );
};
