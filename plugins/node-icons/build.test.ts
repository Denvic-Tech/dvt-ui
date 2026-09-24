// @vitest-environment node
import path from 'node:path';

import { build } from 'vite';
import { describe, expect, it } from 'vitest';

import { nodeIconsPlugin } from './index';

describe('node icon production bundle', () => {
  it.each(['/', '/dvt/', './'])(
    'emits one external asset and supports base %s',
    async base => {
      const result = await build({
        configFile: false,
        root: path.resolve('.'),
        base,
        logLevel: 'silent',
        plugins: [
          nodeIconsPlugin(),
          {
            name: 'icon-test-entry',
            resolveId(id) {
              if (id === 'icon-test-entry') return id;
              return undefined;
            },
            load(id) {
              if (id === 'icon-test-entry') {
                return 'import { spriteUrl, iconKeys } from "virtual:node-icons"; console.log(spriteUrl, iconKeys);';
              }
              return undefined;
            },
          },
        ],
        build: {
          write: false,
          minify: false,
          rollupOptions: { input: 'icon-test-entry' },
        },
      });
      if (!('output' in result))
        throw new Error('Expected a single Rollup output');
      const assets = result.output.filter(item => item.type === 'asset');
      const chunk = result.output.find(item => item.type === 'chunk');
      expect(assets).toHaveLength(1);
      expect(assets[0]!.fileName).toMatch(
        /^assets\/node-icons-[a-f0-9]+\.svg$/
      );
      if (!chunk || chunk.type !== 'chunk') throw new Error('Missing JS chunk');
      expect(chunk.code).not.toContain('<symbol');
      expect(chunk.code).not.toContain('data:image');
      expect(chunk.code).toContain('table-from-db');
      if (base === './') {
        expect(chunk.code).toContain('new URL(');
        expect(chunk.code).toContain('import.meta.url');
      } else {
        expect(chunk.code).toContain(base + assets[0]!.fileName);
      }
    }
  );
});
