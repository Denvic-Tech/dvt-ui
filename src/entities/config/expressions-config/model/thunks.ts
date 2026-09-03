import { createAppAsyncThunk } from '@/app/providers/store/helpers';

import type { ExpressionsConfig } from '@/shared/gatewayClient';

import { expressionsConfigAPI } from '../api';

export const fetchExpressionsConfig = createAppAsyncThunk<
  ExpressionsConfig,
  void
>('expressionsConfig/fetch', async () => {
  return expressionsConfigAPI.getExpressionsConfig();
});
