import {defineConfig, loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import svgr from 'vite-plugin-svgr';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({mode}) => {
    // eslint-disable-next-line no-undef
    const env = loadEnv(mode, process.cwd(), '');
    const host = env.VITE_HOST || 'localhost';
    const parsedPort = parseInt(env.VITE_PORT ?? '', 10);
    const port = Number.isNaN(parsedPort) ? 5173 : parsedPort;

    return {
        plugins: [react(), tailwindcss(), svgr()],
        envPrefix: ['VITE_', 'INACTIVE_'],

        resolve: {
            alias: {
                // eslint-disable-next-line no-undef
                '@': path.resolve(__dirname, 'src'),
            },
        },

        server: {
            host,
            port,
        },
    };
});
