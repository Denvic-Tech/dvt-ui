import { client } from '@/shared/gatewayClient';

export type LoadExcelColumnsParams = {
  path: string;
  sheet_name?: string | null;
  header_row?: number;
  connection_id?: string | null;
  input_name?: string;
};

export type LoadExcelColumnsResponse = {
  columns: string[];
};

const buildExcelColumnsUrl = (projectID: string, nodeID: string) =>
  `/projects/${encodeURIComponent(projectID)}/graph/nodes/${encodeURIComponent(
    nodeID
  )}/excel-columns`;

export const loadExcelColumnsApi = {
  fetch: async (
    projectID: string,
    nodeID: string,
    params: LoadExcelColumnsParams
  ): Promise<LoadExcelColumnsResponse> => {
    const response = await client.post({
      url: buildExcelColumnsUrl(projectID, nodeID),
      body: params,
      silent: true,
    });

    return response.data as LoadExcelColumnsResponse;
  },
};
