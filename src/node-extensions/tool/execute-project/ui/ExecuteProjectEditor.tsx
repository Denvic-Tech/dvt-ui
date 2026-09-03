import React, {
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { CircularProgress, Menu, Stack } from '@mui/material';

import type { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import { useNodeConnections } from '@/features/node/get-node-connections';

import { useCurrentProject } from '@/entities/project/projects';

import { client, type ProjectReadSchema } from '@/shared/gatewayClient';
import { isApiError } from '@/shared/lib/errors';
import { SingleOptionDropdownSelect } from '@/shared/ui';

import type { ExecuteProjectValues } from '../types';

import * as S from './styles';

type ProjectOption = Pick<ProjectReadSchema, 'id' | 'name'>;
type FieldErrors = Partial<Record<keyof ExecuteProjectValues, string[]>>;

const unresolvedVariablesPolicyOptions = [
  { value: 'error', label: 'Остановить с ошибкой' },
  { value: 'skip', label: 'Пропустить переменную' },
];

const systemVariablesPolicyOptions = [
  { value: 'include', label: 'Передать в дочерний проект' },
  { value: 'skip', label: 'Не передавать' },
  { value: 'error', label: 'Остановить с ошибкой' },
];

const getProjectsFromResponse = (response: unknown): ProjectOption[] => {
  const data = (response as { data?: unknown })?.data ?? response;
  return Array.isArray(data) ? (data as ProjectOption[]) : [];
};

const getProjectsErrorMessage = (error: unknown): string => {
  if (isApiError(error)) {
    return error.payload.description ?? error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return 'Не удалось загрузить список проектов.';
};

const toTimeoutInputValue = (value: unknown): string => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === 'string') {
    return value;
  }

  return '';
};

export const ExecuteProjectEditor: React.FC<
  NodeModalExtensionProps<ExecuteProjectValues>
> = ({
  id,
  isOpen,
  localInputData,
  setLocalInputData,
  setValidationCallback,
  setValidationErrors,
}) => {
  const { currentProject } = useCurrentProject();
  const { connectedInputs } = useNodeConnections(id);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [projectMenuAnchor, setProjectMenuAnchor] =
    useState<HTMLElement | null>(null);
  const [projectMenuWidth, setProjectMenuWidth] = useState<
    number | undefined
  >();
  const [projectSearch, setProjectSearch] = useState('');
  const [timeoutInput, setTimeoutInput] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const currentProjectId = currentProject?.id ?? null;
  const isVariablesDataFrameConnected = Boolean(
    connectedInputs?.['variables_df']
  );
  const waitForCompletion =
    isVariablesDataFrameConnected ||
    Boolean(localInputData.wait_for_completion);

  useEffect(() => {
    if (!isVariablesDataFrameConnected || localInputData.wait_for_completion) {
      return;
    }

    setLocalInputData(prev => ({
      ...(prev ?? {}),
      wait_for_completion: true,
    }));
  }, [
    isVariablesDataFrameConnected,
    localInputData.wait_for_completion,
    setLocalInputData,
  ]);

  useEffect(() => {
    setTimeoutInput(toTimeoutInputValue(localInputData.timeout_sec));
  }, [localInputData.timeout_sec]);

  const buildValidationErrors = useCallback((): FieldErrors => {
    const nextErrors: FieldErrors = {};
    const targetProjectId = (localInputData.target_project_id ?? '').trim();
    const normalizedTimeout = timeoutInput.trim();

    if (!targetProjectId) {
      nextErrors.target_project_id = ['Выберите проект.'];
    } else if (currentProjectId && targetProjectId === currentProjectId) {
      nextErrors.target_project_id = ['Нельзя выбрать текущий проект.'];
    }

    if (normalizedTimeout.length > 0) {
      const parsedTimeout = Number(normalizedTimeout);

      if (!Number.isInteger(parsedTimeout) || parsedTimeout < 1) {
        nextErrors.timeout_sec = ['Укажите положительное целое число секунд.'];
      }
    }

    return nextErrors;
  }, [currentProjectId, localInputData.target_project_id, timeoutInput]);

  const clearGlobalValidationErrors = useCallback(() => {
    setValidationErrors?.({});
  }, [setValidationErrors]);

  const clearFieldError = useCallback(
    (fieldName: keyof ExecuteProjectValues) => {
      setFieldErrors(prev => {
        if (!prev[fieldName]) {
          return prev;
        }

        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    },
    []
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let active = true;

    const fetchProjects = async () => {
      setProjectsLoading(true);
      setProjectsError(null);

      try {
        const response = await client.projects.get();
        if (!active) {
          return;
        }

        setProjects(getProjectsFromResponse(response));
      } catch (error) {
        if (!active) {
          return;
        }

        setProjects([]);
        setProjectsError(getProjectsErrorMessage(error));
      } finally {
        if (active) {
          setProjectsLoading(false);
        }
      }
    };

    void fetchProjects();

    return () => {
      active = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !currentProjectId) {
      return;
    }

    if (localInputData.target_project_id !== currentProjectId) {
      return;
    }

    setLocalInputData(prev => {
      const {
        target_project_id: _targetProjectId,
        target_project_name: _targetProjectName,
        ...rest
      } = prev ?? {};
      return rest;
    });
  }, [
    currentProjectId,
    isOpen,
    localInputData.target_project_id,
    setLocalInputData,
  ]);

  useEffect(() => {
    clearGlobalValidationErrors();
  }, [clearGlobalValidationErrors, isOpen]);

  useEffect(() => {
    if (!setValidationCallback) {
      return;
    }

    setValidationCallback(() => {
      return () => {
        const nextErrors = buildValidationErrors();
        setSubmitAttempted(true);
        setFieldErrors(nextErrors);
        clearGlobalValidationErrors();
        return Object.keys(nextErrors).length === 0;
      };
    });

    return () => {
      setValidationCallback(() => () => true);
    };
  }, [
    buildValidationErrors,
    clearGlobalValidationErrors,
    setValidationCallback,
  ]);

  useEffect(() => {
    if (!isOpen) {
      setFieldErrors({});
      setSubmitAttempted(false);
      setProjectSearch('');
      setProjectMenuAnchor(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!submitAttempted) {
      return;
    }

    setFieldErrors(buildValidationErrors());
  }, [buildValidationErrors, submitAttempted]);

  const projectNames = useMemo(
    () =>
      Object.fromEntries(
        projects.map(project => [project.id, project.name || project.id])
      ),
    [projects]
  );

  const availableProjects = useMemo(
    () =>
      currentProjectId
        ? projects.filter(project => project.id !== currentProjectId)
        : projects,
    [currentProjectId, projects]
  );

  const filteredProjects = useMemo(() => {
    const normalizedQuery = projectSearch.trim().toLowerCase();

    if (!normalizedQuery) {
      return availableProjects;
    }

    return availableProjects.filter(project => {
      const name = (project.name || project.id).toLowerCase();
      const id = project.id.toLowerCase();

      return name.includes(normalizedQuery) || id.includes(normalizedQuery);
    });
  }, [availableProjects, projectSearch]);

  const handleOpenProjectMenu = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (projectsLoading || projects.length === 0 || projectsError) {
        return;
      }

      if (projectMenuAnchor) {
        setProjectMenuAnchor(null);
        return;
      }

      setProjectSearch('');
      setProjectMenuWidth(event.currentTarget.clientWidth);
      setProjectMenuAnchor(event.currentTarget);
    },
    [projectMenuAnchor, projects.length, projectsError, projectsLoading]
  );

  const handleCloseProjectMenu = useCallback(() => {
    setProjectMenuAnchor(null);
    setProjectSearch('');
  }, []);

  const handleProjectSelect = useCallback(
    (project: ProjectOption) => {
      setLocalInputData(prev => ({
        ...(prev ?? {}),
        target_project_id: project.id,
        target_project_name: project.name || project.id,
      }));
      clearFieldError('target_project_id');
      handleCloseProjectMenu();
    },
    [clearFieldError, handleCloseProjectMenu, setLocalInputData]
  );

  const handleSwitchChange = useCallback(
    (
      fieldName: 'wait_for_completion' | 'cancel_on_timeout',
      checked: boolean
    ) => {
      setLocalInputData(prev => ({
        ...(prev ?? {}),
        [fieldName]: checked,
      }));
      clearFieldError(fieldName);
    },
    [clearFieldError, setLocalInputData]
  );

  const handleTimeoutChange = useCallback(
    (value: string) => {
      setTimeoutInput(value);
      clearFieldError('timeout_sec');

      const normalizedValue = value.trim();

      if (!normalizedValue) {
        setLocalInputData(prev => {
          const { timeout_sec: _timeoutSec, ...rest } = prev ?? {};
          return rest;
        });
        return;
      }

      const parsedValue = Number(normalizedValue);

      if (Number.isInteger(parsedValue) && Number.isFinite(parsedValue)) {
        setLocalInputData(prev => ({
          ...(prev ?? {}),
          timeout_sec: parsedValue,
        }));
      }
    },
    [clearFieldError, setLocalInputData]
  );

  const handleUnresolvedVariablesPolicyChange = useCallback(
    (value: string) => {
      if (value !== 'error' && value !== 'skip') {
        return;
      }

      setLocalInputData(prev => ({
        ...(prev ?? {}),
        unresolved_variables_policy: value,
      }));
    },
    [setLocalInputData]
  );

  const handleSystemVariablesPolicyChange = useCallback(
    (value: string) => {
      if (value !== 'error' && value !== 'skip' && value !== 'include') {
        return;
      }

      setLocalInputData(prev => ({
        ...(prev ?? {}),
        system_variables_policy: value,
      }));
    },
    [setLocalInputData]
  );

  const selectedProjectId = localInputData.target_project_id ?? '';
  const selectedProjectName = localInputData.target_project_name?.trim() ?? '';
  const selectedProjectLabel = selectedProjectId
    ? selectedProjectName ||
      projectNames[selectedProjectId] ||
      selectedProjectId
    : '';
  const targetProjectErrorMessage = submitAttempted
    ? (fieldErrors.target_project_id?.[0] ?? null)
    : null;
  const projectSelectDisabled =
    projectsLoading || Boolean(projectsError) || availableProjects.length === 0;
  const isProjectFieldInvalid = Boolean(
    submitAttempted && fieldErrors.target_project_id?.length
  );

  return (
    <S.Root>
      <S.Section>
        <Stack spacing={0}>
          <S.ProjectField>
            <S.FieldLabel>Целевой проект</S.FieldLabel>
            <S.ProjectSelectButton
              type='button'
              disabled={projectSelectDisabled}
              error={isProjectFieldInvalid}
              onClick={handleOpenProjectMenu}
            >
              <S.ProjectSelectText placeholder={!selectedProjectId}>
                {projectsLoading
                  ? 'Загрузка проектов...'
                  : selectedProjectId
                    ? selectedProjectLabel
                    : availableProjects.length === 0 && !projectsError
                      ? 'Нет доступных проектов'
                      : 'Выберите проект...'}
              </S.ProjectSelectText>
              {projectsLoading ? (
                <CircularProgress size={16} />
              ) : (
                <S.ChevronIcon
                  open={Boolean(projectMenuAnchor)}
                  hidden={projectSelectDisabled}
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
              )}
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
                        selected={selectedProjectId === project.id}
                        onClick={() => handleProjectSelect(project)}
                      >
                        <S.ProjectMenuLabel>
                          {project.name || project.id}
                        </S.ProjectMenuLabel>
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

            {submitAttempted && targetProjectErrorMessage ? (
              <S.HelperText error>{targetProjectErrorMessage}</S.HelperText>
            ) : null}
            {projectsError ? (
              <S.HelperText error>{projectsError}</S.HelperText>
            ) : null}
          </S.ProjectField>

          <S.ToggleCard
            active={waitForCompletion}
            activeColor='indigo'
            style={{ marginBottom: 8 }}
          >
            <S.ToggleRow>
              <S.ToggleContent>
                <S.ToggleLabel>Ожидать выполнение</S.ToggleLabel>
                <S.ToggleDescription>
                  Дождаться завершения проекта перед продолжением
                </S.ToggleDescription>
                {isVariablesDataFrameConnected ? (
                  <S.ToggleConstraintMessage>
                    При подключённом входе с переменными нельзя отключить
                    «Ожидать выполнение».
                  </S.ToggleConstraintMessage>
                ) : null}
              </S.ToggleContent>
              <S.ToggleTrackButton
                type='button'
                enabled={waitForCompletion}
                disabled={isVariablesDataFrameConnected}
                aria-label='Ожидать выполнение'
                aria-pressed={waitForCompletion}
                onClick={() =>
                  handleSwitchChange('wait_for_completion', !waitForCompletion)
                }
              >
                <S.ToggleThumb enabled={waitForCompletion} />
              </S.ToggleTrackButton>
            </S.ToggleRow>

            {waitForCompletion ? (
              <S.ExpandableArea>
                <S.FieldLabel>Время ожидания (сек)</S.FieldLabel>
                <S.TextInput
                  type='number'
                  min='1'
                  step='1'
                  value={timeoutInput}
                  placeholder='Например, 300'
                  onChange={event => handleTimeoutChange(event.target.value)}
                />
                {fieldErrors.timeout_sec?.[0] ? (
                  <S.HelperText error>
                    {fieldErrors.timeout_sec[0]}
                  </S.HelperText>
                ) : (
                  <S.FieldHint>
                    Оставьте пустым, если таймаут не требуется.
                  </S.FieldHint>
                )}
              </S.ExpandableArea>
            ) : null}
          </S.ToggleCard>

          <S.ToggleCard
            active={Boolean(localInputData.cancel_on_timeout)}
            activeColor='amber'
          >
            <S.ToggleRow>
              <S.ToggleContent>
                <S.ToggleLabel>Отменить по таймауту</S.ToggleLabel>
                <S.ToggleDescription>
                  Принудительно остановить при превышении времени
                </S.ToggleDescription>
              </S.ToggleContent>
              <S.ToggleTrackButton
                type='button'
                enabled={Boolean(localInputData.cancel_on_timeout)}
                aria-label='Отменить по таймауту'
                aria-pressed={Boolean(localInputData.cancel_on_timeout)}
                onClick={() =>
                  handleSwitchChange(
                    'cancel_on_timeout',
                    !localInputData.cancel_on_timeout
                  )
                }
              >
                <S.ToggleThumb
                  enabled={Boolean(localInputData.cancel_on_timeout)}
                />
              </S.ToggleTrackButton>
            </S.ToggleRow>
          </S.ToggleCard>

          <S.PolicyFields>
            <S.PolicyField>
              <S.FieldLabel>Неразрешённые переменные</S.FieldLabel>
              <SingleOptionDropdownSelect
                ariaLabel='Неразрешённые переменные'
                options={unresolvedVariablesPolicyOptions}
                value={localInputData.unresolved_variables_policy ?? 'error'}
                onChange={handleUnresolvedVariablesPolicyChange}
                popperMinWidth={0}
              />
              <S.FieldHint>
                Выберите поведение, если значение входной переменной не удалось
                определить.
              </S.FieldHint>
            </S.PolicyField>

            <S.PolicyField>
              <S.FieldLabel>Системные переменные</S.FieldLabel>
              <SingleOptionDropdownSelect
                ariaLabel='Системные переменные'
                options={systemVariablesPolicyOptions}
                value={localInputData.system_variables_policy ?? 'include'}
                onChange={handleSystemVariablesPolicyChange}
                popperMinWidth={0}
              />
              <S.FieldHint>
                Укажите, нужно ли передавать системные переменные в дочерний
                проект.
              </S.FieldHint>
            </S.PolicyField>
          </S.PolicyFields>
        </Stack>
      </S.Section>
    </S.Root>
  );
};
