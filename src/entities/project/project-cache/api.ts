import type {
  ClearProjectCacheResponse,
  ClearProjectDataCacheResponse,
  ClearProjectMetadataCacheResponse,
} from '@/shared/gatewayClient';
import { client } from '@/shared/gatewayClient';

export const projectCacheApi = {
  clear: async (
    projectID: string,
    nodeIDs: string[] | null = null,
    sendMetadataTask: boolean = true
  ): Promise<ClearProjectCacheResponse> => {
    const response = await client.projects
      .projectId(projectID)
      .cache.clear.post(
        {
          body: {
            node_ids: nodeIDs,
            send_metadata_task: sendMetadataTask,
          },
        },
        { silent: true }
      );

    return response.data;
  },

  clearData: async (
    projectID: string,
    nodeIDs: string[] | null = null
  ): Promise<ClearProjectDataCacheResponse> => {
    const response = await client.projects
      .projectId(projectID)
      .cache.clear.data.post({
        body: {
          node_ids: nodeIDs,
        },
      });

    return response.data;
  },

  clearMetadata: async (
    projectID: string,
    nodeIDs: string[] | null = null,
    sendMetadataTask: boolean = true
  ): Promise<ClearProjectMetadataCacheResponse> => {
    const response = await client.projects
      .projectId(projectID)
      .cache.clear.metadata.post({
        body: {
          node_ids: nodeIDs,
          send_metadata_task: sendMetadataTask,
        },
      });

    return response.data;
  },
};
