import { defineConfig } from '@hey-api/openapi-ts';

import nestedSdk from './plugins/openapi-ts/nested-sdk';

declare const process: any;

export default defineConfig({
  input: (process.env.VITE_API_BASE_URL ?? '') + '/openapi-core.json',
  output: {
    path: 'src/shared/gatewayClient/client.gen',
    indexFile: false,
  },
  plugins: [
    '@hey-api/client-axios',
    nestedSdk({
      includeToClient: true,
      excludePath: ['/internal/*'],
    }),
    'zod',
    {
      name: '@hey-api/sdk',
      validator: 'zod',
    },
    {
      name: 'zod',
      exportFromIndex: true,
      dates: {
        offset: true,
      },
      types: {
        infer: true
      },
    }
  ],
  logs: 'logs',
});
