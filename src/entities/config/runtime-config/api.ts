import { client, type RuntimeConfig } from '@/shared/gatewayClient';

export const runtimeConfigAPI = {
  getRuntimeConfig: async (): Promise<RuntimeConfig> => {
    const response = await client.system.runtimeConfig.get(undefined, {
      silent: true,
    });

    return response.data;
  },
};
