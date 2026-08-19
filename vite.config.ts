import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function rewriteAdminRoute(req: { url?: string | null }) {
  if (req.url === '/admin' || req.url?.startsWith('/admin/')) {
    req.url = '/admin/index.html';
  }
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'admin-history-fallback',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          rewriteAdminRoute(req);
          next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, _res, next) => {
          rewriteAdminRoute(req);
          next();
        });
      }
    }
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin/index.html')
      }
    }
  }
});
