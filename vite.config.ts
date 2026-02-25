import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:8000';
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: 'intelligent-book-summarization-plat.vercel.app',
        proxy: {
          '/api': {
            target: backendUrl,
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path,
            configure: (proxy) => {
              proxy.on('error', (err) => {
                console.error('[Vite Proxy] Backend unreachable:', err.message);
              });
              proxy.on('proxyReq', (_proxyReq, req) => {
                console.log('[Vite Proxy] -->', req.method, req.url);
              });
            },
          },
        },
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
