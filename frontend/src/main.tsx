import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { queryClient } from './config/queryClient'
import { persister } from './config/persister'
import { initPWAInstallPrompt, registerPushServiceWorker } from './utils/pwa'
import { LanguageProvider } from './contexts/LanguageContext'
import 'flag-icons/css/flag-icons.min.css'
import './index.css'
import './styles/common.css'
import App from './App.tsx'

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
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => {
              // 기본 조건: 성공한 쿼리만 persist
              if (query.state.status !== 'success') return false
              // 무한 스크롤 쿼리는 데이터가 크므로 persist 제외
              const key = query.queryKey
              if (Array.isArray(key) && key.includes('infinite')) return false
              // 발자취 게임 상태는 서버 권위 데이터이므로 persist 제외
              // (stale pending_quiz가 캐시되면 진입 시 잘못된 퀴즈가 뜸)
              if (Array.isArray(key) && key[0] === 'bluemarble') return false
              // pageParams가 있는 infinite query도 제외 (커뮤니티, 기도, 댓글 등)
              if (query.state.data && typeof query.state.data === 'object' && 'pageParams' in query.state.data) {
                const pageParams = (query.state.data as any).pageParams
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
