import {
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  forwardRef,
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import TuneIcon from '@mui/icons-material/Tune';
import {
  Alert,
  Box,
  CircularProgress,
  Popover,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { FiDatabase } from 'react-icons/fi';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';

import { NodeModalStepperExtensionProps } from '@/app/providers/node-extensions';
import { useAppDispatch } from '@/app/providers/store';

import { useNodeConnections } from '@/features/node/get-node-connections';
import {
  CLICKHOUSE_ENGINE_OPTIONS,
  hydrateTableCreateSpecDraft,
  serializeTableCreateSpecDraft,
  TableCreateSpecEditor,
} from '@/features/node/table-create-spec-editor';

import { ColumnDropdownSelect } from '@/entities/data/dataframe';
import {
  invalidateDbCatalog,
  requireDbConnectionId,
  resolveDbCatalogMode,
} from '@/entities/data/db-connection';
import { useDbCatalogTable } from '@/entities/data/db-connection/model/hooks/useDbCatalog';
import { setOutputMetadata } from '@/entities/node/node-metadata';

import type {
  DataFrameMetadata,
  DataType,
  DbMetadata as DBMetadata,
  DbTable,
  Metadata,
  TableColumnActionInput,
  TableColumnActionOutput,
} from '@/shared/gatewayClient';
import { client } from '@/shared/gatewayClient';
import { upsertDbMetadataTable } from '@/shared/lib/db-metadata';
import { SingleOptionDropdownSelect } from '@/shared/ui';
import { useConfirmDialog } from '@/shared/ui/confirm-dialog';

import {
  buildColumnMappingNameKey,
  buildColumnSelectorOptionsFromMapping,
  buildCreateSqlCacheKey,
  buildDbColumnsFromColumnMapping,
  buildExistingTableColumnDiff,
  buildRequestedColumnMappingDraft,
  buildResolveWriteColumnsRequest,
  buildResolveWriteColumnsTriggerKey,
  buildSelectedWriteTargetLabel,
  type ColumnMappingChangeState,
  type ColumnMappingItem,
  type ColumnResolveState,
  type CreationMode,
  type ExistingTableColumnDiffRow,
  type ExtensionState,
  extractApiErrorMessage,
  findWriteTargetTable,
  getChangedTargetNameSourceNames,
  getColumnActionLabel,
  getColumnMappingValidationErrors,
  getColumnResolutionValidationErrors,
  getDefaultSelectedColumnActions,
  getLiteralStringValue,
  getResolvedTargetColumnNames,
  getResolvedTargetName,
  getSyncingColumnCount,
  getTypedSpecValidationErrors,
  normalizeName,
  normalizeResolvedColumnRows,
  normalizeTableCreateSpecColumns,
  normalizeTableCreateSpecForDialect,
  resolveCreationMode,
  type ResolvedColumnMappingRow,
  serializeColumnMapping,
  summarizeExistingTableColumnDiff,
  type WriteDataFrameToDBValues,
} from '../lib/helpers';

import { MappingValidationSection } from './WriteSettingsStep/sections/MappingValidationSection';
import {
  AdvancedPanel,
  AdvancedToggle,
  BulkMenuContainer,
  BulkMenuItem,
  BulkMenuItemHint,
  BulkMenuItemTitle,
  BulkMenuSectionTitle,
  CellSelect,
  CellSelectChevron,
  CellSelectShell,
  ChangedCellSelect,
  ChangedNullableSwitch,
  ChangedNullSwitchCell,
  ChangedTargetInput,
  CountLabel,
  DDLPreviewBox,
  DtypeBadge,
  EffectiveColumnIcon,
  EffectiveColumnName,
  EffectiveColumnSkeleton,
  EffectiveColumnValue,
  ErrorList,
  FieldBlock,
  FieldLabel,
  InlineInfoText,
  MappingModalHeader,
  MappingModalHeaderIcon,
  MappingModalHeaderLeft,
  MappingModalStat,
  MappingModalStatLabel,
  MappingModalStats,
  MappingModalStatValue,
  MappingModalSubtitle,
  MappingModalTitle,
  MappingModalTitleGroup,
  MappingRow,
  MappingTableBody,
  MappingTableContainer,
  MappingTableHead,
  NullableSwitch,
  NullSwitchCell,
  OutlineButton,
  PreviewCode,
  PreviewHeader,
  PreviewTitle,
  SchemaCard,
  SchemaRoleBadge,
  SchemaRoleCell,
  SchemaRolePlaceholder,
  SearchField,
  SearchIconWrap,
  SearchInput,
  SectionHint,
  SectionTitle,
  SectionTitleRow,
  SegmentButton,
  SegmentControl,
  SourceMeta,
  SourceName,
  SqlTextArea,
  TargetInput,
  TextActionButton,
  TextActionRow,
  ToolbarRow,
  ToolbarSpacer,
} from './SchemaStrategyStep.styles';

const DATA_TYPE_OPTIONS: DataType[] = [
  'INT',
  'FLOAT',
  'STRING',
  'BOOLEAN',
  'DATETIME',
  'TIMEDELTA',
  'CATEGORY',
  'DICTIONARY',
  'OBJECT',
  'UNKNOWN',
];

const SCHEMA_STRATEGY_FONT_FAMILY =
  'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const MAPPING_TABLE_VIRTUALIZATION_THRESHOLD = 80;
const MAPPING_TABLE_OVERSCAN_PX = 240;

type ColumnSchemaRole = {
  key: string;
  label: string;
  tone: 'primary' | 'success' | 'warning' | 'neutral';
};

const MAPPING_ROLE_LEGEND: Array<{
  key: string;
  label: string;
  description: string;
  tone: ColumnSchemaRole['tone'];
}> = [
  {
    key: 'ord',
    label: 'ORD',
    description: 'Order by',
    tone: 'primary',
  },
  {
    key: 'pk',
    label: 'PK',
    description: 'Primary key',
    tone: 'warning',
  },
  {
    key: 'part',
    label: 'PART',
    description: 'Partition by',
    tone: 'success',
  },
];

const EMPTY_SCHEMA_ROLES: ColumnSchemaRole[] = [];
const EFFECTIVE_DB_COLUMN_TOOLTIP =
  'Имя, под которым колонка создастся в базе данных';
const EFFECTIVE_NAME_FLASH_DURATION_MS = 950;
const COLUMN_RESOLVE_DEBOUNCE_MS = 1200;
const COLUMN_RESOLVE_FLASH_MS = 1000;

const normalizeSourceKeys = (sourceNames: Array<string | null | undefined>) => {
  return Array.from(
    new Set(
      sourceNames.map(sourceName => normalizeName(sourceName)).filter(Boolean)
    )
  );
};

const buildResolvedTargetBySource = (
  rows: ResolvedColumnMappingRow[]
): Map<string, string | null> => {
  return new Map(
    rows
      .filter(
        (
          row
        ): row is ResolvedColumnMappingRow & {
          source_name: string;
        } => Boolean(row.source_name)
      )
      .map(row => [normalizeName(row.source_name), getResolvedTargetName(row)])
  );
};

const getMappingFingerprint = (mapping?: ColumnMappingItem[] | null) => {
  return JSON.stringify(serializeColumnMapping(mapping) ?? null);
};

const isClickHouseConnection = (metadata: DBMetadata | null) => {
  return metadata?.dialect?.toLowerCase() === 'clickhouse';
};

const toSnakeCase = (value: string) => {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .replace(/__+/g, '_')
    .toLowerCase()
    .trim();
};

const toNormalizedRoleColumnList = (
  value: string | string[] | null | undefined
): string[] => {
  if (Array.isArray(value)) {
    return value.map(columnName => columnName.trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized ? [normalized] : [];
  }

  return [];
};

const buildSchemaRolesByTarget = (
  tableCreateSpec: WriteDataFrameToDBValues['table_create_spec']
): Map<string, ColumnSchemaRole[]> => {
  const rolesByTarget = new Map<string, ColumnSchemaRole[]>();
  const addRole = (
    columnName: string | null | undefined,
    role: ColumnSchemaRole
  ) => {
    const normalizedColumnName = normalizeName(columnName);
    if (!normalizedColumnName) {
      return;
    }

    const currentRoles = rolesByTarget.get(normalizedColumnName) ?? [];
    if (currentRoles.some(currentRole => currentRole.key === role.key)) {
      return;
    }

    rolesByTarget.set(normalizedColumnName, [...currentRoles, role]);
  };

  const primaryKeyColumns = toNormalizedRoleColumnList(
    tableCreateSpec?.primary_key_cols
  );
  primaryKeyColumns.forEach((columnName, index) => {
    addRole(columnName, {
      key: `pk:${index}`,
      label: primaryKeyColumns.length > 1 ? `PK ${index + 1}` : 'PK',
      tone: 'warning',
    });
  });

  const clickhouseSpec = tableCreateSpec?.clickhouse;
  toNormalizedRoleColumnList(clickhouseSpec?.order_by).forEach(
    (columnName, index) => {
      addRole(columnName, {
        key: `ord:${index}`,
        label: `ORD ${index + 1}`,
        tone: 'primary',
      });
    }
  );
  toNormalizedRoleColumnList(clickhouseSpec?.partition_by).forEach(
    (columnName, index, allColumns) => {
      addRole(columnName, {
        key: `part:${index}`,
        label: allColumns.length > 1 ? `PART ${index + 1}` : 'PART',
        tone: 'success',
      });
    }
  );
  toNormalizedRoleColumnList(clickhouseSpec?.primary_key).forEach(
    (columnName, index) => {
      addRole(columnName, {
        key: `ch-pk:${index}`,
        label: primaryKeyColumns.length > 0 ? `CH PK ${index + 1}` : 'PK',
        tone: 'warning',
      });
    }
  );
  toNormalizedRoleColumnList(clickhouseSpec?.summing_columns).forEach(
    (columnName, index, allColumns) => {
      addRole(columnName, {
        key: `sum:${index}`,
        label: allColumns.length > 1 ? `SUM ${index + 1}` : 'SUM',
        tone: 'neutral',
      });
    }
  );
  toNormalizedRoleColumnList(clickhouseSpec?.sample_by).forEach(
    (columnName, index, allColumns) => {
      addRole(columnName, {
        key: `sample:${index}`,
        label: allColumns.length > 1 ? `SAMPLE ${index + 1}` : 'SAMPLE',
        tone: 'neutral',
      });
    }
  );
  addRole(clickhouseSpec?.version_column, {
    key: 'version',
    label: 'VER',
    tone: 'neutral',
  });
  addRole(clickhouseSpec?.sign_column, {
    key: 'sign',
    label: 'SIGN',
    tone: 'neutral',
  });

  return rolesByTarget;
};

const CodeIcon = ({ size = 12, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox='0 0 16 16' fill='none'>
    <path
      d='M4.5 3L2 8l2.5 5M11.5 3L14 8l-2.5 5'
      stroke={color}
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const TableIcon = ({ size = 12, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox='0 0 16 16' fill='none'>
    <rect
      x='2'
      y='2'
      width='12'
      height='12'
      rx='2'
      stroke={color}
      strokeWidth='1.4'
    />
    <path d='M2 6h12M2 10h12M6 2v12' stroke={color} strokeWidth='1.4' />
  </svg>
);

const ExpandIcon = ({ size = 13, color = '#4f46e5' }) => (
  <svg width={size} height={size} viewBox='0 0 16 16' fill='none'>
    <path
      d='M10 2h4v4M2 10v4h4M14 2L9.5 6.5M2 14l4.5-4.5'
      stroke={color}
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const SearchIcon = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox='0 0 16 16' fill='none'>
    <circle cx='7' cy='7' r='5' stroke={color} strokeWidth='1.5' />
    <path
      d='M11 11l3 3'
      stroke={color}
      strokeWidth='1.5'
      strokeLinecap='round'
    />
  </svg>
);

const ChevronIcon = ({ size = 11, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox='0 0 16 16' fill='none'>
    <path
      d='M4 6l4 4 4-4'
      stroke={color}
      strokeWidth='1.6'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const ChevronRightIcon = ({ size = 11, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox='0 0 16 16' fill='none'>
    <path
      d='M6 4l4 4-4 4'
      stroke={color}
      strokeWidth='1.6'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const InfoIcon = ({ size = 12, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox='0 0 16 16' fill='none'>
    <circle cx='8' cy='8' r='6' stroke={color} strokeWidth='1.2' />
    <path
      d='M8 7v3.2M8 5.2h.01'
      stroke={color}
      strokeWidth='1.4'
      strokeLinecap='round'
    />
  </svg>
);

const ColumnResolveIndicator = ({
  state,
  right = 14,
}: {
  state: ColumnResolveState;
  right?: number;
}) => {
  if (state === 'idle') {
    return null;
  }

  if (state === 'dirty') {
    return (
      <Box
        component='span'
        role='status'
        aria-label='изменено'
        sx={{
          position: 'absolute',
          right,
          top: '50%',
          width: 7,
          height: 7,
          borderRadius: '50%',
          bgcolor: '#f59e0b',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
        }}
      />
    );
  }

  if (state === 'loading') {
    return (
      <CircularProgress
        role='status'
        aria-label='сверяем'
        size={13}
        thickness={5}
        sx={{
          position: 'absolute',
          right,
          top: '50%',
          color: '#4f46e5',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
        }}
      />
    );
  }

  return (
    <Box
      component='span'
      role='status'
      aria-label='сверено'
      sx={{
        position: 'absolute',
        right,
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#059669',
        display: 'block',
        width: 14,
        height: 14,
        pointerEvents: 'none',
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
};

const TargetNameResetIcon = () => (
  <svg width='10' height='10' viewBox='0 0 10 10' fill='none'>
    <path d='M2 2l6 6M8 2L2 8' stroke='currentColor' strokeWidth='1.3' />
  </svg>
);

type MappingTableProps = {
  changeStateBySource: Map<string, ColumnMappingChangeState>;
  filteredMapping: ResolvedColumnMappingRow[];
  flashingEffectiveSourceKeys: string[];
  initialTargetNames: ReadonlyMap<string, string>;
  onNullableChange: (sourceName: string, checked: boolean) => void;
  onTargetNameBlur: (sourceName: string, value: string) => void;
  onTargetNameCancel: (sourceName: string) => void;
  onTargetNameChange: (sourceName: string, value: string) => void;
  onTargetNameReset: (sourceName: string) => void;
  onTypeChange: (sourceName: string, value: DataType) => void;
  resolveStates: Record<string, ColumnResolveState>;
  resolvingEffectiveSourceKeys: string[];
  schemaRolesByTarget: Map<string, ColumnSchemaRole[]>;
  sourceDtypeBySource: Map<string, DataType | string>;
  highlightedSourceName: string | null;
};

type MappingTableRowProps = {
  item: ResolvedColumnMappingRow;
  last: boolean;
  sourceDtype: DataType | string;
  schemaRoles: ColumnSchemaRole[];
  isHighlighted: boolean;
  isEffectiveNameFlashing: boolean;
  isEffectiveNameResolving: boolean;
  canResetTargetName: boolean;
  targetNameChanged: boolean;
  dtypeChanged: boolean;
  nullableChanged: boolean;
  onNullableChange: (sourceName: string, checked: boolean) => void;
  onTargetNameBlur: (sourceName: string, value: string) => void;
  onTargetNameCancel: (sourceName: string) => void;
  onTargetNameChange: (sourceName: string, value: string) => void;
  onTargetNameReset: (sourceName: string) => void;
  onTypeChange: (sourceName: string, value: DataType) => void;
  resolveState: ColumnResolveState;
  registerRowElement?: (
    sourceName: string,
    element: HTMLDivElement | null
  ) => void;
};

const MappingTableScroller = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<'div'>
>(({ style, ...props }, ref) => (
  <div
    {...props}
    ref={ref}
    style={{
      ...(style ?? {}),
      overflowX: 'hidden',
      overflowY: 'auto',
      overscrollBehavior: 'contain',
      scrollbarGutter: 'stable',
    }}
  />
));

MappingTableScroller.displayName = 'MappingTableScroller';

const MappingTableRow = memo(
  ({
    item,
    last,
    sourceDtype,
    schemaRoles,
    isHighlighted,
    isEffectiveNameFlashing,
    isEffectiveNameResolving,
    canResetTargetName,
    targetNameChanged,
    dtypeChanged,
    nullableChanged,
    onNullableChange,
    onTargetNameBlur,
    onTargetNameCancel,
    onTargetNameChange,
    onTargetNameReset,
    onTypeChange,
    resolveState,
    registerRowElement,
  }: MappingTableRowProps) => {
    const sourceName = item.source_name ?? '';
    const sourceKey = normalizeName(sourceName);
    const requestedTargetName =
      item.requested_target_name ??
      item.effective_target_name ??
      item.db_name ??
      '';
    const effectiveTargetName = getResolvedTargetName(item);
    const effectiveDisplayName = effectiveTargetName ?? item.db_name ?? '-';
    const effectiveSkeletonWidth = `${Math.min(
      Math.max(effectiveDisplayName.length, requestedTargetName.length, 10),
      24
    )}ch`;
    const isDbOnly = !item.source_name;
    const TargetInputComponent = targetNameChanged
      ? ChangedTargetInput
      : TargetInput;
    const TypeSelectComponent = dtypeChanged ? ChangedCellSelect : CellSelect;
    const NullCellComponent = nullableChanged
      ? ChangedNullSwitchCell
      : NullSwitchCell;
    const NullSwitchComponent = nullableChanged
      ? ChangedNullableSwitch
      : NullableSwitch;

    const handleTargetNameChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => {
        if (!sourceName) {
          return;
        }
        onTargetNameChange(sourceName, event.target.value);
      },
      [onTargetNameChange, sourceName]
    );

    const handleTypeChange = useCallback(
      (event: ChangeEvent<HTMLSelectElement>) => {
        if (!sourceName) {
          return;
        }
        onTypeChange(sourceName, event.target.value as DataType);
      },
      [onTypeChange, sourceName]
    );

    const handleNullableChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => {
        if (!sourceName) {
          return;
        }
        onNullableChange(sourceName, event.target.checked);
      },
      [onNullableChange, sourceName]
    );

    return (
      <MappingRow
        ref={element =>
          item.source_name
            ? registerRowElement?.(item.source_name, element)
            : undefined
        }
        checked
        highlighted={isHighlighted}
        last={last}
      >
        <SourceMeta>
          {item.source_name ? (
            <SourceName>{item.source_name}</SourceName>
          ) : (
            <SchemaRolePlaceholder>DB only</SchemaRolePlaceholder>
          )}
          <DtypeBadge dtype={String(sourceDtype)}>{sourceDtype}</DtypeBadge>
        </SourceMeta>

        {isDbOnly ? (
          <SchemaRolePlaceholder>-</SchemaRolePlaceholder>
        ) : (
          <Box
            sx={{
              minWidth: 0,
              position: 'relative',
              '&:hover .target-name-reset, &:focus-within .target-name-reset': {
                opacity: 1,
                pointerEvents: 'auto',
              },
            }}
          >
            <TargetInputComponent
              value={requestedTargetName}
              onChange={handleTargetNameChange}
              onBlur={() => onTargetNameBlur(sourceName, requestedTargetName)}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  onTargetNameBlur(sourceName, requestedTargetName);
                  event.currentTarget.blur();
                } else if (event.key === 'Escape') {
                  event.preventDefault();
                  onTargetNameCancel(sourceName);
                }
              }}
              placeholder='target_name'
              aria-label={`Колонка DB для ${sourceName}`}
              aria-invalid={!requestedTargetName.trim()}
              title={
                requestedTargetName.trim()
                  ? undefined
                  : 'Название колонки DB обязательно'
              }
              style={{
                paddingRight:
                  canResetTargetName && resolveState !== 'idle'
                    ? 54
                    : canResetTargetName
                      ? 34
                      : resolveState === 'dirty' || resolveState === 'loading'
                        ? 28
                        : resolveState === 'flash'
                          ? 32
                          : 8,
              }}
            />
            <ColumnResolveIndicator
              state={resolveState}
              right={canResetTargetName ? 38 : 14}
            />
            {canResetTargetName ? (
              <Box
                component='button'
                type='button'
                className='target-name-reset'
                aria-label={`Сбросить имя колонки DB для ${sourceName}`}
                title='Вернуть исходное имя'
                onMouseDown={event => event.preventDefault()}
                onClick={() => onTargetNameReset(sourceName)}
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
                  '&:hover': { color: '#4b5563', backgroundColor: '#f3f4f6' },
                  '& svg': { display: 'block' },
                }}
              >
                <TargetNameResetIcon />
              </Box>
            ) : null}
          </Box>
        )}

        <EffectiveColumnValue
          flashing={isEffectiveNameFlashing}
          loading={isEffectiveNameResolving}
          title={isEffectiveNameResolving ? undefined : effectiveDisplayName}
        >
          <EffectiveColumnIcon
            flashing={isEffectiveNameFlashing}
            loading={isEffectiveNameResolving}
          >
            <FiDatabase size={11} />
          </EffectiveColumnIcon>
          {isEffectiveNameResolving && sourceKey ? (
            <EffectiveColumnSkeleton
              style={{ width: effectiveSkeletonWidth }}
            />
          ) : (
            <EffectiveColumnName>{effectiveDisplayName}</EffectiveColumnName>
          )}
        </EffectiveColumnValue>

        <CellSelectShell>
          <TypeSelectComponent
            value={(item.dtype ?? 'UNKNOWN') as DataType}
            onChange={handleTypeChange}
            disabled={isDbOnly}
          >
            {DATA_TYPE_OPTIONS.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </TypeSelectComponent>
          <CellSelectChevron>
            <ChevronIcon />
          </CellSelectChevron>
        </CellSelectShell>

        <NullCellComponent>
          <NullSwitchComponent
            checked={Boolean(item.nullable)}
            onChange={handleNullableChange}
            disabled={isDbOnly}
            inputProps={{
              'aria-label': `Nullable for ${requestedTargetName}`,
            }}
          />
        </NullCellComponent>

        <SchemaRoleCell>
          {schemaRoles.length > 0 ? (
            schemaRoles.map(role => (
              <SchemaRoleBadge key={role.key} tone={role.tone}>
                {role.label}
              </SchemaRoleBadge>
            ))
          ) : (
            <SchemaRolePlaceholder>-</SchemaRolePlaceholder>
          )}
        </SchemaRoleCell>
      </MappingRow>
    );
  }
);

MappingTableRow.displayName = 'MappingTableRow';

const MappingTable = memo(
  ({
    changeStateBySource,
    filteredMapping,
    flashingEffectiveSourceKeys,
    initialTargetNames,
    onNullableChange,
    onTargetNameBlur,
    onTargetNameCancel,
    onTargetNameChange,
    onTargetNameReset,
    onTypeChange,
    resolveStates,
    resolvingEffectiveSourceKeys,
    schemaRolesByTarget,
    sourceDtypeBySource,
    highlightedSourceName,
  }: MappingTableProps) => {
    const rowElementsRef = useRef(new Map<string, HTMLDivElement>());
    const virtuosoRef = useRef<VirtuosoHandle | null>(null);
    const shouldVirtualize =
      filteredMapping.length >= MAPPING_TABLE_VIRTUALIZATION_THRESHOLD;
    const highlightedIndex = useMemo(() => {
      const normalizedHighlightedSourceName = normalizeName(
        highlightedSourceName
      );
      if (!normalizedHighlightedSourceName) {
        return -1;
      }

      return filteredMapping.findIndex(item => {
        return (
          normalizeName(item.source_name) === normalizedHighlightedSourceName
        );
      });
    }, [filteredMapping, highlightedSourceName]);

    const registerRowElement = useCallback(
      (sourceName: string, element: HTMLDivElement | null) => {
        const normalizedSourceName = normalizeName(sourceName);
        if (!normalizedSourceName) {
          return;
        }

        if (element) {
          rowElementsRef.current.set(normalizedSourceName, element);
        } else {
          rowElementsRef.current.delete(normalizedSourceName);
        }
      },
      []
    );

    useEffect(() => {
      if (highlightedIndex < 0) {
        return;
      }

      const frame = requestAnimationFrame(() => {
        if (shouldVirtualize) {
          virtuosoRef.current?.scrollToIndex({
            index: highlightedIndex,
            align: 'center',
            behavior: 'smooth',
          });
          return;
        }

        const highlightedRow = rowElementsRef.current.get(
          normalizeName(filteredMapping[highlightedIndex]?.source_name)
        );
        highlightedRow?.scrollIntoView({
          block: 'center',
          behavior: 'smooth',
        });
      });

      return () => {
        cancelAnimationFrame(frame);
      };
    }, [filteredMapping, highlightedIndex, shouldVirtualize]);

    const renderRow = useCallback(
      (item: ResolvedColumnMappingRow, index: number, registerRow = false) => {
        const sourceKey = normalizeName(item.source_name);
        const sourceDtype = sourceDtypeBySource.get(sourceKey) ?? item.dtype;
        const effectiveTargetName = getResolvedTargetName(item);
        const schemaRoles =
          schemaRolesByTarget.get(normalizeName(effectiveTargetName)) ??
          EMPTY_SCHEMA_ROLES;
        const changeState = changeStateBySource.get(sourceKey);
        const requestedTargetName =
          item.requested_target_name ??
          item.effective_target_name ??
          item.db_name ??
          '';
        const initialTargetName = initialTargetNames.get(sourceKey);

        return (
          <MappingTableRow
            key={item.source_name ?? item.db_name ?? `${item.status}:${index}`}
            item={item}
            last={index === filteredMapping.length - 1}
            sourceDtype={sourceDtype ?? 'UNKNOWN'}
            schemaRoles={schemaRoles}
            isHighlighted={highlightedIndex === index}
            isEffectiveNameFlashing={flashingEffectiveSourceKeys.includes(
              sourceKey
            )}
            isEffectiveNameResolving={resolvingEffectiveSourceKeys.includes(
              sourceKey
            )}
            canResetTargetName={
              initialTargetName !== undefined &&
              requestedTargetName !== initialTargetName
            }
            targetNameChanged={Boolean(changeState?.targetNameChanged)}
            dtypeChanged={Boolean(changeState?.dtypeChanged)}
            nullableChanged={Boolean(changeState?.nullableChanged)}
            onNullableChange={onNullableChange}
            onTargetNameBlur={onTargetNameBlur}
            onTargetNameCancel={onTargetNameCancel}
            onTargetNameChange={onTargetNameChange}
            onTargetNameReset={onTargetNameReset}
            onTypeChange={onTypeChange}
            resolveState={resolveStates[sourceKey] ?? 'idle'}
            {...(registerRow ? { registerRowElement } : {})}
          />
        );
      },
      [
        changeStateBySource,
        flashingEffectiveSourceKeys,
        filteredMapping.length,
        highlightedIndex,
        initialTargetNames,
        onNullableChange,
        onTargetNameBlur,
        onTargetNameCancel,
        onTargetNameChange,
        onTargetNameReset,
        onTypeChange,
        resolveStates,
        registerRowElement,
        resolvingEffectiveSourceKeys,
        schemaRolesByTarget,
        sourceDtypeBySource,
      ]
    );

    return (
      <MappingTableContainer>
        <MappingTableHead>
          <div>Колонка в DataFrame</div>
          <div>Колонка в таблице</div>
          <Box
            component='div'
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              minWidth: 0,
              whiteSpace: 'nowrap',
            }}
          >
            <span>Effective DB column</span>
            <Tooltip title={EFFECTIVE_DB_COLUMN_TOOLTIP}>
              <Box
                component='span'
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color:
                    'rgba(var(--mui-palette-text-secondaryChannel) / 0.72)',
                  cursor: 'help',
                }}
              >
                <HelpOutlineRoundedIcon sx={{ fontSize: 13 }} />
              </Box>
            </Tooltip>
          </Box>
          <div>Тип</div>
          <div>Null</div>
          <div>Роль в схеме</div>
        </MappingTableHead>

        <MappingTableBody>
          {filteredMapping.length > 0 ? (
            shouldVirtualize ? (
              <Virtuoso
                ref={virtuosoRef}
                data={filteredMapping}
                style={{ height: '100%' }}
                overscan={MAPPING_TABLE_OVERSCAN_PX}
                increaseViewportBy={{
                  top: MAPPING_TABLE_OVERSCAN_PX,
                  bottom: MAPPING_TABLE_OVERSCAN_PX * 2,
                }}
                computeItemKey={(index, item) =>
                  item.source_name ?? item.db_name ?? `${item.status}:${index}`
                }
                components={{
                  Scroller: MappingTableScroller,
                }}
                itemContent={(index, item) => renderRow(item, index)}
              />
            ) : (
              <Box
                sx={{
                  height: '100%',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  overscrollBehavior: 'contain',
                  scrollbarGutter: 'stable',
                }}
              >
                {filteredMapping.map((item, index) =>
                  renderRow(item, index, true)
                )}
              </Box>
            )
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                px: 2,
                color: 'text.secondary',
              }}
            >
              <Typography sx={{ fontSize: 13 }}>
                Ничего не найдено по текущему фильтру
              </Typography>
            </Box>
          )}
        </MappingTableBody>
      </MappingTableContainer>
    );
  }
);

MappingTable.displayName = 'MappingTable';

export const SchemaStrategyStep = ({
  id: nodeID,
  isOpen,
  localInputData,
  setLocalInputData,
  setSharedState,
  sharedState,
}: NodeModalStepperExtensionProps<
  WriteDataFrameToDBValues,
  ExtensionState
>) => {
  const { getConnectedInputMetadata, connectedInputs } =
    useNodeConnections(nodeID);
  const { confirm } = useConfirmDialog();
  const dispatch = useAppDispatch();

  const [isSqlCopied, setIsSqlCopied] = useState<'raw' | 'typed' | null>(null);
  const [mappingSearch, setMappingSearch] = useState('');
  const deferredMappingSearch = useDeferredValue(mappingSearch);
  const [bulkAnchorEl, setBulkAnchorEl] = useState<HTMLElement | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [pendingEffectiveSourceKeys, setPendingEffectiveSourceKeys] = useState<
    string[]
  >([]);
  const [resolvingEffectiveSourceKeys, setResolvingEffectiveSourceKeys] =
    useState<string[]>([]);
  const [flashingEffectiveSourceKeys, setFlashingEffectiveSourceKeys] =
    useState<string[]>([]);
  const lastTypedInputsFingerprintRef = useRef<string | null>(null);
  const pendingEffectiveSourceKeysRef = useRef<string[]>([]);
  const effectiveFlashTimeoutRef = useRef<number | null>(null);
  const createSqlAbortControllerRef = useRef<AbortController | null>(null);
  const targetNameResolveAbortControllerRef = useRef<AbortController | null>(
    null
  );
  const forceFlashAllEffectiveColumnsRef = useRef(false);
  const resolveDebounceTimersRef = useRef(new Map<string, number>());
  const resolveFlashTimersRef = useRef(new Map<string, number>());
  const resolveRequestTokensRef = useRef(new Map<string, number>());
  const latestGlobalResolveTokenRef = useRef(0);
  const requestedMappingRef = useRef<ColumnMappingItem[]>([]);
  const committedTargetNamesRef = useRef(new Map<string, string>());
  const initialTargetNamesRef = useRef(new Map<string, string>());
  const columnResolveStatesRef = useRef<Record<string, ColumnResolveState>>({});

  useEffect(() => () => createSqlAbortControllerRef.current?.abort(), []);
  useEffect(
    () => () => targetNameResolveAbortControllerRef.current?.abort(),
    []
  );

  const inputConnectionMetadata = useMemo(
    () => getConnectedInputMetadata('connection') as DBMetadata | null,
    [getConnectedInputMetadata]
  );
  const inputDataframeMetadata = useMemo(
    () => getConnectedInputMetadata('df') as DataFrameMetadata | null,
    [getConnectedInputMetadata]
  );
  const literalTableName = useMemo(() => {
    return getLiteralStringValue(localInputData?.table_name);
  }, [localInputData?.table_name]);
  const literalDatabaseName = useMemo(() => {
    return getLiteralStringValue(localInputData?.database_name);
  }, [localInputData?.database_name]);
  const literalSchemaName = useMemo(() => {
    return getLiteralStringValue(localInputData?.schema_name);
  }, [localInputData?.schema_name]);

  const isTableNew = sharedState?.isTableNew ?? false;
  const lazySelectedTable = useDbCatalogTable(
    inputConnectionMetadata,
    literalDatabaseName,
    literalSchemaName,
    literalTableName,
    { enabled: !isTableNew }
  );
  const isClickHouse = useMemo(() => {
    return isClickHouseConnection(inputConnectionMetadata);
  }, [inputConnectionMetadata]);
  const selectedCreationMode = useMemo(() => {
    return resolveCreationMode(sharedState, localInputData);
  }, [localInputData, sharedState]);
  const requestedMapping = useMemo(() => {
    return buildRequestedColumnMappingDraft({
      dataframeMetadata: inputDataframeMetadata,
      existingMapping: localInputData?.column_mapping,
      existingDraft: sharedState?.requestedColumnMappingDraft,
    });
  }, [
    inputDataframeMetadata,
    localInputData?.column_mapping,
    sharedState?.requestedColumnMappingDraft,
  ]);
  const hasEmptyTargetName = requestedMapping.some(
    item => !item.target_name.trim()
  );
  const syncingColumnCount = getSyncingColumnCount(
    sharedState?.columnResolveStates
  );

  for (const item of requestedMapping) {
    const sourceKey = normalizeName(item.source_name);
    if (sourceKey && !initialTargetNamesRef.current.has(sourceKey)) {
      initialTargetNamesRef.current.set(sourceKey, item.target_name);
    }
  }

  useEffect(() => {
    requestedMappingRef.current = requestedMapping;
    for (const item of requestedMapping) {
      const sourceKey = normalizeName(item.source_name);
      if (!committedTargetNamesRef.current.has(sourceKey)) {
        committedTargetNamesRef.current.set(sourceKey, item.target_name);
      }
    }
  }, [requestedMapping]);

  useEffect(() => {
    columnResolveStatesRef.current = sharedState?.columnResolveStates ?? {};
  }, [sharedState?.columnResolveStates]);
  const baseMapping = useMemo(() => {
    return buildRequestedColumnMappingDraft({
      dataframeMetadata: inputDataframeMetadata,
      existingMapping: null,
    });
  }, [inputDataframeMetadata]);
  const baseMappingBySource = useMemo(() => {
    return new Map(
      baseMapping.map(item => [normalizeName(item.source_name), item] as const)
    );
  }, [baseMapping]);
  const sourceDtypeBySource = useMemo(() => {
    return new Map(
      baseMapping.map(
        item => [normalizeName(item.source_name), item.dtype] as const
      )
    );
  }, [baseMapping]);
  const resolvedMappingRows = useMemo(() => {
    return normalizeResolvedColumnRows({
      dataframeMetadata: inputDataframeMetadata,
      requestedMapping,
      response: {
        columns: sharedState?.resolvedColumnRows ?? undefined,
        diagnostics: sharedState?.resolvedDiagnostics ?? undefined,
      },
    });
  }, [
    inputDataframeMetadata,
    requestedMapping,
    sharedState?.resolvedColumnRows,
    sharedState?.resolvedDiagnostics,
  ]);
  const selectedTable = useMemo(() => {
    const embedded = findWriteTargetTable(
      inputConnectionMetadata,
      localInputData
    );
    if (embedded || !lazySelectedTable.item) {
      return embedded;
    }
    return {
      name: lazySelectedTable.item.name,
      type: lazySelectedTable.item.kind === 'view' ? 'VIEW' : 'BASE_TABLE',
      database_name: lazySelectedTable.item.databaseName,
      schema_name: lazySelectedTable.item.schemaName,
      columns: lazySelectedTable.item.columns.map(column => ({
        name: column.name,
        dtype: column.dtype as DataType,
        nullable: column.nullable,
        index: column.indexed,
        primary_key: column.primaryKey,
        indexes: column.indexes,
      })),
    } as DbTable;
  }, [inputConnectionMetadata, lazySelectedTable.item, localInputData]);
  const existingTableColumnDiff = useMemo<ExistingTableColumnDiffRow[]>(() => {
    if (isTableNew) {
      return [];
    }

    return buildExistingTableColumnDiff({
      dataframeMetadata: inputDataframeMetadata,
      requestedMapping,
      resolvedColumnRows: sharedState?.resolvedColumnRows,
      resolvedDiagnostics: sharedState?.resolvedDiagnostics,
    });
  }, [
    inputDataframeMetadata,
    isTableNew,
    requestedMapping,
    sharedState?.resolvedColumnRows,
    sharedState?.resolvedDiagnostics,
  ]);
  const existingTableDiffSummary = useMemo(() => {
    if (isTableNew) {
      return null;
    }

    return summarizeExistingTableColumnDiff({
      columnDiff: existingTableColumnDiff,
      dataframeColumnCount: inputDataframeMetadata?.columns?.length ?? 0,
      dbColumnCount: selectedTable?.columns?.length ?? 0,
    });
  }, [
    existingTableColumnDiff,
    inputDataframeMetadata?.columns?.length,
    isTableNew,
    selectedTable?.columns?.length,
  ]);
  const resolvedTargetBySource = useMemo(() => {
    return buildResolvedTargetBySource(resolvedMappingRows);
  }, [resolvedMappingRows]);
  const serializedEffectiveMapping = useMemo(() => {
    return serializeColumnMapping(
      requestedMapping.map(item => ({
        ...item,
        target_name:
          resolvedTargetBySource.get(normalizeName(item.source_name)) ??
          item.target_name,
      }))
    );
  }, [requestedMapping, resolvedTargetBySource]);
  const targetColumnNames = useMemo(() => {
    const resolvedNames = getResolvedTargetColumnNames(resolvedMappingRows);
    return resolvedNames.length > 0
      ? resolvedNames
      : requestedMapping.map(item => item.target_name);
  }, [requestedMapping, resolvedMappingRows]);
  const normalizedTypedSpec = useMemo(() => {
    return normalizeTableCreateSpecColumns(
      localInputData?.table_create_spec ?? null,
      targetColumnNames
    );
  }, [localInputData?.table_create_spec, targetColumnNames]);
  const normalizedTypedSpecForDialect = useMemo(() => {
    return normalizeTableCreateSpecForDialect({
      connectionMetadata: inputConnectionMetadata,
      value: normalizedTypedSpec,
      allowedColumnNames: targetColumnNames,
    });
  }, [inputConnectionMetadata, normalizedTypedSpec, targetColumnNames]);
  const schemaRolesByTarget = useMemo(() => {
    return buildSchemaRolesByTarget(normalizedTypedSpecForDialect);
  }, [normalizedTypedSpecForDialect]);
  const searchableMapping = useMemo(() => {
    return resolvedMappingRows.map(item => {
      const sourceDtype =
        sourceDtypeBySource.get(normalizeName(item.source_name)) ?? item.dtype;
      const effectiveTargetName = getResolvedTargetName(item);
      const schemaRoleTokens = (
        schemaRolesByTarget.get(normalizeName(effectiveTargetName)) ??
        EMPTY_SCHEMA_ROLES
      )
        .map(role => role.label.toLowerCase())
        .join(' ');

      return {
        item,
        searchText: [
          item.source_name,
          item.requested_target_name,
          effectiveTargetName,
          item.db_name,
          item.status,
          item.dtype,
          String(sourceDtype),
          schemaRoleTokens,
        ]
          .join(' ')
          .toLowerCase(),
      };
    });
  }, [resolvedMappingRows, schemaRolesByTarget, sourceDtypeBySource]);
  const filteredMapping = useMemo(() => {
    const query = deferredMappingSearch.trim().toLowerCase();
    if (!query) {
      return resolvedMappingRows;
    }

    return searchableMapping
      .filter(({ searchText }) => searchText.includes(query))
      .map(({ item }) => item);
  }, [deferredMappingSearch, resolvedMappingRows, searchableMapping]);
  const mappingChangeStateBySource = useMemo(() => {
    return new Map(
      requestedMapping.map(item => {
        const baseItem = baseMappingBySource.get(
          normalizeName(item.source_name)
        );
        const state = {
          targetNameChanged: Boolean(
            baseItem && item.target_name !== baseItem.target_name
          ),
          dtypeChanged: Boolean(baseItem && item.dtype !== baseItem.dtype),
          nullableChanged: Boolean(
            baseItem && Boolean(item.nullable) !== Boolean(baseItem.nullable)
          ),
        };
        return [normalizeName(item.source_name), state] as const;
      })
    );
  }, [baseMappingBySource, requestedMapping]);
  const changedMappingItems = useMemo(() => {
    return requestedMapping.filter(item => {
      const state = mappingChangeStateBySource.get(
        normalizeName(item.source_name)
      );
      return Boolean(
        state &&
        (state.targetNameChanged || state.dtypeChanged || state.nullableChanged)
      );
    });
  }, [requestedMapping, mappingChangeStateBySource]);
  const changedMappingCount = changedMappingItems.length;
  const columnOptions = useMemo(() => {
    return buildColumnSelectorOptionsFromMapping(serializedEffectiveMapping);
  }, [serializedEffectiveMapping]);
  const clickhouseEngineOptions = useMemo(() => {
    return CLICKHOUSE_ENGINE_OPTIONS.map(option => ({
      value: option,
      label: option,
    }));
  }, []);
  const selectedTargetLabel = useMemo(() => {
    return (
      buildSelectedWriteTargetLabel(localInputData) ||
      literalTableName ||
      'Target table'
    );
  }, [literalTableName, localInputData]);
  const typedSpecErrors = useMemo(() => {
    if (!isTableNew || selectedCreationMode !== 'typed') {
      return [] as string[];
    }

    return getTypedSpecValidationErrors({
      connectionMetadata: inputConnectionMetadata,
      mapping: serializedEffectiveMapping ?? requestedMapping,
      tableCreateSpec: localInputData?.table_create_spec ?? null,
      upsertKeyColumn: localInputData?.upsert_config?.key_column ?? null,
      requireUpsertKey:
        (localInputData?.write_mode ?? '').toLowerCase() === 'upsert',
      requireClickHouseCoreFields: false,
    });
  }, [
    inputConnectionMetadata,
    isTableNew,
    localInputData?.table_create_spec,
    localInputData?.upsert_config?.key_column,
    localInputData?.write_mode,
    requestedMapping,
    selectedCreationMode,
    serializedEffectiveMapping,
  ]);
  const mappingErrors = useMemo(() => {
    return getColumnMappingValidationErrors(requestedMapping);
  }, [requestedMapping]);
  const resolutionErrors = useMemo(() => {
    if (!isTableNew || selectedCreationMode !== 'typed') {
      return [] as string[];
    }

    return getColumnResolutionValidationErrors({
      rows: resolvedMappingRows,
      diagnostics: sharedState?.resolvedDiagnostics,
    });
  }, [
    isTableNew,
    resolvedMappingRows,
    selectedCreationMode,
    sharedState?.resolvedDiagnostics,
  ]);
  const tableCreateSpecDraft = useMemo(() => {
    return hydrateTableCreateSpecDraft(
      localInputData?.table_create_spec ?? null
    );
  }, [localInputData?.table_create_spec]);

  const typedPreviewSql = sharedState?.typedPreviewSql ?? '';
  const sqlErrorMessage = (sharedState?.createSqlError ?? '').trim();

  const canFetchTypedPreviewSql = Boolean(
    selectedCreationMode === 'typed' &&
    isTableNew &&
    literalTableName &&
    inputConnectionMetadata &&
    inputDataframeMetadata &&
    typedSpecErrors.length === 0 &&
    resolutionErrors.length === 0 &&
    !sharedState?.isResolvingColumns
  );
  const canFetchRawPreviewSql = Boolean(
    selectedCreationMode === 'raw' &&
    isTableNew &&
    literalTableName &&
    inputConnectionMetadata &&
    inputDataframeMetadata
  );
  const resolveWriteColumnsRequest = useMemo(() => {
    if (hasEmptyTargetName) {
      return null;
    }

    return buildResolveWriteColumnsRequest({
      connectionMetadata: inputConnectionMetadata,
      dataframeMetadata: inputDataframeMetadata,
      inputValues: localInputData,
      isTableNew,
      creationMode: selectedCreationMode,
      requestedMapping,
    });
  }, [
    hasEmptyTargetName,
    inputConnectionMetadata,
    inputDataframeMetadata,
    isTableNew,
    localInputData,
    requestedMapping,
    selectedCreationMode,
  ]);
  const resolveWriteColumnsKey = useMemo(() => {
    return buildResolveWriteColumnsTriggerKey(resolveWriteColumnsRequest);
  }, [resolveWriteColumnsRequest]);

  useEffect(() => {
    pendingEffectiveSourceKeysRef.current = pendingEffectiveSourceKeys;
  }, [pendingEffectiveSourceKeys]);

  useEffect(() => {
    return () => {
      if (effectiveFlashTimeoutRef.current !== null) {
        window.clearTimeout(effectiveFlashTimeoutRef.current);
      }
      for (const timer of resolveDebounceTimersRef.current.values()) {
        window.clearTimeout(timer);
      }
      for (const timer of resolveFlashTimersRef.current.values()) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  useEffect(() => {
    setSharedState(prev => ({
      ...(prev ?? {}),
      inputConnectionMetadata,
      inputDataframeMetadata,
      isTableNew,
      selectedCreationMode: resolveCreationMode(prev, localInputData),
    }));
  }, [
    inputConnectionMetadata,
    inputDataframeMetadata,
    isTableNew,
    localInputData,
    setSharedState,
  ]);

  useEffect(() => {
    if (isOpen && isTableNew && selectedCreationMode === 'typed') {
      return;
    }

    if (effectiveFlashTimeoutRef.current !== null) {
      window.clearTimeout(effectiveFlashTimeoutRef.current);
      effectiveFlashTimeoutRef.current = null;
    }
    setPendingEffectiveSourceKeys([]);
    setResolvingEffectiveSourceKeys([]);
    setFlashingEffectiveSourceKeys([]);
    forceFlashAllEffectiveColumnsRef.current = false;
  }, [isOpen, isTableNew, selectedCreationMode]);

  useEffect(() => {
    if (
      !isOpen ||
      !resolveWriteColumnsRequest ||
      !resolveWriteColumnsKey ||
      syncingColumnCount > 0 ||
      (isTableNew && selectedCreationMode !== 'typed')
    ) {
      return;
    }

    if (
      sharedState?.lastResolveColumnsKey === resolveWriteColumnsKey &&
      (sharedState?.resolvedColumnRows || sharedState?.resolveColumnsError)
    ) {
      // Ключ уже обработан (успех или ошибка) — не запускаем авто-повтор,
      // повторная попытка инициируется вручную через кнопку retry.
      if (pendingEffectiveSourceKeysRef.current.length > 0) {
        setPendingEffectiveSourceKeys([]);
        setResolvingEffectiveSourceKeys([]);
      }
      return;
    }

    let cancelled = false;
    let abortController: AbortController | null = null;
    const previousResolvedTargetBySource = new Map(resolvedTargetBySource);
    const timeout = window.setTimeout(() => {
      abortController = new AbortController();
      const nextResolvingSourceKeys = pendingEffectiveSourceKeysRef.current;
      setPendingEffectiveSourceKeys([]);
      setResolvingEffectiveSourceKeys(nextResolvingSourceKeys);
      setSharedState(prev => ({
        ...(prev ?? {}),
        isResolvingColumns: true,
        resolveColumnsError: null,
      }));

      void client.utils.ddl.resolveWriteColumns
        .post(
          {
            body: resolveWriteColumnsRequest,
          },
          { silent: true, signal: abortController.signal }
        )
        .then(response => {
          if (cancelled) {
            return;
          }

          const nextResolvedRows = normalizeResolvedColumnRows({
            dataframeMetadata: inputDataframeMetadata,
            requestedMapping,
            response: {
              columns: response.data.columns ?? undefined,
              diagnostics: response.data.diagnostics ?? undefined,
            },
          });
          const nextResolvedTargetBySource =
            buildResolvedTargetBySource(nextResolvedRows);
          const nextFlashingSourceKeys =
            forceFlashAllEffectiveColumnsRef.current
              ? nextResolvingSourceKeys
              : nextResolvingSourceKeys.filter(
                  sourceKey =>
                    previousResolvedTargetBySource.get(sourceKey) !==
                    nextResolvedTargetBySource.get(sourceKey)
                );
          forceFlashAllEffectiveColumnsRef.current = false;

          const effectiveMapping = serializeColumnMapping(
            (response.data.effective_column_mapping ?? []).map(item => ({
              source_name: item.source_name,
              target_name: item.target_name,
              dtype: (item.dtype ?? 'UNKNOWN') as DataType | string,
              nullable: item.nullable ?? null,
            }))
          );

          setSharedState(prev => ({
            ...(prev ?? {}),
            isRecreatingTable: false,
            isResolvingColumns: false,
            resolveColumnsError: null,
            lastResolveColumnsKey: resolveWriteColumnsKey,
            resolvedColumnRows: response.data.columns ?? [],
            resolvedDiagnostics: response.data.diagnostics ?? [],
            selectedColumnActions: getDefaultSelectedColumnActions(
              response.data.columns
            ),
          }));
          setResolvingEffectiveSourceKeys([]);

          if (effectiveFlashTimeoutRef.current !== null) {
            window.clearTimeout(effectiveFlashTimeoutRef.current);
            effectiveFlashTimeoutRef.current = null;
          }
          setFlashingEffectiveSourceKeys(nextFlashingSourceKeys);
          if (nextFlashingSourceKeys.length > 0) {
            effectiveFlashTimeoutRef.current = window.setTimeout(() => {
              setFlashingEffectiveSourceKeys(current =>
                current.filter(
                  sourceKey => !nextFlashingSourceKeys.includes(sourceKey)
                )
              );
              effectiveFlashTimeoutRef.current = null;
            }, EFFECTIVE_NAME_FLASH_DURATION_MS);
          }

          setLocalInputData(prev => {
            const currentFingerprint = getMappingFingerprint(
              prev?.column_mapping
            );
            const nextFingerprint = getMappingFingerprint(effectiveMapping);

            if (currentFingerprint === nextFingerprint) {
              return prev;
            }

            return {
              ...(prev ?? {}),
              column_mapping: effectiveMapping,
            };
          });
        })
        .catch(error => {
          if (cancelled) {
            return;
          }

          forceFlashAllEffectiveColumnsRef.current = false;
          setResolvingEffectiveSourceKeys([]);
          setSharedState(prev => ({
            ...(prev ?? {}),
            isRecreatingTable: false,
            isResolvingColumns: false,
            resolveColumnsError: extractApiErrorMessage(
              error,
              'Не удалось разрешить имена колонок через backend.'
            ),
            lastResolveColumnsKey: resolveWriteColumnsKey,
          }));
        });
    }, 250);

    return () => {
      cancelled = true;
      abortController?.abort();
      window.clearTimeout(timeout);
    };
  }, [
    isOpen,
    isTableNew,
    inputDataframeMetadata,
    requestedMapping,
    resolvedTargetBySource,
    resolveWriteColumnsKey,
    resolveWriteColumnsRequest,
    selectedCreationMode,
    syncingColumnCount,
    setLocalInputData,
    setSharedState,
    sharedState?.lastResolveColumnsKey,
    sharedState?.resolvedColumnRows,
    sharedState?.resolveColumnsError,
  ]);

  useEffect(() => {
    if (!isOpen || !isTableNew || selectedCreationMode !== 'typed') {
      return;
    }

    const currentFingerprint = buildColumnMappingNameKey(
      sharedState?.requestedColumnMappingDraft ?? null
    );
    const nextFingerprint = buildColumnMappingNameKey(requestedMapping);

    if (currentFingerprint === nextFingerprint) {
      return;
    }

    setSharedState(prev => ({
      ...(prev ?? {}),
      requestedColumnMappingDraft: serializeColumnMapping(requestedMapping),
    }));
  }, [
    isOpen,
    isTableNew,
    requestedMapping,
    selectedCreationMode,
    setSharedState,
    sharedState?.requestedColumnMappingDraft,
  ]);

  useEffect(() => {
    if (!isOpen || !isTableNew || selectedCreationMode !== 'typed') {
      return;
    }

    setLocalInputData(prev => {
      const nextSpec = normalizeTableCreateSpecColumns(
        prev?.table_create_spec ?? null,
        targetColumnNames
      );
      const nextUpsert =
        prev?.upsert_config?.key_column &&
        !targetColumnNames.some(
          columnName =>
            normalizeName(columnName) ===
            normalizeName(prev.upsert_config?.key_column)
        )
          ? null
          : (prev?.upsert_config ?? null);

      if (
        JSON.stringify(prev?.table_create_spec ?? null) ===
          JSON.stringify(nextSpec) &&
        JSON.stringify(prev?.upsert_config ?? null) ===
          JSON.stringify(nextUpsert)
      ) {
        return prev;
      }

      return {
        ...(prev ?? {}),
        table_create_spec: nextSpec,
        upsert_config: nextUpsert,
      };
    });
  }, [
    isOpen,
    isTableNew,
    selectedCreationMode,
    setLocalInputData,
    targetColumnNames,
  ]);

  useEffect(() => {
    if (!isOpen || !isTableNew || selectedCreationMode !== 'typed') {
      lastTypedInputsFingerprintRef.current = null;
      return;
    }

    const nextFingerprint = JSON.stringify({
      table: literalTableName,
      database: literalDatabaseName,
      schema: literalSchemaName,
      mapping: serializedEffectiveMapping,
      spec: normalizedTypedSpecForDialect,
    });

    if (lastTypedInputsFingerprintRef.current === nextFingerprint) {
      return;
    }

    lastTypedInputsFingerprintRef.current = nextFingerprint;
    setSharedState(prev => ({
      ...(prev ?? {}),
      typedPreviewSql: null,
      lastCreateSqlKey: null,
      createSqlError: null,
    }));
  }, [
    isOpen,
    isTableNew,
    literalDatabaseName,
    literalSchemaName,
    literalTableName,
    normalizedTypedSpecForDialect,
    selectedCreationMode,
    serializedEffectiveMapping,
    setSharedState,
  ]);

  const handleCreationModeChange = useCallback(
    (mode: CreationMode) => {
      setSharedState(prev => ({
        ...(prev ?? {}),
        selectedCreationMode: mode,
        ...(mode === 'typed' && prev?.selectedCreationMode !== 'typed'
          ? {
              typedPreviewSql: null,
              lastCreateSqlKey: null,
              createSqlError: null,
            }
          : {}),
      }));
    },
    [setSharedState]
  );

  const patchMapping = useCallback(
    (
      sourceName: string,
      updater: (current: ColumnMappingItem) => ColumnMappingItem,
      invalidateResolution: boolean
    ) => {
      const nextMapping = requestedMapping.map(item => {
        if (normalizeName(item.source_name) !== normalizeName(sourceName)) {
          return item;
        }

        return updater(item);
      });
      const changedTargetNameSourceKeys = invalidateResolution
        ? normalizeSourceKeys(
            getChangedTargetNameSourceNames(requestedMapping, nextMapping)
          )
        : [];

      if (changedTargetNameSourceKeys.length > 0) {
        setPendingEffectiveSourceKeys(current =>
          normalizeSourceKeys([...current, ...changedTargetNameSourceKeys])
        );
        setFlashingEffectiveSourceKeys(current =>
          current.filter(
            sourceKey => !changedTargetNameSourceKeys.includes(sourceKey)
          )
        );
      }

      if (!invalidateResolution) {
        const effectiveMapping = serializeColumnMapping(
          nextMapping.map(item => ({
            ...item,
            target_name:
              resolvedTargetBySource.get(normalizeName(item.source_name)) ??
              item.target_name,
          }))
        );

        setLocalInputData(prev => ({
          ...(prev ?? {}),
          column_mapping: effectiveMapping,
        }));
      }

      setSharedState(prev => {
        return {
          ...(prev ?? {}),
          requestedColumnMappingDraft: serializeColumnMapping(nextMapping),
          ...(invalidateResolution ? { lastResolveColumnsKey: null } : {}),
        };
      });
    },
    [
      requestedMapping,
      resolvedTargetBySource,
      setLocalInputData,
      setSharedState,
    ]
  );

  const handleRefreshResolvedColumns = useCallback(() => {
    if (hasEmptyTargetName) {
      return;
    }

    const nextSourceKeys = normalizeSourceKeys(
      requestedMapping.map(item => item.source_name)
    );

    if (nextSourceKeys.length === 0) {
      return;
    }

    forceFlashAllEffectiveColumnsRef.current = true;
    setPendingEffectiveSourceKeys(nextSourceKeys);
    setFlashingEffectiveSourceKeys([]);
    setSharedState(prev => ({
      ...(prev ?? {}),
      lastResolveColumnsKey: null,
      resolveColumnsError: null,
    }));
  }, [hasEmptyTargetName, requestedMapping, setSharedState]);

  const setMappingValue = useCallback(
    (nextMapping: ColumnMappingItem[], invalidateResolution: boolean) => {
      const changedTargetNameSourceKeys = invalidateResolution
        ? normalizeSourceKeys(
            getChangedTargetNameSourceNames(requestedMapping, nextMapping)
          )
        : [];

      if (changedTargetNameSourceKeys.length > 0) {
        setPendingEffectiveSourceKeys(current =>
          normalizeSourceKeys([...current, ...changedTargetNameSourceKeys])
        );
        setFlashingEffectiveSourceKeys(current =>
          current.filter(
            sourceKey => !changedTargetNameSourceKeys.includes(sourceKey)
          )
        );
      }

      if (!invalidateResolution) {
        const effectiveMapping = serializeColumnMapping(
          nextMapping.map(item => ({
            ...item,
            target_name:
              resolvedTargetBySource.get(normalizeName(item.source_name)) ??
              item.target_name,
          }))
        );

        setLocalInputData(prev => ({
          ...(prev ?? {}),
          column_mapping: effectiveMapping,
        }));
      }

      setSharedState(prev => ({
        ...(prev ?? {}),
        requestedColumnMappingDraft: serializeColumnMapping(nextMapping),
        ...(invalidateResolution ? { lastResolveColumnsKey: null } : {}),
      }));
    },
    [
      requestedMapping,
      resolvedTargetBySource,
      setLocalInputData,
      setSharedState,
    ]
  );

  const updateResolveState = useCallback(
    (sourceName: string, state: ColumnResolveState) => {
      const sourceKey = normalizeName(sourceName);
      const nextStates = {
        ...columnResolveStatesRef.current,
        [sourceKey]: state,
      };
      columnResolveStatesRef.current = nextStates;
      setSharedState(prev => ({
        ...(prev ?? {}),
        columnResolveStates: {
          ...(prev?.columnResolveStates ?? {}),
          [sourceKey]: state,
        },
      }));
    },
    [setSharedState]
  );

  const abortPendingTargetNameResolve = useCallback(() => {
    targetNameResolveAbortControllerRef.current?.abort();
    targetNameResolveAbortControllerRef.current = null;
    latestGlobalResolveTokenRef.current += 1;

    let changed = false;
    const nextStates = { ...columnResolveStatesRef.current };
    for (const [sourceKey, state] of Object.entries(nextStates)) {
      if (state === 'loading') {
        nextStates[sourceKey] = 'idle';
        changed = true;
      }
    }
    if (!changed) {
      return;
    }

    columnResolveStatesRef.current = nextStates;
    setSharedState(prev => ({
      ...(prev ?? {}),
      isResolvingColumns: false,
      columnResolveStates: nextStates,
    }));
  }, [setSharedState]);

  const updateTargetNameDraft = useCallback(
    (sourceName: string, value: string) => {
      const sourceKey = normalizeName(sourceName);
      const nextMapping = requestedMappingRef.current.map(item =>
        normalizeName(item.source_name) === sourceKey
          ? { ...item, target_name: value }
          : item
      );
      requestedMappingRef.current = nextMapping;
      setSharedState(prev => ({
        ...(prev ?? {}),
        requestedColumnMappingDraft: serializeColumnMapping(nextMapping),
      }));
      return nextMapping;
    },
    [setSharedState]
  );

  const scheduleResolveFlashReset = useCallback(
    (sourceKeys: string[]) => {
      for (const sourceKey of sourceKeys) {
        const previousTimer = resolveFlashTimersRef.current.get(sourceKey);
        if (previousTimer !== undefined) {
          window.clearTimeout(previousTimer);
        }
        const timer = window.setTimeout(() => {
          resolveFlashTimersRef.current.delete(sourceKey);
          setSharedState(prev => {
            if (prev?.columnResolveStates?.[sourceKey] !== 'flash') {
              return prev;
            }
            const nextStates = {
              ...prev.columnResolveStates,
              [sourceKey]: 'idle' as const,
            };
            columnResolveStatesRef.current = nextStates;
            return { ...prev, columnResolveStates: nextStates };
          });
        }, COLUMN_RESOLVE_FLASH_MS);
        resolveFlashTimersRef.current.set(sourceKey, timer);
      }
    },
    [setSharedState]
  );

  const doResolveTargetName = useCallback(
    async (sourceName: string, value: string) => {
      const sourceKey = normalizeName(sourceName);
      const debounceTimer = resolveDebounceTimersRef.current.get(sourceKey);
      if (debounceTimer !== undefined) {
        window.clearTimeout(debounceTimer);
        resolveDebounceTimersRef.current.delete(sourceKey);
      }

      const trimmedValue = value.trim();
      const nextMapping = updateTargetNameDraft(sourceName, trimmedValue);
      if (!trimmedValue) {
        updateResolveState(sourceName, 'dirty');
        return;
      }

      const request = buildResolveWriteColumnsRequest({
        connectionMetadata: inputConnectionMetadata,
        dataframeMetadata: inputDataframeMetadata,
        inputValues: localInputData,
        isTableNew,
        creationMode: selectedCreationMode,
        requestedMapping: nextMapping,
      });
      if (!request) {
        updateResolveState(sourceName, 'dirty');
        return;
      }

      abortPendingTargetNameResolve();
      const abortController = new AbortController();
      targetNameResolveAbortControllerRef.current = abortController;
      const requestToken =
        (resolveRequestTokensRef.current.get(sourceKey) ?? 0) + 1;
      resolveRequestTokensRef.current.set(sourceKey, requestToken);
      const globalToken = latestGlobalResolveTokenRef.current + 1;
      latestGlobalResolveTokenRef.current = globalToken;
      updateResolveState(sourceName, 'loading');

      try {
        const response = await client.utils.ddl.resolveWriteColumns.post(
          { body: request },
          { signal: abortController.signal, silent: true }
        );
        if (
          resolveRequestTokensRef.current.get(sourceKey) !== requestToken ||
          latestGlobalResolveTokenRef.current !== globalToken
        ) {
          return;
        }

        const effectiveMapping = serializeColumnMapping(
          (response.data.effective_column_mapping ?? []).map(item => ({
            source_name: item.source_name,
            target_name: item.target_name,
            dtype: (item.dtype ?? 'UNKNOWN') as DataType | string,
            nullable: item.nullable ?? null,
          }))
        );
        const loadingSourceKeys = Object.entries(columnResolveStatesRef.current)
          .filter(([, state]) => state === 'loading')
          .map(([key]) => key);
        const nextStates = {
          ...columnResolveStatesRef.current,
        };
        for (const key of loadingSourceKeys) {
          nextStates[key] = 'flash';
          const mappingItem = requestedMappingRef.current.find(
            item => normalizeName(item.source_name) === key
          );
          if (mappingItem) {
            committedTargetNamesRef.current.set(key, mappingItem.target_name);
          }
        }
        columnResolveStatesRef.current = nextStates;

        setSharedState(prev => ({
          ...(prev ?? {}),
          resolveColumnsError: null,
          lastResolveColumnsKey: buildResolveWriteColumnsTriggerKey(request),
          resolvedColumnRows: response.data.columns ?? [],
          resolvedDiagnostics: response.data.diagnostics ?? [],
          selectedColumnActions: getDefaultSelectedColumnActions(
            response.data.columns
          ),
          columnResolveStates: nextStates,
        }));
        setLocalInputData(prev => ({
          ...(prev ?? {}),
          column_mapping: effectiveMapping,
        }));
        setResolvingEffectiveSourceKeys([]);
        setFlashingEffectiveSourceKeys(loadingSourceKeys);
        scheduleResolveFlashReset(loadingSourceKeys);
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }
        if (
          resolveRequestTokensRef.current.get(sourceKey) !== requestToken ||
          latestGlobalResolveTokenRef.current !== globalToken
        ) {
          return;
        }

        const nextStates = { ...columnResolveStatesRef.current };
        for (const [key, state] of Object.entries(nextStates)) {
          if (state === 'loading') {
            nextStates[key] = 'idle';
          }
        }
        columnResolveStatesRef.current = nextStates;
        setSharedState(prev => ({
          ...(prev ?? {}),
          resolveColumnsError: extractApiErrorMessage(
            error,
            'Не удалось разрешить имена колонок через backend.'
          ),
          lastResolveColumnsKey: buildResolveWriteColumnsTriggerKey(request),
          columnResolveStates: nextStates,
        }));
      } finally {
        if (targetNameResolveAbortControllerRef.current === abortController) {
          targetNameResolveAbortControllerRef.current = null;
        }
      }
    },
    [
      abortPendingTargetNameResolve,
      inputConnectionMetadata,
      inputDataframeMetadata,
      isTableNew,
      localInputData,
      scheduleResolveFlashReset,
      selectedCreationMode,
      setLocalInputData,
      setSharedState,
      updateResolveState,
      updateTargetNameDraft,
    ]
  );

  const handleTargetNameEdit = useCallback(
    (sourceName: string, value: string) => {
      const sourceKey = normalizeName(sourceName);
      abortPendingTargetNameResolve();
      updateTargetNameDraft(sourceName, value);
      updateResolveState(sourceName, 'dirty');
      setSharedState(prev => ({
        ...(prev ?? {}),
        resolveColumnsError: null,
        isResolvingColumns: false,
      }));

      const previousTimer = resolveDebounceTimersRef.current.get(sourceKey);
      if (previousTimer !== undefined) {
        window.clearTimeout(previousTimer);
      }
      if (!value.trim()) {
        resolveDebounceTimersRef.current.delete(sourceKey);
        return;
      }
      const timer = window.setTimeout(() => {
        resolveDebounceTimersRef.current.delete(sourceKey);
        void doResolveTargetName(sourceName, value);
      }, COLUMN_RESOLVE_DEBOUNCE_MS);
      resolveDebounceTimersRef.current.set(sourceKey, timer);
    },
    [
      abortPendingTargetNameResolve,
      doResolveTargetName,
      setSharedState,
      updateResolveState,
      updateTargetNameDraft,
    ]
  );

  const handleTargetNameCommit = useCallback(
    (sourceName: string, value: string) => {
      if (
        columnResolveStatesRef.current[normalizeName(sourceName)] !== 'dirty'
      ) {
        return;
      }
      void doResolveTargetName(sourceName, value);
    },
    [doResolveTargetName]
  );

  const handleTargetNameCancel = useCallback(
    (sourceName: string) => {
      const sourceKey = normalizeName(sourceName);
      abortPendingTargetNameResolve();
      const debounceTimer = resolveDebounceTimersRef.current.get(sourceKey);
      if (debounceTimer !== undefined) {
        window.clearTimeout(debounceTimer);
        resolveDebounceTimersRef.current.delete(sourceKey);
      }
      resolveRequestTokensRef.current.set(
        sourceKey,
        (resolveRequestTokensRef.current.get(sourceKey) ?? 0) + 1
      );
      latestGlobalResolveTokenRef.current += 1;
      const committedValue =
        committedTargetNamesRef.current.get(sourceKey) ?? sourceName;
      updateTargetNameDraft(sourceName, committedValue);
      updateResolveState(sourceName, 'idle');
    },
    [abortPendingTargetNameResolve, updateResolveState, updateTargetNameDraft]
  );

  const handleTargetNameReset = useCallback(
    (sourceName: string) => {
      const initialValue = initialTargetNamesRef.current.get(
        normalizeName(sourceName)
      );
      if (initialValue === undefined) {
        return;
      }
      void doResolveTargetName(sourceName, initialValue);
    },
    [doResolveTargetName]
  );

  const handleRecreateTable = useCallback(async () => {
    if (sharedState?.isRecreatingTable || sharedState?.isResolvingColumns) {
      return;
    }

    const validationError = (() => {
      if (!inputConnectionMetadata) {
        return 'Отсутствует connection metadata для пересоздания таблицы.';
      }
      if (!selectedTable || !literalTableName) {
        return 'Не выбрана существующая target table.';
      }
      if (!inputDataframeMetadata) {
        return 'Отсутствуют metadata входного DataFrame.';
      }
      if (!resolveWriteColumnsRequest) {
        return 'Не удалось подготовить запрос проверки колонок.';
      }
      if (requestedMapping.length === 0) {
        return 'Для пересоздания таблицы нужна хотя бы одна колонка DataFrame.';
      }
      if (mappingErrors.length > 0) {
        return mappingErrors.join('\n');
      }
      return null;
    })();

    if (validationError) {
      setSharedState(prev => ({
        ...(prev ?? {}),
        recreateTableError: validationError,
      }));
      return;
    }

    const confirmed = await confirm({
      title: 'Пересоздать таблицу?',
      message: `Таблица "${selectedTargetLabel}" будет полностью пересоздана по текущему маппингу DataFrame. Все находящиеся в ней данные будут удалены. Продолжить?`,
      confirmLabel: 'Пересоздать',
      cancelLabel: 'Отмена',
      confirmColor: 'error',
    });

    if (!confirmed) {
      return;
    }

    setSharedState(prev => ({
      ...(prev ?? {}),
      isRecreatingTable: true,
      recreateTableError: null,
      resolveColumnsError: null,
    }));

    try {
      const response = await client.utils.ddl.recreateTable.post(
        {
          body: {
            connection_id: requireDbConnectionId(inputConnectionMetadata),
            table_name: literalTableName!,
            database_name: literalDatabaseName,
            schema_name: literalSchemaName,
            columns: buildDbColumnsFromColumnMapping({
              dataframeMetadata: inputDataframeMetadata!,
              mapping: requestedMapping,
            }),
            table_create_spec: null,
          },
        },
        { silent: true }
      );

      sharedState?.applyTableMetadataUpdate?.(response.data.table_metadata);

      const sourceKeys = normalizeSourceKeys(
        requestedMapping.map(item => item.source_name)
      );
      forceFlashAllEffectiveColumnsRef.current = true;
      setPendingEffectiveSourceKeys(sourceKeys);
      setFlashingEffectiveSourceKeys([]);
      setSharedState(prev => ({
        ...(prev ?? {}),
        recreateTableError: null,
        resolveColumnsError: null,
        resolvedColumnRows: null,
        resolvedDiagnostics: null,
        selectedColumnActions: [],
        lastResolveColumnsKey: null,
      }));
    } catch (error: unknown) {
      setSharedState(prev => ({
        ...(prev ?? {}),
        isRecreatingTable: false,
        recreateTableError: extractApiErrorMessage(
          error,
          'Не удалось пересоздать таблицу через backend.'
        ),
      }));
    }
  }, [
    confirm,
    inputConnectionMetadata,
    inputDataframeMetadata,
    literalDatabaseName,
    literalSchemaName,
    literalTableName,
    mappingErrors,
    requestedMapping,
    resolveWriteColumnsRequest,
    selectedTable,
    selectedTargetLabel,
    setSharedState,
    sharedState?.applyTableMetadataUpdate,
    sharedState?.isRecreatingTable,
    sharedState?.isResolvingColumns,
  ]);

  const selectedColumnActions = useMemo(
    () => sharedState?.selectedColumnActions ?? [],
    [sharedState?.selectedColumnActions]
  );
  const selectedActionColumns = useMemo(
    () => new Set(selectedColumnActions.map(action => action.column_name)),
    [selectedColumnActions]
  );
  const selectedActionsByColumn = useMemo(
    () =>
      new Map(
        selectedColumnActions.map(action => [action.column_name, action])
      ),
    [selectedColumnActions]
  );

  const handleToggleColumnAction = useCallback(
    (action: TableColumnActionOutput) => {
      setSharedState(prev => {
        const current = prev?.selectedColumnActions ?? [];
        const exists = current.some(
          item => item.column_name === action.column_name
        );
        const next = exists
          ? current.filter(item => item.column_name !== action.column_name)
          : [
              ...current,
              {
                type: action.type,
                column_name: action.column_name,
                column: action.column ?? null,
              } satisfies TableColumnActionInput,
            ];
        return {
          ...(prev ?? {}),
          selectedColumnActions: next,
        };
      });
    },
    [setSharedState]
  );

  const handleColumnActionNullableChange = useCallback(
    (action: TableColumnActionOutput, nullable: boolean) => {
      setSharedState(prev => ({
        ...(prev ?? {}),
        selectedColumnActions: (prev?.selectedColumnActions ?? []).map(item =>
          item.column_name === action.column_name
            ? {
                ...item,
                column: {
                  ...(item.column ?? action.column!),
                  nullable,
                },
              }
            : item
        ),
      }));
    },
    [setSharedState]
  );

  useEffect(() => {
    if (isTableNew || sharedState?.isResolvingColumns) {
      return;
    }

    if (selectedColumnActions.length === 0) {
      return;
    }

    const availableActionColumns = new Set(
      existingTableColumnDiff
        .filter(row => row.suggestedAction)
        .map(row => row.suggestedAction!.column_name)
    );

    const prunedActions = selectedColumnActions.filter(action =>
      availableActionColumns.has(action.column_name)
    );

    if (prunedActions.length === selectedColumnActions.length) {
      return;
    }

    setSharedState(prev => ({
      ...(prev ?? {}),
      selectedColumnActions: prunedActions,
    }));
  }, [
    existingTableColumnDiff,
    isTableNew,
    selectedColumnActions,
    setSharedState,
    sharedState?.isResolvingColumns,
  ]);

  useEffect(() => {
    const confirmColumnActions = async (
      actions: TableColumnActionInput[]
    ): Promise<boolean> => {
      const lines = actions
        .map(
          action =>
            `• ${getColumnActionLabel(action.type)}: ${action.column_name}`
        )
        .join('\n');

      return confirm({
        title: 'Применить изменения схемы?',
        message: `Будут применены изменения структуры таблицы "${selectedTargetLabel}" в базе данных:\n${lines}\n\nЭто действие изменит таблицу. Продолжить?`,
        confirmLabel: 'Применить',
        cancelLabel: 'Отмена',
        confirmColor: 'error',
      });
    };

    setSharedState(prev => ({
      ...(prev ?? {}),
      requestColumnActionsConfirm: confirmColumnActions,
    }));
  }, [confirm, selectedTargetLabel, setSharedState]);

  useEffect(() => {
    const connectionInput = connectedInputs?.['connection'];

    const applyTableMetadataUpdate = (tableMetadata: DbTable) => {
      if (!connectionInput || !inputConnectionMetadata) {
        return;
      }

      if (resolveDbCatalogMode(inputConnectionMetadata) === 'lazy') {
        dispatch(
          invalidateDbCatalog(requireDbConnectionId(inputConnectionMetadata))
        );
        return;
      }

      const nextMetadata = upsertDbMetadataTable(
        inputConnectionMetadata,
        tableMetadata,
        {
          // Матчим целевую таблицу так же, как её находит нода (findWriteTargetTable):
          // по значениям из inputData, а не по db/schema объекта из ответа.
          tableName: literalTableName,
          databaseName: literalDatabaseName,
          schemaName: literalSchemaName,
        }
      );

      dispatch(
        setOutputMetadata({
          nodeID: connectionInput.nodeID,
          outputName: connectionInput.outputName,
          // upsertDbMetadataTable сохраняет исходный type: 'DATABASE'.
          metadata: nextMetadata as Metadata,
        })
      );
    };

    setSharedState(prev => ({
      ...(prev ?? {}),
      applyTableMetadataUpdate,
    }));
  }, [
    connectedInputs,
    dispatch,
    inputConnectionMetadata,
    literalDatabaseName,
    literalSchemaName,
    literalTableName,
    setSharedState,
  ]);

  const patchTableCreateSpec = useCallback(
    (
      updater: (
        draft: ReturnType<typeof hydrateTableCreateSpecDraft>
      ) => ReturnType<typeof hydrateTableCreateSpecDraft>
    ) => {
      setLocalInputData(prev => {
        const currentDraft = hydrateTableCreateSpecDraft(
          prev?.table_create_spec ?? null
        );
        const nextDraft = updater(currentDraft);
        return {
          ...(prev ?? {}),
          table_create_spec: serializeTableCreateSpecDraft(nextDraft),
        };
      });
    },
    [setLocalInputData]
  );

  const copySql = useCallback(async (sql: string, mode: 'raw' | 'typed') => {
    if (!sql.trim()) {
      return;
    }

    await navigator.clipboard.writeText(sql);
    setIsSqlCopied(mode);
    window.setTimeout(() => {
      setIsSqlCopied(current => (current === mode ? null : current));
    }, 1400);
  }, []);

  const fetchCreateTableSql = useCallback(
    async (mode: CreationMode, forceRefresh = false) => {
      if (
        !literalTableName ||
        !inputConnectionMetadata ||
        !inputDataframeMetadata
      ) {
        return;
      }

      const requestKey = buildCreateSqlCacheKey({
        connectionMetadata: inputConnectionMetadata,
        dataframeMetadata: inputDataframeMetadata,
        inputValues: {
          ...(localInputData ?? {}),
          column_mapping: mode === 'typed' ? serializedEffectiveMapping : null,
          table_create_spec:
            mode === 'typed' ? normalizedTypedSpecForDialect : null,
        },
        mode,
      });
      const hasExistingSql =
        mode === 'typed'
          ? Boolean(typedPreviewSql.trim())
          : Boolean(localInputData?.create_table_sql?.trim());

      if (
        !forceRefresh &&
        sharedState?.lastCreateSqlKey === requestKey &&
        hasExistingSql
      ) {
        return;
      }

      setSharedState(prev => ({
        ...(prev ?? {}),
        isCreateSqlLoading: true,
        createSqlError: null,
        createTableError: null,
        createTableSuccess: null,
      }));

      createSqlAbortControllerRef.current?.abort();
      const abortController = new AbortController();
      createSqlAbortControllerRef.current = abortController;

      try {
        const response = await client.utils.ddl.generateTableDdl.post(
          {
            body: {
              connection_id: requireDbConnectionId(inputConnectionMetadata),
              table_name: literalTableName,
              database_name: literalDatabaseName,
              schema_name: literalSchemaName,
              columns: buildDbColumnsFromColumnMapping({
                dataframeMetadata: inputDataframeMetadata,
                mapping:
                  mode === 'typed'
                    ? serializedEffectiveMapping
                    : localInputData?.column_mapping,
              }),
              table_create_spec:
                mode === 'typed'
                  ? (normalizedTypedSpecForDialect as any)
                  : null,
            },
          },
          { silent: true, signal: abortController.signal }
        );

        if (createSqlAbortControllerRef.current !== abortController) {
          return;
        }

        if (mode === 'typed') {
          setSharedState(prev => ({
            ...(prev ?? {}),
            typedPreviewSql: response.data.sql,
          }));
        } else {
          setLocalInputData(prev => ({
            ...(prev ?? {}),
            create_table_sql: response.data.sql,
          }));
        }

        setSharedState(prev => ({
          ...(prev ?? {}),
          isCreateSqlLoading: false,
          createSqlError: null,
          lastCreateSqlKey: requestKey,
        }));
      } catch (error: unknown) {
        if (abortController.signal.aborted) {
          return;
        }
        setSharedState(prev => ({
          ...(prev ?? {}),
          isCreateSqlLoading: false,
          createSqlError:
            error instanceof Error && error.message.trim()
              ? error.message
              : 'Не удалось получить SQL для создания таблицы.',
          lastCreateSqlKey: requestKey,
        }));
      } finally {
        if (createSqlAbortControllerRef.current === abortController) {
          createSqlAbortControllerRef.current = null;
        }
      }
    },
    [
      inputConnectionMetadata,
      inputDataframeMetadata,
      literalDatabaseName,
      literalSchemaName,
      literalTableName,
      localInputData,
      normalizedTypedSpecForDialect,
      serializedEffectiveMapping,
      setLocalInputData,
      setSharedState,
      sharedState?.lastCreateSqlKey,
      typedPreviewSql,
    ]
  );

  useEffect(() => {
    if (
      !isOpen ||
      !isTableNew ||
      selectedCreationMode !== 'raw' ||
      !canFetchRawPreviewSql ||
      localInputData?.create_table_sql?.trim()
    ) {
      return;
    }

    void fetchCreateTableSql('raw', false);
  }, [
    canFetchRawPreviewSql,
    fetchCreateTableSql,
    isOpen,
    isTableNew,
    localInputData?.create_table_sql,
    selectedCreationMode,
  ]);

  const applyBulkAction = useCallback(
    (
      action:
        | 'snake_case'
        | 'lowercase'
        | 'reset_types'
        | 'all_not_null'
        | 'all_null'
        | 'reset_renames'
        | 'reset_all'
    ) => {
      if (action === 'reset_types') {
        setMappingValue(
          requestedMapping.map(item => {
            const baseItem = baseMappingBySource.get(
              normalizeName(item.source_name)
            );
            return {
              ...item,
              dtype: baseItem?.dtype ?? item.dtype,
            };
          }),
          false
        );
        setBulkAnchorEl(null);
        return;
      }

      if (action === 'all_not_null') {
        setMappingValue(
          requestedMapping.map(item => ({
            ...item,
            nullable: false,
          })),
          false
        );
        setBulkAnchorEl(null);
        return;
      }

      if (action === 'all_null') {
        setMappingValue(
          requestedMapping.map(item => ({
            ...item,
            nullable: true,
          })),
          false
        );
        setBulkAnchorEl(null);
        return;
      }

      if (action === 'reset_renames') {
        setMappingValue(
          requestedMapping.map(item => {
            const baseItem = baseMappingBySource.get(
              normalizeName(item.source_name)
            );
            return {
              ...item,
              target_name: baseItem?.target_name ?? item.target_name,
            };
          }),
          true
        );
        setBulkAnchorEl(null);
        return;
      }

      if (action === 'reset_all') {
        setMappingValue(baseMapping, true);
        setBulkAnchorEl(null);
        return;
      }

      setMappingValue(
        requestedMapping.map(item => ({
          ...item,
          target_name:
            action === 'snake_case'
              ? toSnakeCase(item.target_name)
              : item.target_name.toLowerCase(),
        })),
        true
      );
      setBulkAnchorEl(null);
    },
    [baseMapping, baseMappingBySource, requestedMapping, setMappingValue]
  );

  if (!isTableNew) {
    return (
      <MappingValidationSection
        columnDiff={existingTableColumnDiff}
        diffSummary={existingTableDiffSummary!}
        hasInvalidTargetName={hasEmptyTargetName}
        isResolving={sharedState?.isResolvingColumns ?? false}
        isRecreatingTable={sharedState?.isRecreatingTable ?? false}
        recreateTableError={sharedState?.recreateTableError ?? null}
        resolveError={sharedState?.resolveColumnsError ?? null}
        onRetryResolve={handleRefreshResolvedColumns}
        selectedActionColumns={selectedActionColumns}
        selectedActionsByColumn={selectedActionsByColumn}
        onToggleAction={handleToggleColumnAction}
        onActionNullableChange={handleColumnActionNullableChange}
        onTargetNameBlur={handleTargetNameCommit}
        onTargetNameCancel={handleTargetNameCancel}
        onTargetNameChange={handleTargetNameEdit}
        onTargetNameReset={handleTargetNameReset}
        initialTargetNames={initialTargetNamesRef.current}
        onRecreateTable={() => void handleRecreateTable()}
        resolveStates={sharedState?.columnResolveStates ?? {}}
      />
    );
  }

  return (
    <SchemaCard>
      <ErrorList>
        {mappingErrors.length > 0 ? (
          <Alert severity='error' sx={{ borderRadius: '10px' }}>
            <Stack spacing={0.25}>
              {mappingErrors.map(error => (
                <Typography key={error} variant='body2'>
                  {error}
                </Typography>
              ))}
            </Stack>
          </Alert>
        ) : null}
        {typedSpecErrors.length > 0 ? (
          <Alert severity='error' sx={{ borderRadius: '10px' }}>
            <Stack spacing={0.25}>
              {typedSpecErrors.map(error => (
                <Typography key={error} variant='body2'>
                  {error}
                </Typography>
              ))}
            </Stack>
          </Alert>
        ) : null}
        {sqlErrorMessage ? (
          <Alert severity='error' sx={{ borderRadius: '10px' }}>
            {sqlErrorMessage}
          </Alert>
        ) : null}
      </ErrorList>

      <SegmentControl>
        <SegmentButton
          type='button'
          active={selectedCreationMode === 'raw'}
          onClick={() => handleCreationModeChange('raw')}
        >
          <CodeIcon />
          SQL-скрипт
        </SegmentButton>
        <SegmentButton
          type='button'
          active={selectedCreationMode === 'typed'}
          onClick={() => handleCreationModeChange('typed')}
        >
          <TableIcon />
          Конструктор таблицы
        </SegmentButton>
      </SegmentControl>

      {selectedCreationMode === 'typed' ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            gap: 1.25,
            minHeight: 0,
          }}
        >
          <MappingModalHeader>
            <MappingModalHeaderLeft>
              <MappingModalHeaderIcon>
                <TableIcon />
              </MappingModalHeaderIcon>
              <MappingModalTitleGroup>
                <MappingModalTitle>Маппинг колонок</MappingModalTitle>
                <MappingModalSubtitle>
                  {selectedTargetLabel}
                </MappingModalSubtitle>
              </MappingModalTitleGroup>
            </MappingModalHeaderLeft>

            <MappingModalStats>
              <MappingModalStat>
                <MappingModalStatValue>
                  {requestedMapping.length}
                </MappingModalStatValue>
                <MappingModalStatLabel>Записывается</MappingModalStatLabel>
              </MappingModalStat>
              <MappingModalStat>
                <MappingModalStatValue>
                  {changedMappingCount}
                </MappingModalStatValue>
                <MappingModalStatLabel>Изменено</MappingModalStatLabel>
              </MappingModalStat>
            </MappingModalStats>
          </MappingModalHeader>

          <ToolbarRow>
            <SearchField>
              <SearchIconWrap>
                <SearchIcon />
              </SearchIconWrap>
              <SearchInput
                value={mappingSearch}
                onChange={event => setMappingSearch(event.target.value)}
                placeholder='Поиск колонки...'
              />
            </SearchField>

            <CountLabel>{requestedMapping.length} колонок</CountLabel>
            <ToolbarSpacer />

            <OutlineButton
              type='button'
              onClick={handleRefreshResolvedColumns}
              disabled={
                !resolveWriteColumnsRequest ||
                Boolean(sharedState?.isResolvingColumns)
              }
            >
              <RefreshIconSvg
                size={12}
                spinning={Boolean(sharedState?.isResolvingColumns)}
              />
              Обновить
            </OutlineButton>

            <OutlineButton
              type='button'
              onClick={event => setBulkAnchorEl(event.currentTarget)}
            >
              <TuneIcon sx={{ fontSize: 16 }} />
              Массово
              <ChevronIcon />
            </OutlineButton>
          </ToolbarRow>

          <MappingTable
            changeStateBySource={mappingChangeStateBySource}
            flashingEffectiveSourceKeys={flashingEffectiveSourceKeys}
            filteredMapping={filteredMapping}
            highlightedSourceName={null}
            initialTargetNames={initialTargetNamesRef.current}
            onNullableChange={(sourceName, checked) =>
              patchMapping(
                sourceName,
                current => ({
                  ...current,
                  nullable: checked,
                }),
                false
              )
            }
            onTargetNameBlur={handleTargetNameCommit}
            onTargetNameCancel={handleTargetNameCancel}
            onTargetNameChange={handleTargetNameEdit}
            onTargetNameReset={handleTargetNameReset}
            onTypeChange={(sourceName, value) =>
              patchMapping(
                sourceName,
                current => ({
                  ...current,
                  dtype: value,
                }),
                false
              )
            }
            resolveStates={sharedState?.columnResolveStates ?? {}}
            resolvingEffectiveSourceKeys={resolvingEffectiveSourceKeys}
            schemaRolesByTarget={schemaRolesByTarget}
            sourceDtypeBySource={sourceDtypeBySource}
          />

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
              pt: 0.5,
            }}
          >
            {MAPPING_ROLE_LEGEND.map(role => (
              <Box
                key={role.key}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Box sx={{ display: 'flex', opacity: 0.68 }}>
                  <SchemaRoleBadge tone={role.tone}>
                    {role.label}
                  </SchemaRoleBadge>
                </Box>
                <Typography
                  sx={{
                    fontSize: 12,
                    color:
                      'rgba(var(--mui-palette-text-secondaryChannel) / 0.6)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {role.description}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      ) : (
        <>
          <PreviewHeader>
            <PreviewTitle>Raw DDL SQL</PreviewTitle>
            <TextActionRow>
              <TextActionButton
                type='button'
                tone='primary'
                onClick={() => void fetchCreateTableSql('raw', true)}
                disabled={
                  !canFetchRawPreviewSql ||
                  Boolean(sharedState?.isCreateSqlLoading)
                }
              >
                <RefreshIconSvg
                  spinning={Boolean(sharedState?.isCreateSqlLoading)}
                />
                Сгенерировать
              </TextActionButton>
              <TextActionButton
                type='button'
                onClick={() =>
                  void copySql(localInputData?.create_table_sql ?? '', 'raw')
                }
                disabled={!localInputData?.create_table_sql?.trim()}
              >
                <CopyIconSvg />
                {isSqlCopied === 'raw' ? 'Скопировано' : 'Копировать'}
              </TextActionButton>
            </TextActionRow>
          </PreviewHeader>

          <InlineInfoText sx={{ mb: 1 }}>
            SQL должен использовать реальные имена колонок target table.
          </InlineInfoText>

          <SqlTextArea
            value={localInputData?.create_table_sql ?? ''}
            onChange={event =>
              setLocalInputData(prev => ({
                ...(prev ?? {}),
                create_table_sql: event.target.value,
              }))
            }
            placeholder='Введите или сгенерируйте CREATE TABLE SQL...'
          />
        </>
      )}

      <Popover
        open={Boolean(bulkAnchorEl)}
        anchorEl={bulkAnchorEl}
        onClose={() => setBulkAnchorEl(null)}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              background: 'transparent',
              boxShadow: 'none',
              overflow: 'visible',
              mt: 0.5,
            },
          },
        }}
      >
        <BulkMenuContainer>
          <BulkMenuSectionTitle>Применить к всем колонкам</BulkMenuSectionTitle>

          <BulkMenuItem
            type='button'
            onClick={() => applyBulkAction('snake_case')}
          >
            <BulkMenuItemTitle>Имена → snake_case</BulkMenuItemTitle>
            <BulkMenuItemHint>customerName → customer_name</BulkMenuItemHint>
          </BulkMenuItem>

          <BulkMenuItem
            type='button'
            onClick={() => applyBulkAction('lowercase')}
          >
            <BulkMenuItemTitle>Имена в нижний регистр</BulkMenuItemTitle>
          </BulkMenuItem>

          <BulkMenuItem
            type='button'
            onClick={() => applyBulkAction('reset_types')}
          >
            <BulkMenuItemTitle>Сбросить типы к исходным</BulkMenuItemTitle>
            <BulkMenuItemHint>по dtype из DataFrame</BulkMenuItemHint>
          </BulkMenuItem>

          <BulkMenuItem
            type='button'
            onClick={() => applyBulkAction('all_not_null')}
          >
            <BulkMenuItemTitle>Сделать все NOT NULL</BulkMenuItemTitle>
          </BulkMenuItem>

          <BulkMenuItem
            type='button'
            onClick={() => applyBulkAction('all_null')}
          >
            <BulkMenuItemTitle>Сделать все NULL</BulkMenuItemTitle>
          </BulkMenuItem>

          <BulkMenuItem
            type='button'
            onClick={() => applyBulkAction('reset_renames')}
          >
            <BulkMenuItemTitle>Сбросить все переименования</BulkMenuItemTitle>
          </BulkMenuItem>

          <BulkMenuItem
            type='button'
            onClick={() => applyBulkAction('reset_all')}
          >
            <BulkMenuItemTitle>Сбросить все изменения</BulkMenuItemTitle>
          </BulkMenuItem>
        </BulkMenuContainer>
      </Popover>
    </SchemaCard>
  );
};

const RefreshIconSvg = ({
  spinning,
  size = 12,
  color = 'currentColor',
}: {
  spinning?: boolean;
  size?: number;
  color?: string;
}) => (
  <AutorenewRoundedIcon
    sx={{
      width: size,
      height: size,
      display: 'block',
      flexShrink: 0,
      color,
      animation: spinning ? 'schemaRefreshSpin 0.9s linear infinite' : 'none',
      '@keyframes schemaRefreshSpin': {
        from: {
          transform: 'rotate(0deg)',
        },
        to: {
          transform: 'rotate(360deg)',
        },
      },
    }}
  />
);

const CopyIconSvg = ({ size = 12, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 16 16'
    fill='none'
    style={{ display: 'block', flexShrink: 0 }}
  >
    <rect
      x='5'
      y='3.5'
      width='7.5'
      height='9'
      rx='1.5'
      stroke={color}
      strokeWidth='1.2'
    />
    <path
      d='M3.5 10.5V5A1.5 1.5 0 015 3.5h4'
      stroke={color}
      strokeWidth='1.2'
      strokeLinecap='round'
    />
  </svg>
);
