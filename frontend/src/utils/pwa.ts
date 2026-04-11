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
    if (import.meta.env.DEV) {
      console.log('✅ PWA 설치 가능 - 설치 프롬프트 준비됨')
    }
    
    // 커스텀 설치 버튼 표시 (선택사항)
    showInstallButton()
  })

  // 설치 완료 이벤트
  window.addEventListener('appinstalled', () => {
    if (import.meta.env.DEV) {
      console.log('✅ PWA 설치 완료!')
    }
    deferredPrompt = null
    hideInstallButton()
  })
}

/**
 * PWA 설치 프롬프트 표시
 */
export const showPWAInstallPrompt = async (): Promise<boolean> => {
  if (!deferredPrompt) {
    if (import.meta.env.DEV) {
      console.log('❌ 설치 프롬프트를 사용할 수 없습니다')
    }
    return false
  }

  try {
    // 설치 프롬프트 표시
    deferredPrompt.prompt()
    
    // 사용자 선택 대기
    const { outcome } = await deferredPrompt.userChoice
    if (import.meta.env.DEV) {
      console.log(`사용자 선택: ${outcome}`)
    }
    
    // 프롬프트 초기화
    deferredPrompt = null
    
    return outcome === 'accepted'
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('❌ PWA 설치 프롬프트 표시 실패:', error)
    }
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
      
      if (import.meta.env.DEV) {
        console.log('✅ PWA 캐시가 모두 삭제되었습니다')
      }
      
      // 페이지 새로고침
      window.location.reload()
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('❌ PWA 캐시 삭제 실패:', error)
      }
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
      if (import.meta.env.DEV) {
        console.error('❌ PWA 업데이트 확인 실패:', error)
      }
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

/**
 * 푸시 알림용 Service Worker 등록
 */
export const registerPushServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    if (import.meta.env.DEV) {
      console.warn('Service Worker를 지원하지 않는 브라우저입니다.');
    }
    return null;
  }

  try {
    // base path 고려 (프로덕션: /chambitcc/, 개발: /)
    const base = import.meta.env.BASE_URL || '/';
    const swPath = `${base}sw.js`.replace(/\/+/g, '/'); // 중복 슬래시 제거
    
    if (import.meta.env.DEV) {
      console.log('🔧 Service Worker 경로:', swPath);
    }
    
    // 좀비 Service Worker 자동 청소
    // 이전에 vite-plugin-pwa 등으로 등록된 다른 스크립트(dev-sw.js 등)가
    // 남아 있으면 update() 시 MIME 에러가 발생하므로 먼저 제거한다.
    const expectedScriptUrl = new URL(swPath, window.location.origin).href;
    const allRegistrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of allRegistrations) {
      const activeUrl =
        reg.active?.scriptURL ||
        reg.waiting?.scriptURL ||
        reg.installing?.scriptURL ||
        '';
      if (activeUrl && activeUrl !== expectedScriptUrl) {
        try {
          await reg.unregister();
          if (import.meta.env.DEV) {
            console.log('🧹 좀비 Service Worker 제거:', activeUrl);
          }
        } catch (unregErr) {
          if (import.meta.env.DEV) {
            console.warn('좀비 SW 제거 실패 (무시):', unregErr);
          }
        }
      }
    }

    // 기존 등록 확인 (청소 후)
    let registration = await navigator.serviceWorker.getRegistration();

    if (!registration) {
      // 새로 등록
      registration = await navigator.serviceWorker.register(swPath, {
        scope: base
      });
      if (import.meta.env.DEV) {
        console.log('✅ Service Worker 등록 완료:', registration);
      }
    } else {
      if (import.meta.env.DEV) {
        console.log('✅ Service Worker 이미 등록됨:', registration);
      }

      // 업데이트 확인 — 실패해도 전체 흐름을 중단시키지 않음
      try {
        await registration.update();
        if (import.meta.env.DEV) {
          console.log('🔄 Service Worker 업데이트 확인 완료');
        }
      } catch (updateErr) {
        if (import.meta.env.DEV) {
          console.warn('⚠️ SW update 실패 — 좀비 등록 가능성, 재등록 시도:', updateErr);
        }
        // 좀비 등록이 남아있던 경우 강제 재등록
        try {
          await registration.unregister();
          registration = await navigator.serviceWorker.register(swPath, {
            scope: base
          });
          if (import.meta.env.DEV) {
            console.log('♻️ Service Worker 재등록 완료:', registration);
          }
        } catch (reregErr) {
          if (import.meta.env.DEV) {
            console.error('SW 재등록 실패:', reregErr);
          }
        }
      }
    }

    // Service Worker 활성화 대기
    await navigator.serviceWorker.ready;
    if (import.meta.env.DEV) {
      console.log('✅ Service Worker 활성화됨');
    }

    return registration;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('❌ Service Worker 등록 실패:', error);
      console.error('에러 상세:', error);
    }
    return null;
  }
}
