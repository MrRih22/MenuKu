import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'MenuKu',
        short_name: 'MenuKu',
        description: 'Sistem Kasir POS dan Self-Order Digital',
        theme_color: '#0f172a', // Warna slate-900 (sesuai tema UI)
        background_color: '#0f172a',
        display: 'standalone', // Membuang UI browser agar tampil full-screen
        icons: [
          {
            src: '/favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: '/favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ]
});
