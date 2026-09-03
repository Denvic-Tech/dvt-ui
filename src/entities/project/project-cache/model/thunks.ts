import type {
  ClearProjectCacheResponse,
  ClearProjectDataCacheResponse,
  ClearProjectMetadataCacheResponse,
} from '@/shared/gatewayClient';
import { createAppAsyncThunk } from '@/app/providers/store/helpers.ts';

import { projectCacheApi } from '../api.ts';

export type ClearProjectCachePayload = {
  projectID: string;
  nodeIDs?: string[] | null;
  sendMetadataTask?: boolean;
};

export type ClearProjectDataCachePayload = {
  projectID: string;
  nodeIDs?: string[] | null;
};

export type ClearProjectMetadataCachePayload = {
  projectID: string;
  nodeIDs?: string[] | null;
  sendMetadataTask?: boolean;
};

export const clearProjectCache = createAppAsyncThunk<
  ClearProjectCacheResponse,
  ClearProjectCachePayload
>('projectCache/clear', async payload => {
  const { projectID, nodeIDs = null, sendMetadataTask = true } = payload;
  return await projectCacheApi.clear(projectID, nodeIDs, sendMetadataTask);
});

export const clearProjectDataCache = createAppAsyncThunk<
  ClearProjectDataCacheResponse,
  ClearProjectDataCachePayload
>('projectCache/clearData', async payload => {
  const { projectID, nodeIDs = null } = payload;
  return await projectCacheApi.clearData(projectID, nodeIDs);
});

export const clearProjectMetadataCache = createAppAsyncThunk<
  ClearProjectMetadataCacheResponse,
  ClearProjectMetadataCachePayload
>('projectCache/clearMetadata', async payload => {
  const { projectID, nodeIDs = null, sendMetadataTask = true } = payload;
  return await projectCacheApi.clearMetadata(
    projectID,
    nodeIDs,
    sendMetadataTask
  );
});
