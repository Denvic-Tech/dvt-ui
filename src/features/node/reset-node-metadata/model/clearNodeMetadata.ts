import { createAppAsyncThunk } from '@/app/providers/store/helpers';

import { setNodeMetadataActuality } from '@/entities/node/node-metadata';
import { projectCacheApi } from '@/entities/project/project-cache';

import type { ClearProjectMetadataCacheResponse } from '@/shared/gatewayClient';
import { createUnknownError, toApiErrorPayload } from '@/shared/lib/errors';

export const clearNodeMetadata = createAppAsyncThunk<
  ClearProjectMetadataCacheResponse,
  { nodeID: string }
>(
  'nodeMetadata/invalidateNodeMetadata',
  async ({ nodeID }, { getState, dispatch, rejectWithValue }) => {
    const state = getState();
    const projectId = state.projects.selectedProject?.id;

    if (!projectId) {
      return rejectWithValue(
        createUnknownError('Не удалось определить проект для сброса метаданных')
      );
    }

    const data = await projectCacheApi.clearMetadata(projectId, [nodeID]);
    dispatch(setNodeMetadataActuality({ nodeID, actual: false }));
    return data;
  },
  {
    mapUnknownError: ({ error }) =>
      toApiErrorPayload(error, 'Не удалось сбросить метаданные выбранной ноды'),
  }
);
