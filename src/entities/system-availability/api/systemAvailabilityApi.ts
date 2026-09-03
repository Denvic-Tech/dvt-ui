import type { SystemStateResponse } from '@/shared/gatewayClient';
import { client } from '@/shared/gatewayClient';

export const systemAvailabilityApi = {
  getState: async (): Promise<SystemStateResponse> => {
    const response = await client.system.state.get(undefined, { silent: true });

    return response.data;
  },
};
