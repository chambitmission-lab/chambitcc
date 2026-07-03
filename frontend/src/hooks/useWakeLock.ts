import { useEffect, useRef } from 'react'

/**
 * active 동안 화면이 꺼지거나 어두워지지 않게 Screen Wake Lock을 잡는다.
 * 음성으로 성경을 낭독하는 동안 화면이 잠기면 음성 인식이 끊기는 문제 방지용.
 *
 * - 지원: Android Chrome, iOS Safari 16.4+ (미지원 브라우저는 조용히 무시)
 * - 탭이 백그라운드로 가면 브라우저가 락을 자동 해제하므로,
 *   다시 보이는 시점에 재획득한다.
 * - 저전력 모드 등에서 요청이 거부될 수 있다 — 기능 저하일 뿐이라 무시.
 */
export const useWakeLock = (active: boolean) => {
  const sentinelRef = useRef<{ release: () => Promise<void> } | null>(null)

  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) {
      return
    }

    let cancelled = false

    const request = async () => {
      try {
        const sentinel = await (navigator as Navigator & {
          wakeLock: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> }
        }).wakeLock.request('screen')
        if (cancelled) {
          sentinel.release().catch(() => {})
        } else {
          sentinelRef.current = sentinel
        }
      } catch {
        // 권한/배터리 정책으로 거부될 수 있음 — 화면 유지만 포기하면 됨
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !cancelled) {
        request()
      }
    }

    request()
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibility)
      sentinelRef.current?.release().catch(() => {})
      sentinelRef.current = null
    }
  }, [active])
}
