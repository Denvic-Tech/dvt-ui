import { client } from '@/shared/gatewayClient';

export interface GetDataFrameDataOptions {
  projectID: string;
  nodeID: string;
  outputName: string;
  offset: number;
  limit: number;
}

export interface DownloadDataFrameCsvOptions {
  projectID: string;
  nodeID: string;
  outputName?: string;
}

export interface DownloadDataFrameCsvResponse {
  data: Blob;
  headers: Record<string, string | undefined>;
}

export const dataframeApi = {
  async getDataFrameData({
    projectID,
    nodeID,
    outputName,
    offset,
    limit,
  }: GetDataFrameDataOptions) {
    const response = await client.projects
      .projectId(projectID)
      .dataframe.nodeId(nodeID)
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

  async downloadDataFrameCsv({
    projectID,
    nodeID,
    outputName,
  }: DownloadDataFrameCsvOptions): Promise<DownloadDataFrameCsvResponse> {
    const response = await client.projects
      .projectId(projectID)
      .dataframe.nodeId(nodeID)
      .download.get(outputName ? { query: { output_name: outputName } } : {}, {
        responseType: 'blob',
      });

    return {
      data: response.data as Blob,
      headers: response.headers as Record<string, string | undefined>,
    };
  },
};
