import { useEffect, useMemo, useRef, useState } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import CircleRoundedIcon from '@mui/icons-material/CircleRounded';
import DataObjectRoundedIcon from '@mui/icons-material/DataObjectRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded';
import NotInterestedRoundedIcon from '@mui/icons-material/NotInterestedRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

import { useAlert } from '@/app/notifications/hooks/useAlert.ts';

import type {
  ProjectVariableCreate,
  ProjectVariableRead,
  ProjectVariableUpdate,
} from '@/shared/gatewayClient';
import { parseConstValue } from '@/shared/lib/node-io';
import {
  buildPrimitiveInputDefinition,
  getDefaultValueForPrimitiveType,
  isProjectVariableValueValid,
  isSafeVariableIdentifier,
  PROJECT_VARIABLE_TYPE_VALUES,
  type ProjectVariableType,
} from '@/shared/lib/variables';
import { useConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DVTDateTimePicker } from '@/shared/ui/node-input';
import { Alert, Button, Spinner, Tooltip } from '@/shared/ui/primitives';

import {
  BooleanButton,
  BooleanGroup,
  ChevronSlot,
  ColumnHeader,
  ColumnHeaderCell,
  DeleteButton,
  EditorBody,
  EditorFooter,
  EditorFooterActions,
  EditorTopRow,
  EmptyListState,
  ExpandedWrap,
  FooterStatus,
  HeaderActions,
  HeaderTitle,
  HeaderTopRow,
  HeaderWrap,
  InlineErrorBlock,
  JsonTextarea,
  ListIndicator,
  ListItemCard,
  ListItemHeader,
  ListItemsWrap,
  ListItemTitle,
  ListToggleButton,
  MiniHeader,
  MiniHeaderName,
  NameCell,
  NameFieldWrap,
  NameInput,
  NameText,
  NullPlaceholder,
  ProjectVariablesRoot,
  RowButton,
  RowWrap,
  StatusWrap,
  TableWrap,
  TextActionButton,
  ToolbarButton,
  TypeSelect,
  ValueActions,
  ValueCell,
  ValueInput,
  ValueLabel,
  ValueLabelRow,
  ValueSection,
  VariableListWrap,
  WarningIndicator,
} from './projectVariableStyles.ts';
import {
  getProjectVariableTypeMeta,
  VariableTypeBadge,
} from './VariableTypeBadge.tsx';
import {
  getProjectVariableValuePreviewText,
  VariableValuePreview,
} from './VariableValuePreview.tsx';

const DRAFT_EDITOR_ID = '__draft_project_variable__';

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error' | 'invalid';

type ProjectVariableDraft = {
  isListType: boolean;
  itemJsonErrors: Array<string | null>;
  jsonError: string | null;
  key: string;
  type: ProjectVariableType;
  value: unknown;
};

type ProjectVariablesEditorProps = {
  isLoading: boolean;
  onCreate: (
    variableKey: string,
    data: ProjectVariableCreate
  ) => Promise<ProjectVariableRead>;
  onDelete: (variableKey: string) => Promise<void>;
  onUpdate: (
    variableKey: string,
    data: ProjectVariableUpdate
  ) => Promise<ProjectVariableRead>;
  searchTerm: string;
  serverError?: string | null | undefined;
  variables: ProjectVariableRead[];
};

const getDefaultValueForType = (type: ProjectVariableType): unknown =>
  getDefaultValueForPrimitiveType(type);

const getEditableValueForType = (type: ProjectVariableType): unknown =>
  type === 'DATETIME' ? '' : getDefaultValueForType(type);

const getDefaultDraftValue = (
  type: ProjectVariableType,
  isListType: boolean
): unknown => (isListType ? [] : getDefaultValueForType(type));

const normalizeListValue = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const isJsonObjectLike = (value: unknown): boolean =>
  typeof value === 'object' && value !== null;

const getJsonDraftFromValue = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }

  if (isJsonObjectLike(value) || Array.isArray(value)) {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return '';
    }
  }

  return '';
};

const getScalarInputTextValue = (
  type: ProjectVariableType,
  value: unknown
): string => {
  if (value === null || value === undefined) {
    return '';
  }

  if (type === 'INT' || type === 'FLOAT') {
    return typeof value === 'number' ? String(value) : '';
  }

  return typeof value === 'string' ? value : String(value);
};

const buildDraftFromVariable = (
  variable: ProjectVariableRead
): ProjectVariableDraft => {
  const isListType = Boolean(variable.is_list_type);
  const normalizedValue = isListType
    ? normalizeListValue(variable.value)
    : variable.value;

  return {
    isListType,
    itemJsonErrors: isListType
      ? new Array(normalizeListValue(normalizedValue).length).fill(null)
      : [],
    jsonError: null,
    key: variable.key,
    type: variable.type,
    value: normalizedValue,
  };
};

const buildEmptyDraft = (): ProjectVariableDraft => ({
  isListType: false,
  itemJsonErrors: [],
  jsonError: null,
  key: '',
  type: 'STRING',
  value: '',
});

const getErrorMessage = (detail: unknown): string => {
  if (!detail) {
    return 'Не удалось сохранить переменную проекта.';
  }

  if (typeof detail === 'string') {
    return detail.trim() || 'Не удалось сохранить переменную проекта.';
  }

  if (detail instanceof Error) {
    return detail.message;
  }

  if (
    typeof detail === 'object' &&
    detail !== null &&
    'message' in detail &&
    typeof detail.message === 'string'
  ) {
    return detail.message;
  }

  try {
    return JSON.stringify(detail);
  } catch {
    return String(detail);
  }
};

const buildMutationPayload = (
  draft: ProjectVariableDraft
): ProjectVariableCreate => ({
  type: draft.type,
  value: draft.isListType ? normalizeListValue(draft.value) : draft.value,
  is_list_type: draft.isListType,
});

const serializeDraft = (draft: ProjectVariableDraft): string =>
  JSON.stringify({
    isListType: draft.isListType,
    key: draft.key,
    type: draft.type,
    value: draft.isListType ? normalizeListValue(draft.value) : draft.value,
  });

const getDraftIssues = ({
  draft,
  existingVariables,
  isCreating,
}: {
  draft: ProjectVariableDraft;
  existingVariables: ProjectVariableRead[];
  isCreating: boolean;
}): string[] => {
  const issues: string[] = [];
  const trimmedKey = draft.key.trim();

  if (!trimmedKey) {
    issues.push('Имя переменной обязательно.');
  } else if (!isSafeVariableIdentifier(trimmedKey)) {
    issues.push(
      `Имя "${trimmedKey}" должно быть валидным идентификатором Python.`
    );
  } else if (
    isCreating &&
    existingVariables.some(variable => variable.key === trimmedKey)
  ) {
    issues.push(`Переменная "${trimmedKey}" уже существует.`);
  }

  if (draft.jsonError) {
    issues.push(draft.jsonError);
  }

  draft.itemJsonErrors.forEach((error, index) => {
    if (error) {
      issues.push(`Элемент ${index + 1}: ${error}`);
    }
  });

  if (
    !isProjectVariableValueValid({
      isListType: draft.isListType,
      type: draft.type,
      value: draft.isListType ? normalizeListValue(draft.value) : draft.value,
    })
  ) {
    issues.push(
      `Значение не соответствует типу ${draft.type}${draft.isListType ? '[]' : ''}.`
    );
  }

  return issues;
};

const matchesSearch = (
  draft: ProjectVariableDraft,
  normalizedQuery: string
): boolean => {
  if (!normalizedQuery) {
    return true;
  }

  const searchValue = [
    draft.key,
    draft.type,
    draft.isListType ? 'list' : 'scalar',
    getProjectVariableValuePreviewText({
      isListType: draft.isListType,
      type: draft.type,
      value: draft.value,
    }),
  ]
    .join(' ')
    .toLowerCase();

  return searchValue.includes(normalizedQuery);
};

type ScalarProjectVariableValueEditorProps = {
  disabled: boolean;
  jsonError: string | null;
  onChange: (nextValue: unknown) => void;
  onJsonDraftChange?: ((nextDraft: string) => void) | undefined;
  type: ProjectVariableType;
  value: unknown;
};

const ScalarProjectVariableValueEditor = ({
  disabled,
  jsonError,
  onChange,
  onJsonDraftChange,
  type,
  value,
}: ScalarProjectVariableValueEditorProps) => {
  if (type === 'JSON') {
    if (value === null && !jsonError) {
      return <NullPlaceholder>значение установлено в null</NullPlaceholder>;
    }

    return (
      <JsonTextarea
        minRows={4}
        placeholder='{}'
        value={typeof value === 'string' ? value : getJsonDraftFromValue(value)}
        error={Boolean(jsonError)}
        helperText={jsonError ?? ' '}
        disabled={disabled}
        onChange={event => onJsonDraftChange?.(event.target.value)}
      />
    );
  }

  if (value === null) {
    return <NullPlaceholder>значение установлено в null</NullPlaceholder>;
  }

  if (type === 'BOOLEAN') {
    return (
      <BooleanGroup>
        <BooleanButton
          type='button'
          active={value === true}
          booleanValue={true}
          disabled={disabled}
          onClick={() => onChange(true)}
        >
          true
        </BooleanButton>
        <BooleanButton
          type='button'
          active={value === false}
          booleanValue={false}
          disabled={disabled}
          onClick={() => onChange(false)}
        >
          false
        </BooleanButton>
      </BooleanGroup>
    );
  }

  if (type === 'DATETIME') {
    return (
      <DVTDateTimePicker
        blurOnEnter
        compact
        disabled={disabled}
        initialIsoValue={typeof value === 'string' ? value : null}
        label={null}
        onPythonDateTimeChange={onChange}
      />
    );
  }

  return (
    <ValueInput
      placeholder='значение'
      disabled={disabled}
      value={getScalarInputTextValue(type, value)}
      onChange={event => {
        const nextText = event.target.value;

        if (type === 'INT' || type === 'FLOAT') {
          onChange(
            parseConstValue(
              nextText,
              buildPrimitiveInputDefinition(type, false)
            )
          );
          return;
        }

        onChange(nextText);
      }}
    />
  );
};

type ProjectVariableValueEditorProps = {
  disabled: boolean;
  draft: ProjectVariableDraft;
  onPatch: (patch: Partial<ProjectVariableDraft>) => void;
};

const ProjectVariableValueEditor = ({
  disabled,
  draft,
  onPatch,
}: ProjectVariableValueEditorProps) => {
  const [jsonDraft, setJsonDraft] = useState('');
  const isExplicitNull = draft.value === null && !draft.jsonError;

  useEffect(() => {
    if (draft.type !== 'JSON' || draft.isListType || draft.value === null) {
      return;
    }

    setJsonDraft(getJsonDraftFromValue(draft.value));
  }, [draft.isListType, draft.type, draft.value]);

  const handleSetNull = () => {
    onPatch({
      jsonError: null,
      value: null,
    });
  };

  const handleClearNull = () => {
    onPatch({
      jsonError: null,
      value: getEditableValueForType(draft.type),
    });
  };

  const handleJsonDraftChange = (nextDraft: string) => {
    setJsonDraft(nextDraft);

    if (!nextDraft.trim()) {
      onPatch({
        jsonError: null,
        value: {},
      });
      return;
    }

    try {
      const parsedValue = JSON.parse(nextDraft);
      onPatch({
        jsonError: null,
        value: parsedValue,
      });
    } catch {
      onPatch({
        jsonError: 'Некорректный JSON формат.',
        value: null,
      });
    }
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(jsonDraft || '{}');
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonDraft(formatted);
      onPatch({
        jsonError: null,
        value: parsed,
      });
    } catch {
      onPatch({
        jsonError: 'Не удалось форматировать: невалидный JSON.',
      });
    }
  };

  if (draft.isListType) {
    const values = normalizeListValue(draft.value);

    return (
      <ValueSection>
        <ValueLabelRow>
          <ValueLabel>Значение</ValueLabel>
        </ValueLabelRow>

        <ListItemsWrap>
          {values.length > 0 ? (
            values.map((item, index) => (
              <ListItemCard key={`${draft.key || 'draft'}-item-${index}`}>
                <ListItemHeader>
                  <ListItemTitle>Элемент {index + 1}</ListItemTitle>
                  <Tooltip title='Удалить элемент списка'>
                    <DeleteButton
                      type='button'
                      visible
                      disabled={disabled}
                      aria-label='Удалить элемент списка'
                      onClick={() => {
                        const nextValues = values.filter(
                          (_value, itemIndex) => itemIndex !== index
                        );
                        const nextErrors = draft.itemJsonErrors.filter(
                          (_error, itemIndex) => itemIndex !== index
                        );

                        onPatch({
                          itemJsonErrors: nextErrors,
                          value: nextValues,
                        });
                      }}
                    >
                      <DeleteOutlineRoundedIcon sx={{ fontSize: 11 }} />
                    </DeleteButton>
                  </Tooltip>
                </ListItemHeader>

                <ScalarProjectVariableValueEditor
                  disabled={disabled}
                  jsonError={draft.itemJsonErrors[index] ?? null}
                  onChange={nextValue => {
                    const nextValues = values.map((currentValue, itemIndex) =>
                      itemIndex === index ? nextValue : currentValue
                    );

                    onPatch({ value: nextValues });
                  }}
                  onJsonDraftChange={
                    draft.type === 'JSON'
                      ? nextDraft => {
                          try {
                            const parsedValue = JSON.parse(nextDraft);
                            const nextValues = values.map(
                              (currentValue, itemIndex) =>
                                itemIndex === index ? parsedValue : currentValue
                            );
                            const nextErrors = [...draft.itemJsonErrors];
                            nextErrors[index] = null;
                            onPatch({
                              itemJsonErrors: nextErrors,
                              value: nextValues,
                            });
                          } catch {
                            const nextValues = values.map(
                              (currentValue, itemIndex) =>
                                itemIndex === index ? null : currentValue
                            );
                            const nextErrors = [...draft.itemJsonErrors];
                            nextErrors[index] = 'Некорректный JSON формат.';
                            onPatch({
                              itemJsonErrors: nextErrors,
                              value: nextValues,
                            });
                          }
                        }
                      : undefined
                  }
                  type={draft.type}
                  value={item}
                />
              </ListItemCard>
            ))
          ) : (
            <EmptyListState>
              Список пуст. Добавьте первый элемент.
            </EmptyListState>
          )}

          <Button
            size='sm'
            variant='outline'
            startIcon={<AddRoundedIcon fontSize='small' />}
            disabled={disabled}
            onClick={() =>
              onPatch({
                itemJsonErrors: [...draft.itemJsonErrors, null],
                value: [...values, getDefaultValueForType(draft.type)],
              })
            }
          >
            Добавить элемент
          </Button>
        </ListItemsWrap>
      </ValueSection>
    );
  }

  return (
    <ValueSection>
      <ValueLabelRow>
        <ValueLabel>Значение</ValueLabel>
        <ValueActions>
          <TextActionButton
            type='button'
            active={isExplicitNull}
            disabled={disabled}
            onClick={isExplicitNull ? handleClearNull : handleSetNull}
          >
            <NotInterestedRoundedIcon sx={{ fontSize: 10 }} />
            {isExplicitNull ? 'null ✓' : 'set null'}
          </TextActionButton>
          {draft.type === 'JSON' && draft.value !== null ? (
            <TextActionButton
              type='button'
              accent
              disabled={disabled}
              onClick={handleFormatJson}
            >
              <AutoFixHighRoundedIcon sx={{ fontSize: 10 }} />
              формат
            </TextActionButton>
          ) : null}
        </ValueActions>
      </ValueLabelRow>

      <ScalarProjectVariableValueEditor
        disabled={disabled}
        jsonError={draft.jsonError}
        onChange={nextValue => onPatch({ value: nextValue })}
        onJsonDraftChange={
          draft.type === 'JSON' ? handleJsonDraftChange : undefined
        }
        type={draft.type}
        value={
          draft.type === 'JSON' &&
          (draft.value !== null || Boolean(draft.jsonError))
            ? jsonDraft
            : draft.value
        }
      />
    </ValueSection>
  );
};

export const ProjectVariablesEditor = ({
  isLoading,
  onCreate,
  onDelete,
  onUpdate,
  searchTerm,
  serverError,
  variables,
}: ProjectVariablesEditorProps) => {
  const { openDialog, confirm } = useConfirmDialog();
  const { showNotification } = useAlert();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProjectVariableDraft | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [isNarrow, setIsNarrow] = useState(false);

  const isCreating = editingId === DRAFT_EDITOR_ID;
  const editingVariable =
    editingId && editingId !== DRAFT_EDITOR_ID
      ? (variables.find(variable => variable.key === editingId) ?? null)
      : null;
  const baselineDraft = useMemo(
    () => (editingVariable ? buildDraftFromVariable(editingVariable) : null),
    [editingVariable]
  );
  const normalizedQuery = searchTerm.trim().toLowerCase();

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const resetEditor = () => {
    clearCloseTimer();
    setEditingId(null);
    setDraft(null);
    setSaveState('idle');
    setSaveError(null);
  };

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width ?? 0;
      setIsNarrow(width < 360);
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      clearCloseTimer();
    };
  }, []);

  useEffect(() => {
    if (
      !editingId ||
      isCreating ||
      saveState === 'saving' ||
      saveState === 'saved'
    ) {
      return;
    }

    if (!editingVariable) {
      resetEditor();
      return;
    }

    if (!draft) {
      setDraft(buildDraftFromVariable(editingVariable));
    }
  }, [draft, editingId, editingVariable, isCreating, saveState]);

  const draftIssues = useMemo(() => {
    if (!draft) {
      return [];
    }

    return getDraftIssues({
      draft,
      existingVariables: variables,
      isCreating,
    });
  }, [draft, isCreating, variables]);

  const hasChanges = useMemo(() => {
    if (!draft) {
      return false;
    }

    if (isCreating) {
      return true;
    }

    if (!baselineDraft) {
      return false;
    }

    return serializeDraft(draft) !== serializeDraft(baselineDraft);
  }, [baselineDraft, draft, isCreating]);

  const isValid = Boolean(draft) && draftIssues.length === 0;
  const isSaving = saveState === 'saving';
  const canSubmit =
    Boolean(draft) && !isSaving && isValid && (isCreating || hasChanges);

  const effectiveSaveState: SaveState =
    saveState === 'saving' || saveState === 'saved' || saveState === 'error'
      ? saveState
      : draft && !isValid
        ? 'invalid'
        : hasChanges
          ? 'dirty'
          : 'idle';

  const visibleVariables = useMemo(() => {
    const persisted = variables.filter(variable =>
      matchesSearch(buildDraftFromVariable(variable), normalizedQuery)
    );

    if (isCreating && draft && matchesSearch(draft, normalizedQuery)) {
      return [
        { kind: 'draft' as const },
        ...persisted.map(variable => ({
          kind: 'persisted' as const,
          variable,
        })),
      ];
    }

    return persisted.map(variable => ({
      kind: 'persisted' as const,
      variable,
    }));
  }, [draft, isCreating, normalizedQuery, variables]);

  const getDisplayDraftForVariable = (variable: ProjectVariableRead) => {
    if (editingId === variable.key && draft && !isCreating) {
      return draft;
    }

    return buildDraftFromVariable(variable);
  };

  const beginEditingExisting = (variable: ProjectVariableRead) => {
    clearCloseTimer();
    setEditingId(variable.key);
    setDraft(buildDraftFromVariable(variable));
    setSaveState('idle');
    setSaveError(null);
  };

  const beginCreatingDraft = () => {
    clearCloseTimer();
    setEditingId(DRAFT_EDITOR_ID);
    setDraft(buildEmptyDraft());
    setSaveState('idle');
    setSaveError(null);
  };

  const commitDraft = async (collapseAfterDelay: boolean): Promise<boolean> => {
    if (!draft || !canSubmit) {
      return false;
    }

    clearCloseTimer();
    setSaveState('saving');
    setSaveError(null);

    try {
      const payload = buildMutationPayload(draft);

      if (isCreating) {
        await onCreate(draft.key.trim(), payload);
      } else if (editingId) {
        await onUpdate(editingId, payload);
      }

      setSaveState('saved');

      if (collapseAfterDelay) {
        closeTimerRef.current = window.setTimeout(() => {
          resetEditor();
        }, 1500);
      } else {
        resetEditor();
      }

      return true;
    } catch (error) {
      setSaveState('error');
      setSaveError(getErrorMessage(error));
      return false;
    }
  };

  const requestEditorSwitch = async (
    target:
      | { type: 'close' }
      | { type: 'create' }
      | { type: 'edit'; variable: ProjectVariableRead }
  ) => {
    if (!editingId) {
      if (target.type === 'create') {
        beginCreatingDraft();
      } else if (target.type === 'edit') {
        beginEditingExisting(target.variable);
      }
      return;
    }

    if (target.type === 'close') {
      if (!isCreating && !hasChanges && effectiveSaveState === 'idle') {
        resetEditor();
      }
      return;
    }

    const nextEditingId =
      target.type === 'create' ? DRAFT_EDITOR_ID : target.variable.key;

    if (editingId === nextEditingId) {
      if (!isCreating && !hasChanges && effectiveSaveState === 'idle') {
        resetEditor();
      }
      return;
    }

    const hasUnsavedChanges = Boolean(draft) && (isCreating || hasChanges);
    if (!hasUnsavedChanges) {
      if (target.type === 'create') {
        beginCreatingDraft();
      } else {
        beginEditingExisting(target.variable);
      }
      return;
    }

    const actionId = await openDialog({
      title: 'Есть несохранённые изменения',
      message:
        'Сохраните или отмените текущие изменения перед переходом к другой переменной.',
      actions: [
        {
          id: 'apply',
          label: isCreating ? 'Создать и продолжить' : 'Применить и продолжить',
          color: 'primary',
          emphasize: true,
          disabled: !canSubmit,
        },
        {
          id: 'discard',
          label: isCreating ? 'Отменить черновик' : 'Отменить изменения',
          color: 'inherit',
        },
        {
          id: 'stay',
          label: 'Продолжить редактирование',
          color: 'inherit',
        },
      ],
    });

    if (actionId === 'apply') {
      const saved = await commitDraft(false);
      if (!saved) {
        return;
      }
    } else if (actionId === 'discard') {
      resetEditor();
    } else {
      return;
    }

    if (target.type === 'create') {
      beginCreatingDraft();
    } else {
      beginEditingExisting(target.variable);
    }
  };

  const handleDraftPatch = (patch: Partial<ProjectVariableDraft>) => {
    setDraft(currentDraft => {
      if (!currentDraft) {
        return currentDraft;
      }

      return {
        ...currentDraft,
        ...patch,
      };
    });
    setSaveState('idle');
    setSaveError(null);
  };

  const handleDelete = async (variableKey: string) => {
    if (variableKey === DRAFT_EDITOR_ID) {
      resetEditor();
      return;
    }

    const isConfirmed = await confirm({
      title: 'Удалить переменную проекта?',
      message: 'Это действие нельзя отменить.',
      confirmLabel: 'Удалить',
      confirmColor: 'error',
    });

    if (!isConfirmed) {
      return;
    }

    setDeletingKey(variableKey);

    try {
      await onDelete(variableKey);

      if (editingId === variableKey) {
        resetEditor();
      }
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Не удалось удалить переменную проекта',
        detail: getErrorMessage(error),
      });
    } finally {
      setDeletingKey(null);
    }
  };

  const getFooterStatusLabel = (): string => {
    switch (effectiveSaveState) {
      case 'dirty':
        return 'есть изменения';
      case 'saving':
        return 'сохранение';
      case 'saved':
        return isCreating ? 'создано' : 'сохранено';
      case 'error':
        return saveError ?? 'ошибка';
      case 'invalid':
        return isCreating
          ? 'укажите имя и исправьте ошибки'
          : 'исправьте ошибки перед сохранением';
      case 'idle':
      default:
        return 'нет изменений';
    }
  };

  return (
    <ProjectVariablesRoot ref={containerRef}>
      <HeaderWrap>
        <HeaderTopRow>
          <HeaderTitle>
            <DataObjectRoundedIcon sx={{ fontSize: 15 }} />
            Переменные проекта
          </HeaderTitle>
          <HeaderActions>
            <ToolbarButton
              size='sm'
              disabled={isCreating || isSaving}
              title={
                isCreating
                  ? 'Сначала завершите создание текущей переменной'
                  : undefined
              }
              sx={{
                '&&.MuiButton-root.Mui-disabled': {
                  background: '#e5e7eb !important',
                  backgroundColor: '#e5e7eb !important',
                  backgroundImage: 'none !important',
                  boxShadow: 'none !important',
                  color: '#9ca3af !important',
                  borderColor: '#e5e7eb !important',
                  opacity: 1,
                },
              }}
              onClick={() => {
                void requestEditorSwitch({ type: 'create' });
              }}
            >
              Добавить
            </ToolbarButton>
          </HeaderActions>
        </HeaderTopRow>
      </HeaderWrap>

      {(serverError || isLoading) && (
        <StatusWrap>
          {serverError ? (
            <Alert variant='destructive'>{serverError}</Alert>
          ) : null}
          {isLoading ? (
            <Alert variant='info'>Загрузка переменных проекта…</Alert>
          ) : null}
        </StatusWrap>
      )}

      <TableWrap>
        <VariableListWrap>
          <ColumnHeader isNarrow={isNarrow}>
            <span />
            <ColumnHeaderCell>Тип</ColumnHeaderCell>
            <ColumnHeaderCell>Имя</ColumnHeaderCell>
            <ColumnHeaderCell>Значение</ColumnHeaderCell>
            <span />
          </ColumnHeader>

          {visibleVariables.length === 0 ? (
            <EmptyListState>
              {variables.length === 0
                ? 'Переменные проекта ещё не заданы.'
                : 'По текущему запросу ничего не найдено.'}
            </EmptyListState>
          ) : (
            visibleVariables.map(item => {
              const isDraftRow = item.kind === 'draft';
              const rowKey = isDraftRow ? DRAFT_EDITOR_ID : item.variable.key;
              const rowDraft = isDraftRow
                ? draft
                : item.kind === 'persisted'
                  ? getDisplayDraftForVariable(item.variable)
                  : null;

              if (!rowDraft) {
                return null;
              }

              const isExpanded = editingId === rowKey;
              const typeMeta = getProjectVariableTypeMeta(rowDraft.type);
              const rowIssues = isExpanded ? draftIssues : [];
              const rowIsSaving =
                deletingKey === rowKey ||
                (isExpanded && saveState === 'saving');

              return (
                <RowWrap
                  key={rowKey}
                  expanded={isExpanded}
                  isDraft={isDraftRow}
                  isSaving={rowIsSaving}
                >
                  <RowButton
                    type='button'
                    isNarrow={isNarrow}
                    aria-expanded={isExpanded}
                    aria-controls={`project-variable-panel-${rowKey}`}
                    onClick={() => {
                      if (isDraftRow) {
                        if (!isExpanded) {
                          beginCreatingDraft();
                        }
                        return;
                      }

                      void requestEditorSwitch(
                        isExpanded
                          ? { type: 'close' }
                          : { type: 'edit', variable: item.variable }
                      );
                    }}
                  >
                    <ChevronSlot>
                      {isExpanded ? (
                        <ExpandMoreRoundedIcon sx={{ fontSize: 14 }} />
                      ) : (
                        <ChevronRightRoundedIcon sx={{ fontSize: 14 }} />
                      )}
                    </ChevronSlot>

                    <VariableTypeBadge
                      isNarrow={isNarrow}
                      type={rowDraft.type}
                    />

                    <NameCell>
                      {rowDraft.isListType ? (
                        <ListIndicator title='список'>
                          <FormatListBulletedRoundedIcon
                            sx={{ fontSize: 10 }}
                          />
                        </ListIndicator>
                      ) : null}
                      <NameText hasName={Boolean(rowDraft.key.trim())}>
                        {rowDraft.key.trim() || '(имя?)'}
                      </NameText>
                      {rowIssues.length > 0 ? (
                        <WarningIndicator title={rowIssues[0]}>
                          <WarningAmberRoundedIcon sx={{ fontSize: 11 }} />
                        </WarningIndicator>
                      ) : null}
                    </NameCell>

                    <ValueCell>
                      <VariableValuePreview
                        isListType={rowDraft.isListType}
                        type={rowDraft.type}
                        value={rowDraft.value}
                      />
                    </ValueCell>

                    <Tooltip title='Удалить переменную'>
                      <DeleteButton
                        className='project-variables-delete-button'
                        type='button'
                        visible={isExpanded || deletingKey === rowKey}
                        disabled={rowIsSaving}
                        aria-label='Удалить переменную'
                        onClick={event => {
                          event.stopPropagation();
                          void handleDelete(rowKey);
                        }}
                      >
                        <DeleteOutlineRoundedIcon sx={{ fontSize: 11 }} />
                      </DeleteButton>
                    </Tooltip>
                  </RowButton>

                  {isExpanded ? (
                    <ExpandedWrap id={`project-variable-panel-${rowKey}`}>
                      <MiniHeader isDraft={isDraftRow}>
                        {isDraftRow ? (
                          <>
                            <AddRoundedIcon sx={{ fontSize: 12 }} />
                            НОВАЯ ПЕРЕМЕННАЯ (ЧЕРНОВИК)
                          </>
                        ) : (
                          <>
                            <EditRoundedIcon sx={{ fontSize: 12 }} />
                            РЕДАКТИРОВАНИЕ
                            <MiniHeaderName>
                              {rowDraft.key || 'переменная'}
                            </MiniHeaderName>
                          </>
                        )}
                      </MiniHeader>

                      <EditorBody isDraft={isDraftRow}>
                        <EditorTopRow isNarrow={isNarrow}>
                          <NameFieldWrap isNarrow={isNarrow}>
                            <NameInput
                              autoFocus={isDraftRow}
                              placeholder='имя_переменной'
                              disabled={!isDraftRow || isSaving}
                              error={rowIssues.some(
                                message =>
                                  message.includes('Имя') ||
                                  message.includes('идентификатор') ||
                                  message.includes('существует')
                              )}
                              value={rowDraft.key}
                              onChange={event =>
                                handleDraftPatch({ key: event.target.value })
                              }
                            />
                          </NameFieldWrap>

                          <TypeSelect
                            typeColor={typeMeta.color}
                            disabled={isSaving}
                            value={rowDraft.type}
                            options={PROJECT_VARIABLE_TYPE_VALUES.map(type => ({
                              label: type,
                              value: type,
                            }))}
                            onChange={value => {
                              const nextType = value as ProjectVariableType;
                              const nextValue = rowDraft.isListType
                                ? normalizeListValue(rowDraft.value).map(() =>
                                    getDefaultValueForType(nextType)
                                  )
                                : getDefaultValueForType(nextType);

                              handleDraftPatch({
                                itemJsonErrors: rowDraft.isListType
                                  ? new Array(
                                      normalizeListValue(nextValue).length
                                    ).fill(null)
                                  : [],
                                jsonError: null,
                                type: nextType,
                                value: nextValue,
                              });
                            }}
                          />

                          <ListToggleButton
                            type='button'
                            active={rowDraft.isListType}
                            disabled={isSaving}
                            onClick={() =>
                              handleDraftPatch({
                                isListType: !rowDraft.isListType,
                                itemJsonErrors: [],
                                jsonError: null,
                                value: !rowDraft.isListType
                                  ? []
                                  : getDefaultDraftValue(rowDraft.type, false),
                              })
                            }
                          >
                            <FormatListBulletedRoundedIcon
                              sx={{ fontSize: 11 }}
                            />
                            список
                          </ListToggleButton>
                        </EditorTopRow>

                        {rowIssues.length > 0 ? (
                          <Alert
                            variant='destructive'
                            icon={
                              <WarningAmberRoundedIcon fontSize='inherit' />
                            }
                            sx={{
                              borderRadius: '7px',
                              py: 0,
                              '& .MuiAlert-message': {
                                fontSize: 11,
                                lineHeight: 1.5,
                              },
                            }}
                          >
                            {rowIssues.join(' ')}
                          </Alert>
                        ) : null}

                        <ProjectVariableValueEditor
                          disabled={isSaving}
                          draft={rowDraft}
                          onPatch={handleDraftPatch}
                        />

                        {saveState === 'error' && saveError ? (
                          <InlineErrorBlock>
                            <WarningAmberRoundedIcon sx={{ fontSize: 12 }} />
                            {saveError}
                          </InlineErrorBlock>
                        ) : null}

                        <EditorFooter>
                          <FooterStatus state={effectiveSaveState}>
                            {effectiveSaveState === 'dirty' ? (
                              <CircleRoundedIcon sx={{ fontSize: 8 }} />
                            ) : null}
                            {effectiveSaveState === 'saving' ? (
                              <Spinner size={11} />
                            ) : null}
                            {effectiveSaveState === 'saved' ? (
                              <CheckRoundedIcon sx={{ fontSize: 12 }} />
                            ) : null}
                            {effectiveSaveState === 'error' ||
                            effectiveSaveState === 'invalid' ? (
                              <WarningAmberRoundedIcon sx={{ fontSize: 11 }} />
                            ) : null}
                            {getFooterStatusLabel()}
                          </FooterStatus>

                          <EditorFooterActions>
                            <Button
                              size='sm'
                              variant='outline'
                              disabled={isSaving}
                              sx={{
                                minHeight: 28,
                                px: 1.25,
                                borderRadius: '6px',
                                fontSize: 11,
                              }}
                              onClick={() => resetEditor()}
                            >
                              Отмена
                            </Button>
                            <Button
                              size='sm'
                              variant={isDraftRow ? 'success' : 'default'}
                              disabled={!canSubmit}
                              startIcon={
                                isSaving ? <Spinner size={12} /> : undefined
                              }
                              sx={{
                                minHeight: 28,
                                px: 1.5,
                                borderRadius: '6px',
                                fontSize: 11,
                                '&&.Mui-disabled': {
                                  background: '#e5e7eb !important',
                                  backgroundImage: 'none !important',
                                  boxShadow: 'none !important',
                                  color: '#9ca3af !important',
                                  opacity: 1,
                                },
                              }}
                              onClick={() => {
                                void commitDraft(true);
                              }}
                            >
                              {isDraftRow ? 'Создать' : 'Применить'}
                            </Button>
                          </EditorFooterActions>
                        </EditorFooter>
                      </EditorBody>
                    </ExpandedWrap>
                  ) : null}
                </RowWrap>
              );
            })
          )}
        </VariableListWrap>
      </TableWrap>
    </ProjectVariablesRoot>
  );
};
