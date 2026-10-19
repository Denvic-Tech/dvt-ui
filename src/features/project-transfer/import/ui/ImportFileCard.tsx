import React from 'react';
import { Box } from '@mui/material';
import { File as FileIcon } from 'lucide-react';

import type { ImportPreviewSchema } from '@/shared/gatewayClient';

import { formatBytes } from '../../lib/errorMessage';
import { getTransferTokens } from '../../ui/transferDialogStyles';

const formatExportedAt = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStats = (preview: ImportPreviewSchema): [string, string][] => {
  const { projects, manifest } = preview;
  const nodes = projects.reduce((sum, project) => sum + project.node_count, 0);
  const edges = projects.reduce((sum, project) => sum + project.edge_count, 0);
  const head: [string, string][] =
    projects.length > 1
      ? [
          ['Проекты', String(projects.length)],
          ['Ноды', String(nodes)],
        ]
      : [
          ['Ноды', String(nodes)],
          ['Связи', String(edges)],
        ];
  return [
    ...head,
    ['Версия DVT', manifest.dvt_version],
    ['Экспортирован', formatExportedAt(manifest.exported_at)],
  ];
};

interface ImportFileCardProps {
  file: File;
  preview: ImportPreviewSchema;
  disabled: boolean;
  onReset: () => void;
}

/** Карточка выбранного архива со сводкой из preview. */
export const ImportFileCard: React.FC<ImportFileCardProps> = ({
  file,
  preview,
  disabled,
  onReset,
}) => (
  <Box
    data-testid='features/project-transfer/import-file-card'
    sx={theme => ({
      borderRadius: '12px',
      border: `1px solid ${getTransferTokens(theme).border}`,
    })}
  >
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        p: '12px 12px 12px 14px',
      }}
    >
      <Box
        component='span'
        sx={theme => {
          const t = getTransferTokens(theme);
          return {
            width: 36,
            height: 36,
            borderRadius: '9px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: t.accentSoft,
            color: t.accent,
          };
        }}
      >
        <FileIcon size={18} strokeWidth={1.6} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          title={file.name}
          sx={theme => ({
            fontSize: 13.5,
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: getTransferTokens(theme).text,
          })}
        >
          {file.name}
        </Box>
        <Box
          sx={theme => ({
            mt: '2px',
            fontSize: 12,
            color: getTransferTokens(theme).text3,
          })}
        >
          {formatBytes(file.size)}
        </Box>
      </Box>
      <Box
        component='button'
        type='button'
        disabled={disabled}
        onClick={onReset}
        data-testid='features/project-transfer/import-replace-file'
        sx={theme => {
          const t = getTransferTokens(theme);
          return {
            height: 30,
            p: '0 10px',
            border: 0,
            borderRadius: '7px',
            background: 'transparent',
            color: t.text2,
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            flexShrink: 0,
            '&:hover:not(:disabled)': { background: t.surfaceHover },
            '&:disabled': { cursor: 'default', opacity: 0.6 },
          };
        }}
      >
        Заменить
      </Box>
    </Box>
    <Box
      sx={theme => ({
        display: 'grid',
        gridTemplateColumns: '.6fr .6fr .9fr 1.5fr',
        gap: '12px',
        p: '10px 14px 12px',
        borderTop: `1px solid ${getTransferTokens(theme).border}`,
      })}
    >
      {getStats(preview).map(([label, value]) => (
        <Box key={label} sx={{ minWidth: 0 }}>
          <Box
            sx={theme => ({
              fontSize: 11.5,
              color: getTransferTokens(theme).text3,
            })}
          >
            {label}
          </Box>
          <Box
            title={value}
            sx={theme => ({
              mt: '2px',
              fontSize: 13,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: getTransferTokens(theme).text,
            })}
          >
            {value}
          </Box>
        </Box>
      ))}
    </Box>
  </Box>
);
