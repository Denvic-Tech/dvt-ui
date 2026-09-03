import {
  client,
  type McpTokenCreatedSchema,
  type McpTokenCreateSchema,
  type McpTokenReadSchema,
} from '@/shared/gatewayClient';

export const mcpTokenApi = {
  async list(): Promise<McpTokenReadSchema[]> {
    const response = await client.mcpTokens.get();
    return response.data.items;
  },

  async create(payload: McpTokenCreateSchema): Promise<McpTokenCreatedSchema> {
    const response = await client.mcpTokens.post({ body: payload });
    return response.data;
  },

  async revoke(tokenId: string): Promise<void> {
    await client.mcpTokens.tokenId(tokenId).delete();
  },
};
