import { memo, useEffect, useMemo, useState } from 'react';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import { useNodeMetadata } from '@/features/node/get-node-metadata';
import { useNodeData } from '@/features/node/manage-node-data';

import { useNodeMetaViewer } from '@/entities/node/node-meta-viewer';

import type {
  FtpMetadata,
  KafkaMetadata,
  NodeMetadata,
  S3Metadata,
} from '@/shared/gatewayClient';

import { formatBytes, formatNumber } from './lib/formatters';
import { ConnectionMetadataPanel } from './ConnectionMetadataPanel';
import { DatabaseMetadataPanel } from './DatabaseMetadataPanel';
import { DataFrameMetadataPanel } from './DataFrameMetadataPanel';
import { JsonMetadataPanel } from './JsonMetadataPanel';
import { SeriesMetadataPanel } from './SeriesMetadataPanel';
import { UnsupportedMetadataPanel } from './UnsupportedMetadataPanel';
import { VariableMapMetadataPanel } from './VariableMapMetadataPanel';

type NodeOutputMetadata = Exclude<NodeMetadata[string], null>;

const OUTPUT_PAGES_ORDER: { [outputName: string]: number } = {
  output: 1,
  inverted_output: 2,
  output_variables: 3,
};

const OUTPUT_PAGES_DISABLED: string[] = ['signal_out'];

const buildFtpConnectionItems = (metadata: FtpMetadata) => {
  return [
    { label: 'connection_id', value: metadata.connection_id },
    {
      label: 'connection_prefix',
      value: metadata.connection_prefix,
    },
    {
      label: 'connection_string',
      value: metadata.connection_string,
      mono: true,
    },
    { label: 'username', value: metadata.username },
    { label: 'anonymous', value: metadata.anonymous ? 'Да' : 'Нет' },
    { label: 'encoding', value: metadata.encoding },
  ];
};

const buildS3ConnectionItems = (metadata: S3Metadata) => {
  return [
    { label: 'connection_id', value: metadata.connection_id },
    {
      label: 'connection_prefix',
      value: metadata.connection_prefix,
    },
    {
      label: 'endpoint_url',
      value: metadata.endpoint_url,
      mono: true,
    },
    {
      label: 'connection_string',
      value: metadata.connection_string,
      mono: true,
    },
  ];
};

const buildKafkaConnectionItems = (metadata: KafkaMetadata) => {
  return [
    {
      label: 'connection_string',
      value: metadata.connection_string,
      mono: true,
    },
    {
      label: 'bootstrap_servers',
      value: metadata.bootstrap_servers.join('\n'),
      mono: true,
    },
  ];
};

const getMetadataView = (metadata: NodeOutputMetadata) => {
  switch (metadata.type) {
    case 'DATABASE':
      return <DatabaseMetadataPanel metadata={metadata} />;
    case 'DATAFRAME':
      return <DataFrameMetadataPanel metadata={metadata} />;
    case 'JSON':
      return <JsonMetadataPanel metadata={metadata} />;
    case 'SERIES':
      return <SeriesMetadataPanel metadata={metadata} />;
    case 'VARIABLE_MAP':
      return <VariableMapMetadataPanel metadata={metadata} />;
    case 'FTP':
      return (
        <ConnectionMetadataPanel
          title='FTP metadata'
          description='Параметры FTP-подключения и состояние стартовой директории.'
          metrics={[
            { label: 'Host', value: metadata.host },
            { label: 'Port', value: formatNumber(metadata.port ?? null) },
            { label: 'Mode', value: metadata.mode ?? '—' },
            {
              label: 'Files',
              value: formatNumber(metadata.directory?.files_count ?? null),
            },
          ]}
          connectionItems={buildFtpConnectionItems(metadata)}
          detailSections={[
            {
              title: 'Директория',
              description:
                'Сводка по стартовому каталогу, если backend прислал его metadata.',
              items: [
                {
                  label: 'current_path',
                  value:
                    metadata.directory?.current_path ??
                    metadata.initial_directory,
                  mono: true,
                },
                {
                  label: 'files_count',
                  value: metadata.directory?.files_count,
                },
                {
                  label: 'folders_count',
                  value: metadata.directory?.folders_count,
                },
                {
                  label: 'total_size',
                  value: formatBytes(metadata.directory?.total_size ?? null),
                },
              ],
            },
          ]}
          previewValue={metadata}
        />
      );
    case 'S3':
      return (
        <ConnectionMetadataPanel
          title='S3 metadata'
          description='Сводка по S3-подключению, бакету и верхнеуровневой структуре.'
          metrics={[
            { label: 'Bucket', value: metadata.bucket?.name ?? '—' },
            { label: 'Region', value: metadata.region ?? '—' },
            {
              label: 'Files',
              value: formatNumber(metadata.bucket?.files_count ?? null),
            },
            {
              label: 'Total size',
              value: formatBytes(metadata.bucket?.total_size ?? null),
            },
          ]}
          connectionItems={buildS3ConnectionItems(metadata)}
          detailSections={[
            {
              title: 'Бакет',
              description: 'Базовая статистика текущего бакета.',
              items: [
                { label: 'name', value: metadata.bucket?.name },
                {
                  label: 'creation_date',
                  value: metadata.bucket?.creation_date,
                },
                {
                  label: 'files_count',
                  value: metadata.bucket?.files_count,
                },
                {
                  label: 'folders_count',
                  value: metadata.bucket?.folders_count,
                },
                {
                  label: 'total_size',
                  value: formatBytes(metadata.bucket?.total_size ?? null),
                },
              ],
            },
          ]}
          previewValue={metadata}
        />
      );
    case 'KAFKA':
      return (
        <ConnectionMetadataPanel
          title='Kafka metadata'
          description='Конфигурация кластера, bootstrap servers и сводка по топикам.'
          metrics={[
            {
              label: 'Topics',
              value: formatNumber(metadata.topics.length),
            },
            {
              label: 'Brokers',
              value: formatNumber(metadata.cluster.brokers?.length ?? null),
            },
            {
              label: 'Controller',
              value: formatNumber(metadata.cluster.controller_id ?? null),
            },
            {
              label: 'Bootstrap',
              value: formatNumber(metadata.bootstrap_servers.length),
            },
          ]}
          connectionItems={buildKafkaConnectionItems(metadata)}
          detailSections={[
            {
              title: 'Топики',
              description:
                'Ключевые параметры топиков, агрегированные в компактный список.',
              items: metadata.topics.map(topic => ({
                label: topic.name,
                value: [
                  `${topic.partitions_count} partitions`,
                  `${topic.replication_factor} replicas`,
                  topic.is_internal ? 'internal' : null,
                ]
                  .filter(Boolean)
                  .join(' • '),
              })),
            },
          ]}
          previewValue={metadata}
        />
      );
    default:
      return <UnsupportedMetadataPanel metadata={metadata} />;
  }
};

interface NodeMetaViewerContentProps {
  closeViewer: () => void;
  nodeID: string;
}

const NodeMetaViewerContent = ({
  closeViewer,
  nodeID,
}: NodeMetaViewerContentProps) => {
  const { nodeMetadata } = useNodeMetadata(nodeID);
  const { nodeData } = useNodeData(nodeID);

  const [selectedOutput, setSelectedOutput] = useState<string | null>(null);

  const outputEntries = useMemo(() => {
    if (!nodeMetadata) {
      return [];
    }

    return Object.entries(nodeMetadata)
      .filter(
        ([outputName, metadata]) => !OUTPUT_PAGES_DISABLED.includes(outputName)
      )
      .sort(
        ([outputNameA, metadataA], [outputNameB, metadataB]) =>
          (OUTPUT_PAGES_ORDER[outputNameA] ?? 999) -
          (OUTPUT_PAGES_ORDER[outputNameB] ?? 999)
      );
  }, [nodeMetadata]);

  const hasMetadata = outputEntries.length > 0;
  const fallbackOutput = hasMetadata ? outputEntries[0][0] : null;
  const effectiveSelectedOutput = selectedOutput ?? fallbackOutput;

  useEffect(() => {
    if (hasMetadata && !selectedOutput) {
      setSelectedOutput(fallbackOutput);
    }
  }, [hasMetadata, fallbackOutput, selectedOutput]);

  useEffect(() => {
    if (!hasMetadata) {
      setSelectedOutput(null);
      return;
    }

    if (
      selectedOutput &&
      !outputEntries.some(([outputName]) => outputName === selectedOutput)
    ) {
      setSelectedOutput(fallbackOutput);
    }
  }, [hasMetadata, outputEntries, selectedOutput, fallbackOutput]);

  const selectedMetadata =
    effectiveSelectedOutput != null
      ? (nodeMetadata?.[effectiveSelectedOutput] ?? null)
      : null;

  return (
    <Dialog
      fullWidth
      maxWidth='lg'
      open
      onClose={closeViewer}
      slotProps={{
        paper: {
          sx: theme => ({
            borderRadius: '28px',
            overflow: 'hidden',
            border: `1px solid ${alpha(theme.palette.common.black, 0.08)}`,
            background:
              theme.palette.mode === 'dark'
                ? `linear-gradient(180deg, ${alpha(theme.palette.common.white, 0.08)} 0%, ${alpha(theme.palette.common.white, 0.02)} 100%)`
                : 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(244,246,248,0.98) 100%)',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
            backdropFilter: 'blur(24px)',
          }),
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 2.5,
          py: 2,
          borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
        }}
      >
        <Box
          display='flex'
          alignItems='flex-start'
          justifyContent='space-between'
          gap={2}
        >
          <Box display='flex' alignItems='flex-start' gap={1.5}>
            <Box>
              <Typography
                sx={{
                  fontSize: 18,
                  lineHeight: 1.25,
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  fontFamily:
                    '"SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                }}
              >
                {nodeData?.displayName ?? nodeData?.name ?? 'Нода'}
              </Typography>
              <Typography
                color='text.secondary'
                sx={{ mt: 0.5, fontSize: 12.5 }}
              >
                Node metadata viewer · ID: {nodeID}
              </Typography>
              <Box display='flex' flexWrap='wrap' gap={0.75} mt={1.25}>
                <Chip
                  size='small'
                  label={`${outputEntries.length} output${outputEntries.length === 1 ? '' : 's'}`}
                  sx={{
                    borderRadius: '999px',
                    backgroundColor: 'rgba(59, 130, 246, 0.12)',
                    color: 'info.dark',
                    fontWeight: 600,
                  }}
                />
                {selectedMetadata && (
                  <Chip
                    size='small'
                    label={selectedMetadata.type}
                    sx={{
                      borderRadius: '999px',
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      color: 'success.dark',
                      fontWeight: 600,
                    }}
                  />
                )}
              </Box>
            </Box>
          </Box>
          <IconButton
            onClick={closeViewer}
            size='small'
            sx={theme => ({
              mt: 0.25,
              borderRadius: '12px',
              border: `1px solid ${alpha(theme.palette.common.black, 0.08)}`,
              backgroundColor: alpha(theme.palette.common.white, 0.54),
            })}
          >
            <CloseRoundedIcon fontSize='small' />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          p: 0,
          background:
            'linear-gradient(180deg, rgba(248,250,252,0.72) 0%, rgba(241,245,249,0.84) 100%)',
        }}
      >
        {!hasMetadata && (
          <Box px={2.5} py={4}>
            <Typography variant='body2'>
              Нет метаданных для отображения.
            </Typography>
          </Box>
        )}

        {hasMetadata && (
          <>
            {outputEntries.length > 1 && (
              <Box
                sx={{
                  px: 2.5,
                  py: 1.5,
                  borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
                }}
              >
                <Tabs
                  allowScrollButtonsMobile
                  variant='scrollable'
                  value={effectiveSelectedOutput}
                  onChange={(_, value) => setSelectedOutput(value)}
                  sx={{
                    minHeight: 0,
                    '& .MuiTabs-indicator': {
                      display: 'none',
                    },
                    '& .MuiTabs-flexContainer': {
                      gap: 1,
                    },
                  }}
                >
                  {outputEntries.map(([outputName, outputMetadata]) => (
                    <Tab
                      key={outputName}
                      value={outputName}
                      label={
                        <Box textAlign='left'>
                          <Typography
                            sx={{
                              fontSize: 12.5,
                              fontWeight: 600,
                              textTransform: 'none',
                            }}
                          >
                            {outputName}
                          </Typography>
                          <Typography
                            color='text.secondary'
                            sx={{
                              mt: 0.25,
                              fontSize: 11,
                              textTransform: 'none',
                            }}
                          >
                            {outputMetadata?.type ?? 'Нет metadata'}
                          </Typography>
                        </Box>
                      }
                      sx={theme => ({
                        alignItems: 'flex-start',
                        minHeight: 0,
                        px: 1.5,
                        py: 1,
                        borderRadius: '16px',
                        border: `1px solid ${alpha(theme.palette.common.black, 0.08)}`,
                        backgroundColor: alpha(
                          theme.palette.common.white,
                          0.62
                        ),
                        textTransform: 'none',
                        '&.Mui-selected': {
                          backgroundColor: alpha(
                            theme.palette.common.white,
                            0.92
                          ),
                          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
                        },
                      })}
                    />
                  ))}
                </Tabs>
              </Box>
            )}

            <Box
              display='flex'
              flexDirection='column'
              gap={2}
              sx={{
                px: 2.5,
                py: 2.5,
                maxHeight: '72vh',
                overflow: 'auto',
              }}
            >
              {selectedMetadata ? (
                getMetadataView(selectedMetadata)
              ) : (
                <Typography variant='body2'>
                  Выберите выход для просмотра метаданных.
                </Typography>
              )}
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

const NodeMetaViewerComponent = () => {
  const { open, nodeID, closeViewer } = useNodeMetaViewer();

  if (!open || !nodeID) {
    return null;
  }

  return <NodeMetaViewerContent closeViewer={closeViewer} nodeID={nodeID} />;
};

export const NodeMetaViewer = memo(NodeMetaViewerComponent);
