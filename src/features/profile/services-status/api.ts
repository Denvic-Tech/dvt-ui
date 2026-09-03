import { client } from '@/shared/gatewayClient';

export const servicesStatusApi = {
  getServicesStatus: async () => {
    const response = await client.system.servicesStats.get();
    return response.data;
  },
};
