import { useEffect, useState, type CSSProperties } from 'react'
import { CHURCH_LAT, CHURCH_LON, useCurrentWeather } from '../../../../hooks/useWeather'
import { useTickingNow } from '../../../../hooks/useTickingNow'
import { sunTimes } from '../../../../utils/sunTimes'
import { weatherToRailMode } from './railWeatherMode'

/* PC 좌측 레일 하단 삽화의 해 — 라이트 테마 전용(다크 그림은 창에 불 켜진 밤이라 비운다).
 *
 * ★ 윤곽 있는 원이 아니라 '물감이 번진 빛무리'다. 이 자리는 하늘까지 그린 완성 장면을 깔면
 *   액자처럼 보여 실패했던 곳이라(rail-bottom-art), 해도 바탕에 스며드는 옅은 워시로만 둔다.
 * - 위치: 교회 좌표의 실제 일출~일몰을 0→1 로 펴서, 왼쪽 언덕 뒤에서 떠 정오에 가장 높고
 *   오른쪽 언덕 뒤로 진다. 5분에 한 번만 옮긴다(루프 없음 — CSS 변수 두 개만 바꾼다).
 * - 언덕 뒤에서 뜨고 진다 — 길의 양 끝이 능선보다 아래에 있고, 하늘 모양으로 오려 낸 틀
 *   (.rail-sun-sky 의 clip-path, DesktopNavRail.css)이 언덕에 걸린 부분을 가린다.
 * - 비·눈(날씨 연출이 도는 동안)·안개·완전 흐림에는 숨고, 구름 조금이면 옅게.
 *
 * 개발·확인용: localStorage 'rail-sun-preview' = 'sweep'(하루를 40초에 한 바퀴) 또는 0~1 숫자(진행률) */
const PREVIEW_KEY = 'rail-sun-preview'
const TICK_MS = 5 * 60 * 1000
const SWEEP_MS = 40_000

const readPreview = (): 'sweep' | number | null => {
  try {
    const v = localStorage.getItem(PREVIEW_KEY)
    if (v === 'sweep') return 'sweep'
    const n = v === null || v === '' ? NaN : Number(v)
    return n >= 0 && n <= 1 ? n : null
  } catch {
    return null
  }
}

/* 하루를 빠르게 돌리는 미리보기 진행률(-0.1~1.1 — 해 없는 구간도 잠깐 지나간다) */
const useSweep = (on: boolean): number => {
  const [p, setP] = useState(0)
  useEffect(() => {
    if (!on) return
    const t0 = performance.now()
    const timer = setInterval(() => setP((((performance.now() - t0) % SWEEP_MS) / SWEEP_MS) * 1.2 - 0.1), 100)
    return () => clearInterval(timer)
  }, [on])
  return p
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export default function RailSun() {
  const { weather } = useCurrentWeather()
  const [preview] = useState(readPreview)
  const sweeping = preview === 'sweep'
  const sweep = useSweep(sweeping)
  const now = useTickingNow(TICK_MS, preview === null)

  let progress: number
  if (sweeping) progress = sweep
  else if (typeof preview === 'number') progress = preview
  else {
    const sun = sunTimes(now, CHURCH_LAT, CHURCH_LON)
    if (!sun) return null
    progress = (now - sun.rise) / (sun.set - sun.rise)
  }
  if (progress <= 0 || progress >= 1) return null

  // 하늘 상태 — 미리보기 중에는 날씨를 보지 않는다
  let sky = 1
  if (preview === null && weather) {
    if (weatherToRailMode(weather)) return null
    if (weather.icon === 'cloudSun') sky = 0.6
    else if (weather.icon !== 'sun') return null
  }

  const lift = Math.sin(Math.PI * progress) // 0(지평선) → 1(정오)
  const style = {
    '--sun-x': progress.toFixed(4),
    '--sun-lift': lift.toFixed(4),
    // 낮게 걸릴수록 붉고 따뜻하게, 높이 뜨면 옅은 볕색으로
    '--sun-warm': `${Math.round((1 - smooth(0.25, 0.8, lift)) * 100)}%`,
    // 능선 아래 깊이 있을 때(뜨기 직전·진 직후)만 살짝 줄여 등장·퇴장이 툭 끊기지 않게
    opacity: (sky * smooth(0, 0.1, lift)).toFixed(3),
  } as CSSProperties

  return (
    <div className="rail-sun-sky" aria-hidden>
      <span className={`rail-sun${sweeping ? ' is-sweep' : ''}`} style={style} />
    </div>
  )
}
