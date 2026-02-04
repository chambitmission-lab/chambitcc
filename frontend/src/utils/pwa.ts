// PWA 캐시 관리 유틸리티

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
