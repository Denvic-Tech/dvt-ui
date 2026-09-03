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
  SettingsFieldGroup,
  SettingsFieldHint,
  SettingsFieldLabel,
  SettingsTextInput,
  SettingsTwoColumns,
} from '@/shared/ui';

import {
  getBooleanDefault,
  getStringDefault,
  type SaveCSVValues,
} from './SaveCSVEditor.helpers';
import {
  EditorCard,
  StyledSwitch,
  ToggleOption,
  TogglesCard,
} from './SaveCSVEditor.styles';

export const SaveCSVEditor: React.FC<
  NodeModalExtensionProps<SaveCSVValues>
> = ({
  id: nodeID,
  nodeDefinition,
  localInputData,
  setLocalInputData,
  setValidationCallback,
  variables,
}) => {
  const update = useCallback(
    (patch: Partial<SaveCSVValues>) =>
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

  const delimiterDefault = useMemo(
    () =>
      getStringDefault(
        nodeDefinition?.input_definitions?.['delimiter']?.default,
        ','
      ) ?? ',',
    [nodeDefinition]
  );
  const encodingDefault = useMemo(
    () =>
      getStringDefault(
        nodeDefinition?.input_definitions?.['encoding']?.default,
        'utf-8'
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
    Partial<Record<keyof SaveCSVValues, string>>
  >({});
  const isPathExpressionMode = isExpressionValue(localInputData.path);
  const expressionPathValue = isExpressionValue(localInputData.path)
    ? localInputData.path
    : null;

  useLayoutEffect(() => {
    setLocalInputData(prev => {
      const { filename, usecols, ...rest } = prev;
      const next: SaveCSVValues = { ...rest };
      let changed = filename !== undefined || usecols !== undefined;

      if (next.delimiter === undefined) {
        next.delimiter = delimiterDefault;
        changed = true;
      }
      if (next.encoding === undefined) {
        next.encoding = encodingDefault;
        changed = true;
      }
      if (next.index === undefined) {
        next.index = indexDefault;
        changed = true;
      }
      if (next.header === undefined) {
        next.header = headerDefault;
        changed = true;
      }
      if (next.single_file === undefined) {
        next.single_file = singleFileDefault;
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [
    delimiterDefault,
    encodingDefault,
    headerDefault,
    indexDefault,
    setLocalInputData,
    singleFileDefault,
  ]);

  useEffect(() => {
    setValidationCallback?.(() => {
      return () => {
        const next: Partial<Record<keyof SaveCSVValues, string>> = {};

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
            next.path = 'Укажите путь к CSV-файлу';
          } else if (
            hasTrailingSlashStoragePath(
              typeof localInputData.path === 'string'
                ? localInputData.path
                : null
            )
          ) {
            next.path = 'Путь должен включать имя CSV-файла, а не только папку';
          }
        }

        const delimiterValue = (localInputData.delimiter ?? '').trim();
        if (delimiterValue.length > 20) {
          next.delimiter =
            'Разделитель должен быть длиной 20 символов или меньше';
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
        onChange={nextValue => update({ path: nextValue })}
        variables={variables}
        connectionMetadata={connectionMetadata}
        pickerState={pickerState}
        extension='.csv'
        allowedFileExts={['csv']}
        title='Путь сохранения'
        description={
          pathInputDefinition?.description ||
          'Укажите полный путь к файлу, включая расширение, или выберите через «Обзор».'
        }
        errorText={errors.path ?? null}
        pickerTitle='Выбор CSV target path'
      />

      <SettingsTwoColumns>
        <SettingsFieldGroup>
          <SettingsFieldLabel>Разделитель (delimiter)</SettingsFieldLabel>
          <SettingsTextInput
            value={localInputData.delimiter ?? delimiterDefault ?? ''}
            onChange={event => update({ delimiter: event.target.value })}
            placeholder=','
            hasError={Boolean(errors.delimiter)}
          />
          <SettingsFieldHint tone={errors.delimiter ? 'error' : 'default'}>
            {errors.delimiter ||
              'Поддерживаются escape-последовательности вроде \\t'}
          </SettingsFieldHint>
        </SettingsFieldGroup>

        <SettingsFieldGroup>
          <SettingsFieldLabel>Кодировка (encoding)</SettingsFieldLabel>
          <SettingsTextInput
            value={localInputData.encoding ?? encodingDefault ?? ''}
            onChange={event => update({ encoding: event.target.value || null })}
            placeholder='utf-8'
          />
          <SettingsFieldHint tone='default'>
            Можно оставить пустым
          </SettingsFieldHint>
        </SettingsFieldGroup>
      </SettingsTwoColumns>

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
