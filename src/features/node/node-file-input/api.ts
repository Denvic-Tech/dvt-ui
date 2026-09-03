import { client, type NodeFileInputResponse } from '@/shared/gatewayClient';

const buildNodeFileInputUrl = (
  projectID: string,
  nodeID: string,
  inputName: string
) =>
  `/projects/${encodeURIComponent(projectID)}/graph/nodes/${encodeURIComponent(nodeID)}/file-inputs/${encodeURIComponent(inputName)}`;

export const nodeFileInputApi = {
  upload: async (
    projectID: string,
    nodeID: string,
    inputName: string,
    file: File | Blob
  ) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await client.post({
      url: buildNodeFileInputUrl(projectID, nodeID, inputName),
      body: formData,
      silent: true,
    });

    return response.data as NodeFileInputResponse;
  },

  delete: async (
    projectID: string,
    nodeID: string,
    inputName: string,
    path: string
  ) => {
    const response = await client.delete({
      url: buildNodeFileInputUrl(projectID, nodeID, inputName),
      query: { path },
      silent: true,
    });

    return response.data as NodeFileInputResponse;
  },
};
