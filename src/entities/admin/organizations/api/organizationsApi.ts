import { client, type OrganizationReadSchema } from '@/shared/gatewayClient';

export const organizationsApi = {
  async getOrganizations(): Promise<OrganizationReadSchema[]> {
    const response = await client.organizations.get();
    return response.data;
  },
};
