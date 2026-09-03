import { definePluginConfig } from '@hey-api/openapi-ts';

import { handler } from './plugin';
import type { NestedSdkPlugin } from './types';

export const defaultConfig: NestedSdkPlugin['Config'] = {
  config: {
    excludePath: [],
    includeToClient: false,
  },
  handler,
  name: 'nested-sdk',
  output: 'client.nested',
};

export const defineConfig = definePluginConfig(defaultConfig);
