import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { optimize } from 'svgo';
import type { Plugin, ResolvedConfig } from 'vite';

export interface IconSource {
  key: string;
  source: string;
}

export interface NodeIconSprite {
  svg: string;
  keys: string[];
  fileName: string;
}

const VIRTUAL_ID = 'virtual:node-icons';
const RESOLVED_ID = '\0' + VIRTUAL_ID;
const ICON_KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Build a standalone resource, never SVG markup embedded in application JS. */
export function buildNodeIconSprite(sources: IconSource[]): NodeIconSprite {
  const keys = new Set<string>();
  const symbols = [...sources]
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
    .map(({ key, source }) => {
      if (!ICON_KEY_PATTERN.test(key) || keys.has(key)) {
        throw new Error('Invalid or duplicate node icon key: ' + key);
      }
      keys.add(key);
      let converted = false;
      const result = optimize(source, {
        // Preserve the original source files and optimize only the derived resource.
        multipass: false,
        plugins: [
          'preset-default',
          {
            name: 'prefixIds',
            params: { prefix: 'node-' + key, delim: '__' },
          },
          {
            name: 'node-icon-symbol',
            fn: () => ({
              element: {
                enter(node, parent) {
                  if (parent.type !== 'root' || node.name !== 'svg') return;
                  if (!node.attributes['viewBox']) {
                    throw new Error('Node icon requires a viewBox: ' + key);
                  }
                  node.name = 'symbol';
                  node.attributes['id'] = 'node-' + key;
                  delete node.attributes['width'];
                  delete node.attributes['height'];
                  delete node.attributes['xmlns'];
                  converted = true;
                },
              },
            }),
          },
        ],
      });
      if (!converted) throw new Error('Node icon requires an SVG root: ' + key);
      return result.data;
    });
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg">' + symbols.join('') + '</svg>';
  const hash = createHash('sha256').update(svg).digest('hex').slice(0, 16);
  return {
    svg,
    keys: [...keys],
    fileName: 'assets/node-icons-' + hash + '.svg',
  };
}

export async function readNodeIconSources(
  directory: string
): Promise<IconSource[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(
    entries.map(async entry => {
      const filePath = path.join(directory, entry.name);
      if (entry.isDirectory()) return readNodeIconSources(filePath);
      if (!entry.isFile() || !entry.name.endsWith('.svg')) return [];
      return [
        {
          key: path.basename(entry.name, '.svg'),
          source: await readFile(filePath, 'utf8'),
        },
      ];
    })
  );
  return groups.flat();
}

function assetUrl(config: ResolvedConfig, fileName: string): string {
  // External <use> requires the UI origin even if other assets use a CDN base.
  const basePath = /^https?:\/\//.test(config.base)
    ? new URL(config.base).pathname
    : config.base;
  if (basePath === '' || basePath === './') return './' + fileName;
  return basePath.replace(/\/?$/, '/') + fileName;
}

export function nodeIconsPlugin(): Plugin {
  let config: ResolvedConfig;
  let directory: string;
  let sprite: NodeIconSprite;
  let assetReference: string | undefined;
  let rebuilding = Promise.resolve();

  async function rebuild() {
    sprite = buildNodeIconSprite(await readNodeIconSources(directory));
  }

  return {
    name: 'dvt-node-icons',
    configResolved(resolved) {
      config = resolved;
      directory = path.resolve(config.root, 'src/shared/assets/node-icons');
    },
    async buildStart() {
      await rebuild();
      if (config.command === 'build') {
        assetReference = this.emitFile({
          type: 'asset',
          fileName: sprite.fileName,
          source: sprite.svg,
        });
      }
    },
    resolveFileUrl({ referenceId, relativePath }) {
      if (referenceId !== assetReference) return undefined;
      if (config.base === '' || config.base === './') {
        return (
          'new URL(' + JSON.stringify(relativePath) + ', import.meta.url).href'
        );
      }
      return JSON.stringify(assetUrl(config, sprite.fileName));
    },
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
      return undefined;
    },
    load(id) {
      if (id !== RESOLVED_ID) return undefined;
      return (
        'export const spriteUrl = ' +
        (assetReference
          ? 'import.meta.ROLLUP_FILE_URL_' + assetReference
          : JSON.stringify(assetUrl(config, sprite.fileName))) +
        ';\nexport const iconKeys = ' +
        JSON.stringify(sprite.keys) +
        ';\n'
      );
    },
    configureServer(server) {
      server.watcher.add(directory);
      const onChange = (file: string) => {
        const relative = path.relative(directory, file);
        if (
          relative.startsWith('..') ||
          path.isAbsolute(relative) ||
          !file.endsWith('.svg')
        )
          return;
        rebuilding = rebuilding.then(async () => {
          try {
            await rebuild();
            const module = server.moduleGraph.getModuleById(RESOLVED_ID);
            if (module) server.moduleGraph.invalidateModule(module);
            server.ws.send({ type: 'full-reload' });
          } catch (error) {
            server.config.logger.error(String(error));
            server.ws.send({
              type: 'error',
              err: {
                message: String(error),
                stack: '',
                plugin: 'dvt-node-icons',
              },
            });
          }
        });
      };
      server.watcher.on('add', onChange);
      server.watcher.on('change', onChange);
      server.watcher.on('unlink', onChange);
      server.httpServer?.once('close', () => {
        server.watcher.off('add', onChange);
        server.watcher.off('change', onChange);
        server.watcher.off('unlink', onChange);
      });
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url ?? '').split('?')[0] ?? '';
        if (!/\/assets\/node-icons-[a-f0-9]+\.svg$/.test(pathname))
          return next();
        // Vite may already have stripped the configured base from req.url.
        if (!sprite || !pathname.endsWith('/' + sprite.fileName)) {
          res.statusCode = 404;
          res.end();
          return;
        }
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'no-cache');
        res.end(req.method === 'HEAD' ? undefined : sprite.svg);
      });
    },
  };
}
