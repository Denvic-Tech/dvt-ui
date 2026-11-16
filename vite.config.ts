import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {visualizer} from 'rollup-plugin-visualizer';
import {defineConfig, loadEnv, type PluginOption} from 'vite';
import svgr from 'vite-plugin-svgr';

import { nodeIconsPlugin } from './plugins/node-icons';

/**
 * Vendor grouping for stable, cacheable chunks. Rules:
 * - no catch-all "vendor" bucket: it would glue entry-only and editor-only
 *   libraries together and undo route-level splitting;
 * - monaco / elkjs stay unassigned: they are reached only through dynamic
 *   imports and must not be pinned to a static chunk;
 * - MUI core + emotion live in one chunk (they import each other through the
 *   styled engine), x-packages depend on it one-way so they can be separate;
 * - icon packs are left to Rollup: they tree-shake per icon.
 */
const manualChunks = (rawId: string): string | undefined => {
    const id = rawId.replace(/\\/g, '/');

    if (id.endsWith('.css')) {
        return undefined;
    }

    if (id.includes('/src/shared/gatewayClient/client.gen/')) {
        return 'gateway-client';
    }

    if (!id.includes('/node_modules/')) {
        return undefined;
    }

    // Match the package name right after node_modules/ so that, for example,
    // "@xyflow/react" is never mistaken for "react".
    const isPackage = (names: string[]) =>
        new RegExp(`/node_modules/(?:${names.join('|')})/`).test(id);

    if (isPackage(['monaco-editor', '@monaco-editor/[^/]+', 'elkjs'])) {
        return undefined;
    }

    if (
        isPackage([
            'react',
            'react-dom',
            'scheduler',
            'react-router',
            'react-router-dom',
            'use-sync-external-store',
            'react-helmet-async',
        ])
    ) {
        return 'react-vendor';
    }

    if (
        isPackage([
            '@mui/material',
            '@mui/system',
            '@mui/styled-engine',
            '@mui/utils',
            '@mui/private-theming',
            '@mui/types',
            '@emotion/[^/]+',
            '@popperjs/[^/]+',
            'stylis',
        ])
    ) {
        return 'mui';
    }

    if (isPackage(['@mui/x-date-pickers'])) {
        return 'mui-x-date-pickers';
    }

    if (isPackage(['@xyflow/[^/]+', 'zustand', 'd3-[a-z-]+'])) {
        return 'xyflow';
    }

    if (
        isPackage([
            '@reduxjs/[^/]+',
            'redux',
            'react-redux',
            'redux-persist',
            'immer',
            'reselect',
            'redux-thunk',
        ])
    ) {
        return 'redux';
    }

    if (isPackage(['zod'])) {
        return 'zod';
    }

    if (isPackage(['axios', '@hey-api/[^/]+'])) {
        return 'http';
    }

    return undefined;
};

// https://vitejs.dev/config/
export default defineConfig(({mode}) => {

    const env = loadEnv(mode, process.cwd(), '');
    const host = env.VITE_HOST || 'localhost';
    const parsedPort = parseInt(env.VITE_PORT ?? '', 10);
    const port = Number.isNaN(parsedPort) ? 5173 : parsedPort;
    const apiOrigin = (() => {
        try {
            return env.VITE_API_BASE_URL ? new URL(env.VITE_API_BASE_URL).origin : '';
        } catch {
            return '';
        }
    })();

    const plugins: PluginOption[] = [react(), tailwindcss(), svgr(), nodeIconsPlugin()];

    // ANALYZE=1 npm run build -> dist/stats.html with a treemap of every chunk.
    if (process.env.ANALYZE) {
        plugins.push(
            visualizer({
                filename: 'dist/stats.html',
                gzipSize: true,
                brotliSize: false,
                template: 'treemap',
            })
        );
    }

    return {
        plugins,
        envPrefix: ['VITE_', 'INACTIVE_'],

        resolve: {
            alias: {

                '@': path.resolve(__dirname, 'src'),
            },
        },

        server: {
            host,
            port,
        },

        // `vite preview` serves the production bundle, which talks to
        // `${origin}/api`; forward that (and websockets) to the backend from
        // VITE_API_BASE_URL so the built app can be smoke-tested locally.
        preview: {
            proxy: apiOrigin
                ? {
                    '/api': { target: apiOrigin, changeOrigin: true },
                    '/ws': { target: apiOrigin, changeOrigin: true, ws: true },
                }
                : undefined,
        },

        build: {
            // Reporting threshold only. gateway-client (generated SDK + zod
            // schemas) is legitimately large and needed from startup.
            chunkSizeWarningLimit: 1600,
            rollupOptions: {
                output: {
                    manualChunks,
                },
            },
        },
    };
});
