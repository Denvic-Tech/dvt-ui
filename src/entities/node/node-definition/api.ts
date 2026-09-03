import { client } from '@/shared/gatewayClient';

export const nodeDefinitionApi = {
  getNodeDefinitions: async () => {
    const response = await client.nodes.get();
    return response.data;
  },
};
