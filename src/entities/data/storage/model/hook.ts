import { useCallback, useMemo } from 'react';

import type { RootState } from '@/app/providers/store';
import { useAppDispatch, useAppSelector } from '@/app/providers/store/hooks.ts';

import { storageApi } from '../api.ts';

import {
  makeSelectStorageNodesByConnectionID,
  selectStorageLoading,
  selectStorageNodesMap,
} from './selectors.ts';
import {
  clearStorageState,
  createFolder,
  type CreateFolderArgs,
  deleteFiles,
  type DeleteFilesArgs,
  deleteFolder,
  type DeleteFolderArgs,
  fetchDownloadPresign,
  type FetchDownloadPresignArgs,
  fetchStorageList,
  type FetchStorageListArgs,
  fetchUploadPresign,
  type FetchUploadPresignArgs,
  movePath,
  type MovePathArgs,
  renamePath,
  type RenamePathArgs,
} from './slice.ts';

const selectFallbackStorageNodes = (state: RootState) => {
  const nodesMap = selectStorageNodesMap(state);
  const firstKey = Object.keys(nodesMap)[0];
  return firstKey ? nodesMap[firstKey] : null;
};

export const useStorage = (connectionID?: string) => {
  const dispatch = useAppDispatch();

  const storageNodesSelector = useMemo(() => {
    if (!connectionID) {
      return selectFallbackStorageNodes;
    }
    return makeSelectStorageNodesByConnectionID(connectionID);
  }, [connectionID]);

  const storageNodes = useAppSelector(storageNodesSelector);
  const storageLoading = useAppSelector(selectStorageLoading);

  const requestUploadPresign = useCallback(
    (...args: FetchUploadPresignArgs) =>
      dispatch(fetchUploadPresign(args)).unwrap(),
    [dispatch]
  );

  const requestDownloadPresign = useCallback(
    (...args: FetchDownloadPresignArgs) =>
      dispatch(fetchDownloadPresign(args)).unwrap(),
    [dispatch]
  );

  const loadStorageTree = useCallback(
    (...args: FetchStorageListArgs) =>
      dispatch(fetchStorageList(args)).unwrap(),
    [dispatch]
  );

  const createStorageFolder = useCallback(
    (...args: CreateFolderArgs) => dispatch(createFolder(args)).unwrap(),
    [dispatch]
  );

  const removeStorageFolder = useCallback(
    (...args: DeleteFolderArgs) => dispatch(deleteFolder(args)).unwrap(),
    [dispatch]
  );

  const removeStorageFiles = useCallback(
    (...args: DeleteFilesArgs) => dispatch(deleteFiles(args)).unwrap(),
    [dispatch]
  );

  const renameStoragePath = useCallback(
    (...args: RenamePathArgs) => dispatch(renamePath(args)).unwrap(),
    [dispatch]
  );

  const moveStoragePath = useCallback(
    (...args: MovePathArgs) => dispatch(movePath(args)).unwrap(),
    [dispatch]
  );

  const uploadStorageFile = useCallback(
    (...args: Parameters<typeof storageApi.uploadFile>) =>
      storageApi.uploadFile(...args),
    []
  );

  const resetStorage = useCallback(() => {
    dispatch(clearStorageState());
  }, [dispatch]);

  return {
    storageNodes,
    storageLoading,
    requestUploadPresign,
    requestDownloadPresign,
    loadStorageTree,
    createStorageFolder,
    removeStorageFolder,
    removeStorageFiles,
    renameStoragePath,
    moveStoragePath,
    uploadStorageFile,
    resetStorage,
  } as const;
};
