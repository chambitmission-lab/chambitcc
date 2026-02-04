import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './config/queryClient'
import { disablePWAInDev } from './utils/pwa'
import './index.css'
import './styles/common.css'
import App from './App.tsx'

// 개발 모드에서 PWA 캐시 비활성화
disablePWAInDev()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
