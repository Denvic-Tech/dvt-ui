import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  InputAdornment,
  InputBase,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import {
  isFileConnectionType,
  useConnections,
} from '@/entities/data/db-connection';
import {
  applyFileStorageListContext,
  type FileStorageConnection,
  FileStorageManager,
  type FileStorageManagerProps,
  type FileStorageManagerRef,
  getFileStorageConnectionMeta,
  toFileStorageConnection,
} from '@/entities/data/storage';
import { useFileStorageManagerViewer } from '@/entities/node/file-storage-manager-viewer';

import {
  buildStoragePathForSaveTarget,
  splitStoragePathForSaveTarget,
} from '@/shared/lib/file-storage-target-path';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  IconButton,
} from '@/shared/ui/primitives';

type FileStorageManagerDialogProps = {
  connection: FileStorageConnection;
  connectionContext?: FileStorageManagerProps['connectionContext'];
  open: boolean;
  onClose: () => void;
  mode?: 'viewer' | 'picker';
  pickerKind?: 'generic' | 'save_target';
  selectionMode?: FileStorageManagerProps['selectionMode'];
  selectedPath?: string | null;
  allowedFileExts?: string[] | null;
  extension?: string | null;
  title?: string | null;
  description?: string | null;
  confirmLabel?: string | null;
  onResolveSelection?: FileStorageManagerProps['onSelect'];
};

const MemoizedFileStorageManager = memo(FileStorageManager);

const INVALID_SAVE_TARGET_FILE_NAME_RE = /[\\/]/;
const SAVE_TARGET_SEGMENT_PREVIEW_LIMIT = 22;
const SAVE_TARGET_DIRECTORY_PREVIEW_LIMIT = 56;

const buildConnectionRootParts = (connection: FileStorageConnection) => {
  const prefix = getFileStorageConnectionMeta(connection).hint;

  if (connection.type === 'ftp') {
    return { protocol: 'ftp://', rootPath: prefix ?? '' };
  }
  if (connection.type === 'sftp') {
    return { protocol: 'sftp://', rootPath: prefix ?? '' };
  }
  if (connection.type === 'smbprotocol') {
    return { protocol: 'smb://', rootPath: prefix ?? '' };
  }

  return { protocol: 's3://', rootPath: prefix ?? '' };
};

const getParentDirectoryPath = (path: string) => {
  const segments = path.split('/').filter(Boolean);
  segments.pop();
  return segments.join('/');
};

const getSaveTargetDraftError = (fileName: string) => {
  const trimmedFileName = fileName.trim();

  if (!trimmedFileName) {
    return 'Укажите имя файла в конце пути';
  }
  if (INVALID_SAVE_TARGET_FILE_NAME_RE.test(trimmedFileName)) {
    return 'Имя файла задаётся без "/" и "\\"';
  }

  return null;
};

const getCompactSaveTargetSegment = (segment: string) => {
  const trimmedSegment = segment.trim();

  if (trimmedSegment.length <= SAVE_TARGET_SEGMENT_PREVIEW_LIMIT) {
    return segment;
  }

  const headLength = 12;
  const tailLength = 7;

  return `${trimmedSegment.slice(0, headLength)}...${trimmedSegment.slice(-tailLength)}`;
};

const getSaveTargetDirectoryPreview = (
  connection: FileStorageConnection,
  currentDirectoryPath: string
) => {
  const rootParts = buildConnectionRootParts(connection);
  const rootLabel = rootParts.rootPath
    ? `${rootParts.protocol}${rootParts.rootPath}`
    : rootParts.protocol;
  const segments = currentDirectoryPath
    .split('/')
    .map(segment => segment.trim())
    .filter(Boolean);

  const fullPreview = segments.length
    ? `${rootLabel} / ${segments.join(' / ')}`
    : rootLabel;

  if (fullPreview.length <= SAVE_TARGET_DIRECTORY_PREVIEW_LIMIT) {
    return fullPreview;
  }

  if (segments.length === 0) {
    return fullPreview;
  }

  const currentDirectoryLabel = getCompactSaveTargetSegment(
    segments[segments.length - 1]
  );

  if (segments.length === 1) {
    return `${rootLabel} / ${currentDirectoryLabel}`;
  }

  return `${rootLabel} / ... / ${currentDirectoryLabel}`;
};

const getSaveTargetDirectoryPreviewParts = (
  connection: FileStorageConnection,
  currentDirectoryPath: string
) => {
  const rootParts = buildConnectionRootParts(connection);
  const rootLabel = rootParts.rootPath
    ? `${rootParts.protocol}${rootParts.rootPath}`
    : rootParts.protocol;
  const segments = currentDirectoryPath
    .split('/')
    .map(segment => segment.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    return {
      prefix: `${rootLabel} /`,
      selected: '',
    };
  }

  const fullPreview = getSaveTargetDirectoryPreview(
    connection,
    currentDirectoryPath
  );
  const selectedRaw = segments[segments.length - 1];
  const selected = fullPreview.endsWith(selectedRaw)
    ? selectedRaw
    : getCompactSaveTargetSegment(selectedRaw);
  const prefix = fullPreview.slice(
    0,
    Math.max(0, fullPreview.length - selected.length)
  );

  return {
    prefix,
    selected,
  };
};

type SaveTargetPathFieldProps = {
  connection: FileStorageConnection;
  currentDirectoryPath: string;
  extension: string;
  fileName: string;
  onChangeFileName: (value: string) => void;
  onSelectDirectoryPath: (path: string) => void;
  errorText?: string | null;
};

const SaveTargetPathField = ({
  connection,
  currentDirectoryPath,
  extension,
  fileName,
  onChangeFileName,
  onSelectDirectoryPath,
  errorText = null,
}: SaveTargetPathFieldProps) => {
  const directoryPreview = getSaveTargetDirectoryPreview(
    connection,
    currentDirectoryPath
  );
  const directoryPreviewParts = getSaveTargetDirectoryPreviewParts(
    connection,
    currentDirectoryPath
  );

  return (
    <Stack spacing={0.75}>
      <Typography
        variant='caption'
        sx={{
          color: theme => alpha(theme.palette.text.primary, 0.54),
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        Полный путь сохранения
      </Typography>

      <Box
        sx={theme => ({
          border: '1px solid',
          borderColor: errorText
            ? 'error.main'
            : alpha(theme.palette.primary.main, 0.36),
          borderRadius: '8px',
          px: 1.35,
          py: 0.8,
          maxWidth: '100%',
          overflow: 'hidden',
          backgroundColor: theme.palette.background.paper,
          boxShadow: errorText
            ? `0 0 0 1px ${alpha(theme.palette.error.main, 0.08)}`
            : `0 0 0 3px ${alpha(theme.palette.primary.main, 0.04)}`,
        })}
      >
        <Stack
          direction='row'
          alignItems='center'
          spacing={0.75}
          sx={{ minWidth: 0 }}
        >
          <Box
            component='button'
            type='button'
            onClick={() => onSelectDirectoryPath(currentDirectoryPath)}
            title={
              currentDirectoryPath
                ? `${currentDirectoryPath}/`
                : `${directoryPreview} /`
            }
            sx={{
              minWidth: 0,
              flex: '0 1 auto',
              maxWidth: '70%',
              border: 0,
              p: 0,
              m: 0,
              background: 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
              font: 'inherit',
              overflow: 'hidden',
            }}
          >
            <Typography
              variant='body2'
              noWrap
              sx={{
                fontSize: 13.5,
                fontWeight: 500,
              }}
            >
              <Box
                component='span'
                sx={{ color: theme => alpha(theme.palette.text.primary, 0.54) }}
              >
                {directoryPreviewParts.prefix}
              </Box>
              {directoryPreviewParts.selected ? (
                <Box component='span' sx={{ color: 'text.primary' }}>
                  {directoryPreviewParts.selected}
                </Box>
              ) : null}
              {directoryPreviewParts.selected ? (
                <Box
                  component='span'
                  sx={{
                    color: theme => alpha(theme.palette.text.primary, 0.54),
                  }}
                >
                  {' /'}
                </Box>
              ) : null}
            </Typography>
          </Box>

          <InputBase
            value={fileName}
            onChange={event => onChangeFileName(event.target.value)}
            placeholder='new_file'
            sx={{
              minWidth: 120,
              flex: '1 1 140px',
              minHeight: 20,
              fontSize: 14,
              fontWeight: 500,
              color: 'primary.main',
              '& .MuiInputBase-input': {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              },
            }}
          />
          <Box
            sx={theme => ({
              flexShrink: 0,
              px: 0.8,
              py: 0.3,
              borderRadius: '5px',
              backgroundColor: alpha(theme.palette.text.primary, 0.045),
            })}
          >
            <Typography
              variant='body2'
              sx={{
                color: theme => alpha(theme.palette.text.primary, 0.42),
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {extension}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Typography
        variant='caption'
        color={errorText ? 'error.main' : 'text.secondary'}
        sx={{ pl: 0.25 }}
      >
        {errorText ? errorText : 'Наберите имя файла в конце строки пути.'}
      </Typography>
    </Stack>
  );
};

export const FileStorageManagerContent = ({
  allowedFileExts = null,
  confirmLabel = null,
  connection,
  connectionContext = null,
  description = null,
  extension = null,
  mode = 'viewer',
  onResolveSelection,
  open,
  onClose,
  pickerKind = 'generic',
  selectedPath = null,
  selectionMode = 'none',
  title = null,
}: FileStorageManagerDialogProps) => {
  const managerRef = useRef<FileStorageManagerRef | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stagedSelection, setStagedSelection] = useState<{
    path: string;
    nodeType: 'file' | 'folder';
  } | null>(null);
  const [saveTargetDirectoryPath, setSaveTargetDirectoryPath] = useState('');
  const [saveTargetFileName, setSaveTargetFileName] = useState('');

  const meta = useMemo(
    () => getFileStorageConnectionMeta(connection),
    [connection]
  );
  const isSaveTargetPicker = mode === 'picker' && pickerKind === 'save_target';

  useEffect(() => {
    if (!open) {
      return;
    }

    setSearchTerm('');

    if (!isSaveTargetPicker || !extension) {
      setStagedSelection(null);
      setSaveTargetDirectoryPath('');
      setSaveTargetFileName('');
      return;
    }

    const nextDraft = splitStoragePathForSaveTarget(selectedPath, extension);
    setSaveTargetDirectoryPath(nextDraft.directoryPath);
    setSaveTargetFileName(nextDraft.fileName);
    setStagedSelection(
      nextDraft.directoryPath
        ? { path: nextDraft.directoryPath, nodeType: 'folder' }
        : null
    );
  }, [connection.id, extension, isSaveTargetPicker, open, selectedPath]);

  useEffect(() => {
    if (!open || !isSaveTargetPicker) {
      return;
    }

    managerRef.current?.openPath(saveTargetDirectoryPath);
  }, [isSaveTargetPicker, open, saveTargetDirectoryPath]);

  const effectiveTitle = title ?? meta?.label ?? '';
  const effectiveDescription =
    description ??
    (isSaveTargetPicker
      ? 'Выберите папку в дереве и задайте имя файла прямо в поле пути выше.'
      : mode === 'picker'
        ? 'Выберите файл или папку и подтвердите выбор.'
        : 'Управление файлами и папками для выбранного подключения.');
  const saveTargetError =
    isSaveTargetPicker && extension
      ? getSaveTargetDraftError(saveTargetFileName)
      : null;
  const saveTargetFullPath =
    isSaveTargetPicker && extension
      ? buildStoragePathForSaveTarget({
          directoryPath: saveTargetDirectoryPath,
          extension,
          fileName: saveTargetFileName,
        })
      : null;
  const resolvedSelectedPath = isSaveTargetPicker
    ? (stagedSelection?.path ??
      (saveTargetDirectoryPath ? saveTargetDirectoryPath : null))
    : (stagedSelection?.path ?? selectedPath);
  const pickerSelectHandler = useCallback(
    (path: string, nodeType: 'file' | 'folder') => {
      if (mode !== 'picker') {
        return;
      }

      if (isSaveTargetPicker && extension) {
        if (nodeType === 'folder') {
          setSaveTargetDirectoryPath(path);
          setStagedSelection({ path, nodeType });
          return;
        }

        const nextDraft = splitStoragePathForSaveTarget(path, extension);
        setSaveTargetDirectoryPath(nextDraft.directoryPath);
        if (nextDraft.fileName) {
          setSaveTargetFileName(nextDraft.fileName);
        }
        setStagedSelection({ path, nodeType });
        return;
      }

      setStagedSelection({ path, nodeType });
    },
    [extension, isSaveTargetPicker, mode]
  );

  const fileStorageManagerProps = useMemo(() => {
    const nextProps: FileStorageManagerProps = {
      connection,
      connectionContext,
      searchTerm,
      showMutations: mode === 'viewer',
    };

    if (selectionMode !== undefined) {
      nextProps.selectionMode = selectionMode;
    }
    if (resolvedSelectedPath !== null) {
      nextProps.selectedPath = resolvedSelectedPath;
    }
    if (mode === 'picker') {
      nextProps.onSelect = pickerSelectHandler;
    }
    if (allowedFileExts) {
      nextProps.allowedFileExts = allowedFileExts;
    }

    return nextProps;
  }, [
    allowedFileExts,
    connection,
    connectionContext,
    mode,
    pickerSelectHandler,
    resolvedSelectedPath,
    searchTerm,
    selectionMode,
  ]);

  const handleSelectDirectoryPath = useCallback((path: string) => {
    setSaveTargetDirectoryPath(path);
    setStagedSelection(path ? { path, nodeType: 'folder' } : null);
    managerRef.current?.openPath(path);
  }, []);

  const handleGoUp = useCallback(() => {
    handleSelectDirectoryPath(getParentDirectoryPath(saveTargetDirectoryPath));
  }, [handleSelectDirectoryPath, saveTargetDirectoryPath]);

  if (!connection || !meta) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 12px)',
          maxWidth: 'calc(100vw - 12px)',
          overflow: 'hidden',
          bgcolor: 'background.paper',
          borderRadius: '12px',
          width: 'min(920px, calc(100vw - 12px))',
        },
      }}
    >
      <DialogHeader
        sx={{
          flexShrink: 0,
          borderBottom: 0,
          backgroundColor: 'background.paper',
          px: 2.5,
          pt: 2,
          pb: 1.1,
        }}
      >
        <Stack direction='row' spacing={1} alignItems='flex-start'>
          <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1, pr: 1 }}>
            <DialogTitle
              sx={{ fontSize: 17, fontWeight: 700, lineHeight: 1.2 }}
            >
              {effectiveTitle}
            </DialogTitle>
            <DialogDescription
              sx={{ mt: 0, maxWidth: 420, fontSize: 12.5, lineHeight: 1.3 }}
            >
              {effectiveDescription}
            </DialogDescription>
          </Stack>
          <IconButton
            type='button'
            size='xs'
            variant='ghost'
            onClick={() => managerRef.current?.refresh()}
            sx={{
              color: 'text.secondary',
              mt: -0.25,
              '&:hover': {
                backgroundColor: 'transparent',
                color: 'text.primary',
              },
            }}
          >
            <RefreshRoundedIcon fontSize='small' />
          </IconButton>
          <IconButton
            type='button'
            size='xs'
            variant='ghost'
            onClick={onClose}
            sx={{
              color: 'text.secondary',
              mt: -0.25,
              '&:hover': {
                backgroundColor: 'transparent',
                color: 'text.primary',
              },
            }}
          >
            <CloseRoundedIcon fontSize='small' />
          </IconButton>
        </Stack>
      </DialogHeader>
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          maxHeight: 'calc(100vh - 220px)',
          minHeight: 0,
          overflowX: 'hidden',
          overflowY: 'auto',
          px: 0,
          pt: 0,
          pb: 0,
        }}
      >
        <Stack spacing={1.4} sx={{ px: 2.5, pt: 0.6 }}>
          {isSaveTargetPicker && extension ? (
            <SaveTargetPathField
              connection={connection}
              currentDirectoryPath={saveTargetDirectoryPath}
              extension={extension}
              fileName={saveTargetFileName}
              onChangeFileName={setSaveTargetFileName}
              onSelectDirectoryPath={handleSelectDirectoryPath}
              errorText={saveTargetError}
            />
          ) : (
            <Stack spacing={0.75}>
              <Typography variant='body2' color='text.secondary'>
                Тип: {connection.type.toUpperCase()}
              </Typography>
              {meta.hint ? (
                <Typography variant='body2' color='text.secondary'>
                  Базовый путь: {meta.hint}
                </Typography>
              ) : null}
            </Stack>
          )}

          <Stack direction='row' spacing={1} alignItems='center'>
            <TextField
              fullWidth
              size='small'
              placeholder='Поиск по дереву...'
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchIcon fontSize='small' />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: 32,
                  minHeight: 32,
                  borderRadius: '8px',
                  backgroundColor: theme =>
                    alpha(theme.palette.text.primary, 0.035),
                },
                '& .MuiOutlinedInput-input': {
                  py: 0.5,
                  fontSize: 13,
                },
                '& .MuiInputAdornment-root': {
                  mr: 0.5,
                },
                '& .MuiInputAdornment-root svg': {
                  fontSize: 17,
                },
              }}
            />
            {isSaveTargetPicker ? (
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={handleGoUp}
                disabled={!saveTargetDirectoryPath}
                sx={{
                  minWidth: 96,
                  height: 32,
                  minHeight: 32,
                  px: 1.1,
                  py: 0,
                  borderRadius: '8px',
                  color: 'text.secondary',
                  fontSize: 13,
                  backgroundColor: theme =>
                    alpha(theme.palette.text.primary, 0.02),
                }}
              >
                Вверх
              </Button>
            ) : null}
          </Stack>
        </Stack>

        <Box
          sx={theme => ({
            borderTop: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
            backgroundColor: alpha(theme.palette.text.primary, 0.028),
            mt: 0.25,
            minHeight: 0,
            minWidth: 0,
            pl: 0.5,
            pr: 1.5,
            pt: 1.2,
            pb: 0.5,
            overflowX: 'hidden',
          })}
        >
          <MemoizedFileStorageManager
            ref={managerRef}
            height='clamp(240px, 48vh, 420px)'
            {...fileStorageManagerProps}
          />
        </Box>
      </DialogContent>
      <DialogFooter
        sx={{
          bgcolor: 'background.paper',
          bottom: 0,
          flexShrink: 0,
          left: 0,
          overflow: 'hidden',
          position: 'sticky',
          px: 2.5,
          py: 1.8,
          right: 0,
          zIndex: 1,
        }}
      >
        {mode === 'picker' ? (
          <>
            <Box sx={{ minWidth: 0, flex: 1, pr: 1 }}>
              {isSaveTargetPicker && saveTargetFullPath ? (
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {saveTargetFullPath}
                </Typography>
              ) : null}
            </Box>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              sx={{ borderRadius: '8px' }}
            >
              Отмена
            </Button>
            <Button
              type='button'
              onClick={() => {
                if (isSaveTargetPicker) {
                  if (!saveTargetFullPath || saveTargetError) {
                    return;
                  }

                  onResolveSelection?.(saveTargetFullPath, 'file');
                  return;
                }

                if (!stagedSelection) {
                  return;
                }

                onResolveSelection?.(
                  stagedSelection.path,
                  stagedSelection.nodeType
                );
              }}
              disabled={
                isSaveTargetPicker
                  ? Boolean(saveTargetError) || !saveTargetFullPath
                  : !stagedSelection
              }
              sx={{
                borderRadius: '8px',
                background: 'none',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                boxShadow: 'none',
                '&:hover': {
                  background: 'none',
                  backgroundColor: '#1D4ED8',
                  boxShadow: 'none',
                },
                '&.Mui-disabled': {
                  background: 'none',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  opacity: 0.45,
                },
              }}
            >
              {confirmLabel ??
                (isSaveTargetPicker ? 'Сохранить сюда' : 'Выбрать')}
            </Button>
          </>
        ) : (
          <Button
            type='button'
            variant='outline'
            onClick={onClose}
            sx={{ borderRadius: '8px' }}
          >
            Закрыть
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  );
};

export const FileStorageManagerViewer = () => {
  const { open, closeViewer, connectionID, mode, picker, resolvePicker } =
    useFileStorageManagerViewer();

  const { getConnectionById } = useConnections();

  const connection = useMemo(
    () => (connectionID ? getConnectionById(connectionID) : null),
    [connectionID, getConnectionById]
  );
  const storageConnection = useMemo(() => {
    const baseConnection = toFileStorageConnection(connection);
    if (!baseConnection) {
      return null;
    }

    return applyFileStorageListContext(
      baseConnection,
      picker.connectionContext
    );
  }, [connection, picker.connectionContext]);

  if (!open || !connection) {
    return null;
  }

  if (!isFileConnectionType(connection.type)) {
    console.warn(`Wrong connection type: ${connection.type}`);
    return null;
  }

  if (!storageConnection) {
    console.warn(
      `Failed to adapt connection for file storage: ${connection.id}`
    );
    return null;
  }

  return (
    <FileStorageManagerContent
      allowedFileExts={picker.allowedFileExts}
      connection={storageConnection}
      connectionContext={picker.connectionContext}
      confirmLabel={picker.confirmLabel}
      description={picker.description}
      extension={picker.extension}
      mode={mode}
      onResolveSelection={(path, nodeType) => {
        if (mode !== 'picker') {
          return;
        }

        resolvePicker({ path, nodeType });
      }}
      open={open}
      onClose={closeViewer}
      pickerKind={picker.kind}
      selectedPath={picker.selectedPath}
      selectionMode={picker.selectionMode}
      title={picker.title}
    />
  );
};
