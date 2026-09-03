import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { InfoOutlined as InfoIcon } from '@mui/icons-material';
import { Box, Chip, Divider, Stack, Tooltip, Typography } from '@mui/material';

import { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import {
  type ColumnDtypeEntry,
  ColumnDtypeOverridesEditor,
} from '@/features/node/column-dtype-overrides';
import {
  FileStorageConnectionFields,
  FileStorageTargetPathSection,
} from '@/features/node/file-storage-target-path';
import {
  buildResolvedFileStoragePickerState,
  type FileStorageConnectionOverridesValue,
} from '@/features/node/file-storage-target-path/ui/fileStorageConnectionFields.helpers';
import { useNodeConnections } from '@/features/node/get-node-connections';
import {
  formatNodeFileSize,
  getNodeFileInputErrorMessage,
  getUploadedFileDisplayName,
  hasNodeFileInputSource,
  isAcceptedNodeFile,
  type NodeFileSourceMode,
  NodeFileUploadField,
  useNodeFileInput,
} from '@/features/node/node-file-input';

import { useConnections } from '@/entities/data/db-connection';

import { type FtpMetadata, type S3Metadata } from '@/shared/gatewayClient';
import {
  isExpressionValue,
  unwrapInputValues,
} from '@/shared/lib/node-input-values';
import {
  SettingsFieldGroup,
  SettingsFieldHint,
  SettingsFieldLabel,
  SettingsSection,
  SettingsSectionTitle,
  SettingsTextInput,
  SettingsTwoColumns,
} from '@/shared/ui';

import {
  buildLoadExcelDtypes,
  DEFAULT_LOAD_EXCEL_DTYPE,
  findDuplicateDtypeEntryIndexes,
  getNumericSeparatorError,
  isLoadExcelDtype,
  LOAD_EXCEL_DTYPE_OPTIONS,
  loadExcelDtypesToEntries,
} from './LoadExcelEditor.helpers';
import { LoadExcelNumericSettings } from './LoadExcelNumericSettings';

const EXCEL_UPLOAD_CONFIG = {
  acceptedExtensions: ['.xls', '.xlsx', '.xlsm'],
  displayName: 'Excel файл',
  helperText:
    'Файл будет загружен во внутреннее storage ноды. Лимит размера проверяет backend.',
} as const;

export type LoadExcelValues = {
  connection?: unknown;
  path?: unknown;
  connection_overrides?: FileStorageConnectionOverridesValue;
  sheet_name?: string | null;
  usecols?: string[] | null;
  usecols_range?: string | null;
  dtypes?: Record<string, string> | null;
  thousands?: string | null;
  decimal?: string;
  header_row?: number | null;
  read_timeout_sec?: number | null;
};

const isExcel = (p: string) => {
  const s = p.toLowerCase();
  return s.endsWith('.xlsx') || s.endsWith('.xls') || s.endsWith('.xlsm');
};

const RANGE_RE = /^[A-Za-z]+(:[A-Za-z]+)?$|^[A-Za-z]+\d+:[A-Za-z]+\d+$/;
const toIntOrNull = (v: string) => {
  if (v.trim() === '') return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : NaN;
};

const getStringDefault = (value: unknown, fallback: string): string =>
  typeof value === 'string' ? value : fallback;

const getIntegerDefault = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isInteger(value) ? value : fallback;

export const LoadExcelEditor: React.FC<
  NodeModalExtensionProps<LoadExcelValues>
> = ({
  id: nodeID,
  localInputData,
  nodeDefinition,
  setLocalInputData,
  setValidationCallback,
  updateInputValues,
  variables,
}) => {
  const [errors, setErrors] = useState<
    Partial<Record<keyof LoadExcelValues, string>>
  >({});
  const [colsInputValue, setColsInputValue] = useState(
    localInputData.usecols?.join(',') ?? ''
  );
  const [dtypeDraftEntries, setDtypeDraftEntries] = useState<
    ColumnDtypeEntry[]
  >(() => loadExcelDtypesToEntries(localInputData.dtypes));
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileSizeLabel, setUploadedFileSizeLabel] = useState<
    string | null
  >(null);
  const [isUploadModeRequested, setIsUploadModeRequested] = useState(false);
  const { getConnectionById } = useConnections();
  const { getConnectedInputMetadata } = useNodeConnections(nodeID);
  const { uploadNodeFileInput } = useNodeFileInput(nodeID);

  const update = useCallback(
    (patch: Partial<LoadExcelValues>) =>
      setLocalInputData(prev => ({ ...prev, ...patch })),
    [setLocalInputData]
  );

  const sheetNameDefault = getStringDefault(
    nodeDefinition?.input_definitions?.['sheet_name']?.default,
    '0'
  );
  const headerRowDefault = getIntegerDefault(
    nodeDefinition?.input_definitions?.['header_row']?.default,
    0
  );
  const decimalDefault = getStringDefault(
    nodeDefinition?.input_definitions?.['decimal']?.default,
    '.'
  );

  useLayoutEffect(() => {
    setLocalInputData(prev => {
      const next = { ...prev };
      let changed = false;

      if (next.dtypes === undefined) {
        next.dtypes = null;
        changed = true;
      }
      if (next.thousands === undefined || next.thousands === '') {
        next.thousands = null;
        changed = true;
      }
      if (next.decimal === undefined || next.decimal === '') {
        next.decimal = decimalDefault;
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [decimalDefault, setLocalInputData]);

  useEffect(() => {
    setIsUploadModeRequested(false);
    setUploadedFileSizeLabel(null);
    setUploadError(null);
    setIsUploading(false);
  }, [nodeID]);

  const hydratedDtypeEntries = useMemo(
    () => loadExcelDtypesToEntries(localInputData.dtypes),
    [localInputData.dtypes]
  );

  useEffect(() => {
    setDtypeDraftEntries(hydratedDtypeEntries);
  }, [hydratedDtypeEntries, nodeID]);

  const duplicateDtypeIndexes = useMemo(
    () => findDuplicateDtypeEntryIndexes(dtypeDraftEntries),
    [dtypeDraftEntries]
  );

  const dtypeColumnErrors = useMemo(() => {
    const duplicateIndexSet = new Set(duplicateDtypeIndexes);
    const result: Partial<Record<number, string>> = {};

    dtypeDraftEntries.forEach((entry, index) => {
      if (duplicateIndexSet.has(index)) {
        result[index] = 'Имя колонки уже используется';
      } else if (entry.dtype && !isLoadExcelDtype(entry.dtype)) {
        result[index] = 'Выберите поддерживаемый dtype';
      }
    });

    return result;
  }, [dtypeDraftEntries, duplicateDtypeIndexes]);

  const handleDtypeEntriesChange = useCallback(
    (entries: ColumnDtypeEntry[]) => {
      setDtypeDraftEntries(entries);

      const hasDuplicates = findDuplicateDtypeEntryIndexes(entries).length > 0;
      const hasUnsupportedDtype = entries.some(
        entry => entry.dtype && !isLoadExcelDtype(entry.dtype)
      );
      if (hasDuplicates || hasUnsupportedDtype) {
        return;
      }

      const nextDtypes = buildLoadExcelDtypes(entries);
      if (
        JSON.stringify(nextDtypes) !==
        JSON.stringify(localInputData.dtypes ?? null)
      ) {
        update({ dtypes: nextDtypes });
      }
    },
    [localInputData.dtypes, update]
  );

  const handleNumericSettingsChange = useCallback(
    (patch: { decimal?: string; thousands?: string | null }) => {
      update(patch);
      setErrors(prev => {
        if (!prev.decimal && !prev.thousands) {
          return prev;
        }

        const next = { ...prev };
        delete next.decimal;
        delete next.thousands;
        return next;
      });
    },
    [update]
  );

  const suggestedDtypeColumn =
    localInputData.usecols?.find(
      column => !dtypeDraftEntries.some(entry => entry.columnName === column)
    ) ?? '';

  const liveSeparatorError = getNumericSeparatorError(
    localInputData.thousands,
    localInputData.decimal ?? decimalDefault
  );

  const connectionMetadata = useMemo(
    () =>
      (getConnectedInputMetadata('connection') as
        | S3Metadata
        | FtpMetadata
        | undefined) ?? null,
    [getConnectedInputMetadata]
  );
  const connectionRecord = useMemo(
    () =>
      connectionMetadata?.connection_id
        ? (getConnectionById(connectionMetadata.connection_id) ?? null)
        : null,
    [connectionMetadata?.connection_id, getConnectionById]
  );
  const isUploadDisabled = Boolean(connectionMetadata);
  const hasUploadedSource = hasNodeFileInputSource(
    localInputData as Record<string, unknown>
  );
  const sourceMode: NodeFileSourceMode =
    !isUploadDisabled && (isUploadModeRequested || hasUploadedSource)
      ? 'upload'
      : 'manual';
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
  const isPathExpressionMode = isExpressionValue(localInputData.path);
  const expressionPathValue =
    isExpressionValue(localInputData.path) &&
    localInputData.path.expression_kind === 'single'
      ? localInputData.path
      : null;

  const clearUploadSource = useCallback(() => {
    setUploadedFileSizeLabel(null);
    setUploadError(null);
    update({
      connection: undefined,
      path: undefined,
    });
  }, [update]);

  useEffect(() => {
    if (!isUploadDisabled || sourceMode !== 'upload') {
      return;
    }

    setIsUploadModeRequested(false);
    clearUploadSource();
  }, [clearUploadSource, isUploadDisabled, sourceMode]);

  const handleSourceModeChange = useCallback(
    (nextMode: NodeFileSourceMode) => {
      if (nextMode === sourceMode) {
        return;
      }

      setUploadError(null);

      if (nextMode === 'upload') {
        setIsUploadModeRequested(true);
        setUploadedFileSizeLabel(null);
        update({
          connection: undefined,
          connection_overrides: undefined,
          path: undefined,
        });
        return;
      }

      setIsUploadModeRequested(false);
      clearUploadSource();
    },
    [clearUploadSource, sourceMode, update]
  );

  const handleUploadFile = useCallback(
    async (file: File) => {
      if (!isAcceptedNodeFile(file, EXCEL_UPLOAD_CONFIG.acceptedExtensions)) {
        setUploadError('Поддерживаются только .xls, .xlsx и .xlsm');
        return;
      }

      setUploadError(null);
      setIsUploading(true);

      try {
        const response = await uploadNodeFileInput(file);
        const inputValuesPatch = response.input_values_patch;

        if (!inputValuesPatch || Object.keys(inputValuesPatch).length === 0) {
          throw new Error('Backend не вернул input_values_patch');
        }

        const rawPatch = unwrapInputValues(inputValuesPatch);

        setIsUploadModeRequested(true);
        setUploadedFileSizeLabel(formatNodeFileSize(file.size));
        setLocalInputData(prev => ({
          ...prev,
          ...rawPatch,
          connection_overrides: undefined,
        }));
        updateInputValues?.(inputValuesPatch);
      } catch (error) {
        setUploadError(
          getNodeFileInputErrorMessage(error, 'Не удалось загрузить Excel файл')
        );
      } finally {
        setIsUploading(false);
      }
    },
    [setLocalInputData, updateInputValues, uploadNodeFileInput]
  );

  useEffect(() => {
    const parentCols = localInputData.usecols || [];
    const localParsed = colsInputValue
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const isDifferent =
      parentCols.length !== localParsed.length ||
      parentCols.some((c, i) => c !== localParsed[i]);

    if (isDifferent) {
      setColsInputValue(parentCols.join(','));
    }
  }, [colsInputValue, localInputData.usecols]);

  useEffect(() => {
    if (!setValidationCallback) return;
    setValidationCallback(() => {
      return () => {
        const next: Partial<Record<keyof LoadExcelValues, string>> = {};
        const path =
          typeof localInputData.path === 'string'
            ? localInputData.path.trim()
            : '';

        if (sourceMode === 'upload') {
          if (
            !hasNodeFileInputSource(localInputData as Record<string, unknown>)
          ) {
            next.path = 'Сначала загрузите Excel файл';
          }
        } else if (isPathExpressionMode) {
          if (!expressionPathValue?.value.trim()) {
            next.path = 'Укажите expression для пути';
          }
        } else if (!path) {
          next.path = 'Укажите путь к файлу или маску';
        } else if (!isExcel(path)) {
          next.path = 'Путь должен заканчиваться на .xlsx, .xls или .xlsm';
        }

        const cols = localInputData.usecols;
        const range = (localInputData.usecols_range ?? '').trim();

        if (cols && cols.some(c => !c.trim())) {
          next.usecols = 'Имена столбцов должны быть непустыми';
        }
        if (range && !RANGE_RE.test(range)) {
          next.usecols_range = 'Неверный диапазон (пример: A:D или A1:D100)';
        }
        if (cols?.length && range) {
          next.usecols =
            'Нельзя указывать и список колонок, и диапазон одновременно';
          next.usecols_range = 'Очистите одно из полей';
        }

        if (duplicateDtypeIndexes.length) {
          next.dtypes = 'Имена колонок в dtype не должны повторяться';
        } else if (
          dtypeDraftEntries.some(
            entry => entry.dtype && !isLoadExcelDtype(entry.dtype)
          )
        ) {
          next.dtypes = 'Выберите поддерживаемый dtype';
        }

        const numericSeparatorError = getNumericSeparatorError(
          localInputData.thousands,
          localInputData.decimal ?? decimalDefault
        );
        if (numericSeparatorError) {
          next.thousands = numericSeparatorError;
          next.decimal = numericSeparatorError;
        }

        const hr = localInputData.header_row;
        if (hr != null) {
          if (!Number.isInteger(hr) || hr < 0) {
            next.header_row = 'Должно быть целым числом ≥ 0';
          }
        }

        const timeout = localInputData.read_timeout_sec;
        if (timeout != null && (!Number.isInteger(timeout) || timeout < 1)) {
          next.read_timeout_sec = 'Должно быть целым числом ≥ 1';
        }

        setErrors(next);
        return Object.keys(next).length === 0;
      };
    });
  }, [
    decimalDefault,
    dtypeDraftEntries,
    duplicateDtypeIndexes.length,
    expressionPathValue,
    isPathExpressionMode,
    localInputData,
    setValidationCallback,
    sourceMode,
  ]);

  const handleColsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setColsInputValue(val);
    const arr = val
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    update({ usecols: arr.length ? arr : null });
  };

  const currentUploadedPath =
    sourceMode === 'upload' && typeof localInputData.path === 'string'
      ? localInputData.path
      : null;
  const currentUploadedFileName =
    sourceMode === 'upload'
      ? (getUploadedFileDisplayName(currentUploadedPath) ?? null)
      : null;
  const currentUploadedFileSizeLabel =
    sourceMode === 'upload' ? uploadedFileSizeLabel : null;

  return (
    <Stack spacing={1.5}>
      <NodeFileUploadField
        config={EXCEL_UPLOAD_CONFIG}
        currentFileName={currentUploadedFileName}
        currentFilePath={currentUploadedPath}
        currentFileSizeLabel={currentUploadedFileSizeLabel}
        error={uploadError}
        isUploading={isUploading}
        mode={sourceMode}
        onClear={clearUploadSource}
        onFileSelected={handleUploadFile}
        onModeChange={handleSourceModeChange}
        uploadDisabled={isUploadDisabled}
        uploadDisabledReason='Уберите подключение connection, чтобы загрузить файл напрямую'
      />

      {sourceMode === 'manual' ? (
        <>
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
            value={localInputData.path ?? ''}
            onChange={nextValue => update({ path: nextValue })}
            variables={variables}
            connectionMetadata={connectionMetadata}
            pickerState={pickerState}
            extension='.xlsx'
            allowedFileExts={['xlsx', 'xls', 'xlsm']}
            title='Файл или маска поиска'
            titleHint={
              <Tooltip title='Можно выбрать файл из файлового менеджера или ввести путь вручную, используя маски: * (любые символы), ? (один символ), [0-9] (диапазон). Пример: reports/2023_*.xlsx'>
                <span>
                  <InfoIcon
                    fontSize='small'
                    color='action'
                    sx={{ width: 16, height: 16, cursor: 'help' }}
                  />
                </span>
              </Tooltip>
            }
            description='Можно выбрать Excel файл через «Обзор» или ввести путь вручную. Для glob-паттернов оставьте путь в literal-режиме.'
            literalPlaceholder='reports/2023_*.xlsx'
            errorText={errors.path ?? null}
            pickerKind='generic'
            pickerSelectionMode='file'
            pickerExtension={null}
            pickerTitle='Выбор Excel source path'
            pickerDescription='Выберите Excel файл. Для glob-паттернов path можно оставить ручным.'
            pickerConfirmLabel='Использовать путь'
            browseTooltip='Выбрать Excel файл'
          />
        </>
      ) : null}

      {sourceMode === 'upload' && !!errors.path && (
        <Typography variant='caption' color='error.main'>
          {errors.path}
        </Typography>
      )}

      <Stack spacing={2}>
        <Box sx={{ py: 1 }}>
          <Divider sx={{ borderColor: '#e5e7eb' }} />
        </Box>

        <SettingsSection>
          <SettingsSectionTitle>Параметры чтения</SettingsSectionTitle>

          <SettingsTwoColumns>
            <SettingsFieldGroup>
              <SettingsFieldLabel>Имя листа (sheet_name)</SettingsFieldLabel>
              <SettingsTextInput
                aria-label='Имя листа'
                placeholder='0'
                value={
                  localInputData.sheet_name === undefined
                    ? sheetNameDefault
                    : (localInputData.sheet_name ?? '')
                }
                onChange={e => update({ sheet_name: e.target.value || null })}
              />
              <SettingsFieldHint tone='default'>
                Имя листа или индекс. Пусто — первый лист
              </SettingsFieldHint>
            </SettingsFieldGroup>

            <SettingsFieldGroup>
              <SettingsFieldLabel>
                Строка заголовка (header_row)
              </SettingsFieldLabel>
              <SettingsTextInput
                aria-label='Строка заголовка'
                placeholder='0'
                type='number'
                min={0}
                step={1}
                value={
                  localInputData.header_row === undefined
                    ? headerRowDefault
                    : (localInputData.header_row ?? '')
                }
                onChange={e => {
                  const n = toIntOrNull(e.target.value);
                  update({ header_row: n as number | null });
                }}
                hasError={Boolean(errors.header_row)}
              />
              <SettingsFieldHint tone={errors.header_row ? 'error' : 'default'}>
                {errors.header_row ||
                  '0 — первая строка (как в pandas.read_excel)'}
              </SettingsFieldHint>
            </SettingsFieldGroup>
          </SettingsTwoColumns>

          <SettingsFieldGroup>
            <SettingsFieldLabel>Столбцы (usecols)</SettingsFieldLabel>
            <SettingsTextInput
              aria-label='Столбцы'
              placeholder='id, name, amount, created_at'
              value={colsInputValue}
              onChange={handleColsChange}
              hasError={Boolean(errors.usecols)}
            />
            <SettingsFieldHint tone={errors.usecols ? 'error' : 'default'}>
              {errors.usecols || 'Через запятую. Пусто — все столбцы'}
            </SettingsFieldHint>

            {!!localInputData.usecols?.length && (
              <Stack
                direction='row'
                spacing={0.5}
                flexWrap='wrap'
                sx={{ mt: 1 }}
              >
                {localInputData.usecols.map(column => (
                  <Chip
                    key={column}
                    size='small'
                    label={column}
                    onDelete={() => {
                      const next = (localInputData.usecols || []).filter(
                        value => value !== column
                      );
                      update({ usecols: next.length ? next : null });
                    }}
                    sx={{ mb: 0.5 }}
                  />
                ))}
              </Stack>
            )}
          </SettingsFieldGroup>

          <SettingsTwoColumns>
            <SettingsFieldGroup>
              <SettingsFieldLabel>
                Таймаут чтения (read_timeout_sec)
              </SettingsFieldLabel>
              <SettingsTextInput
                aria-label='Таймаут чтения'
                placeholder='Не ограничен'
                type='number'
                min={1}
                step={1}
                value={localInputData.read_timeout_sec ?? ''}
                onChange={e => {
                  const n = toIntOrNull(e.target.value);
                  update({ read_timeout_sec: n as number | null });
                }}
                hasError={Boolean(errors.read_timeout_sec)}
              />
              <SettingsFieldHint
                tone={errors.read_timeout_sec ? 'error' : 'default'}
              >
                {errors.read_timeout_sec ||
                  'В секундах. Пусто — без ограничения'}
              </SettingsFieldHint>
            </SettingsFieldGroup>
          </SettingsTwoColumns>
        </SettingsSection>

        <LoadExcelNumericSettings
          decimal={localInputData.decimal ?? decimalDefault}
          decimalError={errors.decimal ?? liveSeparatorError ?? undefined}
          onChange={handleNumericSettingsChange}
          thousands={localInputData.thousands}
          thousandsError={errors.thousands ?? liveSeparatorError ?? undefined}
        />

        <ColumnDtypeOverridesEditor
          columnErrors={dtypeColumnErrors}
          defaultDtype={DEFAULT_LOAD_EXCEL_DTYPE}
          description='Приведение отдельных колонок при чтении. Остальные — авто.'
          emptyText='Добавьте колонку, если для неё нужен явный тип.'
          entries={dtypeDraftEntries}
          onChange={handleDtypeEntriesChange}
          options={LOAD_EXCEL_DTYPE_OPTIONS}
          suggestedColumnName={suggestedDtypeColumn}
          title='Типы столбцов (dtype)'
        />
      </Stack>
    </Stack>
  );
};
