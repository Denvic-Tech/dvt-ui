import { client } from '@/shared/gatewayClient';

export interface GetJsonDataOptions {
  projectID: string;
  nodeID: string;
  outputName: string;
  offset: number;
  limit: number;
}

export const jsonDataApi = {
  async getJsonData({ projectID, nodeID, outputName, offset, limit }: GetJsonDataOptions) {
    const response = await client.projects
      .projectId(projectID)
      .json.nodeId(nodeID)
      .get(
        {
          query: {
            output_name: outputName,
            offset,
            limit,
          },
        },
        { silent: true }
      );

    return response.data;
  },
};

