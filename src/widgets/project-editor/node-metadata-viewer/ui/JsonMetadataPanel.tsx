import { useDeferredValue, useMemo, useState } from 'react';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  Alert,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import {
  buildJsonCandidateKindsByPath,
  JsonFlattenCandidatesList,
  JsonStructureTree,
} from '@/entities/data/json-data';

import type { JsonMetadata } from '@/shared/gatewayClient';

import {
  MetadataJsonPreview,
  MetadataKeyValueGrid,
  MetadataMetricsGrid,
  MetadataPanelSurface,
  MetadataSection,
} from './components/MetadataPrimitives';
import { getValueKind } from './lib/formatters';

interface JsonMetadataPanelProps {
  metadata: JsonMetadata;
}

const getTopLevelItems = (value: unknown): number | null => {
  if (Array.isArray(value)) {
    return value.length;
  }

  if (value != null && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>).length;
  }

  return null;
};

export const JsonMetadataPanel = ({ metadata }: JsonMetadataPanelProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const candidateKindsByPath = useMemo(() => {
    return buildJsonCandidateKindsByPath(metadata.flatten_candidates);
  }, [metadata.flatten_candidates]);

  const topLevelItems = getTopLevelItems(metadata.response);
  const structureStats = metadata.stats;

  return (
    <MetadataPanelSurface>
      <MetadataSection
        title='JSON metadata'
        description='Структурная сводка по JSON payload: inference tree, flatten candidates и schema-like preview.'
      >
        <Stack spacing={1.5}>
          {metadata.structure_truncated ? (
            <Alert
              icon={<ErrorOutlineRoundedIcon fontSize='small' />}
              severity='warning'
            >
              Backend усёк inference-структуру из-за лимитов. Дерево и schema
              показывают только доступную часть.
            </Alert>
          ) : null}

          <MetadataMetricsGrid
            metrics={[
              {
                label: 'Payload kind',
                value: metadata.root?.kind ?? getValueKind(metadata.response),
              },
              {
                label: 'Top-level items',
                value: topLevelItems == null ? '—' : String(topLevelItems),
              },
              {
                label: 'Total nodes',
                value:
                  structureStats?.total_nodes == null
                    ? '—'
                    : String(structureStats.total_nodes),
              },
              {
                label: 'Max depth',
                value:
                  structureStats?.max_depth == null
                    ? '—'
                    : String(structureStats.max_depth),
                ...(structureStats?.union_nodes != null
                  ? {
                      caption: `Union nodes: ${structureStats.union_nodes}`,
                    }
                  : {}),
              },
            ]}
          />

          <MetadataKeyValueGrid
            items={[
              {
                label: 'root.display_path',
                value: metadata.root?.display_path ?? null,
                mono: true,
              },
              {
                label: 'root.kind',
                value: metadata.root?.kind ?? null,
              },
              {
                label: 'object_nodes',
                value: structureStats?.object_nodes ?? null,
              },
              {
                label: 'array_nodes',
                value: structureStats?.array_nodes ?? null,
              },
              {
                label: 'scalar_nodes',
                value: structureStats?.scalar_nodes ?? null,
              },
              {
                label: 'flatten_candidates',
                value: metadata.flatten_candidates?.length ?? 0,
              },
            ]}
          />
        </Stack>
      </MetadataSection>

      <MetadataSection
        title='JSON structure'
        description='Дерево inference по `root`: kind/path/required/nullable/occurrences и детали для union/object/array/scalar узлов.'
      >
        <Stack spacing={1.5}>
          <TextField
            fullWidth
            size='small'
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            placeholder='Поиск по path, kind, keys, examples...'
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchRoundedIcon fontSize='small' color='action' />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              maxWidth: 420,
              '& .MuiOutlinedInput-root': {
                borderRadius: '16px',
              },
            }}
          />

          <JsonStructureTree
            root={metadata.root}
            searchQuery={deferredSearchQuery}
            candidateKindsByPath={candidateKindsByPath}
            emptyMessage='Backend не прислал JSON structure root.'
          />
        </Stack>
      </MetadataSection>

      <MetadataSection
        title='Flatten candidates'
        description='Подсказки backend для `record_path`, `meta_paths` и `explode_paths` с причиной и confidence.'
      >
        <JsonFlattenCandidatesList candidates={metadata.flatten_candidates} />
      </MetadataSection>

      <MetadataSection
        title='Schema preview'
        description='Schema-like сериализация inference для быстрых проверок и дебага контракта.'
      >
        {metadata.inferred_schema ? (
          <MetadataJsonPreview
            value={metadata.inferred_schema}
            maxHeight={320}
          />
        ) : (
          <Typography color='text.secondary' sx={{ fontSize: 13 }}>
            Backend не прислал `inferred_schema`.
          </Typography>
        )}
      </MetadataSection>

      <MetadataSection
        title='Raw payload'
        description='Исходный `response` оставлен как secondary/debug view.'
      >
        <MetadataJsonPreview value={metadata.response} />
      </MetadataSection>
    </MetadataPanelSurface>
  );
};
