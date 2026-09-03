import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';

import { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import {
  FileStorageConnectionFields,
  FileStorageTargetPathSection,
} from '@/features/node/file-storage-target-path';
import { buildResolvedFileStoragePickerState } from '@/features/node/file-storage-target-path/ui/fileStorageConnectionFields.helpers';
import { useNodeConnections } from '@/features/node/get-node-connections';

import { useConnections } from '@/entities/data/db-connection';

import type { FtpMetadata, S3Metadata } from '@/shared/gatewayClient';
import { hasTrailingSlashStoragePath } from '@/shared/lib/file-storage-target-path';
import { isExpressionValue } from '@/shared/lib/node-input-values';

import {
  getBooleanDefault,
  getStringDefault,
  isValidSheetName,
  type SaveExcelValues,
} from './SaveExcelEditor.helpers';
import {
  EditorCard,
  FieldHintBottom,
  FieldLabel,
  StyledSwitch,
  TextInputBox,
  ToggleOption,
  TogglesCard,
} from './SaveExcelEditor.styles';

export const SaveExcelEditor: React.FC<
  NodeModalExtensionProps<SaveExcelValues>
> = ({
  id: nodeID,
  nodeDefinition,
  localInputData,
  setLocalInputData,
  setValidationCallback,
  variables,
}) => {
  const update = useCallback(
    (patch: Partial<SaveExcelValues>) =>
      setLocalInputData(prev => ({ ...prev, ...patch })),
    [setLocalInputData]
  );

  const { getConnectedInputMetadata } = useNodeConnections(nodeID);
  const { getConnectionById } = useConnections();
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

  const sheetNameDefault = useMemo(
    () =>
      getStringDefault(
        nodeDefinition?.input_definitions?.['sheet_name']?.default,
        'Sheet1'
      ),
    [nodeDefinition]
  );
  const indexDefault = useMemo(
    () =>
      getBooleanDefault(
        nodeDefinition?.input_definitions?.['index']?.default,
        false
      ),
    [nodeDefinition]
  );
  const headerDefault = useMemo(
    () =>
      getBooleanDefault(
        nodeDefinition?.input_definitions?.['header']?.default,
        true
      ),
    [nodeDefinition]
  );
  const singleFileDefault = useMemo(
    () =>
      getBooleanDefault(
        nodeDefinition?.input_definitions?.['single_file']?.default,
        true
      ),
    [nodeDefinition]
  );

  const [errors, setErrors] = useState<
    Partial<Record<keyof SaveExcelValues, string>>
  >({});
  const isPathExpressionMode = isExpressionValue(localInputData.path);
  const expressionPathValue = isExpressionValue(localInputData.path)
    ? localInputData.path
    : null;

  useLayoutEffect(() => {
    setLocalInputData(prev => {
      const { filename, ...rest } = prev;
      const next: SaveExcelValues = { ...rest };
      let changed = filename !== undefined;

      if (!next.sheet_name) {
        next.sheet_name = sheetNameDefault;
        changed = true;
      }
      if (typeof next.index !== 'boolean') {
        next.index = indexDefault;
        changed = true;
      }
      if (typeof next.header !== 'boolean') {
        next.header = headerDefault;
        changed = true;
      }
      if (typeof next.single_file !== 'boolean') {
        next.single_file = singleFileDefault;
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [
    headerDefault,
    indexDefault,
    setLocalInputData,
    sheetNameDefault,
    singleFileDefault,
  ]);

  useEffect(() => {
    setValidationCallback?.(() => {
      return () => {
        const next: Partial<Record<keyof SaveExcelValues, string>> = {};

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
            next.path = 'Укажите путь к XLSX-файлу';
          } else if (
            hasTrailingSlashStoragePath(
              typeof localInputData.path === 'string'
                ? localInputData.path
                : null
            )
          ) {
            next.path =
              'Путь должен включать имя XLSX-файла, а не только папку';
          }
        }

        const sheetName = (localInputData.sheet_name ?? '').trim();
        if (!sheetName) {
          next.sheet_name = 'Укажите имя листа';
        } else if (!isValidSheetName(sheetName)) {
          next.sheet_name =
            'Недопустимое имя листа: ≤31 символ, без : \\ / ? * [ ]';
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
  ]);

  return (
    <EditorCard>
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
        onChange={nextValue =>
          update({
            path: (nextValue as SaveExcelValues['path'] | undefined) ?? null,
          })
        }
        variables={variables}
        connectionMetadata={connectionMetadata}
        pickerState={pickerState}
        extension='.xlsx'
        allowedFileExts={['xlsx']}
        title='Путь сохранения'
        description={
          pathInputDefinition?.description ||
          'Укажите полный путь к XLSX-файлу, включая расширение, или выберите через «Обзор».'
        }
        errorText={errors.path ?? null}
        pickerTitle='Выбор Excel target path'
      />

      <div>
        <FieldLabel>Имя листа (sheet_name)</FieldLabel>
        <TextInputBox
          value={localInputData.sheet_name ?? sheetNameDefault}
          onChange={event =>
            update({
              sheet_name: event.target.value.trim()
                ? event.target.value
                : sheetNameDefault,
            })
          }
          placeholder='Sheet1'
          hasError={Boolean(errors.sheet_name)}
        />
        <FieldHintBottom tone={errors.sheet_name ? 'error' : 'default'}>
          {errors.sheet_name || 'Максимум 31 символ без : \\ / ? * [ ]'}
        </FieldHintBottom>
      </div>

      <TogglesCard>
        <ToggleOption
          control={
            <StyledSwitch
              checked={localInputData.index ?? indexDefault}
              onChange={event => update({ index: event.target.checked })}
            />
          }
          label='Сохранять индекс'
        />

        <ToggleOption
          control={
            <StyledSwitch
              checked={localInputData.header ?? headerDefault}
              onChange={event => update({ header: event.target.checked })}
            />
          }
          label='Сохранять заголовки'
        />

        <ToggleOption
          control={
            <StyledSwitch
              checked={localInputData.single_file ?? singleFileDefault}
              onChange={event => update({ single_file: event.target.checked })}
            />
          }
          label='Сохранить в один файл'
        />
      </TogglesCard>
    </EditorCard>
  );
};
