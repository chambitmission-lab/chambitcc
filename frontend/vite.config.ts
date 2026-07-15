import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Vercel 배포: 루트 도메인에서 서빙하므로 base는 기본값 '/'.
// (구 GitHub Pages 배포가 필요하면 deploy:ghpages 스크립트가 --base=/chambitcc/ 로 덮어씀)
export default defineConfig({
  plugins: [
    react(),
    // VitePWA 제거 - 푸시 알림 충돌 방지
    // 수동 Service Worker (public/sw.js) 사용
  ],
})
