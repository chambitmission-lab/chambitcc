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

// Strict Mode는 프로덕션에서만 활성화 (개발 중 권한 중복 요청 방지)
const RootWrapper = import.meta.env.PROD ? StrictMode : ({ children }: { children: React.ReactNode }) => <>{children}</>

createRoot(document.getElementById('root')!).render(
  <RootWrapper>
    <LanguageProvider>
      <PersistQueryClientProvider 
        client={queryClient} 
        persistOptions={{ persister }}
      >
        <App />
      </PersistQueryClientProvider>
    </LanguageProvider>
  </RootWrapper>,
)
