import { memo, useCallback, useMemo, useState } from 'react';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Virtuoso } from 'react-virtuoso';

import { DbCatalogBrowserPanel } from '@/features/node/db-target-selector';

import { resolveDbCatalogMode } from '@/entities/data/db-connection/model/catalogNormalizers';
import { getDbCatalogCapabilities } from '@/entities/data/db-connection/model/hooks/useDbCatalog';

import type { DbMetadata, DbTable } from '@/shared/gatewayClient';
import {
  flattenDbMetadataTables,
  getDbMetadataDatabaseOptions,
  getDbMetadataSchemaOptions,
} from '@/shared/lib/db-metadata';

import { ColumnMetadataCard } from './components/ColumnMetadataCard.tsx';
import { ConnectionMetadataSection } from './components/ConnectionMetadataSection.tsx';
import {
  MetadataMetricsGrid,
  MetadataPanelSurface,
  MetadataPill,
  MetadataSection,
} from './components/MetadataPrimitives.tsx';
import { formatNumber } from './lib/formatters.ts';

interface DatabaseMetadataPanelProps {
  metadata: DbMetadata;
}

interface DatabaseTableAccordionProps {
  table: DbTable;
  expanded: boolean;
  onToggle: () => void;
}

const LazyDatabaseMetadataPanel = ({
  metadata,
}: DatabaseMetadataPanelProps) => {
  const [databaseName, setDatabaseName] = useState<string | null>(
    metadata.database_name ?? null
  );
  const [schemaName, setSchemaName] = useState<string | null>(null);
  const [tableName, setTableName] = useState<string | null>(null);
  const capabilities = getDbCatalogCapabilities(metadata);

  return (
    <MetadataPanelSurface>
      <MetadataSection
        title='Database metadata'
        description='Компактный descriptor подключения. Каталог загружается по уровням только при раскрытии.'
      >
        <Stack direction='row' flexWrap='wrap' gap={0.75}>
          <MetadataPill label='lazy catalog' tone='info' />
          <MetadataPill label={`page ≤ ${capabilities.maxPageSize}`} />
          {capabilities.supportsDatabases ? (
            <MetadataPill label='databases' />
          ) : null}
          {capabilities.supportsSchemas ? (
            <MetadataPill label='schemas' />
          ) : null}
          {capabilities.supportsTables ? <MetadataPill label='tables' /> : null}
          {capabilities.supportsViews ? <MetadataPill label='views' /> : null}
          {capabilities.supportsSearch ? (
            <MetadataPill label='server search' />
          ) : null}
        </Stack>
      </MetadataSection>

      <ConnectionMetadataSection
        items={[
          { label: 'connection_id', value: metadata.connection_id },
          { label: 'connection_revision', value: metadata.connection_revision },
          { label: 'dialect', value: metadata.dialect },
          { label: 'database_name', value: metadata.database_name },
          { label: 'catalog_mode', value: 'lazy' },
        ]}
      />

      <MetadataSection
        title='Каталог'
        description='Итоговые totals не вычисляются из частично загруженных страниц.'
      >
        <DbCatalogBrowserPanel
          metadata={metadata}
          databaseName={databaseName}
          schemaName={schemaName}
          tableName={tableName}
          showRefresh
          onDatabaseChange={value => {
            setDatabaseName(value);
            setSchemaName(null);
            setTableName(null);
          }}
          onSchemaChange={value => {
            setSchemaName(value);
            setTableName(null);
          }}
          onTableChange={table => {
            setDatabaseName(table.databaseName ?? databaseName);
            setSchemaName(table.schemaName ?? schemaName);
            setTableName(table.name);
          }}
        />
      </MetadataSection>
    </MetadataPanelSurface>
  );
};

const getTableKey = (table: DbTable) => {
  return (
    table.id ??
    `${table.database_name ?? 'default-db'}-${table.schema_name ?? 'default-schema'}-${table.name}`
  );
};

const DatabaseTableAccordion = memo(
  ({ table, expanded, onToggle }: DatabaseTableAccordionProps) => {
    return (
      <Accordion
        disableGutters
        expanded={expanded}
        onChange={onToggle}
        elevation={0}
        sx={theme => ({
          borderRadius: '20px',
          overflow: 'hidden',
          border: `1px solid ${alpha(theme.palette.common.black, 0.07)}`,
          background:
            theme.palette.mode === 'dark'
              ? alpha(theme.palette.common.white, 0.04)
              : alpha(theme.palette.common.white, 0.78),
          '&::before': {
            display: 'none',
          },
        })}
      >
        <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent='space-between'
            alignItems={{ xs: 'flex-start', md: 'center' }}
            width='100%'
            gap={1}
          >
            <Box>
              <Typography sx={{ fontSize: 15, fontWeight: 600 }}>
                {table.name}
              </Typography>
              <Typography color='text.secondary' sx={{ fontSize: 12 }}>
                {table.schema_name
                  ? `${table.schema_name} schema`
                  : 'Без схемы'}
              </Typography>
            </Box>
            <Stack direction='row' flexWrap='wrap' gap={0.75}>
              <MetadataPill label={table.type} tone='info' />
              <MetadataPill
                label={`${formatNumber(table.columns.length)} колонок`}
              />
              {table.database_name && (
                <MetadataPill label={table.database_name} />
              )}
            </Stack>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1.5}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'repeat(3, minmax(0, 1fr))',
                },
                gap: 1,
              }}
            >
              <MetadataPill label={`schema: ${table.schema_name ?? '—'}`} />
              <MetadataPill label={`db: ${table.database_name ?? '—'}`} />
              <MetadataPill label={`id: ${table.id ?? '—'}`} />
            </Box>
            <Stack spacing={1}>
              {table.columns.map(column => (
                <ColumnMetadataCard
                  key={`${table.name}-${column.name}`}
                  column={column}
                />
              ))}
            </Stack>
          </Stack>
        </AccordionDetails>
      </Accordion>
    );
  }
);

DatabaseTableAccordion.displayName = 'DatabaseTableAccordion';

const EmbeddedDatabaseMetadataPanel = ({
  metadata,
}: DatabaseMetadataPanelProps) => {
  const [expandedTableKeys, setExpandedTableKeys] = useState<string[]>([]);
  const tables = useMemo(() => flattenDbMetadataTables(metadata), [metadata]);
  const databaseCount = useMemo(() => {
    return getDbMetadataDatabaseOptions(metadata).length;
  }, [metadata]);
  const schemaCount = useMemo(() => {
    return getDbMetadataSchemaOptions(metadata).length;
  }, [metadata]);

  const totalColumns = tables.reduce(
    (count, table) => count + table.columns.length,
    0
  );
  const viewCount = tables.filter(table => table.type === 'VIEW').length;

  const tableKeys = useMemo(
    () => tables.map(table => getTableKey(table)),
    [tables]
  );

  const expandedTableKeySet = useMemo(
    () => new Set(expandedTableKeys),
    [expandedTableKeys]
  );

  const listHeight = Math.min(Math.max(tables.length * 92, 240), 640);

  const toggleTable = useCallback((tableKey: string) => {
    setExpandedTableKeys(prev =>
      prev.includes(tableKey)
        ? prev.filter(key => key !== tableKey)
        : [...prev, tableKey]
    );
  }, []);

  return (
    <MetadataPanelSurface>
      <MetadataSection
        title='Database metadata'
        description='Сводка по базе и структуре таблиц с быстрым доступом к колонкам.'
      >
        <MetadataMetricsGrid
          metrics={[
            {
              label: 'Таблиц',
              value: formatNumber(tables.length),
              caption: 'Все доступные таблицы и views',
            },
            {
              label: 'Views',
              value: formatNumber(viewCount),
            },
            {
              label: 'Базы / схемы',
              value: `${formatNumber(databaseCount)} / ${formatNumber(schemaCount)}`,
            },
            {
              label: 'Колонок',
              value: formatNumber(totalColumns),
            },
          ]}
        />
      </MetadataSection>

      <ConnectionMetadataSection
        items={[
          { label: 'connection_id', value: metadata.connection_id },
          { label: 'connection_revision', value: metadata.connection_revision },
          { label: 'dialect', value: metadata.dialect },
          { label: 'catalog_mode', value: metadata.catalog_mode ?? 'embedded' },
          { label: 'database_name', value: metadata.database_name },
        ]}
      />

      <MetadataSection
        title='Таблицы'
        description='Список таблиц виртуализирован, поэтому даже большие connection metadata не должны тормозить модалку.'
      >
        <Stack spacing={1.25}>
          <Stack direction='row' flexWrap='wrap' gap={0.75}>
            <MetadataPill label={`${formatNumber(tables.length)} таблиц`} />
            <MetadataPill label='virtualized' tone='info' />
          </Stack>

          <Box
            sx={theme => ({
              height: listHeight,
              borderRadius: '20px',
              border: `1px solid ${alpha(theme.palette.common.black, 0.06)}`,
              background:
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.common.white, 0.02)
                  : alpha(theme.palette.common.white, 0.28),
              overflow: 'hidden',
            })}
          >
            <Virtuoso
              data={tables}
              style={{ height: '100%' }}
              overscan={320}
              increaseViewportBy={{ top: 180, bottom: 360 }}
              computeItemKey={index => tableKeys[index]}
              itemContent={(index, table) => {
                const tableKey = tableKeys[index];

                return (
                  <Box px={1.25} py={0.75}>
                    <DatabaseTableAccordion
                      table={table}
                      expanded={expandedTableKeySet.has(tableKey)}
                      onToggle={() => toggleTable(tableKey)}
                    />
                  </Box>
                );
              }}
            />
          </Box>
        </Stack>
      </MetadataSection>
    </MetadataPanelSurface>
  );
};

export const DatabaseMetadataPanel = (props: DatabaseMetadataPanelProps) =>
  resolveDbCatalogMode(props.metadata) === 'lazy' ? (
    <LazyDatabaseMetadataPanel {...props} />
  ) : (
    <EmbeddedDatabaseMetadataPanel {...props} />
  );
