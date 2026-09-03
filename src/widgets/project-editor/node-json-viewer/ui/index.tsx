import React, { useEffect, useMemo, useRef, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DataObjectIcon from '@mui/icons-material/DataObject';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Tooltip,
  Typography,
} from '@mui/material';
import * as monacoTypes from 'monaco-editor';

import { useNodeDefinition } from '@/features/node/get-node-definition';
import { useNodeData } from '@/features/node/manage-node-data';

import { DEFAULT_JSON_LIMIT, useJsonData } from '@/entities/data/json-data';
import { useNodeJsonViewer } from '@/entities/node/node-json-viewer';
import { useCurrentProject } from '@/entities/project/projects';
import { useTaskExecutionStatus } from '@/entities/project/task-execution-status';

import { StyledDialog } from './styles.ts';

const PAGE_SIZE = DEFAULT_JSON_LIMIT;

// eslint-disable-next-line no-control-regex
const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;

const sanitizeFilename = (value: string, fallback: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return fallback;

  const cleaned = trimmed
    .replace(INVALID_FILENAME_CHARS, '_')
    .replace(/\s+/g, '-');

  return cleaned.length > 0 ? cleaned : fallback;
};

const ensureJsonExtension = (value: string): string =>
  value.toLowerCase().endsWith('.json') ? value : `${value}.json`;

const triggerTextDownload = (content: string, filename: string) => {
  if (typeof document === 'undefined') return;
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const safePrettyJson = (value: unknown): string => {
  try {
    if (typeof value === 'string') {
      // If backend returns a JSON string, try to format it as JSON, otherwise show as-is.
      try {
        const parsed = JSON.parse(value);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return value;
      }
    }
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const HeaderButton = ({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) => (
  <Tooltip title={title} arrow>
    <span>
      <Button
        size='small'
        variant='outlined'
        onClick={onClick}
        disabled={disabled ?? false}
        sx={{ textTransform: 'none', borderRadius: 1 }}
      >
        {children}
      </Button>
    </span>
  </Tooltip>
);

interface NodeJsonViewerContentProps {
  closeViewer: () => void;
  nodeID: string;
}

const NodeJsonViewerContent: React.FC<NodeJsonViewerContentProps> = ({
  closeViewer,
  nodeID,
}) => {
  const { currentProject } = useCurrentProject();
  const { nodeData } = useNodeData(nodeID);
  const nodeDefinition = useNodeDefinition(nodeData?.name);

  const jsonOutputs = useMemo(() => {
    return nodeDefinition
      ? Object.values(nodeDefinition.output_definitions ?? {})
          .filter(outputDef => {
            const t = outputDef.type;
            return Array.isArray(t)
              ? t.includes('JSON') || t.includes('DICT')
              : t === 'JSON' || t === 'DICT';
          })
          .map(outputDef => outputDef.attr_name)
      : null;
  }, [nodeDefinition]);

  const [selectedOutputName, setSelectedOutputName] = useState<string | ''>('');
  const [page, setPage] = useState(0);
  const editorRef = useRef<monacoTypes.editor.IStandaloneCodeEditor | null>(
    null
  );
  const [editorValue, setEditorValue] = useState('');

  useEffect(() => {
    setSelectedOutputName('');
    setPage(0);
  }, [nodeID]);

  useEffect(() => {
    if (!jsonOutputs?.length) {
      setPage(0);
      setSelectedOutputName('');
      return;
    }

    if (!selectedOutputName) {
      setSelectedOutputName(jsonOutputs[0]);
      setPage(0);
    }
  }, [jsonOutputs, selectedOutputName]);

  useEffect(() => {
    if (
      selectedOutputName &&
      jsonOutputs &&
      !jsonOutputs.includes(selectedOutputName)
    ) {
      setSelectedOutputName(jsonOutputs[0] ?? '');
      setPage(0);
    }
  }, [jsonOutputs, selectedOutputName]);

  const offset = page * PAGE_SIZE;
  const effectiveNodeId = selectedOutputName ? nodeID : null;
  const { status, jsonData, error, reload } = useJsonData(
    currentProject?.id,
    effectiveNodeId,
    selectedOutputName || undefined,
    offset,
    PAGE_SIZE
  );

  const { status: taskStatus, taskId } = useTaskExecutionStatus();
  const lastFetchedTaskIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!taskId || taskStatus !== 'SUCCESS') return;
    if (lastFetchedTaskIdRef.current === taskId) return;
    lastFetchedTaskIdRef.current = taskId;
    void reload({ force: true });
  }, [taskId, taskStatus, reload]);

  const prettyValue = useMemo(
    () => safePrettyJson(jsonData?.data),
    [jsonData?.data]
  );
  const totalItems = jsonData?.total_items ?? null;
  const hasPaging = typeof totalItems === 'number' && totalItems >= 0;
  const lastPageIndex = hasPaging
    ? Math.max(0, Math.ceil(totalItems / PAGE_SIZE) - 1)
    : 0;

  useEffect(() => {
    if (hasPaging && page > lastPageIndex) {
      setPage(lastPageIndex);
    }
  }, [hasPaging, page, lastPageIndex]);

  const displayName = nodeData?.displayName ?? nodeData?.name ?? 'JSON';
  const shortNodeId = nodeID ? `${nodeID.slice(5, 21)}...` : '';

  const onMount: OnMount = editor => {
    editorRef.current = editor;
  };

  useEffect(() => {
    setEditorValue(prettyValue);
  }, [prettyValue]);

  const handleCopy = async () => {
    if (!nodeID) return;
    try {
      await navigator.clipboard.writeText(editorValue);
    } catch (e) {
      console.error('[NodeJsonViewer] clipboard copy failed', e);
    }
  };

  const handleDownload = () => {
    if (!nodeID) return;
    const parts = [
      displayName?.trim() ? displayName : null,
      selectedOutputName?.trim() ? selectedOutputName : null,
      nodeID.slice(-6),
      hasPaging ? `page-${page + 1}` : null,
    ].filter(Boolean) as string[];

    const base = parts.length > 0 ? parts.join('-') : 'json-output';
    const filename = ensureJsonExtension(sanitizeFilename(base, 'json-output'));
    triggerTextDownload(editorValue, filename);
  };

  const handleFormat = async () => {
    try {
      const parsed = JSON.parse(editorValue || 'null');
      setEditorValue(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.warn('[NodeJsonViewer] format failed', e);
    }
  };

  const handleReload = () => {
    void reload({ force: true });
  };

  return (
    <StyledDialog open onClose={closeViewer}>
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          backgroundColor: '#fff',
        }}
      >
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}
        >
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 1.25,
              border: '1px solid',
              borderColor: 'divider',
              display: 'grid',
              placeItems: 'center',
              backgroundColor: 'background.paper',
              flex: '0 0 auto',
            }}
          >
            <DataObjectIcon fontSize='small' />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant='body1'
              sx={{ fontWeight: 700, lineHeight: 1.15 }}
              noWrap
            >
              JSON-выход
            </Typography>
            <Typography
              variant='caption'
              sx={{ color: 'text.secondary', fontFamily: 'monospace' }}
              noWrap
            >
              {displayName}{' '}
              {selectedOutputName ? `· ${selectedOutputName}` : ''} ·{' '}
              {shortNodeId}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flex: '0 0 auto',
          }}
        >
          <HeaderButton
            title='Обновить'
            onClick={handleReload}
            disabled={!currentProject?.id || !nodeID || !selectedOutputName}
          >
            <RefreshIcon fontSize='small' />
          </HeaderButton>
          <HeaderButton
            title='Форматировать'
            onClick={handleFormat}
            disabled={status !== 'succeeded'}
          >
            <AutoFixHighRoundedIcon fontSize='small' />
          </HeaderButton>
          <HeaderButton
            title='Копировать'
            onClick={handleCopy}
            disabled={status !== 'succeeded'}
          >
            <ContentCopyIcon fontSize='small' />
          </HeaderButton>
          <HeaderButton
            title='Скачать .json'
            onClick={handleDownload}
            disabled={status !== 'succeeded'}
          >
            <FileDownloadIcon fontSize='small' />
          </HeaderButton>

          <Button
            size='small'
            onClick={closeViewer}
            sx={{
              minWidth: 36,
              px: 0,
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              color: 'text.primary',
            }}
          >
            <CloseIcon fontSize='small' />
          </Button>
        </Box>
      </Box>

      <Divider />

      {jsonOutputs && jsonOutputs.length > 1 && (
        <Box
          sx={{
            px: 2,
            py: 1,
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
            backgroundColor: '#fff',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          {jsonOutputs.map(name => {
            const active = selectedOutputName === name;
            return (
              <Button
                key={name}
                size='small'
                variant={active ? 'contained' : 'outlined'}
                disableElevation
                onClick={() => {
                  setSelectedOutputName(name);
                  setPage(0);
                }}
                sx={{ textTransform: 'none', borderRadius: 1 }}
              >
                {name}
              </Button>
            );
          })}
        </Box>
      )}

      {hasPaging && (
        <Box
          sx={{
            px: 2,
            py: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            backgroundColor: '#fff',
          }}
        >
          <Typography variant='caption' color='text.secondary'>
            items: {totalItems} · offset: {offset} · limit: {PAGE_SIZE}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size='small'
              variant='outlined'
              disabled={page <= 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
              sx={{ textTransform: 'none', borderRadius: 1 }}
            >
              {'<'} Назад
            </Button>
            <Button
              size='small'
              variant='outlined'
              disabled={page >= lastPageIndex}
              onClick={() => setPage(p => Math.min(lastPageIndex, p + 1))}
              sx={{ textTransform: 'none', borderRadius: 1 }}
            >
              Вперед {'>'}
            </Button>
          </Box>
        </Box>
      )}

      <Box sx={{ p: 2, height: '100%', minHeight: 0, backgroundColor: '#fff' }}>
        <Box
          sx={{
            height: '100%',
            minHeight: 0,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1.5,
            overflow: 'hidden',
            backgroundColor: 'background.paper',
          }}
        >
          {status === 'loading' && (
            <Box
              sx={{
                height: '100%',
                display: 'grid',
                placeItems: 'center',
                color: 'text.secondary',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} />
                <Typography variant='body2'>Загрузка JSON...</Typography>
              </Box>
            </Box>
          )}

          {status === 'failed' && (
            <Box sx={{ p: 2 }}>
              <Typography variant='body2' sx={{ fontWeight: 700 }}>
                Не удалось загрузить JSON
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {error?.message ?? 'Unknown error'}
              </Typography>
            </Box>
          )}

          {status !== 'loading' && status !== 'failed' && (
            <Editor
              onMount={onMount}
              defaultLanguage='json'
              value={editorValue}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                wordWrap: 'on',
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                renderWhitespace: 'none',
                folding: true,
              }}
              theme='vs'
            />
          )}
        </Box>
      </Box>
    </StyledDialog>
  );
};

export const NodeJsonViewer: React.FC = () => {
  const { open, nodeID, closeViewer } = useNodeJsonViewer();

  if (!open || !nodeID) {
    return null;
  }

  return <NodeJsonViewerContent closeViewer={closeViewer} nodeID={nodeID} />;
};
