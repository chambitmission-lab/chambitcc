// PWA 캐시 관리 유틸리티

// PWA 설치 프롬프트 이벤트 저장
let deferredPrompt: any = null

/**
 * PWA 설치 프롬프트 초기화
 */
export const initPWAInstallPrompt = (): void => {
  window.addEventListener('beforeinstallprompt', (e) => {
    // 기본 브라우저 프롬프트 방지
    e.preventDefault()
    // 나중에 사용하기 위해 이벤트 저장
    deferredPrompt = e
    console.log('✅ PWA 설치 가능 - 설치 프롬프트 준비됨')
    
    // 커스텀 설치 버튼 표시 (선택사항)
    showInstallButton()
  })

  // 설치 완료 이벤트
  window.addEventListener('appinstalled', () => {
    console.log('✅ PWA 설치 완료!')
    deferredPrompt = null
    hideInstallButton()
  })
}

/**
 * PWA 설치 프롬프트 표시
 */
export const showPWAInstallPrompt = async (): Promise<boolean> => {
  if (!deferredPrompt) {
    console.log('❌ 설치 프롬프트를 사용할 수 없습니다')
    return false
  }

  try {
    // 설치 프롬프트 표시
    deferredPrompt.prompt()
    
    // 사용자 선택 대기
    const { outcome } = await deferredPrompt.userChoice
    console.log(`사용자 선택: ${outcome}`)
    
    // 프롬프트 초기화
    deferredPrompt = null
    
    return outcome === 'accepted'
  } catch (error) {
    console.error('❌ PWA 설치 프롬프트 표시 실패:', error)
    return false
  }
}

/**
 * PWA 설치 가능 여부 확인
 */
export const isPWAInstallable = (): boolean => {
  return deferredPrompt !== null
}

/**
 * 커스텀 설치 버튼 표시
 */
const showInstallButton = (): void => {
  // 커스텀 이벤트 발생 (앱에서 리스닝 가능)
  window.dispatchEvent(new CustomEvent('pwa-installable'))
}

/**
 * 커스텀 설치 버튼 숨김
 */
const hideInstallButton = (): void => {
  window.dispatchEvent(new CustomEvent('pwa-installed'))
}

/**
 * Service Worker 캐시를 모두 삭제하고 새로고침
 */
export const clearPWACache = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      // 모든 캐시 삭제
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      )
      
      // Service Worker 등록 해제
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(
        registrations.map(registration => registration.unregister())
      )
      
      console.log('✅ PWA 캐시가 모두 삭제되었습니다')
      
      // 페이지 새로고침
      window.location.reload()
    } catch (error) {
      console.error('❌ PWA 캐시 삭제 실패:', error)
    }
  }
}

/**
 * Service Worker 업데이트 확인 및 적용
 */
export const checkForPWAUpdate = async (): Promise<boolean> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        await registration.update()
        return true
      }
    } catch (error) {
      console.error('❌ PWA 업데이트 확인 실패:', error)
    }
  }
  return false
}

/**
 * 개발 모드에서 PWA 캐시 비활성화
 */
export const disablePWAInDev = (): void => {
  if (import.meta.env.DEV && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister()
        console.log('🔧 개발 모드: Service Worker 비활성화')
      })
    })
  }
}
