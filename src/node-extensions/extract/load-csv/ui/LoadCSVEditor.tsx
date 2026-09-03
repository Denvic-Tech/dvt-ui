import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Chip, Divider, Stack, Typography } from '@mui/material';

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

const CSV_PATH_MODE_OPTIONS = [
  { value: 'single', label: 'Один файл' },
  { value: 'pattern', label: 'Пакет по паттерну' },
] as const;

const CSV_UPLOAD_CONFIG = {
  acceptedExtensions: ['.csv'],
  displayName: 'CSV файл',
  helperText: 'до 2 МБ',
} as const;
const DTYPE_TYPE_OPTIONS = [
  { value: 'str', label: 'str' },
  { value: 'Int64', label: 'int64' },
  { value: 'Float64', label: 'float64' },
  { value: 'bool', label: 'bool' },
  { value: 'datetime64[ns]', label: 'datetime' },
];

type LoadCSVValues = {
  connection?: unknown;
  path?: unknown;
  connection_overrides?: FileStorageConnectionOverridesValue;
  delimiter?: string | null;
  encoding?: string | null;
  usecols?: string[] | null;
  dtype?: { [columnName: string]: string } | undefined;
};

const wildcardChars = /[?*[]/;
const isCSV = (p: string) => p.toLowerCase().endsWith('.csv');
const isPatternPath = (p: string) => wildcardChars.test(p);
const normalizePath = (p: string) => p.replace(/^\/+/, '').replace(/\/+$/, '');

export const LoadCSVEditor: React.FC<
  NodeModalExtensionProps<LoadCSVValues>
> = ({
  id: nodeID,
  localInputData,
  nodeDefinition,
  setLocalInputData,
  setValidationCallback,
  updateInputValues,
  variables,
}) => {
  const [errors, setErrors] = React.useState<
    Partial<Record<keyof LoadCSVValues, string>>
  >({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileSizeLabel, setUploadedFileSizeLabel] = useState<
    string | null
  >(null);
  const [isUploadModeRequested, setIsUploadModeRequested] = useState(false);
  const { getConnectionById } = useConnections();
  const { getConnectedInputMetadata } = useNodeConnections(nodeID);
  const { uploadNodeFileInput } = useNodeFileInput(nodeID);

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

  const [mode, setMode] = React.useState<'single' | 'pattern'>(() =>
    isPatternPath(
      typeof localInputData.path === 'string' ? localInputData.path : ''
    )
      ? 'pattern'
      : 'single'
  );

  const [patternBaseDir, setPatternBaseDir] = React.useState<string | null>(
    null
  );
  const [dtypeDraftEntries, setDtypeDraftEntriesState] = useState<
    ColumnDtypeEntry[]
  >([]);

  useEffect(() => {
    const nextMode = isPatternPath(
      typeof localInputData.path === 'string' ? localInputData.path : ''
    )
      ? 'pattern'
      : 'single';
    setMode(nextMode);
    setPatternBaseDir(null);
    setIsUploadModeRequested(false);
    setUploadedFileSizeLabel(null);
    setUploadError(null);
    setIsUploading(false);
  }, [nodeID]);

  const update = useCallback(
    (patch: Partial<LoadCSVValues>) =>
      setLocalInputData(prev => ({ ...prev, ...patch })),
    [setLocalInputData]
  );

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
        setPatternBaseDir(null);
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
      if (!isAcceptedNodeFile(file, CSV_UPLOAD_CONFIG.acceptedExtensions)) {
        setUploadError('Поддерживается только .csv');
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
          getNodeFileInputErrorMessage(error, 'Не удалось загрузить CSV файл')
        );
      } finally {
        setIsUploading(false);
      }
    },
    [setLocalInputData, updateInputValues, uploadNodeFileInput]
  );

  useEffect(() => {
    const raw = pickerState.resolvedPathValue?.trim() ?? '';
    if (!raw) {
      return;
    }

    if (isPatternPath(raw)) {
      if (mode !== 'pattern') {
        setMode('pattern');
      }

      const norm = normalizePath(raw);
      const beforeWild = norm.split(wildcardChars, 1)[0];
      const baseDir = beforeWild.includes('/')
        ? beforeWild.split('/').slice(0, -1).join('/')
        : '';
      setPatternBaseDir(baseDir || null);
    }
  }, [mode, pickerState.resolvedPathValue]);

  useEffect(() => {
    if (!setValidationCallback) return;
    setValidationCallback(() => {
      return () => {
        const next: Partial<Record<keyof LoadCSVValues, string>> = {};
        const path =
          typeof localInputData.path === 'string'
            ? localInputData.path.trim()
            : '';

        if (sourceMode === 'upload') {
          if (
            !hasNodeFileInputSource(localInputData as Record<string, unknown>)
          ) {
            next.path = 'Сначала загрузите CSV файл';
          }
        } else if (isPathExpressionMode) {
          if (!expressionPathValue?.value.trim()) {
            next.path = 'Нужно задать expression для пути';
          }
        } else if (!path) {
          next.path =
            mode === 'single'
              ? 'Нужно выбрать .csv файл'
              : 'Нужно задать путь или паттерн';
        } else if (mode === 'single') {
          if (!isCSV(path)) {
            next.path = 'Поддерживается только .csv';
          }
        } else {
          const hasGlob = isPatternPath(path);
          const hasCsvExt = /\.csv(\b|$)/i.test(path);

          if (!hasCsvExt) {
            next.path = 'Паттерн должен выбирать .csv файлы';
          } else if (!hasGlob && !isCSV(path)) {
            next.path =
              'Похоже, это путь к одному файлу. Включите режим "Один файл" или добавьте * / ?';
          }
        }

        const delimStr = (localInputData.delimiter ?? '').trim();
        if (delimStr.length > 20) {
          next.delimiter =
            'Разделитель должен быть длиной 20 символов или меньше';
        }

        const cols = localInputData.usecols;
        if (cols && cols.some(c => !c.trim())) {
          next.usecols = 'Имена столбцов должны быть непустыми';
        }

        setErrors(next);
        return Object.keys(next).length === 0;
      };
    });
  }, [
    expressionPathValue,
    isPathExpressionMode,
    localInputData,
    mode,
    setValidationCallback,
    sourceMode,
  ]);

  const usecolsText = useMemo(
    () =>
      localInputData.usecols?.length ? localInputData.usecols.join(',') : '',
    [localInputData.usecols]
  );

  const dtypeEntries = useMemo(
    () =>
      Object.entries(localInputData.dtype ?? {}).map(
        ([columnName, dtype]): ColumnDtypeEntry => ({ columnName, dtype })
      ),
    [localInputData.dtype]
  );

  useEffect(() => {
    setDtypeDraftEntriesState(dtypeEntries);
  }, [dtypeEntries, nodeID]);

  const setDtypeEntries = useCallback(
    (entries: ColumnDtypeEntry[]) => {
      setDtypeDraftEntriesState(entries);
      const next: Record<string, string> = {};

      entries.forEach(({ columnName, dtype }) => {
        const trimmedColumnName = columnName.trim();
        if (!trimmedColumnName || !dtype) return;
        next[trimmedColumnName] = dtype;
      });

      update({ dtype: Object.keys(next).length ? next : undefined });
    },
    [update]
  );

  const suggestedDtypeColumn =
    localInputData.usecols?.find(
      col => !dtypeDraftEntries.some(entry => entry.columnName === col)
    ) ?? '';

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
        config={CSV_UPLOAD_CONFIG}
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

          <Box sx={{ pt: 1 }}>
            <FileStorageTargetPathSection
              inputDefinition={pathInputDefinition}
              value={localInputData.path ?? ''}
              onChange={nextValue => update({ path: nextValue })}
              variables={variables}
              connectionMetadata={connectionMetadata}
              pickerState={pickerState}
              extension='.csv'
              allowedFileExts={['csv']}
              title={
                mode === 'single'
                  ? 'Выберите CSV файл'
                  : 'Выберите папку и задайте паттерн'
              }
              description={
                mode === 'single'
                  ? 'Выберите CSV файл через «Обзор» или введите полный путь вручную.'
                  : 'Выберите папку, а шаблон *.csv подставится автоматически. При необходимости отредактируйте паттерн вручную.'
              }
              errorText={errors.path ?? null}
              pickerKind='generic'
              pickerSelectionMode={mode === 'single' ? 'file' : 'folder'}
              pickerSelectedPath={
                mode === 'single'
                  ? pickerState.resolvedPathValue
                  : patternBaseDir
              }
              pickerExtension={null}
              pickerTitle={
                mode === 'single'
                  ? 'Выбор CSV source file'
                  : 'Выбор папки для CSV pattern'
              }
              pickerDescription={
                mode === 'single'
                  ? 'Выберите CSV файл.'
                  : 'Выберите папку. В path автоматически подставится шаблон *.csv.'
              }
              pickerConfirmLabel='Использовать путь'
              browseTooltip={
                mode === 'single'
                  ? 'Выбрать CSV файл'
                  : 'Выбрать папку для CSV pattern'
              }
              mode={mode}
              modeOptions={CSV_PATH_MODE_OPTIONS}
              onModeChange={nextMode =>
                setMode(nextMode as 'single' | 'pattern')
              }
              mapPickerSelectionToValue={selection => {
                const normalizedSelection = normalizePath(selection.path || '');
                if (mode === 'single') {
                  return normalizedSelection;
                }

                setPatternBaseDir(normalizedSelection || null);
                return normalizedSelection
                  ? `${normalizedSelection}/*.csv`
                  : '*.csv';
              }}
              {...(mode === 'pattern'
                ? { literalPlaceholder: 'reports/2023_*.csv' }
                : {})}
            />
          </Box>
        </>
      ) : null}

      {sourceMode === 'upload' && !!errors.path && (
        <Typography variant='caption' color='error.main'>
          {errors.path}
        </Typography>
      )}

      <Stack spacing={1.5}>
        <Box sx={{ py: 1 }}>
          <Divider sx={{ borderColor: '#e5e7eb' }} />
        </Box>

        <SettingsSection>
          <SettingsSectionTitle>Параметры чтения</SettingsSectionTitle>

          <SettingsTwoColumns>
            <SettingsFieldGroup>
              <SettingsFieldLabel>Разделитель (delimiter)</SettingsFieldLabel>
              <SettingsTextInput
                placeholder=','
                value={localInputData.delimiter ?? ''}
                onChange={e => update({ delimiter: e.target.value })}
                hasError={Boolean(errors.delimiter)}
                maxLength={20}
              />
              <SettingsFieldHint tone={errors.delimiter ? 'error' : 'default'}>
                {errors.delimiter || 'Пусто — запятая. Поддерживаются \\t'}
              </SettingsFieldHint>
            </SettingsFieldGroup>

            <SettingsFieldGroup>
              <SettingsFieldLabel>Кодировка (encoding)</SettingsFieldLabel>
              <SettingsTextInput
                placeholder='utf-8'
                value={localInputData.encoding ?? ''}
                onChange={e => update({ encoding: e.target.value || null })}
              />
              <SettingsFieldHint tone='default'>
                Напр. utf-8, cp1251. Можно пусто
              </SettingsFieldHint>
            </SettingsFieldGroup>
          </SettingsTwoColumns>

          <SettingsFieldGroup>
            <SettingsFieldLabel>Столбцы (usecols)</SettingsFieldLabel>
            <SettingsTextInput
              placeholder='id, name, amount, created_at'
              value={usecolsText}
              onChange={e => {
                const arr = e.target.value
                  .split(',')
                  .map(s => s.trim())
                  .filter(Boolean);
                update({ usecols: arr.length ? arr : null });
              }}
              hasError={Boolean(errors.usecols)}
            />
            <SettingsFieldHint tone={errors.usecols ? 'error' : 'default'}>
              {errors.usecols || 'Через запятую. Пусто — все столбцы'}
            </SettingsFieldHint>
          </SettingsFieldGroup>
        </SettingsSection>
      </Stack>

      {!!localInputData.usecols?.length && (
        <Stack direction='row' spacing={0.5} flexWrap='wrap'>
          {localInputData.usecols.map(c => (
            <Chip
              key={c}
              size='small'
              label={c}
              onDelete={() => {
                const next = (localInputData.usecols || []).filter(
                  x => x !== c
                );
                update({ usecols: next.length ? next : null });
              }}
              sx={{ mb: 0.5 }}
            />
          ))}
        </Stack>
      )}

      <Box sx={{ pt: 1 }}>
        <ColumnDtypeOverridesEditor
          defaultDtype='str'
          description='Приведение отдельных колонок при чтении. Остальные — авто.'
          emptyText='Можно задать типы отдельных колонок при чтении CSV.'
          entries={dtypeDraftEntries}
          onChange={setDtypeEntries}
          options={DTYPE_TYPE_OPTIONS}
          suggestedColumnName={suggestedDtypeColumn}
          title='Типы столбцов (dtype)'
        />
      </Box>
    </Stack>
  );
};
