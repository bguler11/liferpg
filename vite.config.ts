import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Life RPG',
        short_name: 'Life RPG',
        description: '66 günlük alışkanlık RPG\'si',
        lang: 'tr',
        theme_color: '#120e26',
        background_color: '#120e26',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // Firebase Auth'un /__/auth/ yollarını service worker yakalamasın
        navigateFallbackDenylist: [/^\/__\//]
      }
    })
  ],
  test: { environment: 'node' }
});
