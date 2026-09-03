import type {
  UpdateResponseSchema,
  UpdateStatusSchema,
} from '@/shared/gatewayClient';
import { client } from '@/shared/gatewayClient';

export const systemUpdateApi = {
  run: async (version: string): Promise<UpdateResponseSchema> => {
    const response = await client.update.run.post({
      body: { version },
    });

    return response.data;
  },

  getStatus: async (logOffset: number): Promise<UpdateStatusSchema> => {
    const response = await client.update.status.get(
      {
        query: { log_offset: logOffset },
      },
      { silent: true }
    );

    return response.data;
  },
};
