import { useCallback } from 'react';

import { useAppDispatch } from '@/app/providers/store/hooks.ts';

import {
  clearProjectCache,
  clearProjectDataCache,
  clearProjectMetadataCache,
  type ClearProjectCachePayload,
  type ClearProjectDataCachePayload,
  type ClearProjectMetadataCachePayload,
} from './thunks.ts';

type ClearCacheOptions = Omit<ClearProjectCachePayload, 'projectID'>;
type ClearDataCacheOptions = Omit<ClearProjectDataCachePayload, 'projectID'>;
type ClearMetadataCacheOptions = Omit<
  ClearProjectMetadataCachePayload,
  'projectID'
>;

type EnsureProjectID = (
  projectID: string | null | undefined,
  action: string
) => asserts projectID is string;

const ensureProjectID: EnsureProjectID = (projectID, action) => {
  if (!projectID) {
    throw new Error(`No ProjectID for '${action}'`);
  }
};

export const useProjectCache = (projectID: string | null | undefined) => {
  const dispatch = useAppDispatch();

  const clearCache = useCallback(
    (options?: ClearCacheOptions) => {
      ensureProjectID(projectID, 'clearCache');
      const { nodeIDs = null, sendMetadataTask = true } = options ?? {};
      return dispatch(
        clearProjectCache({ projectID, nodeIDs, sendMetadataTask })
      ).unwrap();
    },
    [dispatch, projectID]
  );

  const clearDataCache = useCallback(
    (options?: ClearDataCacheOptions) => {
      ensureProjectID(projectID, 'clearDataCache');
      const { nodeIDs = null } = options ?? {};
      return dispatch(clearProjectDataCache({ projectID, nodeIDs })).unwrap();
    },
    [dispatch, projectID]
  );

  const clearMetadataCache = useCallback(
    (options?: ClearMetadataCacheOptions) => {
      ensureProjectID(projectID, 'clearMetadataCache');
      const { nodeIDs = null, sendMetadataTask = true } = options ?? {};
      return dispatch(
        clearProjectMetadataCache({ projectID, nodeIDs, sendMetadataTask })
      ).unwrap();
    },
    [dispatch, projectID]
  );

  return {
    clearCache,
    clearDataCache,
    clearMetadataCache,
  } as const;
};
