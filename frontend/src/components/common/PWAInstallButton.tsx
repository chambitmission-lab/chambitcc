import { useState, useEffect, useRef } from 'react'
import { showPWAInstallPrompt, isPWAInstallable } from '../../utils/pwa'

/** 닫기를 누르면 이 기간 동안 다시 뜨지 않는다 (매 방문 재노출은 배너 피로를 만든다) */
const SNOOZE_KEY = 'pwa-install-snoozed-at'
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000

const isSnoozed = () => {
  try {
    const at = Number(localStorage.getItem(SNOOZE_KEY))
    return Boolean(at) && Date.now() - at < SNOOZE_MS
  } catch {
    return false
  }
}

const PWAInstallButton = () => {
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [snoozed, setSnoozed] = useState(isSnoozed)
  // 마운트 직후 한 프레임 뒤에 켜서 아래에서 올라오는 등장 트랜지션을 만든다
  const [entered, setEntered] = useState(false)
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // PWA 설치 가능 이벤트 리스닝
    const handleInstallable = () => {
      setIsInstallable(true)
    }

    const handleInstalled = () => {
      setIsInstallable(false)
    }

    window.addEventListener('pwa-installable', handleInstallable)
    window.addEventListener('pwa-installed', handleInstalled)

    // 초기 상태 확인
    setIsInstallable(isPWAInstallable())

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable)
      window.removeEventListener('pwa-installed', handleInstalled)
      if (exitTimer.current) clearTimeout(exitTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!isInstallable || snoozed) return
    const raf = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(raf)
  }, [isInstallable, snoozed])

  const handleInstall = async () => {
    setIsInstalling(true)
    try {
      const accepted = await showPWAInstallPrompt()
      if (accepted) {
        console.log('✅ 사용자가 설치를 수락했습니다')
      } else {
        console.log('❌ 사용자가 설치를 거부했습니다')
      }
    } catch (error) {
      console.error('설치 중 오류:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  const handleSnooze = () => {
    try {
      localStorage.setItem(SNOOZE_KEY, String(Date.now()))
    } catch {
      /* 사파리 프라이빗 모드 등 — 저장 실패해도 이번 세션은 닫힌다 */
    }
    setEntered(false)
    exitTimer.current = setTimeout(() => setSnoozed(true), 220)
  }

  // 설치 불가능하거나 최근에 닫았으면 숨김
  if (!isInstallable || snoozed) {
    return null
  }

  return (
    /* 하단 독(z-100) 바로 위에 앉는 카드. 독과 같은 max-w-md·좌우 여백으로 폭을 맞춘다 */
    <div
      className={`fixed left-0 right-0 z-[90] bottom-[calc(5.75rem+env(safe-area-inset-bottom))] px-4 pointer-events-none transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none ${
        entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      }`}
    >
      <div className="max-w-md mx-auto pointer-events-auto">
        <div className="feed-card rounded-2xl px-3 py-2.5 flex items-center gap-3">
          {/* 실제 설치될 앱 아이콘 — 무엇이 홈 화면에 생기는지 그대로 보여준다 */}
          <img
            src="/pwa-192x192.png"
            alt=""
            aria-hidden
            className="w-10 h-10 rounded-xl shrink-0 ring-1 ring-black/5 dark:ring-white/10 object-cover"
          />

          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-ink-strong leading-tight truncate">
              참빛 앱 설치
            </p>
            <p className="text-[11px] text-ink-muted leading-tight mt-0.5 truncate">
              홈 화면에서 바로 열고 알림도 받아요
            </p>
          </div>

          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="shrink-0 h-9 px-3.5 rounded-xl bg-brand text-brand-on text-[13px] font-semibold flex items-center gap-1.5 active:scale-95 transition-transform duration-150 disabled:opacity-60 disabled:active:scale-100"
          >
            {isInstalling ? (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : (
              /* 내려받기 글리프 — 앱 전역 아이콘 문법(인라인 SVG, stroke 1.8) */
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M12 4v10" />
                <path d="M8 11l4 4 4-4" />
                <path d="M5 19h14" />
              </svg>
            )}
            {isInstalling ? '설치 중' : '설치'}
          </button>

          <button
            onClick={handleSnooze}
            aria-label="설치 안내 닫기"
            className="shrink-0 w-7 h-7 -mr-0.5 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink-strong hover:bg-[var(--surface-inset)] active:scale-90 transition-[color,background-color,transform] duration-150"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default PWAInstallButton
