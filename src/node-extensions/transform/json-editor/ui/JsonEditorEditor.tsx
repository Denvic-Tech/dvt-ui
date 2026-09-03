import { type ReactNode, useMemo } from 'react';
import { alpha, Box, Paper, Stack, Typography } from '@mui/material';

import type { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import { useNodeConnections } from '@/features/node/get-node-connections';
import { NodeDataInput } from '@/features/node/use-universal-node-data-input';

import {
  findJsonExcludeConflicts,
  isJsonMetadata,
} from '@/entities/data/json-data';

import type {
  InputDefinitionModel,
  Io,
  JsonMetadata,
  NodeDefinition,
} from '@/shared/gatewayClient';
import { Alert } from '@/shared/ui/primitives';

import {
  GROUP_LABELS,
  type SchemaMappingActionKey,
} from './SchemaMapping/helpers';
import { SchemaMapping } from './SchemaMapping/SchemaMapping';
import type { JsonEditorValues } from './editorTypes';

type MultiPathField =
  | 'exclude_paths'
  | 'explode_paths'
  | 'keep_json_paths'
  | 'meta_paths';

const hasIoType = (type: InputDefinitionModel['type'], target: Io): boolean => {
  return Array.isArray(type) ? type.includes(target) : type === target;
};

const getInputDefinition = (
  nodeDefinition: NodeDefinition,
  attrName: string
): InputDefinitionModel | null => {
  const inputDefinitions = nodeDefinition.input_definitions ?? {};

  return (
    inputDefinitions[attrName] ??
    Object.values(inputDefinitions).find(
      inputDefinition => inputDefinition.attr_name === attrName
    ) ??
    null
  );
};

const getPrimaryJsonInputName = (
  nodeDefinition: NodeDefinition
): string | null => {
  const inputDefinitions = Object.values(
    nodeDefinition.input_definitions ?? {}
  );
  const explicitJsonInput = inputDefinitions.find(
    inputDefinition =>
      inputDefinition.attr_name === 'json' &&
      hasIoType(inputDefinition.type, 'JSON')
  );

  if (explicitJsonInput) {
    return explicitJsonInput.attr_name;
  }

  const firstJsonInput = inputDefinitions.find(inputDefinition =>
    hasIoType(inputDefinition.type, 'JSON')
  );

  return firstJsonInput?.attr_name ?? null;
};

const normalizePathList = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === 'string')
        .map(item => item.trim())
        .filter(Boolean)
    )
  );
};

const normalizeRecordPath = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : '';
};

const SectionCard = ({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description?: string;
  title: string;
}) => (
  <Paper
    elevation={0}
    sx={theme => ({
      p: 2,
      borderRadius: '22px',
      border: `1px solid ${alpha(theme.palette.common.black, 0.08)}`,
      background:
        theme.palette.mode === 'dark'
          ? alpha(theme.palette.common.white, 0.05)
          : alpha(theme.palette.common.white, 0.84),
      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
    })}
  >
    <Stack spacing={1.5}>
      <Box>
        <Typography sx={{ fontSize: 15, fontWeight: 600 }}>{title}</Typography>
        {description ? (
          <Typography color='text.secondary' sx={{ mt: 0.5, fontSize: 12.5 }}>
            {description}
          </Typography>
        ) : null}
      </Box>
      {children}
    </Stack>
  </Paper>
);

export const JsonEditorEditor = ({
  id: nodeID,
  localInputData,
  nodeDefinition,
  setLocalInputData,
  variables,
}: NodeModalExtensionProps<JsonEditorValues>) => {
  const { connectedMetadataByInputName, getConnectedInputMetadata } =
    useNodeConnections(nodeID);

  const jsonInputName = useMemo(() => {
    return getPrimaryJsonInputName(nodeDefinition);
  }, [nodeDefinition]);

  const connectedJsonMetadata = useMemo(() => {
    if (jsonInputName) {
      const metadata = getConnectedInputMetadata(jsonInputName);

      if (isJsonMetadata(metadata)) {
        return metadata;
      }
    }

    return (
      Object.values(connectedMetadataByInputName ?? {}).find(metadata =>
        isJsonMetadata(metadata)
      ) ?? null
    );
  }, [connectedMetadataByInputName, getConnectedInputMetadata, jsonInputName]);

  const jsonMetadata = connectedJsonMetadata as JsonMetadata | null;
  const recordPath = normalizeRecordPath(localInputData.record_path);
  const metaPaths = normalizePathList(localInputData.meta_paths);
  const explodePaths = normalizePathList(localInputData.explode_paths);
  const keepJsonPaths = normalizePathList(localInputData.keep_json_paths);
  const excludePaths = normalizePathList(localInputData.exclude_paths);
  const conflicts = useMemo(() => {
    return findJsonExcludeConflicts(localInputData);
  }, [localInputData]);

  const updateField = <TField extends keyof JsonEditorValues>(
    field: TField,
    value: JsonEditorValues[TField]
  ) => {
    setLocalInputData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleMultiPath = (field: MultiPathField, path: string) => {
    const currentValues = normalizePathList(localInputData[field]);
    const nextValues = currentValues.includes(path)
      ? currentValues.filter(currentPath => currentPath !== path)
      : [...currentValues, path];

    updateField(field, nextValues);
  };

  const toggleRecordPath = (path: string) => {
    updateField('record_path', recordPath === path ? '' : path);
  };

  const handleSchemaActionToggle = (
    path: string,
    action: SchemaMappingActionKey
  ) => {
    switch (action) {
      case 'record':
        toggleRecordPath(path);
        return;
      case 'keep':
        toggleMultiPath('keep_json_paths', path);
        return;
      case 'exclude':
        toggleMultiPath('exclude_paths', path);
        return;
      case 'meta':
        toggleMultiPath('meta_paths', path);
        return;
      case 'explode':
        toggleMultiPath('explode_paths', path);
        return;
      default:
        return;
    }
  };

  const handleClearAllPaths = () => {
    setLocalInputData(prev => ({
      ...prev,
      record_path: '',
      meta_paths: [],
      explode_paths: [],
      keep_json_paths: [],
      exclude_paths: [],
    }));
  };

  const handleClearActionGroup = (action: SchemaMappingActionKey) => {
    switch (action) {
      case 'record':
        updateField('record_path', '');
        return;
      case 'meta':
        updateField('meta_paths', []);
        return;
      case 'explode':
        updateField('explode_paths', []);
        return;
      case 'keep':
        updateField('keep_json_paths', []);
        return;
      case 'exclude':
        updateField('exclude_paths', []);
        return;
      default:
        return;
    }
  };

  const renderNodeInput = (attrName: string) => {
    const inputDefinition = getInputDefinition(nodeDefinition, attrName);

    if (!inputDefinition) {
      return null;
    }

    return (
      <NodeDataInput
        nodeID={nodeID}
        inputDefinition={inputDefinition}
        currentValue={localInputData[attrName as keyof JsonEditorValues]}
        onValueChange={newValue =>
          updateField(attrName as keyof JsonEditorValues, newValue)
        }
        variables={variables}
      />
    );
  };

  return (
    <Stack spacing={2} sx={{ height: '100%', minHeight: 0 }}>
      {conflicts.length > 0 ? (
        <Alert variant='warning'>
          <Stack spacing={0.5}>
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
              Поле «{GROUP_LABELS.exclude_paths}» имеет приоритет над другими
              выборами.
            </Typography>
            {conflicts.map(conflict => (
              <Typography
                key={conflict.path}
                variant='body2'
                sx={{ wordBreak: 'break-word' }}
              >
                {conflict.path}:{' '}
                {conflict.groups.map(group => GROUP_LABELS[group]).join(', ')}
              </Typography>
            ))}
          </Stack>
        </Alert>
      ) : null}

      <SchemaMapping
        nodeEmptyMessage='JSON schema tree будет доступен после подключения metadata.'
        root={jsonMetadata?.root}
        structureTruncated={jsonMetadata?.structure_truncated}
        values={{
          record_path: recordPath,
          meta_paths: metaPaths,
          explode_paths: explodePaths,
          keep_json_paths: keepJsonPaths,
          exclude_paths: excludePaths,
        }}
        onClearActionGroup={handleClearActionGroup}
        onClearAll={handleClearAllPaths}
        onToggleAction={handleSchemaActionToggle}
      />

      <SectionCard
        title='Node settings'
        description='Primitive-поля ноды остаются в стандартном UI проекта.'
      >
        <Stack spacing={1.5}>
          {jsonInputName ? (
            <Stack spacing={0.75}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>
                {jsonInputName}
              </Typography>
              {renderNodeInput(jsonInputName)}
            </Stack>
          ) : null}

          <Stack spacing={0.75}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>
              separator
            </Typography>
            {renderNodeInput('separator')}
          </Stack>

          <Stack spacing={0.75}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>
              auto_detect_record_path
            </Typography>
            {renderNodeInput('auto_detect_record_path')}
          </Stack>

          <Stack spacing={0.75}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>
              max_rows
            </Typography>
            {renderNodeInput('max_rows')}
          </Stack>
        </Stack>
      </SectionCard>
    </Stack>
  );
};
