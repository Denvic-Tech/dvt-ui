import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Paper, Stack, Typography } from '@mui/material';
import type { SimpleTreeViewProps } from '@mui/x-tree-view';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { FcFolder } from 'react-icons/fc';

import {
  FileStorageConnectionType,
  FileStorageFileNode,
  FileStorageFolderNode,
  type FileStorageListContext,
} from '@/entities/data/storage';
import { storageApi } from '@/entities/data/storage/api.ts';
import {
  fileId,
  folderId,
  joinPath,
  normalizePath,
} from '@/entities/data/storage/model/helpers';

import FTPLogo from '@/shared/assets/FTP-icon.svg';
import S3Logo from '@/shared/assets/S3-icon.svg';
import SFTPLogo from '@/shared/assets/SFTP-icon.svg';
import type { UserFileTreeSchema } from '@/shared/gatewayClient';

import { getFileIconElement } from '../fileTree.tsx';

type DirCache = Record<string, UserFileTreeSchema>;

const EMPTY_FOLDERS: FileStorageFolderNode[] = [];
const EMPTY_FILES: FileStorageFileNode[] = [];

export type FileStorageTreePickerRef = {
  refreshAll: () => void;
  openPath: (path: string, select?: boolean) => void;
};

export interface FileStorageTreePickerProps {
  connectionID: string;
  connectionName?: string | undefined;
  connectionType?: FileStorageConnectionType | undefined;
  connectionContext?: FileStorageListContext | null | undefined;
  rootHint?: string | null | undefined;
  mode: 'file' | 'folder' | 'file_or_folder';
  selected?: string | null | undefined;
  onSelect?: ((fullPath: string) => void) | undefined;
  filterFile?: ((name: string) => boolean) | undefined;
  allowedFileExts?: string[] | undefined;
  searchTerm?: string | undefined;
  height?: number | string | undefined;
  maxItems?: number | undefined;
}

const getRootIconSrc = (connectionType?: FileStorageConnectionType) => {
  if (connectionType === 's3') {
    return { src: S3Logo, alt: 'S3' };
  }
  if (connectionType === 'ftp') {
    return { src: FTPLogo, alt: 'FTP' };
  }
  if (connectionType === 'sftp') {
    return { src: SFTPLogo, alt: 'SFTP' };
  }
  return null;
};

export const FileStorageTreePicker = forwardRef<
  FileStorageTreePickerRef,
  FileStorageTreePickerProps
>(function FileStorageTreePicker(
  {
    connectionID,
    connectionName,
    connectionType,
    connectionContext,
    rootHint,
    mode,
    selected = null,
    onSelect,
    filterFile,
    allowedFileExts,
    searchTerm = '',
    height = 320,
    maxItems,
  },
  ref
) {
  const [expanded, setExpanded] = useState<string[]>([folderId('/')]);
  const [cache, setCache] = useState<DirCache>({});
  const [loadingPaths, setLoadingPaths] = useState<Set<string>>(new Set());

  const allowedExtsNorm = useMemo(
    () =>
      allowedFileExts?.map(ext => ext.replace(/^\./, '').toLowerCase()) ?? null,
    [allowedFileExts]
  );

  const isFileAllowedByExt = useCallback(
    (name: string) => {
      if (!allowedExtsNorm || allowedExtsNorm.length === 0) return true;
      const ext = name.split('.').pop()?.toLowerCase() || '';
      return allowedExtsNorm.includes(ext);
    },
    [allowedExtsNorm]
  );

  const isFileAllowed = useCallback(
    (name: string) => {
      if (mode === 'folder') return false;
      if (!isFileAllowedByExt(name)) return false;
      return filterFile ? filterFile(name) : true;
    },
    [filterFile, isFileAllowedByExt, mode]
  );

  const isKnownFile = useCallback(
    (fullPath: string) => {
      const normalized = normalizePath(fullPath);
      const parent = normalized.split('/').slice(0, -1).join('/');
      const name = normalized.split('/').pop() || '';
      const entry = cache[normalizePath(parent)];
      if (!entry) return false;
      return entry.nodes.some(
        node => node.type === 'file' && node.name === name
      );
    },
    [cache]
  );

  const isKnownFolder = useCallback(
    (fullPath: string) => {
      const normalized = normalizePath(fullPath);
      const parent = normalized.split('/').slice(0, -1).join('/');
      const name = normalized.split('/').pop() || '';
      const entry = cache[normalizePath(parent)];
      if (!entry) return false;
      return entry.nodes.some(
        node => node.type === 'folder' && node.name === name
      );
    },
    [cache]
  );

  const selectedId = useMemo(() => {
    if (!selected) return null;
    const normalized = normalizePath(selected);
    if (mode === 'folder') return folderId(normalized || '/');
    if (mode === 'file') return fileId(normalized);
    if (isKnownFile(normalized)) return fileId(normalized);
    return folderId(normalized || '/');
  }, [isKnownFile, mode, selected]);

  const loadPath = useCallback(
    async (path: string) => {
      const key = normalizePath(path);

      if (cache[key] || loadingPaths.has(key)) return;

      setLoadingPaths(prev => new Set(prev).add(key));

      try {
        const data = await storageApi.list(
          connectionID,
          path,
          maxItems,
          connectionContext
        );
        setCache(prev => ({ ...prev, [key]: data }));
      } catch (error) {
        console.error(`Failed to load path "${path}":`, error);
      } finally {
        setLoadingPaths(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [cache, connectionContext, connectionID, loadingPaths, maxItems]
  );

  useEffect(() => {
    setExpanded([folderId('/')]);
    setCache({});
    setLoadingPaths(new Set());
  }, [
    connectionContext?.bucket,
    connectionContext?.initial_directory,
    connectionContext?.prefix,
    connectionID,
  ]);

  useEffect(() => {
    void loadPath('/');
  }, [loadPath]);

  const filterBySearch = useCallback(
    (name: string) =>
      !searchTerm ||
      name.toLowerCase().includes(searchTerm.trim().toLowerCase()),
    [searchTerm]
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
        if (!filterBySearch(node.name)) return;

        if (node.type === 'folder') {
          folders.push(node);
          return;
        }

        if (node.type === 'file') {
          files.push(node);
        }
      });

      return { folders, files };
    },
    [cache, filterBySearch]
  );

  const onExpandedItemsChange: SimpleTreeViewProps<false>['onExpandedItemsChange'] =
    (_event, itemIds) => {
      const newlyExpanded = itemIds.filter(
        itemId => !expanded.includes(itemId)
      );
      setExpanded(itemIds);

      newlyExpanded.forEach(itemId => {
        if (!itemId.startsWith('dir:')) return;
        const rawPath = itemId.slice(4);
        const path = rawPath === '/' ? '' : normalizePath(rawPath);
        void loadPath(path);
      });
    };

  useImperativeHandle(
    ref,
    () => ({
      refreshAll() {
        const paths = new Set<string>();
        expanded
          .filter(itemId => itemId.startsWith('dir:'))
          .forEach(itemId => {
            const rawPath = itemId.slice(4);
            paths.add(rawPath === '/' ? '' : normalizePath(rawPath));
          });

        setCache({});
        setLoadingPaths(new Set());
        paths.forEach(path => {
          void loadPath(path);
        });
      },
      openPath(path, selectPath) {
        const normalized = normalizePath(path);
        const parts = normalized.split('/').filter(Boolean);
        const ids: string[] = [folderId('/')];
        let acc = normalizePath('/');

        for (const part of parts.slice(
          0,
          mode === 'file' ? -1 : parts.length
        )) {
          acc = joinPath(acc, part);
          ids.push(folderId(acc));
        }

        setExpanded(prev => Array.from(new Set([...prev, ...ids])));

        if (selectPath) {
          onSelect?.(normalized);
        }
      },
    }),
    [expanded, loadPath, mode, onSelect]
  );

  const handleSelectFolder = useCallback(
    (folderPath: string) => onSelect?.(normalizePath(folderPath)),
    [onSelect]
  );

  const handleSelectFile = useCallback(
    (fullPath: string) => onSelect?.(normalizePath(fullPath)),
    [onSelect]
  );

  const renderFolder = useCallback(
    (label: string, dirPath: string, isRoot = false) => {
      const id = folderId(dirPath || '/');
      const normalizedPath = normalizePath(dirPath);
      const isLoading = loadingPaths.has(normalizedPath);
      const loaded = Boolean(cache[normalizedPath]);

      const { folders, files } = getChildren(dirPath);
      const isEmptyLoaded =
        loaded && folders.length === 0 && files.length === 0;

      const isFolderSelectable = mode === 'folder' || mode === 'file_or_folder';
      const isSelected =
        (selectedId === id && isFolderSelectable) ||
        (mode === 'file_or_folder' &&
          selected &&
          normalizePath(selected) === normalizedPath &&
          isKnownFolder(normalizedPath));

      const rootIcon = getRootIconSrc(connectionType);

      return (
        <TreeItem
          key={id}
          itemId={id}
          label={
            <Stack
              direction='row'
              alignItems='center'
              spacing={0.75}
              sx={{
                px: 0.5,
                width: '100%',
                cursor: isFolderSelectable ? 'pointer' : 'default',
                fontWeight: isSelected ? 600 : 400,
              }}
              onClick={event => {
                event.stopPropagation();
                if (isFolderSelectable) {
                  handleSelectFolder(normalizedPath);
                }
              }}
            >
              {isRoot && rootIcon ? (
                <Box
                  component='img'
                  src={rootIcon.src}
                  alt={rootIcon.alt}
                  sx={{ width: 18, height: 18, flexShrink: 0 }}
                />
              ) : (
                <FcFolder size={18} />
              )}
              <Stack
                spacing={0}
                sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}
              >
                <Typography
                  variant='body2'
                  {...(isRoot ? { sx: { fontWeight: 500 } } : {})}
                  noWrap
                  title={label}
                >
                  {label}
                </Typography>
                {isRoot && rootHint ? (
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    noWrap
                    title={rootHint}
                  >
                    {rootHint}
                  </Typography>
                ) : null}
              </Stack>
              {isSelected ? (
                <CheckCircleOutlineIcon
                  color='success'
                  sx={{ ml: 'auto', fontSize: 16 }}
                />
              ) : null}
            </Stack>
          }
        >
          {!loaded && !isLoading ? (
            <TreeItem
              itemId={`${id}::placeholder`}
              label=''
              sx={{ display: 'none' }}
            />
          ) : null}

          {isLoading ? (
            <TreeItem
              itemId={`${id}::loading`}
              label={
                <Typography variant='body2' color='text.secondary'>
                  Загрузка…
                </Typography>
              }
              disabled
            />
          ) : null}

          {isEmptyLoaded ? (
            <TreeItem
              itemId={`${id}::empty`}
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
                const itemId = fileId(file.path);
                const allowed = isFileAllowed(file.name);
                const isSelectedFile =
                  selectedId === itemId ||
                  (mode === 'file_or_folder' &&
                    selected === file.path &&
                    isKnownFile(file.path));

                return (
                  <TreeItem
                    key={itemId}
                    itemId={itemId}
                    label={
                      <Stack
                        direction='row'
                        alignItems='center'
                        spacing={1}
                        sx={{
                          px: 0.5,
                          opacity: allowed ? 1 : 0.6,
                          cursor: allowed ? 'pointer' : 'default',
                          userSelect: 'none',
                          fontWeight: isSelectedFile ? 600 : 400,
                        }}
                        onClick={event => {
                          event.stopPropagation();
                          if (allowed) {
                            handleSelectFile(file.path);
                          }
                        }}
                      >
                        {getFileIconElement(file.name, 18)}
                        <Typography variant='body2' noWrap title={file.name}>
                          {file.name}
                        </Typography>
                        {isSelectedFile ? (
                          <CheckCircleOutlineIcon
                            color='success'
                            sx={{ ml: 'auto', fontSize: 16 }}
                          />
                        ) : null}
                      </Stack>
                    }
                  />
                );
              })
            : null}
        </TreeItem>
      );
    },
    [
      cache,
      connectionType,
      getChildren,
      handleSelectFile,
      handleSelectFolder,
      isFileAllowed,
      isKnownFile,
      isKnownFolder,
      loadingPaths,
      mode,
      rootHint,
      selected,
      selectedId,
    ]
  );

  const rootLabel = connectionName?.trim() || 'Мои файлы';

  return (
    <Paper variant='outlined' sx={{ p: 1, height }}>
      <SimpleTreeView
        expandedItems={expanded}
        onExpandedItemsChange={onExpandedItemsChange}
        expansionTrigger='iconContainer'
        slots={{ expandIcon: ChevronRightIcon, collapseIcon: ExpandMoreIcon }}
        itemChildrenIndentation={20}
        sx={{
          height: '100%',
          overflow: 'auto',
          '& .MuiTreeItem-iconContainer': {
            width: 0,
            mr: 0,
            ml: 0,
          },
        }}
      >
        {renderFolder(rootLabel, '/', true)}
      </SimpleTreeView>
    </Paper>
  );
});
