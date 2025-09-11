import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/sendgrid-api': {
        target: 'https://api.sendgrid.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sendgrid-api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist'
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});