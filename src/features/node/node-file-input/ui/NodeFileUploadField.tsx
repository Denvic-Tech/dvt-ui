import React, { useMemo, useRef, useState } from 'react';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { Alert, Box, Button, Stack, Tooltip, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

import type { NodeFileSourceMode, NodeFileUploadConfig } from '../lib/helpers';
import { getAcceptedExtensionsLabel } from '../lib/helpers';

const SourceModeGroup = styled('div')({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: 4,
  borderRadius: 12,
  background: '#f1f3f7',
  boxSizing: 'border-box',
});

const SourceModeButton = styled('button', {
  shouldForwardProp: prop => prop !== 'active' && prop !== 'disabledState',
})<{ active: boolean; disabledState?: boolean }>(
  ({ active, disabledState = false, theme }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
    padding: '0 16px',
    borderRadius: 10,
    border: '1px solid transparent',
    background: active ? '#ffffff' : 'transparent',
    color: active ? theme.palette.grey[900] : theme.palette.grey[600],
    fontSize: 13,
    fontWeight: active ? 600 : 500,
    lineHeight: 1,
    whiteSpace: 'nowrap',
    cursor: disabledState ? 'not-allowed' : 'pointer',
    opacity: disabledState ? 0.55 : 1,
    boxShadow: active ? '0 1px 2px rgba(15,23,42,0.08)' : 'none',
    transition:
      'border-color 150ms ease, background-color 150ms ease, color 150ms ease, box-shadow 150ms ease',
    '&:hover': {
      background: active ? '#ffffff' : 'transparent',
      color: active ? theme.palette.grey[900] : theme.palette.grey[600],
      boxShadow: active ? '0 1px 2px rgba(15,23,42,0.08)' : 'none',
    },
    '&:focus-visible': {
      outline: 'none',
      boxShadow: active
        ? '0 1px 2px rgba(15,23,42,0.08), 0 0 0 3px rgba(99,102,241,0.12)'
        : '0 0 0 3px rgba(99,102,241,0.12)',
    },
  })
);

const SectionTitle = styled('span')(({ theme }) => ({
  fontSize: 13,
  fontWeight: 700,
  color: theme.palette.grey[900],
}));

const DropZone = styled(Box, {
  shouldForwardProp: prop => prop !== 'isDragOver' && prop !== 'isUploading',
})<{ isDragOver: boolean; isUploading: boolean }>(
  ({ theme, isDragOver, isUploading }) => ({
    border: `1px dashed ${isDragOver ? theme.palette.primary.main : '#d7dbe5'}`,
    borderRadius: 16,
    padding: '30px 24px 32px',
    cursor: isUploading ? 'progress' : 'pointer',
    backgroundColor: isDragOver ? '#f3f5f9' : '#f8f9fb',
    transition: theme.transitions.create([
      'border-color',
      'background-color',
      'box-shadow',
    ]),
    outline: 'none',
    boxShadow: isDragOver ? '0 0 0 3px rgba(99,102,241,0.08)' : 'none',
  })
);

const DropIconShell = styled('div')({
  width: 42,
  height: 42,
  borderRadius: 12,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#e3e8ff',
});

const DropTitle = styled('div')(({ theme }) => ({
  fontSize: 14,
  fontWeight: 600,
  lineHeight: 1.2,
  color: theme.palette.grey[900],
}));

const DropHint = styled('div')(({ theme }) => ({
  fontSize: 12,
  fontWeight: 500,
  lineHeight: 1.2,
  color: theme.palette.grey[500],
}));

const UploadedFileCard = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '10px 14px 10px 16px',
  borderRadius: 16,
  border: `1px solid ${theme.palette.divider}`,
  background: theme.palette.grey[50],
}));

const UploadedFileInfo = styled('div')({
  minWidth: 0,
  flex: 1,
});

const UploadedFileName = styled('div')(({ theme }) => ({
  fontSize: 13,
  fontWeight: 600,
  lineHeight: 1.25,
  color: theme.palette.grey[900],
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

const UploadedFileMeta = styled('div')(({ theme }) => ({
  marginTop: 3,
  fontSize: 12,
  fontWeight: 500,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  lineHeight: 1.2,
  color: '#15803d',
}));

const UploadedFileSize = styled('span')(({ theme }) => ({
  color: theme.palette.grey[500],
  opacity: 0.8,
}));

const UploadedFileMetaMuted = styled('span')(({ theme }) => ({
  color: theme.palette.grey[400],
  opacity: 0.8,
}));

const UploadedFileActions = styled('div')({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  flexShrink: 0,
});

const ReplaceButton = styled(Button)({
  minWidth: 'fit-content',
  minHeight: 32,
  padding: '3px 12px',
  borderRadius: 10,
  textTransform: 'none',
  fontWeight: 600,
  backgroundColor: '#ffffff',
  color: '#6b7280',
});

const DeleteButton = styled('button')(({ theme }) => ({
  width: 32,
  height: 32,
  border: 'none',
  borderRadius: 10,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#ffffff',
  color: theme.palette.grey[400],
  cursor: 'pointer',
  transition: 'background-color 150ms ease, color 150ms ease',
  '&:hover': {
    background: '#fef2f2',
    color: theme.palette.error.main,
  },
  '&:disabled': {
    cursor: 'not-allowed',
    opacity: 0.5,
  },
}));

type NodeFileUploadFieldProps = {
  config: NodeFileUploadConfig;
  currentFileName: string | null;
  currentFilePath?: string | null;
  currentFileSizeLabel?: string | null;
  error: string | null;
  isUploading: boolean;
  mode: NodeFileSourceMode;
  onClear: () => void;
  onFileSelected: (file: File) => void | Promise<void>;
  onModeChange: (mode: NodeFileSourceMode) => void;
  uploadDisabled?: boolean;
  uploadDisabledReason?: string | null;
};

export const NodeFileUploadField: React.FC<NodeFileUploadFieldProps> = ({
  config,
  currentFileName,
  currentFileSizeLabel = null,
  error,
  isUploading,
  mode,
  onClear,
  onFileSelected,
  onModeChange,
  uploadDisabled = false,
  uploadDisabledReason = null,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const acceptedExtensionsLabel = useMemo(
    () => getAcceptedExtensionsLabel(config.acceptedExtensions),
    [config.acceptedExtensions]
  );
  const accept = useMemo(
    () => config.acceptedExtensions.join(','),
    [config.acceptedExtensions]
  );

  const handleFiles = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) {
      return;
    }

    void onFileSelected(file);
  };
  const hasUploadedFile = Boolean(currentFileName);

  return (
    <Stack spacing={1.5}>
      <Stack direction='row' alignItems='center' justifyContent='space-between'>
        <SectionTitle>Источник файла:</SectionTitle>
        <SourceModeGroup role='tablist' aria-label='Источник файла'>
          <SourceModeButton
            type='button'
            active={mode === 'manual'}
            disabledState={false}
            aria-pressed={mode === 'manual'}
            onClick={() => onModeChange('manual')}
          >
            Выбрать файл
          </SourceModeButton>
          <Tooltip title={uploadDisabled ? uploadDisabledReason || '' : ''}>
            <span>
              <SourceModeButton
                type='button'
                active={mode === 'upload'}
                disabledState={uploadDisabled}
                disabled={uploadDisabled}
                aria-pressed={mode === 'upload'}
                onClick={() => onModeChange('upload')}
              >
                Загрузить файл
              </SourceModeButton>
            </span>
          </Tooltip>
        </SourceModeGroup>
      </Stack>

      {mode === 'upload' ? (
        <>
          {!hasUploadedFile ? (
            <DropZone
              isDragOver={isDragOver}
              isUploading={isUploading}
              role='button'
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  inputRef.current?.click();
                }
              }}
              onDragEnter={event => {
                event.preventDefault();
                setIsDragOver(true);
              }}
              onDragOver={event => {
                event.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={event => {
                event.preventDefault();
                setIsDragOver(false);
              }}
              onDrop={event => {
                event.preventDefault();
                setIsDragOver(false);
                handleFiles(event.dataTransfer.files);
              }}
            >
              <Stack spacing={1.25} alignItems='center' textAlign='center'>
                <DropIconShell>
                  <CloudUploadOutlinedIcon
                    sx={{ fontSize: 20, color: '#6366f1' }}
                  />
                </DropIconShell>
                <DropTitle>
                  Перетащите {config.displayName} сюда или нажмите для выбора
                </DropTitle>
                <DropHint>
                  Поддерживаются: {acceptedExtensionsLabel} {config.helperText}
                </DropHint>
              </Stack>
            </DropZone>
          ) : null}

          <input
            ref={inputRef}
            hidden
            type='file'
            accept={accept}
            onChange={event => {
              handleFiles(event.target.files);
              event.target.value = '';
            }}
          />

          {hasUploadedFile ? (
            <UploadedFileCard>
              <UploadedFileInfo>
                <UploadedFileName>{currentFileName}</UploadedFileName>
                <UploadedFileMeta>
                  {currentFileSizeLabel ? (
                    <>
                      <UploadedFileSize>
                        {currentFileSizeLabel}
                      </UploadedFileSize>{' '}
                      <UploadedFileMetaMuted>•</UploadedFileMetaMuted>{' '}
                    </>
                  ) : null}
                  <CheckRoundedIcon sx={{ fontSize: 14 }} />
                  Файл загружен
                </UploadedFileMeta>
              </UploadedFileInfo>

              <UploadedFileActions>
                <ReplaceButton
                  size='small'
                  variant='outlined'
                  disabled={isUploading}
                  onClick={() => inputRef.current?.click()}
                >
                  Заменить
                </ReplaceButton>
                <DeleteButton
                  type='button'
                  disabled={isUploading}
                  onClick={onClear}
                  aria-label='Удалить файл'
                >
                  <DeleteOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                </DeleteButton>
              </UploadedFileActions>
            </UploadedFileCard>
          ) : null}

          {isUploading ? (
            <Typography variant='caption' color='text.secondary'>
              Загружаем файл...
            </Typography>
          ) : null}

          {error ? <Alert severity='error'>{error}</Alert> : null}
        </>
      ) : null}
    </Stack>
  );
};
