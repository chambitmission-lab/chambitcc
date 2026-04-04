import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { queryClient } from './config/queryClient'
import { persister } from './config/persister'
import { initPWAInstallPrompt, registerPushServiceWorker } from './utils/pwa'
import { LanguageProvider } from './contexts/LanguageContext'
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
        persistOptions={{ persister }}
      >
        <App />
      </PersistQueryClientProvider>
    </LanguageProvider>
  </StrictMode>,
)
