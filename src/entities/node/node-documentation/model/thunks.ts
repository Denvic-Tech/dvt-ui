import { createAppAsyncThunk } from '@/app/providers/store/helpers';

import { nodeDocumentationApi } from '../api';

import {
  buildNodeDocumentationRequestKey,
  type NodeDocumentationRequestParams,
} from './slice';

export const fetchNodeDocumentation = createAppAsyncThunk(
  'nodeDocumentation/fetch',
  async (params: NodeDocumentationRequestParams) => {
    const data = await nodeDocumentationApi.getNodeDocumentation(params);

    return {
      data,
      key: buildNodeDocumentationRequestKey(params),
      params,
    };
  }
);
