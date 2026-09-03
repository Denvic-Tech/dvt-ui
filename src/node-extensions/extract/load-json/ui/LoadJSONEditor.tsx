import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Divider, Stack, Typography } from '@mui/material';

import { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

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
} from '@/shared/ui';

const JSON_PATH_MODE_OPTIONS = [
  { value: 'single', label: 'Один файл' },
  { value: 'pattern', label: 'Пакет по паттерну' },
] as const;

const JSON_UPLOAD_CONFIG = {
  acceptedExtensions: ['.json'],
  displayName: 'JSON файл',
  helperText: 'до 2 МБ',
} as const;

type LoadJSONValues = {
  connection?: unknown;
  path?: unknown;
  connection_overrides?: FileStorageConnectionOverridesValue;
  encoding?: string | null;
};

const wildcardChars = /[?*[]/;
const isJSON = (path: string) => path.toLowerCase().endsWith('.json');
const isPatternPath = (path: string) => wildcardChars.test(path);
const normalizePath = (path: string) =>
  path.replace(/^\/+/, '').replace(/\/+$/, '');

export const LoadJSONEditor: React.FC<
  NodeModalExtensionProps<LoadJSONValues>
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
    Partial<Record<keyof LoadJSONValues, string>>
  >({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileSizeLabel, setUploadedFileSizeLabel] = useState<
    string | null
  >(null);
  const [isUploadModeRequested, setIsUploadModeRequested] = useState(false);
  const [mode, setMode] = useState<'single' | 'pattern'>(() =>
    isPatternPath(
      typeof localInputData.path === 'string' ? localInputData.path : ''
    )
      ? 'pattern'
      : 'single'
  );
  const [patternBaseDir, setPatternBaseDir] = useState<string | null>(null);
  const { getConnectionById } = useConnections();
  const { getConnectedInputMetadata } = useNodeConnections(nodeID);
  const { uploadNodeFileInput } = useNodeFileInput(nodeID);

  const update = useCallback(
    (patch: Partial<LoadJSONValues>) =>
      setLocalInputData(prev => ({ ...prev, ...patch })),
    [setLocalInputData]
  );

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
  }, [localInputData.path, nodeID]);

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
      if (!isAcceptedNodeFile(file, JSON_UPLOAD_CONFIG.acceptedExtensions)) {
        setUploadError('Поддерживается только .json');
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
          getNodeFileInputErrorMessage(error, 'Не удалось загрузить JSON файл')
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

      const normalized = normalizePath(raw);
      const beforeWild = normalized.split(wildcardChars, 1)[0];
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
        const next: Partial<Record<keyof LoadJSONValues, string>> = {};
        const path =
          typeof localInputData.path === 'string'
            ? localInputData.path.trim()
            : '';

        if (sourceMode === 'upload') {
          if (
            !hasNodeFileInputSource(localInputData as Record<string, unknown>)
          ) {
            next.path = 'Сначала загрузите JSON файл';
          }
        } else if (isPathExpressionMode) {
          if (!expressionPathValue?.value.trim()) {
            next.path = 'Нужно задать expression для пути';
          }
        } else if (!path) {
          next.path =
            mode === 'single'
              ? 'Нужно выбрать .json файл'
              : 'Нужно задать путь или паттерн';
        } else if (mode === 'single') {
          if (!isJSON(path)) {
            next.path = 'Поддерживается только .json';
          }
        } else {
          const hasGlob = isPatternPath(path);
          const hasJsonExt = /\.json(\b|$)/i.test(path);

          if (!hasJsonExt) {
            next.path = 'Паттерн должен выбирать .json файлы';
          } else if (!hasGlob && !isJSON(path)) {
            next.path =
              'Похоже, это путь к одному файлу. Включите режим "Один файл" или добавьте * / ?';
          }
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
        config={JSON_UPLOAD_CONFIG}
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
              extension='.json'
              allowedFileExts={['json']}
              title={
                mode === 'single'
                  ? 'Выберите JSON файл'
                  : 'Выберите папку и задайте паттерн'
              }
              description={
                mode === 'single'
                  ? 'Выберите JSON файл через «Обзор» или введите полный путь вручную.'
                  : 'Выберите папку, а шаблон *.json подставится автоматически. При необходимости отредактируйте паттерн вручную.'
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
                  ? 'Выбор JSON source file'
                  : 'Выбор папки для JSON pattern'
              }
              pickerDescription={
                mode === 'single'
                  ? 'Выберите JSON файл.'
                  : 'Выберите папку. В path автоматически подставится шаблон *.json.'
              }
              pickerConfirmLabel='Использовать путь'
              browseTooltip={
                mode === 'single'
                  ? 'Выбрать JSON файл'
                  : 'Выбрать папку для JSON pattern'
              }
              mode={mode}
              modeOptions={JSON_PATH_MODE_OPTIONS}
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
                  ? `${normalizedSelection}/*.json`
                  : '*.json';
              }}
              {...(mode === 'pattern'
                ? { literalPlaceholder: 'reports/2026_*.json' }
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

          <SettingsFieldGroup>
            <SettingsFieldLabel>Кодировка (encoding)</SettingsFieldLabel>
            <SettingsTextInput
              placeholder='utf-8'
              value={localInputData.encoding ?? 'utf-8'}
              onChange={event =>
                update({ encoding: event.target.value || 'utf-8' })
              }
            />
            <SettingsFieldHint tone='default'>
              Напр. utf-8, cp1251. По умолчанию utf-8
            </SettingsFieldHint>
          </SettingsFieldGroup>
        </SettingsSection>
      </Stack>
    </Stack>
  );
};
