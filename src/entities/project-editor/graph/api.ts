import {
  client,
  type GetGraphProjectsProjectIdGraphGetResponse,
} from '@/shared/gatewayClient';
import { ApiError } from '@/shared/lib/errors';

import { normalizeSerializedGraph } from './lib/serializedGraph.ts';

export interface GraphApiResponse {
  nodes: ReturnType<typeof normalizeSerializedGraph>['nodes'];
  edges: ReturnType<typeof normalizeSerializedGraph>['edges'];
  subgraphs: ReturnType<typeof normalizeSerializedGraph>['subgraphs'];
}

export const graphApi = {
  getGraph: async (projectID: string): Promise<GraphApiResponse> => {
    const response = await client.projects.projectId(projectID).graph.get();
    const data = response.data as GetGraphProjectsProjectIdGraphGetResponse;

    // Keep backward compatibility with older backends that return only [nodes, edges].
    if (!Array.isArray(data) || data.length < 2 || data.length > 3) {
      throw new ApiError({
        code: 'GRAPH:BAD_GRAPH_RESPONSE',
        message:
          "Response 'data' must be [nodes, edges] or [nodes, edges, subgraphs]",
      });
    }

    const [nodes = [], edges = [], subgraphs = []] = data;

    return normalizeSerializedGraph({
      nodes,
      edges,
      subgraphs,
    });
  },
};
