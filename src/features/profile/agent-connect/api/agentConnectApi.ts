import { client, type ConnectLinkCreateSchema } from '@/shared/gatewayClient';

export type AgentConnectLink = {
  url: string;
  expiresAt: string;
};

export const agentConnectApi = {
  async createLink(
    payload: ConnectLinkCreateSchema
  ): Promise<AgentConnectLink> {
    const response = await client.agents.connect.post({ body: payload });

    return {
      url: response.data.connect_url,
      expiresAt: response.data.expires_at,
    };
  },
};
