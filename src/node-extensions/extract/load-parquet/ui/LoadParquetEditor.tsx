import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Chip, Divider, Stack, Typography } from '@mui/material';

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

const PARQUET_UPLOAD_CONFIG = {
  acceptedExtensions: ['.parquet'],
  displayName: 'Parquet файл',
  helperText:
    'Файл будет загружен во внутреннее storage ноды. Лимит размера проверяет backend.',
} as const;

export type LoadParquetValues = {
  connection?: unknown;
  path?: unknown;
  connection_overrides?: FileStorageConnectionOverridesValue;
  usecols?: string[] | null;
};

const isParquet = (p: string) => {
  const s = p.toLowerCase();
  return s.endsWith('.parquet') || s.endsWith('.parq');
};

export const LoadParquetEditor: React.FC<
  NodeModalExtensionProps<LoadParquetValues>
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
    Partial<Record<keyof LoadParquetValues, string>>
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

  const update = useCallback(
    (patch: Partial<LoadParquetValues>) =>
      setLocalInputData(prev => ({ ...prev, ...patch })),
    [setLocalInputData]
  );

  useEffect(() => {
    setIsUploadModeRequested(false);
    setUploadedFileSizeLabel(null);
    setUploadError(null);
    setIsUploading(false);
  }, [nodeID]);

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
      if (!isAcceptedNodeFile(file, PARQUET_UPLOAD_CONFIG.acceptedExtensions)) {
        setUploadError('Поддерживается только .parquet');
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
          getNodeFileInputErrorMessage(
            error,
            'Не удалось загрузить Parquet файл'
          )
        );
      } finally {
        setIsUploading(false);
      }
    },
    [setLocalInputData, updateInputValues, uploadNodeFileInput]
  );

  useEffect(() => {
    if (!setValidationCallback) return;
    setValidationCallback(() => {
      return () => {
        const next: Partial<Record<keyof LoadParquetValues, string>> = {};
        const path =
          typeof localInputData.path === 'string'
            ? localInputData.path.trim()
            : '';

        if (sourceMode === 'upload') {
          if (
            !hasNodeFileInputSource(localInputData as Record<string, unknown>)
          ) {
            next.path = 'Сначала загрузите Parquet файл';
          }
        } else if (isPathExpressionMode) {
          if (!expressionPathValue?.value.trim()) {
            next.path = 'Нужно задать expression для пути';
          }
        } else if (!path) {
          next.path = 'Нужно выбрать .parquet файл';
        } else if (!isParquet(path)) {
          next.path = 'Поддерживается только .parquet';
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
    setValidationCallback,
    sourceMode,
  ]);

  const usecolsText = useMemo(
    () =>
      localInputData.usecols?.length ? localInputData.usecols.join(',') : '',
    [localInputData.usecols]
  );

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
        config={PARQUET_UPLOAD_CONFIG}
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
            extension='.parquet'
            allowedFileExts={['parquet', 'parq']}
            title='Выберите Parquet каталог или файл'
            description='Выберите parquet файл или каталог parquet dataset через «Обзор», либо введите путь вручную.'
            errorText={errors.path ?? null}
            pickerKind='generic'
            pickerSelectionMode='file_or_folder'
            pickerExtension={null}
            pickerTitle='Выбор parquet source path'
            pickerDescription='Выберите parquet файл или каталог parquet dataset.'
            pickerConfirmLabel='Использовать путь'
            browseTooltip='Выбрать parquet файл или каталог'
          />
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
            <SettingsFieldLabel>Столбцы (usecols)</SettingsFieldLabel>
            <SettingsTextInput
              placeholder='col1,col2,col3'
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
              {errors.usecols || 'Через запятую. Пусто — значит все столбцы'}
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
    </Stack>
  );
};
