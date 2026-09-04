import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { queryClient } from './config/queryClient'
import { persister } from './config/persister'
import { initPWAInstallPrompt, registerPushServiceWorker } from './utils/pwa'
import { escapeKakaoInApp, isKakaoInApp } from './utils/inappBrowser'
import { LanguageProvider } from './contexts/LanguageContext'
import './index.css'
import './styles/theme.css'
import './styles/common.css'
import App from './App.tsx'

// 카카오톡 인앱 브라우저로 진입한 경우 어떤 페이지든 외부 브라우저로 탈출
// (안드로이드: 설치된 PWA가 열리거나 크롬에서 설치 유도 / iOS: Safari로 열림)
if (isKakaoInApp()) {
  escapeKakaoInApp()
}

// PWA 설치 프롬프트 초기화 (프로덕션에서만)
if (import.meta.env.PROD) {
  initPWAInstallPrompt()
}

// 푸시 알림용 Service Worker 등록 (개발/프로덕션 모두)
registerPushServiceWorker()

// Strict Mode는 개발/프로덕션 모두에서 활성화
// 권한 중복 요청 문제는 AudioRecorder 컴포넌트에서 ref로 해결
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          // 빌드가 바뀌면 persist 캐시를 통째로 폐기 — 새 코드가 옛 스키마의
          // 캐시 데이터를 복원해서 생기는 코드-데이터 불일치를 막는다
          buster: __APP_VERSION__,
          // persist-client 기본 maxAge 는 24시간 — 그보다 오래 안 열면 캐시를 통째로 버려
          // 하루 만에 켠 앱이 매번 콜드 스타트였다. gcTime(7일)과 맞춘다.
          // 오래된 데이터는 refetchOnMount(staleTime 5분)가 뒤에서 조용히 갱신한다.
          maxAge: 1000 * 60 * 60 * 24 * 7,
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => {
              // 기본 조건: 성공한 쿼리만 persist
              if (query.state.status !== 'success') return false
              // 무한 스크롤 쿼리는 데이터가 크므로 persist 제외
              const key = query.queryKey
              if (Array.isArray(key) && key.includes('infinite')) return false
              // 발자취 게임 상태는 서버 권위 데이터이므로 persist 제외
              // (stale pending_quiz가 캐시되면 진입 시 잘못된 퀴즈가 뜸)
              // 단, 통계(stats)는 복원한다 — /profile이 레벨 계산에 쓰는데,
              // 제외하면 앱을 켤 때마다 이 요청을 기다리며 전체 스피너가 떴다
              if (Array.isArray(key) && key[0] === 'bluemarble' && key[1] !== 'stats') return false
              // 실황 날씨는 persist 제외 — 저장하면 다음 실행 때 며칠 전 기온이 먼저 뜬다
              if (Array.isArray(key) && key[0] === 'weather') return false
              // 성경 본문(장·검색)은 persist 제외 — 장 하나가 6~29KB 라 며칠 읽으면 캐시가
              // 수 MB 로 불어 매 persist·부팅 복원을 무겁게 만든다. 오프라인 읽기는
              // 서비스워커의 API 캐시(network-first)가 이미 담당한다.
              if (Array.isArray(key) && key[0] === 'bible' && (key[1] === 'chapter' || key[1] === 'search')) return false
              // pageParams가 있는 infinite query도 제외 (커뮤니티, 기도, 댓글 등)
              if (query.state.data && typeof query.state.data === 'object' && 'pageParams' in query.state.data) {
                const pageParams = (query.state.data as { pageParams?: unknown }).pageParams
                // 첫 페이지만 있으면 persist 허용, 2페이지 이상이면 제외
                if (Array.isArray(pageParams) && pageParams.length > 1) return false
              }
              return true
            },
          },
        }}
      >
        <App />
      </PersistQueryClientProvider>
    </LanguageProvider>
  </StrictMode>,
)
