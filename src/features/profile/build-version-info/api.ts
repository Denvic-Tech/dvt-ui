import { client } from '@/shared/gatewayClient';

export const buildVersionApi = {
  getBuildVersionInfo: async () => {
    const response = await client.system.version.get();
    return response.data;
  },
};
