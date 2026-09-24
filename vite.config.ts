import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import svgr from 'vite-plugin-svgr';

import { nodeIconsPlugin } from './plugins/node-icons';

// https://vitejs.dev/config/
export default defineConfig(({mode}) => {

    const env = loadEnv(mode, process.cwd(), '');
    const host = env.VITE_HOST || 'localhost';
    const parsedPort = parseInt(env.VITE_PORT ?? '', 10);
    const port = Number.isNaN(parsedPort) ? 5173 : parsedPort;

    return {
        plugins: [react(), tailwindcss(), svgr(), nodeIconsPlugin()],
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
    };
});
