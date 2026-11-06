import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import { Box, Divider, Menu, Stack, Tooltip } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { IconCalendarTime, IconPencil, IconPlus } from '@tabler/icons-react';

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
} from '@/shared/gatewayClient';
import { isApiError } from '@/shared/lib/errors';
import { useDelayedLoading } from '@/shared/lib/hooks/useDelayedLoading';
import { useConfirmDialog } from '@/shared/ui/confirm-dialog';
import {
  CancelButton,
  CreateButton,
} from '@/shared/ui/create-entity-dialog/styles';
import { PageLayout } from '@/shared/ui/page-layout';
import { SingleOptionDropdownSelect } from '@/shared/ui/select/SingleOptionDropdownSelect';
import { TokenDialog } from '@/shared/ui/token-form';
import {
  getTokenListBoxHeight,
  TokenListBox,
  TokenListCreateButton,
  TokenListEmptyLink,
  TokenListEmptyState,
  TokenListScroll,
} from '@/shared/ui/token-list';

import { ScheduleRow, ScheduleRowSkeleton } from './ScheduleRow';
import * as S from './styles';

type ScheduleEntry = ProjectScheduleResponse;
type ScheduleFormData = ProjectScheduleRequest;
type SchedulePatchData = ProjectSchedulePatchRequest;
type ProjectOption = Pick<ProjectReadSchema, 'id' | 'name' | 'user_email'>;

const SKELETON_ROWS = [
  { nameWidth: 180 },
  { nameWidth: 132 },
  { nameWidth: 216 },
  { nameWidth: 156 },
];

const RETRY_BACKOFF_OPTIONS = [
  { value: 'fixed', label: 'Фиксированная' },
  { value: 'exponential', label: 'Экспоненциальная' },
];

// Options use the same text as the select trigger.
const retryBackoffOptionTextSx: SxProps<Theme> = theme => ({
  fontFamily: theme.typography.fontFamily,
  fontSize: 13,
  fontWeight: 400,
  color: 'text.primary',
});

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

  // Reloads after saving must not bring the skeleton back over the list.
  const hasLoadedRef = useRef(false);
  if (!loading) {
    hasLoadedRef.current = true;
  }
  const isLoadingList = !hasLoadedRef.current;
  const showSkeleton = useDelayedLoading(isLoadingList);

  return (
    <>
      <PageLayout
        width='default'
        title='Schedule Projects'
        icon={IconCalendarTime}
        headerActions={
          <TokenListCreateButton
            disableRipple
            disabled={Boolean(schedulerUnavailableMessage)}
            onClick={() => handleOpenDialog()}
          >
            <AddRoundedIcon sx={{ fontSize: 16 }} />
            Создать запуск
          </TokenListCreateButton>
        }
        fitContent
      >
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

        <TokenListBox
          aria-label='Расписания'
          sx={{ flex: `0 1 ${getTokenListBoxHeight(schedules.length)}px` }}
        >
          {showSkeleton ? (
            SKELETON_ROWS.map(row => (
              <ScheduleRowSkeleton
                key={row.nameWidth}
                nameWidth={row.nameWidth}
              />
            ))
          ) : isLoadingList ? null : schedulerUnavailableMessage &&
            schedules.length === 0 ? (
            <TokenListEmptyState title='Список недоступен'>
              Пока невозможно загрузить список расписаний.
            </TokenListEmptyState>
          ) : schedules.length === 0 ? (
            <TokenListEmptyState title='Расписаний пока нет'>
              <TokenListEmptyLink
                type='button'
                onClick={() => handleOpenDialog()}
              >
                Создайте запуск
              </TokenListEmptyLink>
              , чтобы проект выполнялся по расписанию.
            </TokenListEmptyState>
          ) : (
            <TokenListScroll>
              {schedules.map(schedule => (
                <ScheduleRow
                  key={`${schedule.project_id}-${schedule.cron}`}
                  schedule={schedule}
                  name={
                    projectNames[schedule.project_id] || schedule.project_id
                  }
                  isPending={pendingByProjectId[schedule.project_id] === true}
                  onToggle={() => void handleToggle(schedule)}
                  onEdit={() => handleOpenDialog(schedule)}
                  onDelete={() => void handleDelete(schedule.project_id)}
                />
              ))}
            </TokenListScroll>
          )}
        </TokenListBox>
      </PageLayout>

      <TokenDialog
        open={dialogOpen}
        icon={
          editingEntry ? <IconPencil stroke={1.5} /> : <IconPlus stroke={1.5} />
        }
        title={editingEntry ? 'Настройка' : 'Новый запуск'}
        subtitle={
          editingEntry
            ? projectNames[editingEntry.project_id] || editingEntry.project_id
            : 'Выберите проект и расписание запуска'
        }
        actions={
          <>
            <CancelButton type='button' onClick={() => setDialogOpen(false)}>
              Отмена
            </CancelButton>
            <CreateButton
              type='button'
              onClick={() => void handleSave()}
              disabled={
                !formData.project_id || !isRetrySettingsValid(retrySettings)
              }
            >
              {editingEntry ? 'Сохранить изменения' : 'Создать'}
            </CreateButton>
          </>
        }
      >
        <Stack
          spacing={2.5}
          divider={<Divider flexItem sx={{ borderColor: '#f3f4f6' }} />}
        >
          <Box>
            <S.ProjectSelectButton
              type='button'
              aria-label='Проект'
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
              transitionDuration={{ enter: 100, exit: 0 }}
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
                    optionTextSx={retryBackoffOptionTextSx}
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
            <CronBuilder
              value={formData.cron}
              onChange={newCron => setFormData({ ...formData, cron: newCron })}
            />
          </Box>
        </Stack>
      </TokenDialog>
    </>
  );
};
