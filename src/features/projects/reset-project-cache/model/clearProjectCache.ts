import { createAppAsyncThunk } from '@/app/providers/store/helpers';

import { clearDataFrameCache } from '@/entities/data/dataframe';
import { clearJsonDataCache } from '@/entities/data/json-data';
import { nodeDataFrameViewerActions } from '@/entities/node/node-dataframe-viewer';
import { nodeJsonViewerActions } from '@/entities/node/node-json-viewer';
import { nodeMetaViewerActions } from '@/entities/node/node-meta-viewer';
import { resetNodesMetadata } from '@/entities/node/node-metadata';
import { projectCacheApi } from '@/entities/project/project-cache/api.ts';

import type { CommonResponse } from '@/shared/gatewayClient';
import { createUnknownError, toApiErrorPayload } from '@/shared/lib/errors';

export const clearProjectCache = createAppAsyncThunk<CommonResponse, void>(
  'cache/clearProjectCache',
  async (_: void, { dispatch, getState, rejectWithValue }) => {
    const state = getState();
    const projectId = state.projects.selectedProject?.id;

    if (!projectId) {
      return rejectWithValue(
        createUnknownError('Не удалось определить проект для очистки кэша')
      );
    }

    const response = await projectCacheApi.clear(projectId);

    dispatch(clearDataFrameCache());
    dispatch(clearJsonDataCache());
    dispatch(resetNodesMetadata());
    dispatch(nodeDataFrameViewerActions.close());
    dispatch(nodeJsonViewerActions.close());
    dispatch(nodeMetaViewerActions.close());

    return response;
  },
  {
    mapUnknownError: ({ error }) =>
      toApiErrorPayload(error, 'Не удалось очистить кэш проекта'),
  }
);
