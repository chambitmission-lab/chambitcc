import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg'],
      devOptions: {
        enabled: false // 개발 중에는 PWA 비활성화
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg}'],
        // 캐시 버전 업데이트 (fingerprint 제거 후)
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache-v2', // 버전 업데이트
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5분으로 단축
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // 정적 리소스는 캐시 우선
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache-v2',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30일
              }
            }
          }
        ]
      },
      manifest: {
        name: '참빛교회',
        short_name: '참빛교회',
        description: '참빛교회 공식 웹사이트',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        start_url: mode === 'production' ? '/chambitcc/' : '/',
        scope: mode === 'production' ? '/chambitcc/' : '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  base: mode === 'production' ? '/chambitcc/' : '/',
}))
