import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import DriveFileRenameOutlineRoundedIcon from '@mui/icons-material/DriveFileRenameOutlineRounded';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FolderIcon from '@mui/icons-material/Folder';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import {
  Box,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { MdOutlineCreateNewFolder } from 'react-icons/md';

import { useAlert } from '@/app/notifications';

import {
  FileStorageConnection,
  FileStorageFileNode,
  FileStorageFolderNode,
  type FileStorageListContext,
} from '@/entities/data/storage';
import {
  fileId,
  folderId,
  getFileStorageConnectionMeta,
  normalizePath,
} from '@/entities/data/storage/model/helpers';
import { useStorage } from '@/entities/data/storage/model/hook';

import type { UserFileTreeSchema } from '@/shared/gatewayClient';
import { useConfirmDialog } from '@/shared/ui/confirm-dialog';

import { StoragePathNameDialog } from './StoragePathNameDialog';

type DirCache = Record<string, UserFileTreeSchema>;
type SelectionMode = 'none' | 'file' | 'folder' | 'file_or_folder';

const EMPTY_FOLDERS: FileStorageFolderNode[] = [];
const EMPTY_FILES: FileStorageFileNode[] = [];
const ROOT_ITEM_ID = folderId('/');
const INVALID_NAME_CHARS_RE = /[\\:*?"<>|]/;
const TREE_ITEM_SURFACE_INSET_PX = 8;
const FILE_EXTENSION_COLOR_PALETTE = [
  '#059669',
  '#0F766E',
  '#2563EB',
  '#4F46E5',
  '#7C3AED',
  '#C2410C',
  '#D97706',
  '#DC2626',
  '#BE185D',
  '#64748B',
] as const;
const GREEN_FILE_EXTENSIONS = new Set(['csv', 'xlsx', 'xls']);
const GREEN_FILE_EXTENSION_COLOR = '#16A34A';
const PARQUET_FILE_EXTENSIONS = new Set(['parquet', 'pqt']);
const PARQUET_FILE_EXTENSION_COLOR = '#64748B';

type PendingCreateFolder = {
  parentPath: string;
};

type PendingRenamePath = {
  currentName: string;
  path: string;
  type: 'file' | 'folder';
};

const hashString = (value: string) => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
};

const getFileExtension = (filename: string) =>
  filename.split('.').pop()?.trim().toLowerCase() || '';

const getFileExtensionLabel = (filename: string) => {
  const normalizedExt = getFileExtension(filename);
  const ext = normalizedExt.toUpperCase();

  if (PARQUET_FILE_EXTENSIONS.has(normalizedExt)) {
    return 'PQT';
  }

  if (!ext || ext === filename.toUpperCase()) {
    return 'FIL';
  }

  return ext.slice(0, 3);
};

const getFileExtensionColor = (filename: string) => {
  const ext = getFileExtension(filename);
  const label = getFileExtensionLabel(filename);

  if (PARQUET_FILE_EXTENSIONS.has(ext)) {
    return PARQUET_FILE_EXTENSION_COLOR;
  }

  if (GREEN_FILE_EXTENSIONS.has(ext)) {
    return GREEN_FILE_EXTENSION_COLOR;
  }

  return FILE_EXTENSION_COLOR_PALETTE[
    hashString(label) % FILE_EXTENSION_COLOR_PALETTE.length
  ];
};

const FileExtensionBadge = ({ filename }: { filename: string }) => {
  const label = getFileExtensionLabel(filename);
  const color = getFileExtensionColor(filename);

  return (
    <Box
      aria-hidden='true'
      sx={{
        width: 18,
        height: 18,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '6px',
        backgroundColor: alpha(color, 0.12),
        color,
        fontSize: 7,
        fontWeight: 700,
        lineHeight: 1,
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
        flexShrink: 0,
      }}
    >
      {label}
    </Box>
  );
};

export type FileStorageManagerRef = {
  refresh: () => void;
  openPath: (path: string) => void;
};

export interface FileStorageManagerProps {
  connection: FileStorageConnection;
  connectionContext?: FileStorageListContext | null;
  searchTerm?: string;
  height?: number | string;
  onFileOpen?: (path: string) => void | Promise<void>;
  selectionMode?: SelectionMode;
  selectedPath?: string | null;
  onSelect?: (path: string, nodeType: 'file' | 'folder') => void;
  filterFile?: (name: string) => boolean;
  allowedFileExts?: string[];
  showMutations?: boolean;
  emptyFilesText?: string;
  emptySearchText?: string;
}

export const FileStorageManager = forwardRef<
  FileStorageManagerRef,
  FileStorageManagerProps
>(function FileStorageManager(
  {
    connection,
    connectionContext = null,
    searchTerm = '',
    height = 420,
    onFileOpen,
    selectionMode = 'none',
    selectedPath = null,
    onSelect,
    filterFile,
    allowedFileExts,
    showMutations = true,
    emptyFilesText = 'Нет доступных файлов',
    emptySearchText = 'Файлы не найдены',
  },
  ref
) {
  const {
    loadStorageTree,
    requestDownloadPresign,
    createStorageFolder,
    removeStorageFolder,
    removeStorageFiles,
    renameStoragePath,
    uploadStorageFile,
  } = useStorage();
  const { showNotification } = useAlert();
  const { confirm } = useConfirmDialog();

  const [expanded, setExpanded] = useState<string[]>([ROOT_ITEM_ID]);
  const [cache, setCache] = useState<DirCache>({});
  const [loadingPaths, setLoadingPaths] = useState<Set<string>>(new Set());
  const [busyPaths, setBusyPaths] = useState<Set<string>>(new Set());
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [menuFolderPath, setMenuFolderPath] = useState<string | null>(null);
  const [dragHoverPath, setDragHoverPath] = useState<string | null>(null);
  const [pendingCreateFolder, setPendingCreateFolder] =
    useState<PendingCreateFolder | null>(null);
  const [pendingRenamePath, setPendingRenamePath] =
    useState<PendingRenamePath | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadTargetPath, setUploadTargetPath] = useState<string | null>(null);

  const connectionId = String(connection.id);
  const connectionMeta = useMemo(
    () => getFileStorageConnectionMeta(connection),
    [connection]
  );
  const searchLC = useMemo(() => searchTerm.trim().toLowerCase(), [searchTerm]);

  const allowedExtsNorm = useMemo(
    () =>
      allowedFileExts?.map(ext => ext.replace(/^\./, '').toLowerCase()) ?? null,
    [allowedFileExts]
  );

  const validatePathName = useCallback((value: string) => {
    if (!value) {
      return 'Имя не может быть пустым';
    }

    if (INVALID_NAME_CHARS_RE.test(value)) {
      return 'Имя содержит недопустимые символы: \\ : * ? " < > |';
    }

    if (value === '.' || value === '..') {
      return 'Имя должно быть конкретным, без "." или ".."';
    }

    if (value.includes('/')) {
      return 'Имя должно задаваться без "/"';
    }

    return null;
  }, []);

  const isFileAllowedByExt = useCallback(
    (name: string) => {
      if (!allowedExtsNorm || allowedExtsNorm.length === 0) {
        return true;
      }

      const ext = name.split('.').pop()?.toLowerCase() || '';
      return allowedExtsNorm.includes(ext);
    },
    [allowedExtsNorm]
  );

  const isFileAllowed = useCallback(
    (name: string) => {
      if (!isFileAllowedByExt(name)) {
        return false;
      }

      return filterFile ? filterFile(name) : true;
    },
    [filterFile, isFileAllowedByExt]
  );

  const canSelectFolders =
    selectionMode === 'folder' || selectionMode === 'file_or_folder';
  const canSelectFiles =
    selectionMode === 'file' || selectionMode === 'file_or_folder';
  const rowMinHeight = showMutations ? 20 : 28;
  const rowVerticalPadding = showMutations ? 0 : 0.3;
  const rowGap = showMutations && selectionMode === 'none' ? '0px' : '2px';

  const selectedNormalizedPath = useMemo(
    () => normalizePath(selectedPath ?? ''),
    [selectedPath]
  );

  const loadDir = useCallback(
    async (path: string) => {
      const normalizedPath = normalizePath(path);

      setLoadingPaths(prev => new Set(prev).add(normalizedPath));

      try {
        const tree = await loadStorageTree(
          connectionId,
          normalizedPath,
          undefined,
          connectionContext
        );
        setCache(prev => ({
          ...prev,
          [normalizedPath]: tree,
        }));
      } catch (error) {
        console.error('loadDir failed', {
          connectionId,
          normalizedPath,
          error,
        });
      } finally {
        setLoadingPaths(prev => {
          const next = new Set(prev);
          next.delete(normalizedPath);
          return next;
        });
      }
    },
    [connectionContext, connectionId, loadStorageTree]
  );

  const refreshPath = useCallback(
    (path: string) => {
      const normalizedPath = normalizePath(path);
      setCache(prev => {
        const { [normalizedPath]: _omitted, ...rest } = prev;
        return rest;
      });
      void loadDir(normalizedPath);
    },
    [loadDir]
  );

  const refreshAll = useCallback(() => {
    const pathsToReload = Array.from(
      new Set(
        expanded
          .filter(itemId => itemId.startsWith('dir:'))
          .map(itemId => {
            const rawPath = itemId.slice(4);
            return rawPath === '/' ? '' : normalizePath(rawPath);
          })
      )
    );

    if (!pathsToReload.includes('')) {
      pathsToReload.unshift('');
    }

    setCache({});
    setLoadingPaths(new Set(pathsToReload));

    pathsToReload.forEach(path => {
      void loadDir(path);
    });
  }, [expanded, loadDir]);

  useImperativeHandle(
    ref,
    () => ({
      refresh() {
        refreshAll();
      },
      openPath(path) {
        const normalizedPath = normalizePath(path);
        const parts = normalizedPath.split('/').filter(Boolean);
        const nextExpanded = [ROOT_ITEM_ID];
        let accumulatedPath = '';

        for (const part of parts) {
          accumulatedPath = normalizePath(
            [accumulatedPath, part].filter(Boolean).join('/')
          );
          nextExpanded.push(folderId(accumulatedPath));
        }

        setExpanded(prev => Array.from(new Set([...prev, ...nextExpanded])));
        void loadDir('');
        nextExpanded.slice(1).forEach(itemId => void loadDir(itemId.slice(4)));
      },
    }),
    [loadDir, refreshAll]
  );

  useEffect(() => {
    setExpanded([ROOT_ITEM_ID]);
    setCache({});
    setLoadingPaths(new Set());
    setBusyPaths(new Set());
    setMenuAnchorEl(null);
    setMenuFolderPath(null);
    setPendingCreateFolder(null);
    setPendingRenamePath(null);
  }, [
    connectionContext?.bucket,
    connectionContext?.initial_directory,
    connectionContext?.prefix,
    connectionId,
  ]);

  useEffect(() => {
    void loadDir('');
  }, [loadDir]);

  const filterBySearch = useCallback(
    (name: string) => !searchLC || name.toLowerCase().includes(searchLC),
    [searchLC]
  );

  const getChildren = useCallback(
    (dirPath: string) => {
      const key = normalizePath(dirPath);
      const entry = cache[key];

      if (!entry) {
        return {
          folders: EMPTY_FOLDERS,
          files: EMPTY_FILES,
        };
      }

      const folders: FileStorageFolderNode[] = [];
      const files: FileStorageFileNode[] = [];

      entry.nodes.forEach(node => {
        if (!filterBySearch(node.name)) {
          return;
        }

        if (node.type === 'folder') {
          folders.push(node);
          return;
        }

        files.push(node as FileStorageFileNode);
      });

      return { folders, files };
    },
    [cache, filterBySearch]
  );

  const invalidateBranch = useCallback((path: string) => {
    const normalizedPath = normalizePath(path);

    setCache(prev =>
      Object.fromEntries(
        Object.entries(prev).filter(([key]) => {
          return !(
            key === normalizedPath || key.startsWith(`${normalizedPath}/`)
          );
        })
      )
    );

    setExpanded(prev =>
      prev.filter(itemId => {
        if (!itemId.startsWith('dir:')) {
          return true;
        }

        const rawPath = itemId.slice(4);
        const itemPath = rawPath === '/' ? '' : normalizePath(rawPath);
        return !(
          itemPath === normalizedPath ||
          itemPath.startsWith(`${normalizedPath}/`)
        );
      })
    );
  }, []);

  const withBusyPath = useCallback(
    async (path: string, callback: () => Promise<void>) => {
      const normalizedPath = normalizePath(path);
      setBusyPaths(prev => new Set(prev).add(normalizedPath));

      try {
        await callback();
      } finally {
        setBusyPaths(prev => {
          const next = new Set(prev);
          next.delete(normalizedPath);
          return next;
        });
      }
    },
    []
  );

  const uploadFilesToPath = useCallback(
    async (files: FileList | File[], targetPath: string) => {
      if (!files.length) {
        return;
      }

      const normalizedPath = normalizePath(targetPath);

      await withBusyPath(normalizedPath, async () => {
        let successCount = 0;
        const failedFiles: string[] = [];

        for (const file of Array.from(files)) {
          try {
            await uploadStorageFile(connectionId, normalizedPath, file);
            successCount += 1;
          } catch (error) {
            console.error('uploadStorageFile failed', {
              connectionId,
              normalizedPath,
              fileName: file.name,
              error,
            });
            failedFiles.push(file.name);
          }
        }

        if (successCount > 0) {
          refreshPath(normalizedPath);
          showNotification({
            type: 'success',
            title:
              successCount === 1
                ? 'Файл успешно загружен'
                : `Файлов успешно загружено: ${successCount}`,
          });
        }

        if (failedFiles.length > 0) {
          showNotification({
            type: 'error',
            title: 'Не удалось загрузить файлы',
            description: failedFiles.join(', '),
          });
        }
      });
    },
    [
      connectionId,
      refreshPath,
      showNotification,
      uploadStorageFile,
      withBusyPath,
    ]
  );

  const handleFileOpen = useCallback(
    async (fullPath: string) => {
      try {
        const normalizedPath = normalizePath(fullPath);

        if (onFileOpen) {
          await onFileOpen(normalizedPath);
          return;
        }

        const parentPath = normalizedPath.split('/').slice(0, -1).join('/');
        const filename = normalizedPath.split('/').pop();

        if (!filename) {
          return;
        }

        const url = await requestDownloadPresign(
          connectionId,
          filename,
          parentPath
        );
        window.open(url, '_blank', 'noopener,noreferrer');
      } catch (error) {
        console.error('handleFileOpen failed', {
          connectionId,
          fullPath,
          error,
        });
        showNotification({
          type: 'error',
          title: 'Не удалось открыть файл',
        });
      }
    },
    [connectionId, onFileOpen, requestDownloadPresign, showNotification]
  );

  const openCreateFolderDialog = useCallback((parentPath: string) => {
    setPendingCreateFolder({
      parentPath: normalizePath(parentPath),
    });
  }, []);

  const closeCreateFolderDialog = useCallback(() => {
    setPendingCreateFolder(null);
  }, []);

  const confirmCreateFolder = useCallback(
    async (folderName: string) => {
      if (!pendingCreateFolder) {
        return;
      }

      const parentPath = normalizePath(pendingCreateFolder.parentPath);

      try {
        await withBusyPath(parentPath, async () => {
          await createStorageFolder(connectionId, folderName, parentPath);
        });

        refreshPath(parentPath);

        if (parentPath) {
          const parentItemId = folderId(parentPath);
          setExpanded(prev =>
            prev.includes(parentItemId) ? prev : [...prev, parentItemId]
          );
        }

        showNotification({
          type: 'success',
          title: 'Папка создана',
        });
        closeCreateFolderDialog();
      } catch (error) {
        console.error('confirmCreateFolder failed', {
          connectionId,
          parentPath,
          folderName,
          error,
        });
        showNotification({
          type: 'error',
          title: 'Не удалось создать папку',
        });
      }
    },
    [
      closeCreateFolderDialog,
      connectionId,
      createStorageFolder,
      pendingCreateFolder,
      refreshPath,
      showNotification,
      withBusyPath,
    ]
  );

  const openRenameDialog = useCallback(
    (path: string, type: 'file' | 'folder') => {
      const normalizedPath = normalizePath(path);
      const currentName = normalizedPath.split('/').pop() || normalizedPath;

      if (!currentName) {
        return;
      }

      setPendingRenamePath({
        currentName,
        path: normalizedPath,
        type,
      });
    },
    []
  );

  const closeRenameDialog = useCallback(() => {
    setPendingRenamePath(null);
  }, []);

  const confirmRenamePath = useCallback(
    async (newName: string) => {
      if (!pendingRenamePath) {
        return;
      }

      const normalizedPath = normalizePath(pendingRenamePath.path);
      const parentPath = normalizedPath.split('/').slice(0, -1).join('/');

      try {
        await withBusyPath(normalizedPath, async () => {
          await renameStoragePath(connectionId, normalizedPath, newName);
        });

        invalidateBranch(normalizedPath);
        refreshPath(parentPath);

        showNotification({
          type: 'success',
          title:
            pendingRenamePath.type === 'folder'
              ? 'Папка переименована'
              : 'Файл переименован',
        });
        closeRenameDialog();
      } catch (error) {
        console.error('confirmRenamePath failed', {
          connectionId,
          normalizedPath,
          newName,
          error,
        });
        showNotification({
          type: 'error',
          title: 'Не удалось переименовать путь',
        });
      }
    },
    [
      closeRenameDialog,
      connectionId,
      invalidateBranch,
      pendingRenamePath,
      refreshPath,
      renameStoragePath,
      showNotification,
      withBusyPath,
    ]
  );

  const handleDeleteFolder = useCallback(
    async (dirPath: string) => {
      const normalizedPath = normalizePath(dirPath);
      const isConfirmed = await confirm({
        title: 'Удалить папку?',
        message: `Удалить папку "${normalizedPath || 'корень подключения'}" и всё содержимое?`,
        confirmLabel: 'Удалить',
        cancelLabel: 'Отмена',
        confirmColor: 'error',
      });

      if (!isConfirmed) {
        return;
      }

      const parentPath = normalizedPath.split('/').slice(0, -1).join('/');

      try {
        await withBusyPath(normalizedPath, async () => {
          await removeStorageFolder(connectionId, normalizedPath);
        });

        invalidateBranch(normalizedPath);
        refreshPath(parentPath);
        showNotification({ type: 'success', title: 'Папка удалена' });
      } catch (error) {
        console.error('handleDeleteFolder failed', {
          connectionId,
          normalizedPath,
          error,
        });
        showNotification({
          type: 'error',
          title: 'Не удалось удалить папку',
        });
      }
    },
    [
      confirm,
      connectionId,
      invalidateBranch,
      refreshPath,
      removeStorageFolder,
      showNotification,
      withBusyPath,
    ]
  );

  const handleDeleteFile = useCallback(
    async (filePath: string) => {
      const normalizedPath = normalizePath(filePath);
      const fileName = normalizedPath.split('/').pop() || normalizedPath;
      const isConfirmed = await confirm({
        title: 'Удалить файл?',
        message: `Удалить файл "${fileName}"?`,
        confirmLabel: 'Удалить',
        cancelLabel: 'Отмена',
        confirmColor: 'error',
      });

      if (!isConfirmed) {
        return;
      }

      const parentPath = normalizedPath.split('/').slice(0, -1).join('/');

      try {
        await withBusyPath(normalizedPath, async () => {
          await removeStorageFiles(connectionId, [normalizedPath]);
        });

        refreshPath(parentPath);
        showNotification({ type: 'success', title: 'Файл удалён' });
      } catch (error) {
        console.error('handleDeleteFile failed', {
          connectionId,
          normalizedPath,
          error,
        });
        showNotification({
          type: 'error',
          title: 'Не удалось удалить файл',
        });
      }
    },
    [
      confirm,
      connectionId,
      refreshPath,
      removeStorageFiles,
      showNotification,
      withBusyPath,
    ]
  );

  const onExpandedItemsChange = useCallback(
    (
      _event: React.SyntheticEvent<Element, Event> | null,
      itemIds: string[]
    ) => {
      const newlyExpanded = itemIds.filter(
        itemId => !expanded.includes(itemId)
      );
      setExpanded(itemIds);

      newlyExpanded.forEach(itemId => {
        if (!itemId.startsWith('dir:')) {
          return;
        }

        const rawPath = itemId.slice(4);
        const path = rawPath === '/' ? '' : normalizePath(rawPath);

        if (cache[path] || loadingPaths.has(path)) {
          return;
        }

        void loadDir(path);
      });
    },
    [cache, expanded, loadDir, loadingPaths]
  );

  const openContextMenu = useCallback(
    (event: React.MouseEvent, dirPath: string) => {
      if (!showMutations) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setMenuFolderPath(normalizePath(dirPath));
      setMenuAnchorEl(event.currentTarget as HTMLElement);
    },
    [showMutations]
  );

  const closeContextMenu = useCallback(() => {
    setMenuAnchorEl(null);
    setMenuFolderPath(null);
  }, []);

  const handleChooseFileFromMenu = useCallback(() => {
    if (!menuFolderPath) {
      return;
    }

    setUploadTargetPath(menuFolderPath);
    closeContextMenu();
    requestAnimationFrame(() => {
      fileInputRef.current?.click();
    });
  }, [closeContextMenu, menuFolderPath]);

  const onFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      const targetPath = uploadTargetPath;

      if (files && targetPath != null) {
        void uploadFilesToPath(files, targetPath);
      }

      event.target.value = '';
      setUploadTargetPath(null);
    },
    [uploadFilesToPath, uploadTargetPath]
  );

  const onDragOverFolder = useCallback(
    (event: React.DragEvent, path: string) => {
      if (!showMutations || !event.dataTransfer.types.includes('Files')) {
        return;
      }

      event.preventDefault();
      setDragHoverPath(normalizePath(path));
    },
    [showMutations]
  );

  const onDragLeaveFolder = useCallback(() => {
    setDragHoverPath(null);
  }, []);

  const onDropToFolder = useCallback(
    (event: React.DragEvent, path: string) => {
      if (!showMutations || !event.dataTransfer.files.length) {
        return;
      }

      event.preventDefault();
      setDragHoverPath(null);
      void uploadFilesToPath(event.dataTransfer.files, normalizePath(path));
    },
    [showMutations, uploadFilesToPath]
  );

  const renderFolder = useCallback(
    (label: string, dirPath: string, isRoot = false) => {
      const normalizedPath = normalizePath(dirPath);
      const itemId = folderId(normalizedPath || '/');
      const loaded = Boolean(cache[normalizedPath]);
      const isLoading = loadingPaths.has(normalizedPath);
      const isBusy = busyPaths.has(normalizedPath);
      const isExpanded = expanded.includes(itemId);
      const { folders, files } = getChildren(normalizedPath);
      const isEmptyLoaded =
        loaded && folders.length === 0 && files.length === 0;
      const isSelected =
        canSelectFolders && selectedNormalizedPath === normalizedPath;

      return (
        <TreeItem
          key={itemId}
          itemId={itemId}
          label={
            <Stack
              direction='row'
              alignItems='center'
              spacing={0.75}
              onContextMenu={event => openContextMenu(event, normalizedPath)}
              onDragOver={event => onDragOverFolder(event, normalizedPath)}
              onDragEnter={event => onDragOverFolder(event, normalizedPath)}
              onDragLeave={onDragLeaveFolder}
              onDrop={event => onDropToFolder(event, normalizedPath)}
              onClick={event => {
                event.stopPropagation();
                if (canSelectFolders) {
                  onSelect?.(normalizedPath, 'folder');
                }
              }}
              sx={{
                pl: isRoot ? 0.5 : 0.85,
                pr: isSelected && canSelectFolders ? 1.5 : 0.5,
                py: isRoot ? 0.75 : 0,
                width: '100%',
                cursor: canSelectFolders ? 'pointer' : 'default',
                outline:
                  dragHoverPath === normalizedPath
                    ? '1px dashed #9ca3af'
                    : 'none',
                '&:hover .folder-actions': showMutations
                  ? {
                      opacity: 1,
                      pointerEvents: 'auto',
                    }
                  : undefined,
              }}
            >
              {isRoot ? (
                <Box
                  component='img'
                  src={connectionMeta.iconSrc}
                  alt={connectionMeta.iconAlt}
                  sx={{ width: 18, height: 18, flexShrink: 0 }}
                />
              ) : (
                <FolderIcon
                  sx={{
                    fontSize: 16,
                    flexShrink: 0,
                    color: isExpanded ? '#c7d2fe' : '#dbe1ea',
                    '& path': {
                      stroke: isExpanded ? '#6f80f4' : '#97a4b5',
                      strokeWidth: 2,
                      paintOrder: 'stroke fill',
                    },
                  }}
                />
              )}
              <Stack
                spacing={0}
                sx={{
                  minWidth: 0,
                  flex: 1,
                  ...(isRoot
                    ? {
                        justifyContent: 'center',
                        gap: '1px',
                      }
                    : null),
                }}
              >
                <Typography
                  noWrap
                  title={label}
                  variant='body2'
                  sx={{
                    fontWeight: isRoot ? 600 : 500,
                    ...(isRoot
                      ? {
                          lineHeight: 1.05,
                        }
                      : null),
                  }}
                >
                  {label}
                </Typography>
                {isRoot && connectionMeta.hint ? (
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    noWrap
                    title={connectionMeta.hint}
                    sx={{ lineHeight: 1 }}
                  >
                    {connectionMeta.hint}
                  </Typography>
                ) : null}
              </Stack>
              {isLoading || isBusy ? (
                <CircularProgress size={14} sx={{ ml: 0.5 }} />
              ) : null}
              {isSelected ? (
                isRoot ? (
                  <CheckRoundedIcon
                    sx={{
                      ml: 0.5,
                      mr: 0.5,
                      fontSize: 16.5,
                      color: 'primary.main',
                      '& path': {
                        stroke: 'currentColor',
                        strokeWidth: 1.2,
                        paintOrder: 'stroke fill',
                      },
                    }}
                  />
                ) : (
                  <CheckRoundedIcon
                    sx={{
                      ml: 0.5,
                      mr: 0.5,
                      fontSize: 15.5,
                      color: 'primary.main',
                      '& path': {
                        stroke: 'currentColor',
                        strokeWidth: 1.2,
                        paintOrder: 'stroke fill',
                      },
                    }}
                  />
                )
              ) : null}

              {showMutations ? (
                <Stack
                  direction='row'
                  spacing={0.25}
                  className='folder-actions'
                  sx={{
                    ml: 'auto',
                    opacity: 0,
                    pointerEvents: 'none',
                    transition: 'opacity .15s',
                    flexShrink: 0,
                  }}
                  onClick={event => event.stopPropagation()}
                >
                  <Tooltip title='Обновить'>
                    <IconButton
                      size='small'
                      onClick={() => refreshPath(normalizedPath)}
                      disabled={isLoading}
                    >
                      <RefreshRoundedIcon fontSize='small' />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title='Загрузить файл'>
                    <IconButton
                      size='small'
                      onClick={() => {
                        setUploadTargetPath(normalizedPath);
                        requestAnimationFrame(() => {
                          fileInputRef.current?.click();
                        });
                      }}
                    >
                      <UploadFileRoundedIcon fontSize='small' />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title='Новая папка'>
                    <IconButton
                      size='small'
                      onClick={() => openCreateFolderDialog(normalizedPath)}
                      disabled={isBusy}
                    >
                      <MdOutlineCreateNewFolder size={18} />
                    </IconButton>
                  </Tooltip>
                  {!isRoot ? (
                    <Tooltip title='Переименовать'>
                      <IconButton
                        size='small'
                        onClick={() =>
                          openRenameDialog(normalizedPath, 'folder')
                        }
                      >
                        <DriveFileRenameOutlineRoundedIcon fontSize='small' />
                      </IconButton>
                    </Tooltip>
                  ) : null}
                  {!isRoot ? (
                    <Tooltip title='Удалить папку'>
                      <IconButton
                        size='small'
                        color='error'
                        onClick={() => void handleDeleteFolder(normalizedPath)}
                      >
                        <DeleteOutlineRoundedIcon fontSize='small' />
                      </IconButton>
                    </Tooltip>
                  ) : null}
                </Stack>
              ) : null}
            </Stack>
          }
          sx={{
            '& > .MuiTreeItem-content': {
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              minHeight: rowMinHeight,
              paddingRight: `${TREE_ITEM_SURFACE_INSET_PX}px`,
              ...(isRoot
                ? {
                    paddingLeft: `${TREE_ITEM_SURFACE_INSET_PX}px !important`,
                    paddingRight: `${TREE_ITEM_SURFACE_INSET_PX}px !important`,
                  }
                : null),
              py: rowVerticalPadding,
              borderRadius: '7px',
              position: 'relative',
              zIndex: 0,
              ...(isSelected && canSelectFolders
                ? {
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: TREE_ITEM_SURFACE_INSET_PX,
                      right: TREE_ITEM_SURFACE_INSET_PX,
                      borderRadius: '7px',
                      backgroundColor: alpha('#4f46e5', 0.1),
                      border: `1px solid ${alpha('#4f46e5', 0.2)}`,
                      zIndex: 0,
                    },
                  }
                : null),
              ...(!isSelected && canSelectFolders
                ? {
                    '&:hover::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: TREE_ITEM_SURFACE_INSET_PX,
                      right: TREE_ITEM_SURFACE_INSET_PX,
                      borderRadius: '7px',
                      backgroundColor: alpha('#4f46e5', 0.06),
                      border: `1px solid ${alpha('#4f46e5', 0.12)}`,
                      zIndex: 0,
                    },
                  }
                : null),
            },
            '& > .MuiTreeItem-content.Mui-selected': {
              borderRadius: '7px',
              backgroundColor: 'transparent !important',
              border: 'none',
            },
            '& > .MuiTreeItem-content.Mui-focused': {
              borderRadius: '7px',
              backgroundColor: 'transparent !important',
            },
            '& > .MuiTreeItem-content.Mui-selected.Mui-focused': {
              borderRadius: '7px',
              backgroundColor: 'transparent !important',
              border: 'none',
            },
            '& > .MuiTreeItem-content.Mui-selected:hover': {
              borderRadius: '7px',
              backgroundColor: 'transparent !important',
            },
            '& > .MuiTreeItem-content .MuiTreeItem-label': {
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              position: 'relative',
              zIndex: 1,
            },
            '& > .MuiTreeItem-content .MuiTreeItem-iconContainer': {
              position: 'relative',
              zIndex: 1,
            },
            '& > .MuiTreeItem-content:hover': {
              backgroundColor: 'transparent !important',
            },
            ...(isRoot
              ? {
                  '& > .MuiTreeItem-content .MuiTreeItem-iconContainer': {
                    visibility: 'hidden',
                    pointerEvents: 'none',
                    width: 0,
                    minWidth: 0,
                    marginRight: 0,
                  },
                }
              : {}),
          }}
        >
          {!loaded && !isLoading ? (
            <TreeItem
              itemId={`${itemId}::placeholder`}
              label=''
              sx={{ display: 'none' }}
            />
          ) : null}

          {isLoading ? (
            <TreeItem
              itemId={`${itemId}::loading`}
              label={
                <Stack direction='row' alignItems='center' spacing={0.5}>
                  <CircularProgress size={12} />
                  <Typography variant='caption' color='text.secondary'>
                    Загрузка…
                  </Typography>
                </Stack>
              }
              disabled
            />
          ) : null}

          {isEmptyLoaded ? (
            <TreeItem
              itemId={`${itemId}::empty`}
              label={
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ fontStyle: 'italic' }}
                >
                  Пустая папка
                </Typography>
              }
              disabled
            />
          ) : null}

          {loaded
            ? folders.map(folder => renderFolder(folder.name, folder.path))
            : null}

          {loaded
            ? files.map(file => {
                const fileItemId = fileId(file.path);
                const allowed = isFileAllowed(file.name);
                const isSelectedFile =
                  canSelectFiles &&
                  selectedNormalizedPath === normalizePath(file.path);

                return (
                  <TreeItem
                    key={fileItemId}
                    itemId={fileItemId}
                    label={
                      <Stack
                        direction='row'
                        alignItems='center'
                        sx={{
                          width: '100%',
                          pl: 0.85,
                          pr: isSelectedFile ? 1.5 : 0.5,
                          opacity: allowed ? 1 : 0.6,
                          cursor:
                            canSelectFiles && allowed ? 'pointer' : 'default',
                          '&:hover .file-actions': showMutations
                            ? {
                                opacity: 1,
                                pointerEvents: 'auto',
                              }
                            : undefined,
                        }}
                        onClick={event => {
                          event.stopPropagation();
                          if (canSelectFiles && allowed) {
                            onSelect?.(normalizePath(file.path), 'file');
                          }
                        }}
                        onDoubleClick={event => {
                          event.stopPropagation();
                          void handleFileOpen(file.path);
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            minWidth: 0,
                            flex: 1,
                            overflow: 'hidden',
                          }}
                        >
                          <FileExtensionBadge filename={file.name} />
                          <Typography
                            noWrap
                            title={file.name}
                            variant='body2'
                            sx={{ fontWeight: 500 }}
                          >
                            {file.name}
                          </Typography>
                        </Box>
                        {isSelectedFile ? (
                          <CheckRoundedIcon
                            sx={{
                              ml: 0.5,
                              mr: 0.5,
                              fontSize: 15.5,
                              color: 'primary.main',
                              '& path': {
                                stroke: 'currentColor',
                                strokeWidth: 1.2,
                                paintOrder: 'stroke fill',
                              },
                            }}
                          />
                        ) : null}
                        {showMutations ? (
                          <Stack
                            direction='row'
                            spacing={0.25}
                            className='file-actions'
                            sx={{
                              ml: 'auto',
                              opacity: 0,
                              pointerEvents: 'none',
                              transition: 'opacity .15s',
                              flexShrink: 0,
                            }}
                            onClick={event => event.stopPropagation()}
                          >
                            <Tooltip title='Переименовать'>
                              <IconButton
                                size='small'
                                onClick={() =>
                                  openRenameDialog(
                                    normalizePath(file.path),
                                    'file'
                                  )
                                }
                              >
                                <DriveFileRenameOutlineRoundedIcon fontSize='small' />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Удалить файл'>
                              <IconButton
                                size='small'
                                color='error'
                                onClick={() => void handleDeleteFile(file.path)}
                              >
                                <DeleteOutlineRoundedIcon fontSize='small' />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        ) : null}
                      </Stack>
                    }
                    sx={{
                      '& > .MuiTreeItem-content': {
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        minHeight: rowMinHeight,
                        paddingRight: `${TREE_ITEM_SURFACE_INSET_PX}px`,
                        py: rowVerticalPadding,
                        borderRadius: '7px',
                        position: 'relative',
                        zIndex: 0,
                        ...(isSelectedFile
                          ? {
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                bottom: 0,
                                left: TREE_ITEM_SURFACE_INSET_PX,
                                right: TREE_ITEM_SURFACE_INSET_PX,
                                borderRadius: '7px',
                                backgroundColor: alpha('#4f46e5', 0.1),
                                border: `1px solid ${alpha('#4f46e5', 0.2)}`,
                                zIndex: 0,
                              },
                            }
                          : null),
                        ...(!isSelectedFile && canSelectFiles && allowed
                          ? {
                              '&:hover::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                bottom: 0,
                                left: TREE_ITEM_SURFACE_INSET_PX,
                                right: TREE_ITEM_SURFACE_INSET_PX,
                                borderRadius: '7px',
                                backgroundColor: alpha('#4f46e5', 0.06),
                                border: `1px solid ${alpha('#4f46e5', 0.12)}`,
                                zIndex: 0,
                              },
                            }
                          : null),
                      },
                      '& > .MuiTreeItem-content:hover': {
                        backgroundColor: 'transparent !important',
                      },
                      '& > .MuiTreeItem-content.Mui-selected': {
                        borderRadius: '7px',
                        backgroundColor: 'transparent !important',
                        border: 'none',
                      },
                      '& > .MuiTreeItem-content.Mui-focused': {
                        borderRadius: '7px',
                        backgroundColor: 'transparent !important',
                      },
                      '& > .MuiTreeItem-content.Mui-selected.Mui-focused': {
                        borderRadius: '7px',
                        backgroundColor: 'transparent !important',
                        border: 'none',
                      },
                      '& > .MuiTreeItem-content.Mui-selected:hover': {
                        borderRadius: '7px',
                        backgroundColor: 'transparent !important',
                      },
                      '& > .MuiTreeItem-content .MuiTreeItem-label': {
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        position: 'relative',
                        zIndex: 1,
                      },
                    }}
                  />
                );
              })
            : null}
        </TreeItem>
      );
    },
    [
      busyPaths,
      cache,
      canSelectFiles,
      canSelectFolders,
      connectionMeta.hint,
      connectionMeta.iconAlt,
      connectionMeta.iconSrc,
      dragHoverPath,
      expanded,
      getChildren,
      handleDeleteFile,
      handleDeleteFolder,
      handleFileOpen,
      isFileAllowed,
      loadingPaths,
      onDragLeaveFolder,
      onDragOverFolder,
      onDropToFolder,
      onSelect,
      openContextMenu,
      openCreateFolderDialog,
      openRenameDialog,
      refreshPath,
      rowMinHeight,
      rowVerticalPadding,
      selectedNormalizedPath,
      showMutations,
    ]
  );

  const { hasLoadedAnything, anySearchMatched } = useMemo(() => {
    const entries = Object.values(cache);
    const loaded = entries.length > 0;

    let raw = false;
    let searchMatched = false;

    for (const tree of entries) {
      if (!tree.nodes?.length) {
        continue;
      }

      raw = true;

      if (
        searchLC &&
        tree.nodes.some(node => node.name.toLowerCase().includes(searchLC))
      ) {
        searchMatched = true;
      }
    }

    if (!searchLC) {
      searchMatched = raw;
    }

    return {
      hasLoadedAnything: loaded,
      anySearchMatched: searchMatched,
    };
  }, [cache, searchLC]);

  return (
    <Box sx={{ height, display: 'flex', flexDirection: 'column' }}>
      <input
        ref={fileInputRef}
        type='file'
        hidden
        multiple
        onChange={onFileInputChange}
      />

      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <SimpleTreeView
          expandedItems={expanded}
          onExpandedItemsChange={onExpandedItemsChange}
          expansionTrigger='iconContainer'
          slots={{ expandIcon: ChevronRightIcon, collapseIcon: ExpandMoreIcon }}
          itemChildrenIndentation={24}
          sx={{
            '& .MuiTreeItem-root + .MuiTreeItem-root > .MuiTreeItem-content': {
              marginTop: rowGap,
            },
            '& .MuiTreeItem-groupTransition': {
              paddingTop: rowGap,
            },
            '& .MuiTreeItem-iconContainer': {
              width: 12,
              minWidth: 12,
              mr: 0.125,
              ml: 0,
              display: 'inline-flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexShrink: 0,
              color: '#9b9ba6',
            },
            '& .MuiTreeItem-iconContainer svg': {
              fontSize: 15,
            },
          }}
        >
          {renderFolder(connectionMeta.label, '', true)}
        </SimpleTreeView>

        {hasLoadedAnything && !anySearchMatched ? (
          <Typography
            variant='body2'
            color='text.secondary'
            align='center'
            sx={{ mt: 2 }}
          >
            {searchTerm ? emptySearchText : emptyFilesText}
          </Typography>
        ) : null}
      </Box>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={closeContextMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <MenuItem onClick={handleChooseFileFromMenu}>Загрузить файл…</MenuItem>
        <MenuItem
          onClick={() => {
            if (!menuFolderPath) {
              return;
            }

            closeContextMenu();
            openCreateFolderDialog(menuFolderPath);
          }}
        >
          Новая папка
        </MenuItem>
        {menuFolderPath ? (
          <MenuItem
            onClick={() => {
              closeContextMenu();
              refreshPath(menuFolderPath);
            }}
          >
            Обновить
          </MenuItem>
        ) : null}
        {menuFolderPath ? (
          <MenuItem
            onClick={() => {
              closeContextMenu();
              openRenameDialog(menuFolderPath, 'folder');
            }}
          >
            Переименовать
          </MenuItem>
        ) : null}
        {menuFolderPath ? (
          <MenuItem
            onClick={() => {
              closeContextMenu();
              void handleDeleteFolder(menuFolderPath);
            }}
          >
            Удалить папку
          </MenuItem>
        ) : null}
      </Menu>

      <StoragePathNameDialog
        open={Boolean(pendingCreateFolder)}
        title='Новая папка'
        description='Введите имя новой директории в текущем подключении.'
        label='Имя папки'
        confirmLabel='Создать'
        onClose={closeCreateFolderDialog}
        onConfirm={confirmCreateFolder}
        validate={validatePathName}
      />

      <StoragePathNameDialog
        open={Boolean(pendingRenamePath)}
        title={
          pendingRenamePath?.type === 'folder'
            ? 'Переименовать папку'
            : 'Переименовать файл'
        }
        description='Укажите новое имя без изменения родительского пути.'
        label='Новое имя'
        confirmLabel='Сохранить'
        initialValue={pendingRenamePath?.currentName ?? ''}
        onClose={closeRenameDialog}
        onConfirm={confirmRenamePath}
        validate={validatePathName}
      />
    </Box>
  );
});
