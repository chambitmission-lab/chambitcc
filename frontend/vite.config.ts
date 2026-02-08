import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // VitePWA 제거 - 푸시 알림 충돌 방지
    // 수동 Service Worker (public/sw.js) 사용
  ],
  base: mode === 'production' ? '/chambitcc/' : '/',
}))
