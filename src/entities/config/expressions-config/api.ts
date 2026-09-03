import { client, ExpressionsConfig } from '@/shared/gatewayClient';

export const expressionsConfigAPI = {
  getExpressionsConfig: async (): Promise<ExpressionsConfig> => {
    const response = await client.config.expressions.get({});
    return response.data;
  },
};
