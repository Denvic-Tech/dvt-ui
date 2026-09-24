import path from 'path';
import { defineConfig } from 'vitest/config';

import { nodeIconsPlugin } from './plugins/node-icons';

export default defineConfig({
  plugins: [nodeIconsPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'plugins/**/*.test.ts'],
    clearMocks: true,
    restoreMocks: true,
  },
});
