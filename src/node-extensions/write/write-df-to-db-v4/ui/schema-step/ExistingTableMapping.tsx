import {
  type ComponentPropsWithoutRef,
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Divider, MenuItem } from '@mui/material';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';

import type {
  DbColumn,
  TableColumnActionInput,
  TableColumnActionOutput,
  WriteColumnResolutionRow,
} from '@/shared/gatewayClient';
import {
  IconButtonBase,
  SearchField,
  SearchLead,
  Spinner,
} from '@/shared/ui/clean-minimal/controls';
import { ActionMenu } from '@/shared/ui/clean-minimal/dropdown';
import {
  CloseIcon,
  MoreIcon,
  SearchIcon,
} from '@/shared/ui/clean-minimal/icons';

import {
  type CatalogDescriptions,
  resolveCommentBaseline,
} from '../../lib/catalogDescriptions';
import {
  canFillEmptyDbComment,
  type CommentOverrides,
  commentValue,
  normalizeComment,
} from '../../lib/columnComments';
import { type ColumnResolveState, normalizeName } from '../../lib/helpers';
import { CatalogDescriptionNote } from '../CatalogDescriptionNote';
import { SmallButton } from '../kit.styles';

import { ColumnCommentPanel } from './ColumnCommentPanel';
import { formatColumnCount } from './format';
import {
  ActionCheckbox,
  type ActionCheckboxTone,
  ChangedNote,
  CommentButton,
  DbOnlyName,
  DfCell,
  GridBody,
  GridBodyRow,
  GridEmpty,
  GridHeadRow,
  GridInput,
  GridTable,
  HeaderSpacer,
  InputResetButton,
  MessageBox,
  MonoText,
  MutedDash,
  SchemaStepHeader,
  SegmentGroup,
  SegmentTab,
  StatusText,
  TableArea,
  TableOverlay,
  ToggleSwitch,
} from './SchemaStep.styles';
import { TablePathChip } from './TablePathChip';

type ColumnDiffStatus = WriteColumnResolutionRow['status'];

export type ColumnDiffRow = {
  sourceComment?: string | null;
  dbComment?: string | null;
  dfName: string | null;
  dfType: string | null;
  requestedTargetName: string | null;
  dbName: string | null;
  dbType: string | null;
  dbNullable: boolean | null;
  status: ColumnDiffStatus;
  reason: string | null;
  suggestedAction: TableColumnActionOutput | null;
};

type ActionType = TableColumnActionOutput['type'];

export type ExistingTableMappingProps = {
  tableParents: readonly string[];
  tableName: string;
  onTablePathClick?: (() => void) | undefined;
  columnDiff: ColumnDiffRow[];
  commentOverrides?: CommentOverrides | undefined;
  sourceCommentOverrides?: CommentOverrides | undefined;
  nullableOverrides?: Readonly<Record<string, boolean>> | undefined;
  onExistingNullableChange: (
    columnName: string,
    nullable: boolean,
    baseline: boolean | null
  ) => void;
  /** Описания каталога по имени колонки DF: baseline комментария источника. */
  catalogDescriptions?: CatalogDescriptions | null;
  commentsSupported?: boolean | undefined;
  onCommentChange?:
    | ((name: string, value: string | null, isNew: boolean) => void)
    | undefined;
  dbColumns?: readonly Pick<DbColumn, 'name' | 'comment'>[] | undefined;
  hasInvalidTargetName: boolean;
  initialTargetNames: ReadonlyMap<string, string>;
  isResolving: boolean;
  isRecreatingTable: boolean;
  recreateTableError: string | null;
  resolveError: string | null;
  onRetryResolve: () => void;
  selectedActionColumns: Set<string>;
  selectedActionsByColumn: ReadonlyMap<string, TableColumnActionInput>;
  onToggleAction: (action: TableColumnActionOutput) => void;
  onActionNullableChange: (
    action: TableColumnActionOutput,
    nullable: boolean
  ) => void;
  onTargetNameBlur: (sourceName: string, value: string) => void;
  onTargetNameCancel: (sourceName: string) => void;
  onTargetNameChange: (sourceName: string, value: string) => void;
  onTargetNameReset: (sourceName: string) => void;
  /** Вернуть все имена колонок в БД к исходным. */
  onResetTargetNames: () => void;
  /** Сбросить все правки шага (имена, NULL, комментарии, действия). */
  onResetAll: () => void;
  hasChanges: boolean;
  onRecreateTable: () => void;
  resolveStates: Record<string, ColumnResolveState>;
};

const MAPPING_GRID_COLUMNS =
  'minmax(0, 1.2fr) 220px 88px 52px minmax(0, 1fr) 96px 116px';
const MAPPING_GRID_GAP = 20;
const VIRTUALIZATION_THRESHOLD = 60;

const RESOLVED_COLUMN_STATUSES = new Set<ColumnDiffStatus>([
  'match',
  'explicit_mapping',
  'auto_transliterated',
  'normalized_target',
  'case_resolved',
  'internal_column_ignored',
]);

const NOT_NULL_EDITABLE_STATUSES = new Set<ColumnDiffStatus>([
  'missing_in_db',
  'invalid',
  'duplicate_effective_target',
  'internal_column_ignored',
]);

/** Вариант действия: подпись и глагол для подсказки. */
type ActionView = { label: string; verb: string };

const KEEP_VIEW: ActionView = { label: 'Оставить', verb: 'оставить' };
const NO_CHANGE_VIEW: ActionView = { label: 'Не менять', verb: 'не менять' };
const CHANGE_VIEW: ActionView = { label: 'Изменить', verb: 'изменить' };

/**
 * Варианты действия: `on` — действие выбрано (чекбокс отмечен), `off` — нет.
 * Подпись чекбокса постоянная — `on.label`; `tone` — цвет отмеченного.
 */
const ACTION_CHOICES: Record<
  ActionType,
  { on: ActionView; off: ActionView; tone: ActionCheckboxTone }
> = {
  add_column: {
    on: { label: 'Создать', verb: 'создать' },
    off: { label: 'Не создавать', verb: 'не создавать' },
    tone: 'create',
  },
  drop_column: {
    on: { label: 'Удалить', verb: 'удалить' },
    off: KEEP_VIEW,
    tone: 'danger',
  },
  recreate_column: {
    on: { label: 'Пересоздать', verb: 'пересоздать' },
    off: KEEP_VIEW,
    tone: 'danger',
  },
  set_column_comment: { on: CHANGE_VIEW, off: NO_CHANGE_VIEW, tone: 'create' },
  set_column_nullable: { on: CHANGE_VIEW, off: NO_CHANGE_VIEW, tone: 'create' },
};

/** Галочка чекбокса (макет: `.cbx`). */
const CheckMark = () => (
  <svg
    width='11'
    height='11'
    viewBox='0 0 16 16'
    fill='none'
    stroke='currentColor'
    strokeWidth='2.4'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
    focusable='false'
  >
    <path d='M3.5 8.5l3 3 6-7' />
  </svg>
);

type StatusView = {
  label: string;
  tone: 'ok' | 'new' | 'warn' | 'error' | 'muted';
};

const getStatusView = (
  status: ColumnDiffStatus,
  actionType: ActionType | null,
  actionSelected: boolean
): StatusView => {
  switch (status) {
    case 'match':
    case 'explicit_mapping':
    case 'auto_transliterated':
    case 'normalized_target':
    case 'case_resolved':
      return { label: 'Совпадает', tone: 'ok' };
    case 'missing_in_db':
      return {
        label: 'Нет в БД',
        tone: actionType === 'add_column' && !actionSelected ? 'muted' : 'new',
      };
    case 'missing_in_dataframe':
      return {
        label: 'Нет в DF',
        tone: actionType === 'drop_column' && actionSelected ? 'muted' : 'warn',
      };
    case 'type_mismatch':
      return { label: 'Другой тип', tone: 'error' };
    case 'duplicate_effective_target':
      return { label: 'Дубликат', tone: 'error' };
    case 'invalid':
      return { label: 'Ошибка', tone: 'error' };
    case 'internal_column_ignored':
      return { label: 'Пропущена', tone: 'muted' };
  }
};

const getRowKey = (row: ColumnDiffRow) =>
  row.dfName ? `df:${row.dfName}` : `db:${row.dbName ?? ''}`;

type DerivedRow = {
  key: string;
  row: ColumnDiffRow;
  targetName: string;
  isTargetNameEmpty: boolean;
  isTargetNameChanged: boolean;
  resolveState: ColumnResolveState;
  isReconciling: boolean;
  visibleAction: TableColumnActionOutput | null;
  isActionSelected: boolean;
  canEditNewNullable: boolean;
  canEditExistingNullable: boolean;
  nullable: boolean | null;
  nullableChanged: boolean;
  comment: {
    key: string;
    isNew: boolean;
    value: string | null;
    sourceBaseline: string | null;
    changed: boolean;
    disabled: boolean;
  };
  status: StatusView;
  isDiff: boolean;
  isOff: boolean;
};

/** Сопоставление колонок DF и существующей таблицы (макет WdbMapD). */
export const ExistingTableMapping = ({
  tableParents,
  tableName,
  onTablePathClick,
  columnDiff,
  dbColumns,
  commentOverrides,
  sourceCommentOverrides,
  catalogDescriptions,
  nullableOverrides,
  onExistingNullableChange,
  commentsSupported,
  onCommentChange,
  hasInvalidTargetName,
  initialTargetNames,
  isResolving,
  isRecreatingTable,
  recreateTableError,
  resolveError,
  onRetryResolve,
  selectedActionColumns,
  selectedActionsByColumn,
  onToggleAction,
  onActionNullableChange,
  onTargetNameBlur,
  onTargetNameCancel,
  onTargetNameChange,
  onTargetNameReset,
  onResetTargetNames,
  onResetAll,
  hasChanges,
  onRecreateTable,
  resolveStates,
}: ExistingTableMappingProps) => {
  const [columnSearch, setColumnSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'diff'>('all');
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [activeCommentKey, setActiveCommentKey] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const virtuosoRef = useRef<VirtuosoHandle | null>(null);

  const dbCommentsByName = useMemo(
    () =>
      new Map(dbColumns?.map(column => [column.name, column.comment ?? null])),
    [dbColumns]
  );
  const isBusy = isResolving || isRecreatingTable;
  const hasResolveError = Boolean(resolveError) && !isBusy;

  const derivedRows = useMemo<DerivedRow[]>(
    () =>
      columnDiff.map(row => {
        const sourceBaseline = resolveCommentBaseline(
          row.dfName,
          catalogDescriptions,
          row.sourceComment
        );
        const targetName = row.requestedTargetName ?? row.dbName ?? '';
        const isTargetNameEmpty = Boolean(row.dfName) && !targetName.trim();
        const resolveState =
          resolveStates[normalizeName(row.dfName ?? row.dbName)] ?? 'idle';
        const initialTargetName = row.dfName
          ? initialTargetNames.get(normalizeName(row.dfName))
          : undefined;
        const isReconciling =
          resolveState === 'dirty' || resolveState === 'loading';
        const dbComment =
          !isReconciling && !isTargetNameEmpty && row.dbName
            ? dbCommentsByName.get(row.dbName)
            : undefined;
        const visibleAction = isReconciling ? null : row.suggestedAction;
        const isActionSelected = Boolean(
          visibleAction && selectedActionColumns.has(visibleAction.column_name)
        );
        const selectedAction = visibleAction
          ? selectedActionsByColumn.get(visibleAction.column_name)
          : undefined;
        const canEditNewNullable = Boolean(
          visibleAction?.type === 'add_column' && isActionSelected
        );
        const structuralAction = selectedActionsByColumn.get(row.dbName ?? '');
        const canEditExistingNullable = Boolean(
          row.dbName &&
          !isTargetNameEmpty &&
          !isReconciling &&
          !NOT_NULL_EDITABLE_STATUSES.has(row.status) &&
          (!structuralAction ||
            structuralAction.type === 'set_column_comment' ||
            structuralAction.type === 'set_column_nullable')
        );
        const existingNullable = row.dbName
          ? nullableOverrides?.[row.dbName]
          : undefined;
        const nullable = canEditNewNullable
          ? (selectedAction?.column?.nullable ?? row.dbNullable)
          : canEditExistingNullable
            ? (existingNullable ?? structuralAction?.nullable ?? row.dbNullable)
            : row.dbNullable;
        const nullableChanged = canEditNewNullable
          ? nullable !== row.dbNullable
          : canEditExistingNullable && nullable !== row.dbNullable;

        const isNewColumn = row.status === 'missing_in_db';
        const commentBaseline = isNewColumn
          ? sourceBaseline
          : row.dbComment !== undefined
            ? row.dbComment
            : (dbComment ?? null);
        // Пустой комментарий в БД заполняется комментарием из DF и уходит в
        // `set_column_comment` (как в getEffectiveDbCommentOverrides).
        const commentDefault =
          !isNewColumn &&
          commentsSupported !== false &&
          canFillEmptyDbComment(row.status, commentBaseline)
            ? (sourceBaseline ?? commentBaseline)
            : commentBaseline;
        const commentCurrent = isNewColumn
          ? commentValue(
              sourceCommentOverrides,
              row.dfName ?? '',
              sourceBaseline
            )
          : commentValue(commentOverrides, row.dbName ?? '', commentDefault);
        const commentChanged =
          normalizeComment(commentCurrent) !==
          normalizeComment(commentBaseline);
        const isDropSelected =
          selectedActionsByColumn.get(row.dbName ?? '')?.type === 'drop_column';
        const actionType = visibleAction?.type ?? null;
        const status = getStatusView(row.status, actionType, isActionSelected);

        return {
          key: getRowKey(row),
          row,
          targetName,
          isTargetNameEmpty,
          isTargetNameChanged:
            initialTargetName !== undefined && targetName !== initialTargetName,
          resolveState,
          isReconciling,
          visibleAction,
          isActionSelected,
          canEditNewNullable,
          canEditExistingNullable,
          nullable,
          nullableChanged,
          comment: {
            key: isNewColumn ? (row.dfName ?? '') : (row.dbName ?? ''),
            isNew: isNewColumn,
            value: commentCurrent,
            sourceBaseline,
            changed: commentChanged,
            disabled:
              !commentsSupported ||
              isBusy ||
              isReconciling ||
              isTargetNameEmpty ||
              isDropSelected,
          },
          status,
          isDiff:
            !RESOLVED_COLUMN_STATUSES.has(row.status) ||
            nullableChanged ||
            commentChanged,
          isOff:
            (actionType === 'add_column' && !isActionSelected) ||
            (actionType === 'drop_column' && isActionSelected),
        };
      }),
    [
      catalogDescriptions,
      columnDiff,
      commentOverrides,
      commentsSupported,
      dbCommentsByName,
      initialTargetNames,
      isBusy,
      nullableOverrides,
      resolveStates,
      selectedActionColumns,
      selectedActionsByColumn,
      sourceCommentOverrides,
    ]
  );

  const diffCount = derivedRows.filter(item => item.isDiff).length;
  const displayedRows = useMemo(() => {
    const normalizedSearch = columnSearch.trim().toLowerCase();
    return derivedRows.filter(item => {
      if (filter === 'diff' && !item.isDiff) return false;
      if (!normalizedSearch) return true;
      return [item.row.dfName, item.row.requestedTargetName, item.row.dbName]
        .filter(Boolean)
        .some(value => value!.toLowerCase().includes(normalizedSearch));
    });
  }, [columnSearch, derivedRows, filter]);
  const shouldVirtualize = displayedRows.length >= VIRTUALIZATION_THRESHOLD;

  const activeIndex = activeCommentKey
    ? displayedRows.findIndex(item => item.key === activeCommentKey)
    : -1;
  const activeRow = activeIndex >= 0 ? displayedRows[activeIndex] : null;

  useEffect(() => {
    if (activeCommentKey && activeIndex < 0) setActiveCommentKey(null);
  }, [activeCommentKey, activeIndex]);

  useEffect(() => {
    if (activeIndex < 0) return;
    const frame = requestAnimationFrame(() => {
      if (shouldVirtualize) {
        virtuosoRef.current?.scrollToIndex({
          index: activeIndex,
          align: 'center',
          behavior: 'smooth',
        });
        return;
      }
      const rowElement = bodyRef.current?.children[activeIndex];
      if (rowElement instanceof HTMLElement) {
        rowElement.scrollIntoView?.({ block: 'nearest' });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [activeIndex, shouldVirtualize]);

  const addActions = derivedRows.filter(
    item => item.visibleAction?.type === 'add_column'
  );
  const dropActions = derivedRows.filter(
    item => item.visibleAction?.type === 'drop_column'
  );
  const hasRenames = derivedRows.some(item => item.isTargetNameChanged);
  const nullableTargets = derivedRows.filter(
    item => item.canEditNewNullable || item.canEditExistingNullable
  );

  const setNullableForAll = (nullable: boolean) => {
    for (const item of nullableTargets) {
      if (Boolean(item.nullable) === nullable) continue;
      if (item.canEditNewNullable && item.visibleAction) {
        onActionNullableChange(item.visibleAction, nullable);
      } else if (item.canEditExistingNullable && item.row.dbName) {
        onExistingNullableChange(
          item.row.dbName,
          nullable,
          item.row.dbNullable
        );
      }
    }
  };

  const toggleActions = (items: DerivedRow[], selected: boolean) => {
    for (const item of items) {
      if (item.visibleAction && item.isActionSelected !== selected) {
        onToggleAction(item.visibleAction);
      }
    }
  };

  const closeMenuAnd = (action: () => void) => () => {
    setMenuAnchor(null);
    action();
  };

  const renderRow = (item: DerivedRow, index: number) => {
    const { row } = item;
    const isDbOnly = !row.dfName;
    const isActive = item.key === activeCommentKey;
    const action = item.visibleAction;
    const actionChoices = action ? ACTION_CHOICES[action.type] : null;
    const currentAction = actionChoices
      ? item.isActionSelected
        ? actionChoices.on
        : actionChoices.off
      : null;
    const nextAction = actionChoices
      ? item.isActionSelected
        ? actionChoices.off
        : actionChoices.on
      : null;
    const actionHint =
      currentAction && nextAction
        ? `Сейчас: ${currentAction.label}. Нажмите, чтобы ${nextAction.verb}`
        : undefined;
    const showNullable =
      item.nullable !== null ||
      item.canEditNewNullable ||
      item.canEditExistingNullable;
    const isLoading = item.resolveState === 'loading';
    const columnLabel = row.dbName ?? item.targetName ?? row.dfName ?? '';

    return (
      <GridBodyRow
        key={item.key}
        role='row'
        columns={MAPPING_GRID_COLUMNS}
        gap={MAPPING_GRID_GAP}
        active={isActive}
        off={item.isOff}
        data-first-row={index === 0}
      >
        <DfCell role='cell'>
          {isDbOnly ? (
            <MutedDash>—</MutedDash>
          ) : (
            <>
              <span className='df-name' title={row.dfName ?? ''}>
                {row.dfName}
              </span>
              {row.dfType ? (
                <span className='df-type'>{row.dfType.toLowerCase()}</span>
              ) : null}
            </>
          )}
        </DfCell>

        <span role='cell'>
          {isDbOnly ? (
            <DbOnlyName
              strike={action?.type === 'drop_column' && item.isActionSelected}
              title={row.dbName ?? ''}
            >
              {row.dbName ?? '—'}
            </DbOnlyName>
          ) : (
            <GridInput
              className='grid-input'
              mono
              invalid={item.isTargetNameEmpty}
            >
              <input
                value={item.targetName}
                onChange={event =>
                  onTargetNameChange(row.dfName!, event.target.value)
                }
                onBlur={() => onTargetNameBlur(row.dfName!, item.targetName)}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    onTargetNameBlur(row.dfName!, item.targetName);
                    event.currentTarget.blur();
                  } else if (event.key === 'Escape') {
                    event.preventDefault();
                    event.stopPropagation();
                    onTargetNameCancel(row.dfName!);
                  }
                }}
                aria-label={`Колонка DB для ${row.dfName}`}
                aria-invalid={item.isTargetNameEmpty}
                title={
                  item.isTargetNameEmpty
                    ? 'Название колонки DB обязательно'
                    : undefined
                }
                spellCheck={false}
                autoComplete='off'
              />
              {item.isReconciling ? (
                <Spinner
                  size={11}
                  role='status'
                  aria-label={isLoading ? 'Сопоставляем' : 'Изменено'}
                />
              ) : null}
              {item.isTargetNameChanged ? (
                <InputResetButton
                  type='button'
                  className='input-reset'
                  aria-label={`Сбросить имя колонки DB для ${row.dfName}`}
                  title='Вернуть исходное имя'
                  onMouseDown={event => event.preventDefault()}
                  onClick={() => onTargetNameReset(row.dfName!)}
                >
                  <CloseIcon size={10} />
                </InputResetButton>
              ) : null}
            </GridInput>
          )}
        </span>

        <span role='cell'>
          {row.dbType ? (
            <MonoText className='db-type' title={row.dbType}>
              {row.dbType}
            </MonoText>
          ) : (
            <MutedDash>—</MutedDash>
          )}
        </span>

        <span role='cell'>
          {showNullable ? (
            <ToggleSwitch
              type='button'
              role='switch'
              checked={Boolean(item.nullable)}
              changed={item.nullableChanged}
              aria-checked={Boolean(item.nullable)}
              aria-label={`Nullable for ${columnLabel}`}
              disabled={
                isBusy ||
                (!item.canEditNewNullable && !item.canEditExistingNullable)
              }
              onClick={() => {
                const next = !item.nullable;
                if (item.canEditNewNullable && action) {
                  onActionNullableChange(action, next);
                } else if (item.canEditExistingNullable && row.dbName) {
                  onExistingNullableChange(row.dbName, next, row.dbNullable);
                }
              }}
            />
          ) : (
            <MutedDash>—</MutedDash>
          )}
        </span>

        <span role='cell'>
          <CommentButton
            type='button'
            changed={item.comment.changed}
            active={isActive}
            title={item.comment.value ?? undefined}
            aria-label={`Комментарий колонки ${columnLabel}`}
            onClick={() =>
              setActiveCommentKey(current =>
                current === item.key ? null : item.key
              )
            }
          >
            {item.comment.value ? (
              <span className='comment-text'>{item.comment.value}</span>
            ) : (
              <span className='comment-placeholder'>Комментарий</span>
            )}
          </CommentButton>
        </span>

        <span role='cell' title={row.reason ?? undefined}>
          {item.isReconciling ? (
            <StatusText tone='muted'>
              {isLoading ? 'Сверяем…' : 'Изменено'}
            </StatusText>
          ) : (
            <StatusText tone={item.status.tone}>{item.status.label}</StatusText>
          )}
        </span>

        <span role='cell'>
          {action && actionChoices ? (
            <ActionCheckbox
              type='button'
              role='checkbox'
              aria-checked={item.isActionSelected}
              tone={actionChoices.tone}
              checked={item.isActionSelected}
              disabled={isBusy}
              title={actionHint}
              onClick={() => onToggleAction(action)}
            >
              <span className='checkbox-box' aria-hidden='true'>
                <CheckMark />
              </span>
              <span className='checkbox-label'>{actionChoices.on.label}</span>
            </ActionCheckbox>
          ) : item.nullableChanged && item.canEditExistingNullable ? (
            <ChangedNote>
              {item.nullable ? 'Разрешить NULL' : 'Запретить NULL'}
            </ChangedNote>
          ) : null}
        </span>
      </GridBodyRow>
    );
  };

  const emptyText =
    filter === 'diff' && !columnSearch.trim()
      ? 'Расхождений нет — все колонки совпадают'
      : columnSearch.trim()
        ? 'Колонки не найдены'
        : 'Нет данных для сравнения';

  return (
    <>
      <SchemaStepHeader>
        <TablePathChip
          parents={tableParents}
          tableName={tableName}
          countLabel={formatColumnCount(dbColumns?.length ?? 0)}
          onClick={onTablePathClick}
        />
        <HeaderSpacer />
        <SearchField style={{ width: 220, flex: 'none' }}>
          <SearchLead>
            <SearchIcon size={14} />
          </SearchLead>
          <input
            value={columnSearch}
            onChange={event => setColumnSearch(event.target.value)}
            placeholder='Поиск колонки'
            aria-label='Поиск колонки'
          />
        </SearchField>
        <SegmentGroup role='tablist' aria-label='Фильтр колонок'>
          <SegmentTab
            type='button'
            role='tab'
            active={filter === 'all'}
            aria-selected={filter === 'all'}
            onClick={() => setFilter('all')}
          >
            Все <span className='segment-count'>{derivedRows.length}</span>
          </SegmentTab>
          <SegmentTab
            type='button'
            role='tab'
            active={filter === 'diff'}
            aria-selected={filter === 'diff'}
            onClick={() => setFilter('diff')}
          >
            Расхождения <span className='segment-count'>{diffCount}</span>
          </SegmentTab>
        </SegmentGroup>
        <IconButtonBase
          type='button'
          aria-label='Действия с таблицей'
          title='Действия'
          aria-haspopup='menu'
          aria-expanded={Boolean(menuAnchor)}
          active={Boolean(menuAnchor)}
          disabled={isBusy}
          onClick={event => setMenuAnchor(event.currentTarget)}
        >
          <MoreIcon />
        </IconButtonBase>
        <ActionMenu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem
            disabled={nullableTargets.every(item => item.nullable === true)}
            onClick={closeMenuAnd(() => setNullableForAll(true))}
          >
            Разрешить NULL для всех
          </MenuItem>
          <MenuItem
            disabled={nullableTargets.every(item => item.nullable === false)}
            onClick={closeMenuAnd(() => setNullableForAll(false))}
          >
            Запретить NULL для всех
          </MenuItem>
          <Divider />
          <MenuItem
            disabled={addActions.every(item => item.isActionSelected)}
            onClick={closeMenuAnd(() => toggleActions(addActions, true))}
          >
            Создать все новые колонки
          </MenuItem>
          <MenuItem
            disabled={addActions.every(item => !item.isActionSelected)}
            onClick={closeMenuAnd(() => toggleActions(addActions, false))}
          >
            Не создавать новые колонки
          </MenuItem>
          <MenuItem
            disabled={dropActions.every(item => item.isActionSelected)}
            onClick={closeMenuAnd(() => toggleActions(dropActions, true))}
          >
            Удалить колонки, которых нет в DF
          </MenuItem>
          <Divider />
          <MenuItem
            disabled={!hasRenames}
            onClick={closeMenuAnd(onResetTargetNames)}
          >
            Сбросить переименования
          </MenuItem>
          <MenuItem disabled={!hasChanges} onClick={closeMenuAnd(onResetAll)}>
            Сбросить все изменения
          </MenuItem>
          <Divider />
          <MenuItem data-tone='danger' onClick={closeMenuAnd(onRecreateTable)}>
            Пересоздать таблицу
          </MenuItem>
        </ActionMenu>
      </SchemaStepHeader>

      {recreateTableError ? (
        <MessageBox tone='error' role='alert'>
          <span className='message-text'>{recreateTableError}</span>
        </MessageBox>
      ) : null}

      <TableArea dimmed={isBusy || hasResolveError}>
        <GridTable
          role='table'
          aria-label='Сопоставление колонок DF и БД'
          aria-busy={isBusy}
          data-table-content='true'
        >
          <GridHeadRow
            role='row'
            columns={MAPPING_GRID_COLUMNS}
            gap={MAPPING_GRID_GAP}
          >
            <span role='columnheader'>Колонка в DF</span>
            <span role='columnheader'>Колонка в БД</span>
            <span role='columnheader'>Тип в БД</span>
            <span role='columnheader'>NULL</span>
            <span role='columnheader'>Комментарий</span>
            <span role='columnheader'>Статус</span>
            <span role='columnheader'>Действие</span>
          </GridHeadRow>
          {displayedRows.length === 0 ? (
            <GridEmpty>{emptyText}</GridEmpty>
          ) : shouldVirtualize ? (
            <Virtuoso
              ref={virtuosoRef}
              data={displayedRows}
              style={{ flex: 1, minHeight: 0 }}
              computeItemKey={(_index, item) => item.key}
              components={VIRTUOSO_COMPONENTS}
              itemContent={(index, item) => renderRow(item, index)}
            />
          ) : (
            <GridBody ref={bodyRef}>
              {displayedRows.map((item, index) => renderRow(item, index))}
            </GridBody>
          )}
        </GridTable>

        {isBusy ? (
          <TableOverlay role='status'>
            <Spinner size={22} />
            <span className='overlay-title'>
              {isRecreatingTable
                ? 'Пересоздание таблицы...'
                : 'Проверка соответствия колонок...'}
            </span>
          </TableOverlay>
        ) : null}

        {hasResolveError ? (
          <TableOverlay role='alert'>
            <span className='overlay-title'>
              Не удалось проверить соответствие колонок
            </span>
            <span className='overlay-text'>{resolveError}</span>
            <SmallButton
              type='button'
              tone='primary'
              onClick={onRetryResolve}
              disabled={hasInvalidTargetName}
            >
              Повторить
            </SmallButton>
          </TableOverlay>
        ) : null}
      </TableArea>

      {activeRow ? (
        <ColumnCommentPanel
          columnName={
            activeRow.row.dbName ??
            activeRow.targetName ??
            activeRow.row.dfName ??
            ''
          }
          value={activeRow.comment.value}
          onChange={value =>
            onCommentChange?.(
              activeRow.comment.key,
              value,
              activeRow.comment.isNew
            )
          }
          sourceComment={activeRow.comment.sourceBaseline}
          onUseSource={() =>
            onCommentChange?.(
              activeRow.comment.key,
              activeRow.comment.sourceBaseline,
              activeRow.comment.isNew
            )
          }
          sourceAdornment={
            <CatalogDescriptionNote
              field={
                activeRow.row.dfName
                  ? catalogDescriptions?.[activeRow.row.dfName]
                  : undefined
              }
            />
          }
          disabled={activeRow.comment.disabled}
          disabledReason={
            !commentsSupported
              ? 'Редактирование комментариев недоступно для этой СУБД'
              : 'Комментарий сейчас нельзя изменить'
          }
          hasPrevious={activeIndex > 0}
          hasNext={activeIndex < displayedRows.length - 1}
          onPrevious={() =>
            setActiveCommentKey(displayedRows[activeIndex - 1]?.key ?? null)
          }
          onNext={() =>
            setActiveCommentKey(displayedRows[activeIndex + 1]?.key ?? null)
          }
          onClose={() => setActiveCommentKey(null)}
        />
      ) : null}
    </>
  );
};

const VirtualScroller = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<'div'>
>(({ style, ...props }, ref) => (
  <GridBody {...props} ref={ref} style={{ ...style, paddingBottom: 0 }} />
));

VirtualScroller.displayName = 'ExistingTableMappingVirtualScroller';

const VIRTUOSO_COMPONENTS = { Scroller: VirtualScroller };
