import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:8000';

  return {
    plugins: [react()],

    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            // Suppress noisy ECONNREFUSED errors when backend is still starting
            proxy.on('error', (err, _req, res) => {
              // Silently handle connection refused — frontend health polling handles retries
              if (res && typeof (res as any).writeHead === 'function' && !(res as any).headersSent) {
                (res as any).writeHead(502, { 'Content-Type': 'application/json' });
                (res as any).end(JSON.stringify({ detail: 'Backend starting up...' }));
              }
            });
            // Remove default error logging from http-proxy
            proxy.removeAllListeners('proxyReq');
          },
        },
      },
    },

    build: {
      target: 'es2020',
      minify: 'esbuild',
      cssMinify: true,
      sourcemap: false,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'icons': ['lucide-react'],
          },
        },
      },
    },

    optimizeDeps: {
      include: ['react', 'react-dom', 'lucide-react'],
    },
  };
});