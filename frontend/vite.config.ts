import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Vercel 배포: 루트 도메인에서 서빙하므로 base는 기본값 '/'.
// (구 GitHub Pages 배포가 필요하면 deploy:ghpages 스크립트가 --base=/chambitcc/ 로 덮어씀)
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    // VitePWA 제거 - 푸시 알림 충돌 방지
    // 수동 Service Worker (public/sw.js) 사용
  ],
  // 프로덕션 빌드에서만 console.log/debug 제거 (warn/error 는 유지).
  // 핫패스(기도 작성 키 입력, 성경 장 로드 등)의 로그가 사용자 콘솔에
  // 개인 기도문까지 노출하던 것을 소스 수정 없이 일괄 차단한다.
  esbuild: command === 'build' ? { pure: ['console.log', 'console.debug'] } : undefined,
}))
