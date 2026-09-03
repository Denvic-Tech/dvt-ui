import React, { useMemo, useState } from 'react';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { type TableComponents, TableVirtuoso } from 'react-virtuoso';

import type {
  TableColumnActionInput,
  TableColumnActionOutput,
  WriteColumnResolutionRow,
} from '@/shared/gatewayClient';

import {
  type ColumnResolveState,
  getColumnActionLabel,
  normalizeName,
} from '../../../lib/helpers';
import {
  ColumnActionButton,
  ColumnActionCheck,
  ColumnActionDismiss,
  ColumnActionLabel,
  ColumnName,
  EmptyCell,
  MappingHeader,
  MappingHeaderLeft,
  MappingSection,
  MappingStatusBadge,
  MappingTable,
  MappingTableContainer,
  MappingTableHead,
  MappingTitle,
  NullableCheckboxInput,
  NullableCheckboxMark,
  NullableControl,
  NullableControlLabel,
  NullableReadOnlyChip,
  StatBadge,
  StatsBadgesRow,
  StyledTableRow,
  TableBodyCell,
  TableHeadCell,
  TypeBadge,
} from '../index.styles';

type ColumnDiffStatus = WriteColumnResolutionRow['status'];

type ColumnDiffRow = {
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

type MappingValidationSectionProps = {
  columnDiff: ColumnDiffRow[];
  diffSummary: {
    countDelta: number;
    dbCount: number;
    dfCount: number;
    missingInDb: number;
    missingInDf: number;
    softCast: number;
    typeMismatch: number;
  };
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
  onRecreateTable: () => void;
  resolveStates: Record<string, ColumnResolveState>;
};

const MinimalCheckIcon = () => (
  <svg width='12' height='12' viewBox='0 0 14 14' fill='none'>
    <polyline
      points='2,7 5.25,10 12,3'
      stroke='currentColor'
      strokeWidth='1.8'
      strokeLinecap='square'
      strokeLinejoin='miter'
    />
  </svg>
);

const CloseIcon = () => (
  <svg width='10' height='10' viewBox='0 0 10 10' fill='none'>
    <path d='M2 2l6 6M8 2L2 8' stroke='currentColor' strokeWidth='1.3' />
  </svg>
);

const PlusIcon = () => (
  <svg width='12' height='12' viewBox='0 0 14 14' fill='none'>
    <path
      d='M7 2.5v9M2.5 7h9'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='square'
    />
  </svg>
);

const TrashIcon = () => (
  <svg width='12' height='12' viewBox='0 0 14 14' fill='none'>
    <path
      d='M2.5 4h9M5 2.5h4M4 4l.5 7.5h5L10 4M6 6v3.5M8 6v3.5'
      stroke='currentColor'
      strokeWidth='1.2'
      strokeLinecap='square'
      strokeLinejoin='miter'
    />
  </svg>
);

const actionGlyph = (type: TableColumnActionOutput['type']) => {
  switch (type) {
    case 'add_column':
      return <PlusIcon />;
    case 'drop_column':
      return <TrashIcon />;
    case 'recreate_column':
      return '↻';
  }
};

const actionButtonLabel = (
  type: TableColumnActionOutput['type'],
  selected: boolean
) => {
  if (!selected) {
    return getColumnActionLabel(type);
  }

  switch (type) {
    case 'add_column':
      return 'Будет создана';
    case 'drop_column':
      return 'Будет удалена';
    case 'recreate_column':
      return 'Будет пересоздана';
  }
};

const ResolveStateIndicator = ({
  state,
  compact = false,
}: {
  state: ColumnResolveState;
  compact?: boolean;
}) => {
  if (state === 'idle') {
    return null;
  }

  if (compact && state === 'dirty') {
    return (
      <Box
        component='span'
        role='status'
        aria-label='изменено'
        sx={{
          display: 'block',
          width: 7,
          height: 7,
          borderRadius: '50%',
          bgcolor: '#f59e0b',
        }}
      />
    );
  }

  if (compact && state === 'loading') {
    return (
      <CircularProgress
        role='status'
        aria-label='сверяем'
        size={13}
        thickness={5}
        sx={{ display: 'block', color: '#4f46e5' }}
      />
    );
  }

  if (state === 'flash') {
    if (!compact) {
      return null;
    }

    return (
      <Box
        component='span'
        role='status'
        aria-label='сверено'
        sx={{
          display: 'block',
          color: '#059669',
          width: 14,
          height: 14,
        }}
      >
        <svg width='14' height='14' viewBox='0 0 14 14' fill='none'>
          <polyline
            points='2,7 5.25,10 12,3'
            stroke='currentColor'
            strokeWidth='1.8'
            strokeLinecap='square'
            strokeLinejoin='miter'
          />
        </svg>
      </Box>
    );
  }

  const config = {
    dirty: { color: '#b45309', label: 'изменено' },
    loading: { color: '#4f46e5', label: 'сверяем…' },
  }[state];

  return (
    <Box
      component='span'
      role='status'
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 16,
        gap: 0.75,
        color: config.color,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {state === 'dirty' ? (
        <Box
          component='span'
          sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#f59e0b' }}
        />
      ) : state === 'loading' ? (
        <CircularProgress size={12} thickness={5} color='inherit' />
      ) : null}
      <Box
        component='span'
        sx={{ display: 'block', lineHeight: 1, transform: 'translateY(-1px)' }}
      >
        {config.label}
      </Box>
    </Box>
  );
};

const statusLabel = (status: ColumnDiffStatus) => {
  switch (status) {
    case 'match':
      return 'OK';
    case 'explicit_mapping':
      return 'Mapped';
    case 'auto_transliterated':
      return 'Translit';
    case 'normalized_target':
      return 'Normalized';
    case 'case_resolved':
      return 'Case';
    case 'missing_in_db':
      return 'Нет в БД';
    case 'missing_in_dataframe':
      return 'Нет в DF';
    case 'type_mismatch':
      return 'Тип';
    case 'duplicate_effective_target':
      return 'Duplicate';
    case 'internal_column_ignored':
      return 'Ignored';
    case 'invalid':
      return 'Invalid';
  }
};

const statusVariant = (
  status: ColumnDiffStatus
): 'notInDb' | 'notInDf' | 'typeMismatch' | 'ok' | 'softCast' => {
  switch (status) {
    case 'missing_in_db':
      return 'notInDb';
    case 'missing_in_dataframe':
      return 'notInDf';
    case 'type_mismatch':
    case 'duplicate_effective_target':
    case 'invalid':
      return 'typeMismatch';
    case 'explicit_mapping':
    case 'auto_transliterated':
    case 'normalized_target':
    case 'case_resolved':
    case 'internal_column_ignored':
      return 'softCast';
    case 'match':
      return 'ok';
  }
};

const MAPPING_DIFF_VIRTUALIZATION_THRESHOLD = 60;

const RESOLVED_COLUMN_STATUSES = new Set<ColumnDiffStatus>([
  'match',
  'explicit_mapping',
  'auto_transliterated',
  'normalized_target',
  'case_resolved',
  'internal_column_ignored',
]);

const ACTION_ROW_COLORS: Record<
  TableColumnActionOutput['type'],
  { accent: string; background: string }
> = {
  add_column: { accent: '#22c55e', background: '#f0fdf4' },
  drop_column: { accent: '#ef4444', background: '#fef2f2' },
  recreate_column: { accent: '#f59e0b', background: '#fffbeb' },
};

// Стабильная ссылка на компоненты TableVirtuoso: переиспользуем существующие
// styled-примитивы таблицы, чтобы виртуализация не меняла внешний вид.
const DIFF_TABLE_COMPONENTS = {
  Scroller: MappingTableContainer,
  Table: MappingTable,
  TableHead: MappingTableHead,
  TableRow: StyledTableRow,
} as unknown as TableComponents<ColumnDiffRow>;

export const MappingValidationSection: React.FC<
  MappingValidationSectionProps
> = ({
  columnDiff,
  diffSummary,
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
  onRecreateTable,
  resolveStates,
}) => {
  const [columnSearch, setColumnSearch] = useState('');
  const [showOnlyMismatches, setShowOnlyMismatches] = useState(false);
  const [actionsMenuAnchor, setActionsMenuAnchor] =
    useState<HTMLElement | null>(null);
  const isBusy = isResolving || isRecreatingTable;
  const hasResolveError = Boolean(resolveError) && !isBusy;
  const hasMismatches = columnDiff.some(
    row => !RESOLVED_COLUMN_STATUSES.has(row.status)
  );
  const isMismatchFilterActive = showOnlyMismatches && hasMismatches;
  const displayedColumnDiff = useMemo(() => {
    const normalizedSearch = columnSearch.trim().toLowerCase();

    return columnDiff.filter(row => {
      if (isMismatchFilterActive && RESOLVED_COLUMN_STATUSES.has(row.status)) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [row.dfName, row.requestedTargetName, row.dbName].some(value =>
        value?.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [columnDiff, columnSearch, isMismatchFilterActive]);
  const shouldVirtualize =
    displayedColumnDiff.length >= MAPPING_DIFF_VIRTUALIZATION_THRESHOLD;

  const headerRow = (
    <tr>
      <TableHeadCell style={{ width: '18%' }}>Колонка DF</TableHeadCell>
      <TableHeadCell style={{ width: '9%' }}>Тип DF</TableHeadCell>
      <TableHeadCell style={{ width: '22%' }}>Колонка DB</TableHeadCell>
      <TableHeadCell style={{ width: '9%' }}>Тип DB</TableHeadCell>
      <TableHeadCell style={{ width: '10%' }}>NULL</TableHeadCell>
      <TableHeadCell style={{ width: '12%' }}>Статус</TableHeadCell>
      <TableHeadCell style={{ width: '20%' }}>Действие</TableHeadCell>
    </tr>
  );

  const renderRowCells = (_index: number, row: ColumnDiffRow) => {
    const targetName = row.requestedTargetName ?? row.dbName ?? '';
    const isTargetNameEmpty = Boolean(row.dfName) && !targetName.trim();
    const resolveStateKey = normalizeName(row.dfName ?? row.dbName);
    const resolveState = resolveStates[resolveStateKey] ?? 'idle';
    const initialTargetName = row.dfName
      ? initialTargetNames.get(normalizeName(row.dfName))
      : undefined;
    const isTargetNameChanged =
      initialTargetName !== undefined && targetName !== initialTargetName;
    const isReconciling =
      resolveState === 'dirty' || resolveState === 'loading';
    const hasInputIndicator = resolveState !== 'idle';
    const visibleAction = isReconciling ? null : row.suggestedAction;
    const actionColors = visibleAction
      ? ACTION_ROW_COLORS[visibleAction.type]
      : null;
    const isActionSelected = Boolean(
      visibleAction && selectedActionColumns.has(visibleAction.column_name)
    );
    const selectedAction = visibleAction
      ? selectedActionsByColumn.get(visibleAction.column_name)
      : undefined;
    const canEditNullable = Boolean(
      visibleAction?.type === 'add_column' && isActionSelected
    );
    const nullable =
      typeof selectedAction?.column?.nullable === 'boolean'
        ? selectedAction.column.nullable
        : row.dbNullable;
    const nullableLabel = nullable ? 'NULL' : 'NOT NULL';
    const rowCellStyle: React.CSSProperties | undefined =
      actionColors && isActionSelected
        ? { backgroundColor: actionColors.background }
        : undefined;
    const firstRowCellStyle: React.CSSProperties | undefined = actionColors
      ? {
          ...rowCellStyle,
          borderLeft: `3px solid ${actionColors.accent}`,
        }
      : rowCellStyle;

    return (
      <>
        <TableBodyCell style={firstRowCellStyle}>
          {row.dfName ? (
            <ColumnName>{row.dfName}</ColumnName>
          ) : (
            <EmptyCell>—</EmptyCell>
          )}
        </TableBodyCell>
        <TableBodyCell style={rowCellStyle}>
          {row.dfType ? (
            <TypeBadge dataType={row.dfType}>{row.dfType}</TypeBadge>
          ) : (
            <EmptyCell>—</EmptyCell>
          )}
        </TableBodyCell>
        <TableBodyCell style={rowCellStyle}>
          {row.dfName ? (
            <Box
              sx={{
                minWidth: 160,
                position: 'relative',
                '&:hover .target-name-reset, &:focus-within .target-name-reset':
                  {
                    opacity: 1,
                    pointerEvents: 'auto',
                  },
              }}
            >
              <Box
                component='input'
                value={targetName}
                onChange={event =>
                  onTargetNameChange(row.dfName!, event.target.value)
                }
                onBlur={() => onTargetNameBlur(row.dfName!, targetName)}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    onTargetNameBlur(row.dfName!, targetName);
                    event.currentTarget.blur();
                  } else if (event.key === 'Escape') {
                    event.preventDefault();
                    onTargetNameCancel(row.dfName!);
                  }
                }}
                aria-label={`Колонка DB для ${row.dfName}`}
                aria-invalid={isTargetNameEmpty}
                title={
                  isTargetNameEmpty
                    ? 'Название колонки DB обязательно'
                    : undefined
                }
                sx={{
                  width: '100%',
                  boxSizing: 'border-box',
                  border: `1px solid ${isTargetNameEmpty ? '#ef4444' : '#e5e7eb'}`,
                  backgroundColor: isTargetNameEmpty ? '#fef2f2' : '#ffffff',
                  borderRadius: '6px',
                  px: 1,
                  py: 0.5,
                  pr:
                    isTargetNameChanged && resolveState !== 'idle'
                      ? 7
                      : isTargetNameChanged
                        ? 4
                        : resolveState === 'dirty' || resolveState === 'loading'
                          ? 4
                          : resolveState === 'flash'
                            ? 4
                            : 1,
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  fontSize: 12,
                  color: isTargetNameEmpty ? '#b91c1c' : '#374151',
                  outline: 'none',
                  '&:focus': {
                    borderColor: isTargetNameEmpty ? '#dc2626' : '#c7d2fe',
                    boxShadow: isTargetNameEmpty
                      ? '0 0 0 3px rgba(239,68,68,0.12)'
                      : '0 0 0 3px rgba(99,102,241,0.08)',
                  },
                }}
              />
              {hasInputIndicator ? (
                <Box
                  sx={{
                    position: 'absolute',
                    right: isTargetNameChanged ? 38 : 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                >
                  <ResolveStateIndicator state={resolveState} compact />
                </Box>
              ) : null}
              {isTargetNameChanged ? (
                <Box
                  component='button'
                  type='button'
                  className='target-name-reset'
                  aria-label={`Сбросить имя колонки DB для ${row.dfName}`}
                  title='Вернуть исходное имя'
                  onMouseDown={event => event.preventDefault()}
                  onClick={() => onTargetNameReset(row.dfName!)}
                  sx={{
                    position: 'absolute',
                    right: 7,
                    top: '50%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 20,
                    height: 20,
                    p: 0,
                    border: 0,
                    borderRadius: '5px',
                    backgroundColor: 'transparent',
                    color: '#9ca3af',
                    opacity: 0,
                    transform: 'translateY(-50%)',
                    transition: 'opacity 120ms ease, color 120ms ease',
                    pointerEvents: 'none',
                    cursor: 'pointer',
                    '&:hover': {
                      color: '#4b5563',
                      backgroundColor: '#f3f4f6',
                    },
                    '& svg': { display: 'block' },
                  }}
                >
                  <CloseIcon />
                </Box>
              ) : null}
            </Box>
          ) : row.dbName ? (
            <ColumnName>{row.dbName}</ColumnName>
          ) : (
            <EmptyCell>—</EmptyCell>
          )}
        </TableBodyCell>
        <TableBodyCell style={rowCellStyle}>
          {row.dbType ? (
            <TypeBadge dataType={row.dbType}>{row.dbType}</TypeBadge>
          ) : (
            <EmptyCell>—</EmptyCell>
          )}
        </TableBodyCell>
        <TableBodyCell style={rowCellStyle}>
          {canEditNullable && visibleAction ? (
            <NullableControl>
              <NullableCheckboxInput
                type='checkbox'
                checked={Boolean(nullable)}
                onChange={event =>
                  onActionNullableChange(visibleAction, event.target.checked)
                }
                aria-label={`Nullable for ${visibleAction.column_name}`}
              />
              <NullableCheckboxMark checked={Boolean(nullable)} />
              <NullableControlLabel checked={Boolean(nullable)}>
                NULL
              </NullableControlLabel>
            </NullableControl>
          ) : nullable === null ? (
            <EmptyCell>—</EmptyCell>
          ) : (
            <NullableReadOnlyChip
              nullable={nullable}
              aria-label={`Nullable for ${targetName || row.dbName}: ${nullableLabel}`}
            >
              {nullableLabel}
            </NullableReadOnlyChip>
          )}
        </TableBodyCell>
        <TableBodyCell style={rowCellStyle}>
          {isReconciling ? (
            <ResolveStateIndicator state={resolveState} />
          ) : (
            <MappingStatusBadge
              variant={statusVariant(row.status)}
              title={row.reason ?? undefined}
            >
              {statusLabel(row.status)}
            </MappingStatusBadge>
          )}
        </TableBodyCell>
        <TableBodyCell style={rowCellStyle}>
          {isReconciling ? (
            <ResolveStateIndicator state={resolveState} />
          ) : row.suggestedAction ? (
            (() => {
              const action = row.suggestedAction;
              const isSelected = selectedActionColumns.has(action.column_name);
              const buttonLabel = actionButtonLabel(action.type, isSelected);
              return (
                <ColumnActionButton
                  type='button'
                  actionType={action.type}
                  selected={isSelected}
                  aria-pressed={isSelected}
                  title={buttonLabel}
                  onClick={() => onToggleAction(action)}
                >
                  <ColumnActionCheck>
                    {isSelected ? (
                      <MinimalCheckIcon />
                    ) : (
                      actionGlyph(action.type)
                    )}
                  </ColumnActionCheck>
                  <ColumnActionLabel>{buttonLabel}</ColumnActionLabel>
                  {isSelected ? (
                    <ColumnActionDismiss>
                      <CloseIcon />
                    </ColumnActionDismiss>
                  ) : null}
                </ColumnActionButton>
              );
            })()
          ) : (
            <EmptyCell>—</EmptyCell>
          )}
        </TableBodyCell>
      </>
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        height: '100%',
        minHeight: 0,
      }}
    >
      <MappingSection>
        <MappingHeader>
          <MappingHeaderLeft>
            <MappingTitle>Сопоставление DF и DB</MappingTitle>
            <StatsBadgesRow>
              <StatBadge>DF: {diffSummary.dfCount}</StatBadge>
              <StatBadge>DB: {diffSummary.dbCount}</StatBadge>
              <StatBadge
                variant={diffSummary.countDelta === 0 ? 'success' : 'warning'}
              >
                Δ: {diffSummary.countDelta >= 0 ? '+' : ''}
                {diffSummary.countDelta}
              </StatBadge>
              <StatBadge
                variant={diffSummary.missingInDb > 0 ? 'error' : 'default'}
              >
                Нет в БД: {diffSummary.missingInDb}
              </StatBadge>
              <StatBadge
                variant={diffSummary.missingInDf > 0 ? 'warning' : 'default'}
              >
                Нет в DF: {diffSummary.missingInDf}
              </StatBadge>
              <StatBadge
                variant={diffSummary.typeMismatch > 0 ? 'warning' : 'default'}
              >
                Блокеры: {diffSummary.typeMismatch}
              </StatBadge>
              <StatBadge
                variant={diffSummary.softCast > 0 ? 'info' : 'default'}
              >
                Resolved: {diffSummary.softCast}
              </StatBadge>
            </StatsBadgesRow>
          </MappingHeaderLeft>

          <Box>
            <IconButton
              aria-label='Действия с таблицей'
              aria-haspopup='menu'
              aria-expanded={actionsMenuAnchor ? 'true' : undefined}
              onClick={event => setActionsMenuAnchor(event.currentTarget)}
              disabled={isBusy}
              size='small'
              sx={{
                width: 32,
                height: 32,
                borderRadius: '9px',
                backgroundColor: 'transparent',
                color: '#6b7280',
                '&:hover': {
                  backgroundColor: '#e5e7eb',
                },
                '& .MuiSvgIcon-root': { fontSize: 18 },
              }}
            >
              <MoreVertRoundedIcon />
            </IconButton>

            <Menu
              anchorEl={actionsMenuAnchor}
              open={Boolean(actionsMenuAnchor)}
              onClose={() => setActionsMenuAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              MenuListProps={{ sx: { py: 0.5 } }}
              slotProps={{
                paper: {
                  sx: {
                    mt: 0.75,
                    minWidth: 250,
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.14)',
                    overflow: 'hidden',
                  },
                },
              }}
            >
              <MenuItem
                disableRipple
                onClick={() => {
                  setActionsMenuAnchor(null);
                  onRecreateTable();
                }}
                sx={{
                  alignItems: 'flex-start',
                  gap: 1.25,
                  width: 'auto',
                  mx: 0.5,
                  px: 2,
                  py: 1.25,
                  borderRadius: '7px',
                  '&:hover': { backgroundColor: '#fef2f2' },
                }}
              >
                <ReplayRoundedIcon
                  sx={{
                    mt: 0.15,
                    color: '#dc2626',
                    fontSize: 16,
                    transform: 'scaleX(-1)',
                  }}
                />
                <Box>
                  <Typography
                    sx={{ color: '#dc2626', fontSize: 12, fontWeight: 600 }}
                  >
                    Пересоздать таблицу
                  </Typography>
                  <Typography
                    sx={{
                      mt: 0.25,
                      maxWidth: 190,
                      color: '#9ca3af',
                      fontSize: 11,
                      lineHeight: 1.3,
                      whiteSpace: 'normal',
                    }}
                  >
                    Удалить и создать заново по схеме DataFrame
                  </Typography>
                </Box>
              </MenuItem>
            </Menu>
          </Box>
        </MappingHeader>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 2,
            py: 1.5,
            backgroundColor: '#fff',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <Box sx={{ position: 'relative', width: 240 }}>
            <SearchRoundedIcon
              sx={{
                position: 'absolute',
                left: 10,
                top: '50%',
                color: '#9ca3af',
                fontSize: 16,
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            />
            <Box
              component='input'
              value={columnSearch}
              onChange={event => setColumnSearch(event.target.value)}
              placeholder='Поиск колонки…'
              aria-label='Поиск по названию колонки'
              disabled={isBusy}
              sx={{
                width: '100%',
                height: 30,
                boxSizing: 'border-box',
                pl: 4,
                pr: 1.25,
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#f9fafb',
                color: '#374151',
                fontFamily: 'inherit',
                fontSize: 12,
                outline: 'none',
                '&:focus': {
                  borderColor: '#c7d2fe',
                  boxShadow: '0 0 0 3px rgba(99,102,241,0.08)',
                },
                '&::placeholder': { color: '#9ca3af', opacity: 1 },
              }}
            />
          </Box>

          {hasMismatches ? (
            <Button
              variant='outlined'
              size='small'
              disableRipple
              startIcon={<FilterAltOutlinedIcon />}
              aria-pressed={isMismatchFilterActive}
              onClick={() => setShowOnlyMismatches(current => !current)}
              disabled={isBusy}
              sx={{
                height: 30,
                minHeight: 30,
                maxHeight: 30,
                boxSizing: 'border-box',
                py: 0,
                borderColor: isMismatchFilterActive ? '#a5b4fc' : '#d1d5db',
                borderRadius: '8px',
                backgroundColor: isMismatchFilterActive ? '#eef2ff' : '#fff',
                color: isMismatchFilterActive ? '#4338ca' : '#374151',
                fontSize: 12,
                lineHeight: 1,
                textTransform: 'none',
                whiteSpace: 'nowrap',
                '&:hover': {
                  borderColor: isMismatchFilterActive ? '#818cf8' : '#9ca3af',
                  backgroundColor: isMismatchFilterActive
                    ? '#e0e7ff'
                    : '#f9fafb',
                },
                '& .MuiButton-startIcon': { mr: 0.75 },
                '& .MuiSvgIcon-root': { fontSize: 15 },
              }}
            >
              Только расхождения
            </Button>
          ) : null}
        </Box>

        {recreateTableError ? (
          <Alert severity='error' sx={{ mx: 2, mt: 1.5 }}>
            {recreateTableError}
          </Alert>
        ) : null}

        <Box
          sx={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex' }}
        >
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              transition: 'filter 160ms ease',
              ...(isBusy || hasResolveError
                ? {
                    filter: 'blur(2px)',
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }
                : {}),
            }}
            aria-busy={isBusy}
          >
            {displayedColumnDiff.length === 0 ? (
              <MappingTableContainer>
                <MappingTable aria-label='df-db-diff-table'>
                  <MappingTableHead>{headerRow}</MappingTableHead>
                  <tbody>
                    <StyledTableRow>
                      <TableBodyCell colSpan={7}>
                        {columnSearch.trim() || isMismatchFilterActive
                          ? 'Колонки с заданными условиями не найдены'
                          : 'Нет данных для сравнения'}
                      </TableBodyCell>
                    </StyledTableRow>
                  </tbody>
                </MappingTable>
              </MappingTableContainer>
            ) : shouldVirtualize ? (
              <TableVirtuoso
                key={isMismatchFilterActive ? 'mismatches' : 'all'}
                data={displayedColumnDiff}
                aria-label='df-db-diff-table'
                style={{ flex: 1, minHeight: 0, height: '100%', width: '100%' }}
                components={DIFF_TABLE_COMPONENTS}
                fixedHeaderContent={() => headerRow}
                itemContent={renderRowCells}
              />
            ) : (
              <MappingTableContainer
                key={isMismatchFilterActive ? 'mismatches' : 'all'}
              >
                <MappingTable aria-label='df-db-diff-table'>
                  <MappingTableHead>{headerRow}</MappingTableHead>
                  <tbody>
                    {displayedColumnDiff.map((row, index) => (
                      <StyledTableRow key={index}>
                        {renderRowCells(index, row)}
                      </StyledTableRow>
                    ))}
                  </tbody>
                </MappingTable>
              </MappingTableContainer>
            )}
          </Box>

          {isBusy ? (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.5,
                zIndex: 2,
                borderRadius: 'inherit',
                backgroundColor: 'rgba(255, 255, 255, 0.55)',
              }}
            >
              <CircularProgress size={28} thickness={4} />
              <Typography
                sx={{ fontSize: 13, color: '#4b5563', fontWeight: 500 }}
              >
                {isRecreatingTable
                  ? 'Пересоздание таблицы...'
                  : 'Проверка соответствия колонок...'}
              </Typography>
            </Box>
          ) : null}

          {hasResolveError ? (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.5,
                px: 3,
                zIndex: 3,
                borderRadius: 'inherit',
                backgroundColor: 'rgba(255, 255, 255, 0.82)',
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  backgroundColor: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '& .MuiSvgIcon-root': { fontSize: 24, color: '#d97706' },
                }}
              >
                <WarningAmberIcon />
              </Box>
              <Typography
                sx={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}
              >
                Не удалось проверить соответствие колонок
              </Typography>
              <Typography
                sx={{
                  fontSize: 12.5,
                  color: '#6b7280',
                  textAlign: 'center',
                  maxWidth: 560,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {resolveError}
              </Typography>
              <Button
                variant='contained'
                size='small'
                startIcon={<ReplayRoundedIcon />}
                onClick={onRetryResolve}
                disabled={hasInvalidTargetName}
                sx={{ mt: 0.5, textTransform: 'none' }}
              >
                Повторить
              </Button>
            </Box>
          ) : null}
        </Box>
      </MappingSection>
    </Box>
  );
};
