import { type ApiTokenCreate,client } from '@/shared/gatewayClient';
import { ApiError } from '@/shared/lib/errors';

export const apiKeyApi = {
  list: async () => {
    const response = await client.auth.apiTokens.get();
    if (!response.data.success)
      throw new ApiError({
        code: 'AUTH.TOKEN_ERROR',
        message: response.data.message ?? 'Error while user tokens fetch.',
        status: response.status,
      });
    if (!response.data.data)
      throw new ApiError({
        code: 'AUTH.TOKEN_ERROR',
        message: response.data.message ?? 'Error while fetching data.',
        status: response.status,
      });
    return response.data.data.tokens;
  },
  create: async (payload: ApiTokenCreate) => {
    const response = await client.auth.apiTokens.post({
      body: payload,
    });
    if (!response.data.success)
      throw new ApiError({
        code: 'AUTH.TOKEN_ERROR',
        message: response.data.message ?? 'Error while user token creation.',
        status: response.status,
      });
    if (!response.data.data)
      throw new ApiError({
        code: 'AUTH.TOKEN_ERROR',
        message: response.data.message ?? 'Error while user token creation.',
        status: response.status,
      });

    return response.data.data.token;
  },
  delete: async (tokenIdentifier: string): Promise<void> => {
    const response = await client.auth.apiTokens
      .tokenIdentifier(tokenIdentifier)
      .delete();
    if (!response.data.success)
      throw new ApiError({
        code: 'AUTH.TOKEN_ERROR',
        message: response.data.message ?? 'Error while user token deleting.',
        status: response.status,
      });
  },
};
