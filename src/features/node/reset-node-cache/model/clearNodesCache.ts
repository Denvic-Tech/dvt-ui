import { createAppAsyncThunk } from '@/app/providers/store/helpers';

import { setNodeMetadataActuality } from '@/entities/node/node-metadata';
import { projectCacheApi } from '@/entities/project/project-cache';

import type { ClearProjectCacheResponse } from '@/shared/gatewayClient';
import { createUnknownError, toApiErrorPayload } from '@/shared/lib/errors';

export const clearNodesCache = createAppAsyncThunk<
  ClearProjectCacheResponse,
  { nodeIDs: string[] }
>(
  'cache/clearNodesCache',
  async ({ nodeIDs }, { getState, dispatch, rejectWithValue }) => {
    const state = getState();
    const projectID = state.projects.selectedProject?.id;

    if (!projectID) {
      return rejectWithValue(
        createUnknownError('Не удалось определить проект для очистки кэша нод')
      );
    }

    const normalizedNodeIDs = Array.from(
      new Set(
        nodeIDs.filter(nodeID => typeof nodeID === 'string' && nodeID.length)
      )
    );

    const response = await projectCacheApi.clear(projectID, normalizedNodeIDs);

    for (const nodeID of normalizedNodeIDs) {
      dispatch(setNodeMetadataActuality({ nodeID, actual: false }));
    }

    return response;
  },
  {
    mapUnknownError: ({ error }) =>
      toApiErrorPayload(error, 'Не удалось очистить кэш выбранных нод'),
  }
);
