import { createAppAsyncThunk } from '@/app/providers/store/helpers.ts';
import { client } from '@/shared/gatewayClient';

export const fetchNodeDefinitions = createAppAsyncThunk(
  'nodeDefinition/fetch',
  async () => {
    const response = await client.nodes.get();
    return response.data;
  }
);
