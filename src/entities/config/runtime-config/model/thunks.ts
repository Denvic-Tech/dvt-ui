import { createAppAsyncThunk } from '@/app/providers/store/helpers';

import type { RuntimeConfig } from '@/shared/gatewayClient';

import { runtimeConfigAPI } from '../api';

export const fetchRuntimeConfig = createAppAsyncThunk<RuntimeConfig, void>(
  'runtimeConfig/fetch',
  async () => {
    return runtimeConfigAPI.getRuntimeConfig();
  }
);
