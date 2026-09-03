import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Menu,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { TextFieldProps } from '@mui/material/TextField';

import { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import {
  FileStorageConnectionFields,
  FileStorageTargetPathSection,
} from '@/features/node/file-storage-target-path';
import { buildResolvedFileStoragePickerState } from '@/features/node/file-storage-target-path/ui/fileStorageConnectionFields.helpers';
import { useNodeConnections } from '@/features/node/get-node-connections';

import { ColumnDropdownSelect } from '@/entities/data/dataframe';
import { useConnections } from '@/entities/data/db-connection';

import type {
  DataFrameMetadata,
  FtpMetadata,
  S3Metadata,
} from '@/shared/gatewayClient';
import { hasTrailingSlashStoragePath } from '@/shared/lib/file-storage-target-path';
import { isExpressionValue } from '@/shared/lib/node-input-values';

import {
  applySaveParquetDefaults,
  applySaveParquetMode,
  applySaveParquetModeValue,
  DEFAULT_PARQUET_FILENAME_TEMPLATE,
  getParquetFilenameExample,
  getSaveParquetLayout,
  hydrateSaveParquetDraft,
  isIntLikeDtype,
  isSameRecord,
  type MappingFilter,
  normalizeParquetFilenameTemplate,
  normalizeSimpleParquetPath,
  type SaveParquetValues,
  SUPPORTED_PARQUET_TYPES,
  switchSaveParquetToAdvanced,
  switchSaveParquetToSimple,
  toParquetTypeRecord,
  validateParquetFilenameSafety,
  validateSaveParquetExpressionFields,
} from './SaveParquetEditor.helpers';
import {
  autocompleteListboxSx,
  autocompletePaperSx,
  BulkRow,
  ColumnName,
  DtypeBadge,
  EditorCard,
  EmptyState,
  FieldHintBottom,
  getAutocompleteTextFieldSx,
  MobileCellLabel,
  PartitionCard,
  PrimaryBulkButton,
  RowErrorText,
  SchemaCard,
  SchemaCell,
  SchemaCountBadge,
  SchemaHeader,
  SchemaRow,
  SchemaSubtitle,
  SchemaTable,
  SchemaTableBody,
  SchemaTableHead,
  SchemaTitle,
  SchemaTitleRow,
  SchemaToolbar,
  SearchBox,
  SearchInput,
  SecondaryBulkButton,
  SelectFieldWrap,
  SelectGroupLabel,
  SelectOption,
  SelectOptionText,
  SelectTrigger,
  SelectValueText,
  SoftDivider,
  StyledSwitch,
  TabButton,
  TabCount,
  TabsGroup,
  TextInputBox,
  ThreeColumns,
  ToggleOption,
} from './SaveParquetEditor.styles';
import { SaveParquetExpressionField } from './SaveParquetExpressionField';

const PARQUET_TYPE_GROUPS = [
  { label: 'Auto', values: ['infer'] },
  {
    label: 'Numeric',
    values: [
      'int8',
      'int16',
      'int32',
      'int64',
      'uint8',
      'uint16',
      'uint32',
      'uint64',
      'float16',
      'float32',
      'float64',
      'bool',
      'decimal128(10,2)',
      'decimal128(18,2)',
      'decimal128(38,10)',
      'decimal256(38,10)',
    ],
  },
  {
    label: 'String / Binary',
    values: ['string', 'large_string', 'binary', 'large_binary'],
  },
  {
    label: 'Date / Time',
    values: [
      'date32',
      'date64',
      'time32[s]',
      'time32[ms]',
      'time64[us]',
      'time64[ns]',
      'timestamp[s]',
      'timestamp[ms]',
      'timestamp[us]',
      'timestamp[ns]',
      'timestamp[us, tz=UTC]',
      'timestamp[ns, tz=UTC]',
      'duration[s]',
      'duration[ms]',
      'duration[us]',
      'duration[ns]',
    ],
  },
] as const;

const FILTER_TABS: ReadonlyArray<{
  key: MappingFilter;
  label: string;
}> = [
  { key: 'all', label: 'Все' },
  { key: 'configured', label: 'Настроенные' },
  { key: 'infer', label: 'Infer' },
];

type ParquetTypeSelectProps = {
  value: string | null;
  hasError: boolean;
  onChange: (nextType: string | null) => void;
};

const renderMonospaceOption = (
  props: React.HTMLAttributes<HTMLLIElement>,
  option: string
) => (
  <Box component='li' {...props}>
    <Typography
      variant='body2'
      sx={{
        width: '100%',
        fontFamily: 'ui-monospace, SFMono-Regular, Consolas',
        fontSize: 13,
      }}
    >
      {option}
    </Typography>
  </Box>
);

const ParquetTypeSelect: React.FC<ParquetTypeSelectProps> = ({
  value,
  hasError,
  onChange,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const menuId = useId();
  const open = Boolean(anchorEl);
  const displayValue = value ?? 'infer (auto)';
  const menuWidth = anchorEl?.clientWidth ?? 280;

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleSelect = useCallback(
    (nextValue: string) => {
      onChange(nextValue === 'infer' ? null : nextValue);
      handleClose();
    },
    [handleClose, onChange]
  );

  return (
    <SelectFieldWrap>
      <SelectTrigger
        type='button'
        open={open}
        hasError={hasError}
        onClick={event => setAnchorEl(event.currentTarget)}
        aria-haspopup='menu'
        aria-expanded={open ? 'true' : undefined}
        aria-controls={open ? menuId : undefined}
      >
        <SelectValueText>{displayValue}</SelectValueText>
        <KeyboardArrowDownRoundedIcon
          sx={{
            fontSize: 18,
            color: '#94a3b8',
            transition: 'transform 150ms ease',
            transform: open ? 'rotate(180deg)' : 'none',
          }}
        />
      </SelectTrigger>

      <Menu
        id={menuId}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              width: menuWidth,
              maxHeight: 280,
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              boxShadow: '0 10px 28px rgba(15,23,42,0.12)',
            },
          },
          list: {
            disablePadding: true,
            sx: {
              py: 0,
            },
          },
        }}
      >
        {PARQUET_TYPE_GROUPS.map(group => (
          <React.Fragment key={group.label}>
            <SelectGroupLabel disableSticky>{group.label}</SelectGroupLabel>
            {group.values.map(optionValue => {
              const isInfer = optionValue === 'infer';
              const isActive = isInfer ? value == null : value === optionValue;

              return (
                <SelectOption
                  key={optionValue}
                  active={isActive}
                  onClick={() => handleSelect(optionValue)}
                >
                  <SelectOptionText>
                    {isInfer ? 'infer' : optionValue}
                  </SelectOptionText>
                  {isActive ? <CheckRoundedIcon sx={{ fontSize: 16 }} /> : null}
                </SelectOption>
              );
            })}
          </React.Fragment>
        ))}
      </Menu>
    </SelectFieldWrap>
  );
};

export const SaveParquetEditor: React.FC<
  NodeModalExtensionProps<SaveParquetValues>
> = ({
  id: nodeID,
  nodeDefinition,
  localInputData,
  setLocalInputData,
  setValidationCallback,
  variables,
}) => {
  const theme = useTheme();
  const update = useCallback(
    (patch: Partial<SaveParquetValues>) =>
      setLocalInputData(prev => ({ ...prev, ...patch })),
    [setLocalInputData]
  );

  const { getConnectedInputMetadata } = useNodeConnections(nodeID);
  const { getConnectionById } = useConnections();
  const inputMetadata = useMemo(
    () => getConnectedInputMetadata('df') as DataFrameMetadata | null,
    [getConnectedInputMetadata]
  );
  const connectionMetadata = useMemo(
    () =>
      getConnectedInputMetadata('connection') as
        | S3Metadata
        | FtpMetadata
        | null,
    [getConnectedInputMetadata]
  );
  const connectionRecord = useMemo(
    () =>
      connectionMetadata?.connection_id
        ? (getConnectionById(connectionMetadata.connection_id) ?? null)
        : null,
    [connectionMetadata?.connection_id, getConnectionById]
  );
  const pathInputDefinition = nodeDefinition?.input_definitions?.['path'];
  const pickerState = useMemo(
    () =>
      buildResolvedFileStoragePickerState({
        connectionMetadata,
        connectionOverrides: localInputData.connection_overrides,
        connectionRecord,
        nodeDefinition,
        pathLabel: 'Path',
        pathValue: localInputData.path,
        variables,
      }),
    [
      connectionMetadata,
      connectionRecord,
      localInputData.connection_overrides,
      localInputData.path,
      nodeDefinition,
      variables,
    ]
  );

  const columns = useMemo(() => inputMetadata?.columns ?? [], [inputMetadata]);
  const allColumns = useMemo(
    () => columns.map(column => column.name),
    [columns]
  );
  const allColumnsSet = useMemo(() => new Set(allColumns), [allColumns]);

  const parquetTypesRecord = useMemo(
    () => toParquetTypeRecord(localInputData.parquet_types),
    [localInputData.parquet_types]
  );

  const configuredColumnsCount = useMemo(
    () =>
      Object.keys(parquetTypesRecord).filter(column =>
        allColumnsSet.has(column)
      ).length,
    [allColumnsSet, parquetTypesRecord]
  );

  const inferColumnsCount = columns.length - configuredColumnsCount;

  const [mappingSearch, setMappingSearch] = useState('');
  const [mappingFilter, setMappingFilter] = useState<MappingFilter>('all');

  const compressionInputDef = useMemo(
    () => nodeDefinition?.input_definitions?.['compression'],
    [nodeDefinition]
  );
  const rowCapInputDef = nodeDefinition?.input_definitions?.['row_cap'];
  const filenameTemplateInputDef =
    nodeDefinition?.input_definitions?.['filename_template'];
  const partitionOnInputDef =
    nodeDefinition?.input_definitions?.['partition_on'];
  const writeIndexInputDef = nodeDefinition?.input_definitions?.['write_index'];
  const compressionOptions: string[] = useMemo(() => {
    const options = compressionInputDef?.options;
    return Array.isArray(options)
      ? options.filter(
          (option: unknown): option is string => typeof option === 'string'
        )
      : [];
  }, [compressionInputDef]);

  const modeInputDef = useMemo(
    () => nodeDefinition?.input_definitions?.['mode'],
    [nodeDefinition]
  );
  const modeOptions: string[] = useMemo(() => {
    const options = modeInputDef?.options;
    return Array.isArray(options)
      ? options.filter(
          (option: unknown): option is string => typeof option === 'string'
        )
      : [];
  }, [modeInputDef]);

  const modeDefault = useMemo<string | undefined>(() => {
    const rawDefault = (modeInputDef?.default as string | undefined)?.trim();
    return rawDefault || modeOptions[0];
  }, [modeInputDef, modeOptions]);

  const compressionDefault = useMemo<string | undefined>(() => {
    const rawDefault = (
      compressionInputDef?.default as string | undefined
    )?.trim();
    return rawDefault || compressionOptions[0];
  }, [compressionInputDef, compressionOptions]);

  const literalMode = useMemo(
    () =>
      typeof localInputData.mode === 'string'
        ? localInputData.mode
        : (modeDefault ?? ''),
    [localInputData.mode, modeDefault]
  );
  const literalCompression = useMemo(
    () =>
      typeof localInputData.compression === 'string'
        ? localInputData.compression
        : (compressionDefault ?? ''),
    [compressionDefault, localInputData.compression]
  );
  const literalRowCap =
    typeof localInputData.row_cap === 'number' ? localInputData.row_cap : null;
  const literalPartitionOn = Array.isArray(localInputData.partition_on)
    ? localInputData.partition_on
    : [];
  const literalWriteIndex =
    typeof localInputData.write_index === 'boolean'
      ? localInputData.write_index
      : false;
  const layout = getSaveParquetLayout(localInputData, modeDefault);
  const simpleUnavailableReason = isExpressionValue(localInputData.mode)
    ? 'Simple недоступен, пока mode задан expression-ом: expression может разрешиться в append. Для перехода в Simple задайте mode=create или mode=overwrite.'
    : literalMode === 'append'
      ? 'Simple недоступен при mode=append. Для перехода в Simple задайте mode=create или mode=overwrite.'
      : null;
  const literalFilenameTemplate =
    typeof localInputData.filename_template === 'string'
      ? localInputData.filename_template
      : DEFAULT_PARQUET_FILENAME_TEMPLATE;
  const filenameTemplateExample = getParquetFilenameExample(
    literalFilenameTemplate
  );
  const [legacyWarning, setLegacyWarning] = useState(false);

  useEffect(() => {
    setLocalInputData(prev => {
      const hydrated = hydrateSaveParquetDraft(prev, modeDefault);
      if (hydrated.wasLegacy) {
        setLegacyWarning(true);
      }
      return hydrated.values;
    });
  }, [
    localInputData.compatibility_mode,
    localInputData.filename_template,
    localInputData.mode,
    localInputData.partition_on,
    localInputData.row_cap,
    modeDefault,
    setLocalInputData,
  ]);

  useEffect(() => {
    setLocalInputData(prev => {
      if (prev.filename === undefined) {
        return prev;
      }

      const { filename: _filename, ...rest } = prev;
      return rest;
    });
  }, [setLocalInputData]);

  useEffect(() => {
    setLocalInputData(prev =>
      applySaveParquetDefaults(prev, modeDefault, compressionDefault)
    );
  }, [
    compressionDefault,
    localInputData.compression,
    localInputData.mode,
    modeDefault,
    setLocalInputData,
  ]);

  useEffect(() => {
    const patch: Partial<SaveParquetValues> = {};
    if (localInputData.row_cap === undefined) {
      patch.row_cap = null;
    }
    if (localInputData.parquet_types === undefined) {
      patch.parquet_types = null;
    }
    if (Object.keys(patch).length) {
      update(patch);
    }
  }, [localInputData.parquet_types, localInputData.row_cap, update]);

  useEffect(() => {
    if (localInputData.parquet_types == null) {
      return;
    }
    if (Object.keys(parquetTypesRecord).length > 0) {
      return;
    }
    update({ parquet_types: null });
  }, [localInputData.parquet_types, parquetTypesRecord, update]);

  useEffect(() => {
    if (allColumnsSet.size === 0 || localInputData.parquet_types == null) {
      return;
    }

    const next: Record<string, string> = {};
    for (const [column, type] of Object.entries(parquetTypesRecord)) {
      if (allColumnsSet.has(column)) {
        next[column] = type;
      }
    }

    if (Object.keys(next).length === 0) {
      if (Object.keys(parquetTypesRecord).length > 0) {
        update({ parquet_types: null });
      }
      return;
    }

    if (!isSameRecord(next, parquetTypesRecord)) {
      update({ parquet_types: next });
    }
  }, [allColumnsSet, localInputData.parquet_types, parquetTypesRecord, update]);

  const [errors, setErrors] = useState<
    Partial<Record<keyof SaveParquetValues, string>>
  >({});
  const [mappingRowErrors, setMappingRowErrors] = useState<
    Record<string, string>
  >({});
  const [mappingGeneralErrors, setMappingGeneralErrors] = useState<string[]>(
    []
  );
  const partitionSelectTextFieldSx = useMemo(() => {
    const baseSx = getAutocompleteTextFieldSx(
      theme,
      Boolean(errors.partition_on)
    );

    return {
      ...baseSx,
      '& .MuiOutlinedInput-root': {
        ...((baseSx['& .MuiOutlinedInput-root'] as Record<string, unknown>) ??
          {}),
        borderRadius: '10px',
      },
    };
  }, [errors.partition_on, theme]);
  const isPathExpressionMode = isExpressionValue(localInputData['path']);
  const expressionPathValue = isExpressionValue(localInputData['path'])
    ? localInputData['path']
    : null;
  const pathExpressionHint = isPathExpressionMode
    ? layout === 'advanced'
      ? 'Expression должен вернуть путь к каталогу dataset без суффикса .parquet. Например: reports/orders, а не reports/orders.parquet.'
      : 'Результат expression трактуется как physical parquet file. Если суффикс .parquet отсутствует, backend добавит его автоматически.'
    : null;
  const filteredColumns = useMemo(() => {
    const query = mappingSearch.trim().toLowerCase();

    return columns.filter(column => {
      const isConfigured = Boolean(parquetTypesRecord[column.name]);
      if (mappingFilter === 'configured' && !isConfigured) {
        return false;
      }
      if (mappingFilter === 'infer' && isConfigured) {
        return false;
      }
      if (!query) {
        return true;
      }

      const name = column.name.toLowerCase();
      const dtype = String(column.dtype ?? '').toLowerCase();
      return name.includes(query) || dtype.includes(query);
    });
  }, [columns, mappingFilter, mappingSearch, parquetTypesRecord]);

  const intColumnsCount = useMemo(
    () => columns.filter(column => isIntLikeDtype(column.dtype)).length,
    [columns]
  );

  const setColumnParquetType = useCallback(
    (columnName: string, nextType: string | null) => {
      setLocalInputData(prev => {
        const next = toParquetTypeRecord(prev.parquet_types);

        if (!nextType || !SUPPORTED_PARQUET_TYPES.has(nextType)) {
          delete next[columnName];
        } else {
          next[columnName] = nextType;
        }

        return {
          ...prev,
          parquet_types: Object.keys(next).length ? next : null,
        };
      });

      setMappingRowErrors(prev => {
        if (!prev[columnName]) {
          return prev;
        }
        const next = { ...prev };
        delete next[columnName];
        return next;
      });
    },
    [setLocalInputData]
  );

  const applyInt64ForAllIntColumns = useCallback(() => {
    setLocalInputData(prev => {
      const next = toParquetTypeRecord(prev.parquet_types);

      for (const column of columns) {
        if (isIntLikeDtype(column.dtype)) {
          next[column.name] = 'int64';
        }
      }

      return {
        ...prev,
        parquet_types: Object.keys(next).length ? next : null,
      };
    });

    setMappingRowErrors({});
    setMappingGeneralErrors([]);
  }, [columns, setLocalInputData]);

  const resetAllToInfer = useCallback(() => {
    update({ parquet_types: null });
    setMappingRowErrors({});
    setMappingGeneralErrors([]);
  }, [update]);

  const handleLayoutChange = useCallback(
    (nextLayout: string) => {
      setLocalInputData(prev => {
        if (nextLayout === 'advanced') {
          return switchSaveParquetToAdvanced(prev);
        }
        return switchSaveParquetToSimple(prev);
      });
    },
    [setLocalInputData]
  );

  const handleLiteralModeChange = useCallback(
    (nextMode: string | null) => {
      const resolvedMode = nextMode ?? modeDefault ?? 'create';
      setLocalInputData(prev => applySaveParquetMode(prev, resolvedMode));
    },
    [modeDefault, setLocalInputData]
  );

  useEffect(() => {
    setValidationCallback?.(() => {
      return () => {
        const next: Partial<Record<keyof SaveParquetValues, string>> = {};
        const nextMappingRowErrors: Record<string, string> = {};
        const nextMappingGeneralErrors: string[] = [];

        if (isPathExpressionMode) {
          if (!expressionPathValue?.value.trim()) {
            next.path = 'Укажите expression для пути';
          }
        } else {
          const rawPath =
            typeof localInputData.path === 'string'
              ? localInputData.path.trim()
              : '';
          if (!rawPath) {
            next.path =
              layout === 'simple'
                ? 'Укажите путь к parquet-файлу'
                : 'Укажите путь к каталогу parquet dataset';
          } else if (
            layout === 'advanced' &&
            rawPath.toLowerCase().replace(/\/+$/, '').endsWith('.parquet')
          ) {
            next.path =
              'Advanced path должен указывать на каталог dataset, без .parquet в конце';
          } else if (
            layout === 'simple' &&
            hasTrailingSlashStoragePath(
              typeof localInputData.path === 'string'
                ? localInputData.path
                : null
            )
          ) {
            next.path =
              'Путь должен включать имя parquet dataset, а не только папку';
          }
        }

        if (layout === 'advanced') {
          if (isExpressionValue(localInputData.filename_template)) {
            if (!localInputData.filename_template.value.trim()) {
              next.filename_template =
                'Укажите expression для filename template';
            }
          } else {
            const template =
              typeof localInputData.filename_template === 'string'
                ? localInputData.filename_template.trim()
                : '';
            if (!template) {
              next.filename_template = 'Укажите шаблон имени parquet-файлов';
            } else if (
              /[\\/\0]/.test(template) ||
              template === '.' ||
              template === '..'
            ) {
              next.filename_template =
                'Шаблон задаёт только имя файла и не может содержать путь';
            }
          }

          const filenameSafetyError =
            validateParquetFilenameSafety(localInputData);
          if (!next.filename_template && filenameSafetyError) {
            next.filename_template = filenameSafetyError;
          }
        }

        Object.assign(
          next,
          validateSaveParquetExpressionFields({
            values: localInputData,
            compressionDefault,
            compressionOptions,
            modeDefault,
            modeOptions,
            allColumns,
          })
        );

        for (const [column, parquetType] of Object.entries(
          parquetTypesRecord
        )) {
          if (allColumnsSet.size > 0 && !allColumnsSet.has(column)) {
            nextMappingGeneralErrors.push(
              `Колонка "${column}" отсутствует во входном DataFrame`
            );
            continue;
          }
          if (!SUPPORTED_PARQUET_TYPES.has(parquetType)) {
            nextMappingRowErrors[column] =
              `Недопустимый Parquet type: "${parquetType}"`;
          }
        }

        if (
          Object.keys(nextMappingRowErrors).length > 0 ||
          nextMappingGeneralErrors.length > 0
        ) {
          next.parquet_types = 'Исправьте ошибки в Parquet Schema Contract';
        }

        setErrors(next);
        setMappingRowErrors(nextMappingRowErrors);
        setMappingGeneralErrors(nextMappingGeneralErrors);

        return Object.keys(next).length === 0;
      };
    });
  }, [
    setValidationCallback,
    allColumns,
    allColumnsSet,
    compressionDefault,
    compressionOptions,
    expressionPathValue,
    isPathExpressionMode,
    layout,
    localInputData,
    modeDefault,
    modeOptions,
    parquetTypesRecord,
  ]);

  return (
    <EditorCard>
      {legacyWarning ? (
        <Alert severity='warning'>
          Эта нода использовала legacy-механизм записи Parquet. После сохранения
          она будет переведена на новый механизм записи. Physical layout файлов
          может измениться. Проверьте Path, режим записи, Row cap и шаблон имени
          перед сохранением.
        </Alert>
      ) : null}

      <FileStorageConnectionFields
        connectionMetadata={connectionMetadata}
        connectionRecord={connectionRecord}
        nodeDefinition={nodeDefinition}
        value={localInputData.connection_overrides}
        onChange={nextValue => update({ connection_overrides: nextValue })}
        variables={variables}
      />

      <FileStorageTargetPathSection
        inputDefinition={pathInputDefinition}
        value={localInputData.path ?? null}
        onChange={nextValue => update({ path: nextValue })}
        variables={variables}
        connectionMetadata={connectionMetadata}
        pickerState={pickerState}
        extension={layout === 'simple' ? '.parquet' : ''}
        pickerExtension={layout === 'simple' ? '.parquet' : null}
        allowedFileExts={layout === 'simple' ? ['parquet'] : []}
        pickerSelectionMode={layout === 'simple' ? 'file_or_folder' : 'folder'}
        mode={layout}
        modeOptions={[
          {
            value: 'simple',
            label: 'Simple',
            ...(simpleUnavailableReason
              ? {
                  disabled: true,
                  disabledReason: simpleUnavailableReason,
                }
              : {}),
          },
          { value: 'advanced', label: 'Advanced' },
        ]}
        onModeChange={nextLayout => {
          if (nextLayout === 'simple' && simpleUnavailableReason) {
            return;
          }
          handleLayoutChange(nextLayout);
        }}
        title={
          layout === 'simple'
            ? 'Путь к Parquet-файлу'
            : 'Каталог Parquet dataset'
        }
        description={
          layout === 'simple'
            ? 'Simple создаёт ровно один physical .parquet file.'
            : 'Advanced трактует Path как каталог dataset. Каталог не должен оканчиваться на .parquet.'
        }
        errorText={errors.path ?? null}
        pickerTitle={
          layout === 'simple'
            ? 'Выбор Parquet-файла'
            : 'Выбор каталога Parquet dataset'
        }
        footerText={
          <>
            {pathExpressionHint ? (
              <Box component='span' sx={{ display: 'block', mb: 0.25 }}>
                {pathExpressionHint}
              </Box>
            ) : null}
            <Box component='span' sx={{ display: 'block' }}>
              {layout === 'simple'
                ? `Output: ${typeof localInputData.path === 'string' ? normalizeSimpleParquetPath(localInputData.path) : '…'}`
                : `Dataset: ${typeof localInputData.path === 'string' ? localInputData.path.replace(/\/+$/, '') : '…'}/`}
            </Box>
          </>
        }
      />

      {layout === 'advanced' ? (
        <Alert severity='info' icon={false}>
          Advanced settings управляют physical files внутри dataset.
          Переключение обратно в Simple очистит filename template, row_cap и
          partition_on.
          {simpleUnavailableReason ? ` ${simpleUnavailableReason}` : ''}
        </Alert>
      ) : null}

      <ThreeColumns>
        {layout === 'advanced' ? (
          <div>
            <SaveParquetExpressionField
              inputDefinition={rowCapInputDef}
              value={localInputData.row_cap}
              onChange={nextValue =>
                update({
                  row_cap: nextValue as Exclude<
                    SaveParquetValues['row_cap'],
                    undefined
                  >,
                })
              }
              variables={variables}
              title='Лимит строк (row_cap)'
              literalFallback={null}
            >
              <TextInputBox
                type='number'
                value={literalRowCap ?? ''}
                onChange={event => {
                  const raw = event.target.value.trim();
                  if (!raw) {
                    update({ row_cap: null });
                    return;
                  }

                  const parsed = Number(raw);
                  if (Number.isFinite(parsed)) {
                    update({ row_cap: parsed });
                  }
                }}
                min={1}
                step={1}
                placeholder='Без лимита'
                hasError={Boolean(errors.row_cap)}
              />
            </SaveParquetExpressionField>
            <FieldHintBottom tone={errors.row_cap ? 'error' : 'default'}>
              {errors.row_cap ||
                'Пусто = без лимита. Если заполнено, то только целое число >= 1.'}
            </FieldHintBottom>
          </div>
        ) : null}

        <div>
          <SaveParquetExpressionField
            inputDefinition={compressionInputDef}
            value={localInputData.compression}
            onChange={nextValue =>
              update({
                compression: nextValue as Exclude<
                  SaveParquetValues['compression'],
                  undefined
                >,
              })
            }
            variables={variables}
            title='Сжатие (compression)'
            literalFallback={compressionDefault ?? null}
          >
            <Autocomplete<string, false, true, false>
              disableClearable
              options={compressionOptions}
              value={literalCompression}
              openOnFocus
              onChange={(_event, value) => {
                const nextValue = value ?? compressionDefault ?? null;
                update({ compression: nextValue });
              }}
              popupIcon={
                <KeyboardArrowDownRoundedIcon sx={{ color: '#94a3b8' }} />
              }
              slotProps={{
                paper: { sx: autocompletePaperSx },
              }}
              ListboxProps={{ sx: autocompleteListboxSx }}
              renderInput={params => (
                <TextField
                  {...(params as unknown as TextFieldProps)}
                  placeholder='snappy'
                  error={Boolean(errors.compression)}
                  sx={getAutocompleteTextFieldSx(
                    theme,
                    Boolean(errors.compression)
                  )}
                  inputProps={{
                    ...params.inputProps,
                    readOnly: true,
                  }}
                />
              )}
              renderOption={renderMonospaceOption}
            />
          </SaveParquetExpressionField>
          <FieldHintBottom tone={errors.compression ? 'error' : 'default'}>
            {errors.compression ||
              'Напр., snappy (по умолчанию), zstd, gzip, brotli, lz4.'}
          </FieldHintBottom>
        </div>

        <div>
          <SaveParquetExpressionField
            inputDefinition={modeInputDef}
            value={localInputData.mode}
            onChange={nextValue =>
              setLocalInputData(prev =>
                applySaveParquetModeValue(
                  prev,
                  nextValue as Exclude<SaveParquetValues['mode'], undefined>
                )
              )
            }
            variables={variables}
            title='Режим записи (mode)'
            literalFallback={modeDefault ?? null}
          >
            <Autocomplete<string, false, true, false>
              disableClearable
              options={modeOptions}
              value={literalMode}
              openOnFocus
              onChange={(_event, value) => {
                handleLiteralModeChange(value ?? modeDefault ?? null);
              }}
              popupIcon={
                <KeyboardArrowDownRoundedIcon sx={{ color: '#94a3b8' }} />
              }
              slotProps={{
                paper: { sx: autocompletePaperSx },
              }}
              ListboxProps={{ sx: autocompleteListboxSx }}
              renderInput={params => (
                <TextField
                  {...(params as unknown as TextFieldProps)}
                  placeholder='overwrite'
                  error={Boolean(errors.mode)}
                  sx={getAutocompleteTextFieldSx(theme, Boolean(errors.mode))}
                  inputProps={{
                    ...params.inputProps,
                    readOnly: true,
                  }}
                />
              )}
              renderOption={renderMonospaceOption}
            />
          </SaveParquetExpressionField>
          <FieldHintBottom tone={errors.mode ? 'error' : 'default'}>
            {errors.mode || 'Определяет поведение при записи parquet dataset.'}
          </FieldHintBottom>
        </div>
      </ThreeColumns>

      {layout === 'advanced' ? (
        <Box
          sx={{
            p: 2,
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
          }}
        >
          <Typography variant='subtitle2' sx={{ mb: 0.5, fontWeight: 700 }}>
            File naming
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
            Токены применяются после DVT expression resolution. Для
            гарантированной уникальности используйте &lt;increment&gt; или
            &lt;uuid&gt;.
          </Typography>
          <Stack
            direction='row'
            spacing={1}
            useFlexGap
            flexWrap='wrap'
            sx={{ mb: 1.5 }}
          >
            {[
              ['Increment', '<increment>.parquet'],
              ['UUID', '<uuid>.parquet'],
              ['Partition index', '<partition_index>.parquet'],
            ].map(([label, template]) => (
              <Button
                key={label}
                size='small'
                variant={
                  literalFilenameTemplate === template
                    ? 'contained'
                    : 'outlined'
                }
                onClick={() => update({ filename_template: template })}
              >
                {label}
              </Button>
            ))}
            <Button
              size='small'
              variant={
                [
                  '<increment>.parquet',
                  '<uuid>.parquet',
                  '<partition_index>.parquet',
                ].includes(literalFilenameTemplate)
                  ? 'outlined'
                  : 'contained'
              }
              onClick={() => {
                if (
                  [
                    '<increment>.parquet',
                    '<uuid>.parquet',
                    '<partition_index>.parquet',
                  ].includes(literalFilenameTemplate)
                ) {
                  update({ filename_template: 'data_<increment>.parquet' });
                }
              }}
            >
              Custom
            </Button>
          </Stack>

          <SaveParquetExpressionField
            inputDefinition={filenameTemplateInputDef}
            value={localInputData.filename_template}
            onChange={nextValue =>
              update({
                filename_template: nextValue as Exclude<
                  SaveParquetValues['filename_template'],
                  undefined
                >,
              })
            }
            variables={variables}
            title='Filename template'
            literalFallback={DEFAULT_PARQUET_FILENAME_TEMPLATE}
          >
            <TextInputBox
              value={literalFilenameTemplate}
              onChange={event =>
                update({ filename_template: event.target.value })
              }
              onBlur={event =>
                update({
                  filename_template: normalizeParquetFilenameTemplate(
                    event.currentTarget.value
                  ),
                })
              }
              placeholder='<increment>.parquet'
              hasError={Boolean(errors.filename_template)}
            />
          </SaveParquetExpressionField>
          <FieldHintBottom
            tone={errors.filename_template ? 'error' : 'default'}
          >
            {errors.filename_template || `Example: ${filenameTemplateExample}`}
          </FieldHintBottom>
        </Box>
      ) : null}

      <PartitionCard>
        {layout === 'advanced' ? (
          <div>
            <SaveParquetExpressionField
              inputDefinition={partitionOnInputDef}
              value={localInputData.partition_on}
              onChange={nextValue =>
                update({
                  partition_on: nextValue as Exclude<
                    SaveParquetValues['partition_on'],
                    undefined
                  >,
                })
              }
              variables={variables}
              title='Разбиение по колонкам (partition_on)'
              literalFallback={null}
            >
              <ColumnDropdownSelect
                multiple
                columns={columns}
                value={literalPartitionOn}
                onChange={value =>
                  update({ partition_on: value.length ? value : null })
                }
                error={Boolean(errors.partition_on)}
                placeholder='Выберите колонки для Hive-partitioning'
                textFieldSx={partitionSelectTextFieldSx}
              />
            </SaveParquetExpressionField>
            <FieldHintBottom tone={errors.partition_on ? 'error' : 'default'}>
              {errors.partition_on ||
                'Можно оставить пустым, если разбиение по колонкам не нужно.'}
            </FieldHintBottom>
          </div>
        ) : null}

        {layout === 'advanced' ? <SoftDivider /> : null}

        <div>
          <SaveParquetExpressionField
            inputDefinition={writeIndexInputDef}
            value={localInputData.write_index}
            onChange={nextValue =>
              update({
                write_index: nextValue as Exclude<
                  SaveParquetValues['write_index'],
                  undefined
                >,
              })
            }
            variables={variables}
            title='Сохранять индекс DataFrame в файл'
            literalFallback={false}
            literalHeaderContent={
              <ToggleOption
                control={
                  <StyledSwitch
                    checked={literalWriteIndex}
                    onChange={event =>
                      update({ write_index: event.target.checked })
                    }
                  />
                }
                label='Сохранять индекс DataFrame в файл'
              />
            }
          />
          {errors.write_index ? (
            <FieldHintBottom tone='error'>{errors.write_index}</FieldHintBottom>
          ) : null}
        </div>
      </PartitionCard>

      <SchemaCard hasError={Boolean(errors.parquet_types)}>
        <SchemaHeader>
          <SchemaTitleRow>
            <SchemaTitle>Parquet Schema Contract</SchemaTitle>
            <SchemaCountBadge>
              {configuredColumnsCount} / {columns.length}
            </SchemaCountBadge>
          </SchemaTitleRow>
          <SchemaSubtitle>
            Явный контракт типа для каждой колонки входного DataFrame
          </SchemaSubtitle>
        </SchemaHeader>

        <SchemaToolbar>
          <SearchBox>
            <SearchRoundedIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
            <SearchInput
              value={mappingSearch}
              onChange={event => setMappingSearch(event.target.value)}
              placeholder='Поиск по колонкам'
            />
          </SearchBox>

          <TabsGroup>
            {FILTER_TABS.map(tab => {
              const isActive = mappingFilter === tab.key;
              const count =
                tab.key === 'all'
                  ? columns.length
                  : tab.key === 'configured'
                    ? configuredColumnsCount
                    : inferColumnsCount;

              return (
                <TabButton
                  key={tab.key}
                  type='button'
                  active={isActive}
                  onClick={() => setMappingFilter(tab.key)}
                >
                  {tab.label}
                  <TabCount active={isActive}>{count}</TabCount>
                </TabButton>
              );
            })}
          </TabsGroup>
        </SchemaToolbar>

        <BulkRow>
          <PrimaryBulkButton
            type='button'
            onClick={applyInt64ForAllIntColumns}
            disabled={intColumnsCount === 0}
          >
            <AutoFixHighRoundedIcon sx={{ fontSize: 14 }} />
            Применить ко всем INT {'->'} int64
          </PrimaryBulkButton>
          <SecondaryBulkButton
            type='button'
            onClick={resetAllToInfer}
            disabled={
              configuredColumnsCount === 0 &&
              Object.keys(parquetTypesRecord).length === 0
            }
          >
            <ReplayRoundedIcon sx={{ fontSize: 14 }} />
            Сбросить всё в infer
          </SecondaryBulkButton>
        </BulkRow>

        {mappingGeneralErrors.length > 0 ? (
          <Alert severity='error' sx={{ mb: 1.5 }}>
            {mappingGeneralErrors.map(error => (
              <Typography key={error} variant='body2'>
                {error}
              </Typography>
            ))}
          </Alert>
        ) : null}

        {columns.length === 0 ? (
          <Alert severity='info' sx={{ mb: 1.5 }}>
            Для настройки `parquet_types` подключите вход `df` с метаданными
            колонок.
          </Alert>
        ) : null}

        {columns.length > 0 ? (
          <SchemaTable>
            <SchemaTableHead>
              <div>Колонка</div>
              <div>Текущий dtype</div>
              <div>Parquet type</div>
            </SchemaTableHead>

            <SchemaTableBody>
              {filteredColumns.length === 0 ? (
                <EmptyState>Ничего не найдено</EmptyState>
              ) : (
                filteredColumns.map((column, index) => {
                  const columnType = parquetTypesRecord[column.name] ?? null;
                  const rowError = mappingRowErrors[column.name];

                  return (
                    <SchemaRow
                      key={column.name}
                      configured={columnType !== null}
                      last={index === filteredColumns.length - 1}
                    >
                      <SchemaCell>
                        <MobileCellLabel>Колонка</MobileCellLabel>
                        <ColumnName>{column.name}</ColumnName>
                      </SchemaCell>

                      <SchemaCell>
                        <MobileCellLabel>Текущий dtype</MobileCellLabel>
                        <DtypeBadge dtype={String(column.dtype ?? 'UNKNOWN')}>
                          {String(column.dtype ?? 'UNKNOWN')}
                        </DtypeBadge>
                      </SchemaCell>

                      <SchemaCell>
                        <MobileCellLabel>Parquet type</MobileCellLabel>
                        <ParquetTypeSelect
                          value={columnType}
                          hasError={Boolean(rowError)}
                          onChange={nextType =>
                            setColumnParquetType(column.name, nextType)
                          }
                        />
                        {rowError ? (
                          <RowErrorText>{rowError}</RowErrorText>
                        ) : null}
                      </SchemaCell>
                    </SchemaRow>
                  );
                })
              )}
            </SchemaTableBody>
          </SchemaTable>
        ) : null}

        {errors.parquet_types ? (
          <FieldHintBottom tone='error'>{errors.parquet_types}</FieldHintBottom>
        ) : null}
      </SchemaCard>
    </EditorCard>
  );
};
