import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { queryClient } from './config/queryClient'
import { persister } from './config/persister'
import { disablePWAInDev, initPWAInstallPrompt } from './utils/pwa'
import { LanguageProvider } from './contexts/LanguageContext'
import './index.css'
import './styles/common.css'
import App from './App.tsx'

// 개발 모드에서 PWA 캐시 비활성화
disablePWAInDev()

// PWA 설치 프롬프트 초기화 (프로덕션에서만)
if (import.meta.env.PROD) {
  initPWAInstallPrompt()
}

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
