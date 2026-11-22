// 함께 깨어 있는 촛불 — 25초 하트비트로 내 촛불을 켜 두고, 응답으로 전체 수를 받는다.
// 화면이 가려지면 끄고(다른 사람 화면에서 촛불이 꺼진다), 돌아오면 다시 켠다.
import { useEffect, useState } from 'react'
import { getRestPresence, leaveRest, sendRestHeartbeat } from '../../api/prayerRest'
import { tokenStore } from '../../utils/tokenStore'

const HEARTBEAT_MS = 25_000

export interface VigilState {
  /** 나를 뺀 다른 사람 수 */
  others: number
  /** 내 촛불이 켜져 있는지 (비로그인은 false) */
  mine: boolean
}

/** 로컬 시연용 — dev 서버에서만 ?candles=N 으로 다른 사람 촛불을 흉내 낸다 */
const demoOthers = (): number | null => {
  if (!import.meta.env.DEV) return null
  const raw = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('candles')
  const n = raw == null ? NaN : Number(raw)
  return Number.isFinite(n) && n >= 0 ? Math.min(40, Math.floor(n)) : null
}

export const useVigilPresence = (): VigilState => {
  const [state, setState] = useState<VigilState>({ others: 0, mine: false })

  useEffect(() => {
    const demo = demoOthers()
    const loggedIn = !!tokenStore.getAccess()
    let alive = true
    let timer: number | undefined

    const apply = (total: number, meIncluded: boolean) => {
      if (!alive) return
      const others = Math.max(0, total - (meIncluded ? 1 : 0))
      setState({ others: demo ?? others, mine: meIncluded })
    }

    const beat = () => {
      const p = loggedIn ? sendRestHeartbeat() : getRestPresence()
      p.then((r) => apply(r.total, r.me_included)).catch(() => {
        if (demo != null) apply(demo + (loggedIn ? 1 : 0), loggedIn)
      })
    }

    const start = () => {
      beat()
      window.clearInterval(timer)
      timer = window.setInterval(beat, HEARTBEAT_MS)
    }
    const stop = () => {
      window.clearInterval(timer)
      if (loggedIn) void leaveRest().catch(() => {})
    }
    const onVisibility = () => (document.visibilityState === 'visible' ? start() : stop())

    start()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', stop)
    return () => {
      alive = false
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', stop)
      stop()
    }
  }, [])

  return state
}
