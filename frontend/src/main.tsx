import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { queryClient } from './config/queryClient'
import { persister } from './config/persister'
import { disablePWAInDev } from './utils/pwa'
import './index.css'
import './styles/common.css'
import App from './App.tsx'

// 개발 모드에서 PWA 캐시 비활성화
disablePWAInDev()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider 
      client={queryClient} 
      persistOptions={{ persister }}
    >
      <App />
    </PersistQueryClientProvider>
  </StrictMode>,
)
