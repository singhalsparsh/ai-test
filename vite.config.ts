import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import VitePluginSitemap from 'vite-plugin-sitemap';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePluginSitemap({
        hostname: 'https://innov6.sparshlike.eu.org',
        exclude: ['/api/*'],
        changefreq: 'weekly',
        priority: 0.8,
        lastmod: new Date(),
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        // Forward /api/* requests to the Python backend on port 8000
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
        // Forward WebSocket connections for live detection
        '/ws': {
          target: 'ws://localhost:8000',
          ws: true,
        },
      },
    },
  };
});

