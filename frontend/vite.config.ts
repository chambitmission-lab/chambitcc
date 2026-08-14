import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 빌드마다 고유한 버전 문자열.
// 설치형 PWA는 강력 새로고침이 없어 옛 번들이 며칠씩 살아남을 수 있다.
// 번들에는 __APP_VERSION__ 으로 심고, dist 에는 version.json 으로 내보내서
// 앱이 스스로 "서버의 최신 빌드 == 지금 실행 중인 빌드" 를 비교할 수 있게 한다.
const appVersion = Date.now().toString()

// https://vite.dev/config/
// Vercel 배포: 루트 도메인에서 서빙하므로 base는 기본값 '/'.
// (구 GitHub Pages 배포가 필요하면 deploy:ghpages 스크립트가 --base=/chambitcc/ 로 덮어씀)
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    // VitePWA 제거 - 푸시 알림 충돌 방지
    // 수동 Service Worker (public/sw.js) 사용
    {
      name: 'emit-version-json',
      apply: 'build',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify({ version: appVersion }),
        })
      },
    },
  ],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  // 프로덕션 빌드에서만 console.log/debug 제거 (warn/error 는 유지).
  // 핫패스(기도 작성 키 입력, 성경 장 로드 등)의 로그가 사용자 콘솔에
  // 개인 기도문까지 노출하던 것을 소스 수정 없이 일괄 차단한다.
  esbuild: command === 'build' ? { pure: ['console.log', 'console.debug'] } : undefined,
  build: {
    rollupOptions: {
      output: {
        // npm 업데이트 때만 바뀌는 프레임워크 코드를 vendor 청크로 고정.
        // 앱 코드만 바뀌는 평소 배포에서는 vendor 해시가 그대로 유지되어
        // 재방문 사용자가 메인 청크의 앱 코드 부분만 다시 받는다.
        // 주의: 여기 나열된 패키지는 전부 eager 진입 코드가 이미 정적 import하는
        // 것들이어야 한다 — lazy 전용 패키지(framer-motion, d3, recharts 등)를
        // 넣으면 첫 로드에 강제 포함되므로 금지.
        manualChunks(id) {
          if (
            /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|@tanstack|axios)[\\/]/.test(
              id,
            )
          ) {
            return 'vendor'
          }
        },
      },
    },
  },
}))
