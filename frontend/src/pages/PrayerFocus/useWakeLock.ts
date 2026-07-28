// 기도 중 화면이 자동으로 꺼지지 않도록 Screen Wake Lock을 잡는 훅.
// 미지원 브라우저·저전력 모드 거부는 조용히 무시하고, 탭 복귀 시 자동 재획득한다.
import { useEffect, useRef } from 'react'

export const useWakeLock = (active: boolean) => {
  const sentinelRef = useRef<{ release: () => Promise<void> } | null>(null)

  useEffect(() => {
    if (!active) return

    let cancelled = false

    const request = async () => {
      try {
        const wakeLock = (navigator as Navigator & {
          wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> }
        }).wakeLock
        if (!wakeLock) return
        const sentinel = await wakeLock.request('screen')
        if (cancelled) {
          sentinel.release().catch(() => {})
          return
        }
        sentinelRef.current = sentinel
      } catch {
        // 배터리 세이버 등에서 거부될 수 있음 — 화면 유지 없이 계속 진행
      }
    }

    request()

    // 탭이 백그라운드로 갔다 오면 wake lock 이 자동 해제되므로 재획득
    const onVisibility = () => {
      if (document.visibilityState === 'visible') request()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      sentinelRef.current?.release().catch(() => {})
      sentinelRef.current = null
    }
  }, [active])
}
