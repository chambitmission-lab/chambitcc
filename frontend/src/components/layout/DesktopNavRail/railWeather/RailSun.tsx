import { useEffect, useId, useState, type CSSProperties } from 'react'
import { CHURCH_LAT, CHURCH_LON, useCurrentWeather } from '../../../../hooks/useWeather'
import { useTickingNow } from '../../../../hooks/useTickingNow'
import { moonPhase, sunTimes } from '../../../../utils/sunTimes'
import { weatherToRailMode } from './railWeatherMode'

/* PC 좌측 레일 하단 삽화의 해와 달 — 라이트·다크 공통(다크는 테마만 어두울 뿐 낮에는 해가 떠 있다).
 *
 * ★ 윤곽 있는 원이 아니라 '물감이 번진 빛무리'다. 이 자리는 하늘까지 그린 완성 장면을 깔면
 *   액자처럼 보여 실패했던 곳이라(rail-bottom-art), 해도 바탕에 스며드는 옅은 워시로만 둔다.
 * - 위치: 교회 좌표의 실제 일출~일몰을 0→1 로 펴서, 왼쪽 언덕 뒤에서 떠 정오에 가장 높고
 *   오른쪽 언덕 뒤로 진다. 5분에 한 번만 옮긴다(루프 없음 — CSS 변수 두 개만 바꾼다).
 * - 언덕 뒤에서 뜨고 진다 — 길의 양 끝이 능선보다 아래에 있고, 하늘 모양으로 오려 낸 틀
 *   (.rail-sun-sky 의 clip-path, DesktopNavRail.css)이 언덕에 걸린 부분을 가린다.
 * - 비·뇌우·눈에는 숨는다(가랑비만 예외 — 희미하게 비친다). 구름 조금이면 조금 옅게, 흐림·안개에는 구름 뒤로
 *   비치는 정도로 옅고 창백하게(veiled) — 흐린 날에도 해 위치로 시간을 가늠할 수 있게.
 *
 * - 해가 지면 달: 일몰→다음 일출을 같은 길로 건넌다(.is-moon).
 *   모양은 그날의 실제 위상(초승달·반달·보름달·그믐달)을 따른다 — 뜨고 지는 시각은 따르지 않는다. 날씨 규칙은 해와 같다.
 *
 * 개발·확인용: localStorage 'rail-sun-preview' = 'sweep'(낮→밤을 60초에 한 바퀴) 또는 0~1 숫자(진행률) */
const PREVIEW_KEY = 'rail-sun-preview'
const TICK_MS = 5 * 60 * 1000
const SWEEP_MS = 60_000
const DAY_MS = 86_400_000

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

/* 하루를 빠르게 돌리는 미리보기 — 돈 바퀴 수(소수부 앞 절반은 낮의 해, 뒤 절반은 밤의 달).
 * 바퀴마다 달 모양을 한 단계씩 바꿔 초승달→반달→보름달→그믐달을 차례로 보여 준다 */
const useSweep = (on: boolean): number => {
  const [p, setP] = useState(0)
  useEffect(() => {
    if (!on) return
    const t0 = performance.now()
    const timer = setInterval(() => setP((performance.now() - t0) / SWEEP_MS), 100)
    return () => clearInterval(timer)
  }, [on])
  return p
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/* 달 — 그날 위상대로 밝은 면을 그린다. 반듯한 도형이 아니라 물감 자국처럼:
 * (다크 테마에서만) 어두운 면이 아주 옅게 비치고, 밝은 면에는 달의 바다 얼룩이 있고, 가장자리는 살짝 번진다.
 * 밝은 면 = 바깥 반원 + 명암 경계(가로 반지름 r·|cos 2πphase| 의 반타원). 상현까지는 오른쪽이 밝다(북반구). */
const MOON_R = 12
function MoonGlyph({ phase }: { phase: number }) {
  const id = useId().replace(/:/g, '')
  const lit = (1 - Math.cos(2 * Math.PI * phase)) / 2
  const waxing = phase < 0.5
  const gibbous = lit > 0.5
  // 삭 앞뒤의 실낱 같은 달은 이 크기(지름 24px)에서 선 한 가닥으로만 보여 달로 읽히지 않는다 —
  // 가장 가는 달도 눈썹달 굵기(가운데 폭 ≈3.6px)는 되게 명암 경계를 묶는다
  const edge = Math.abs(Math.cos(2 * Math.PI * phase))
  const rx = (MOON_R * (gibbous ? edge : Math.min(0.7, edge))).toFixed(2)
  const d =
    lit > 0.985
      ? `M0,${-MOON_R}A${MOON_R},${MOON_R} 0 1 1 0,${MOON_R}A${MOON_R},${MOON_R} 0 1 1 0,${-MOON_R}Z`
      : `M0,${-MOON_R}A${MOON_R},${MOON_R} 0 0 ${waxing ? 1 : 0} 0,${MOON_R}` +
        `A${rx},${MOON_R} 0 0 ${waxing === gibbous ? 1 : 0} 0,${-MOON_R}Z`
  return (
    <svg className="rail-moon" viewBox="-17 -17 34 34" width="34" height="34">
      <defs>
        <clipPath id={`${id}lit`}>
          <path d={d} />
        </clipPath>
        <filter id={`${id}soft`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.45" />
        </filter>
      </defs>
      <g transform="rotate(-20)" filter={`url(#${id}soft)`}>
        <circle r={MOON_R} className="rail-moon-dark" />
        <path d={d} className="rail-moon-lit" />
        <g clipPath={`url(#${id}lit)`} className="rail-moon-mare">
          <ellipse cx="-3.4" cy="-4.2" rx="3.6" ry="2.8" />
          <ellipse cx="3.8" cy="0.6" rx="2.6" ry="3.1" />
          <ellipse cx="-1.6" cy="5.4" rx="2.4" ry="1.8" />
          <circle cx="5.6" cy="-6" r="1.5" />
          <circle cx="-7.2" cy="1.6" r="1.6" />
        </g>
      </g>
    </svg>
  )
}

export default function RailSun() {
  const { weather } = useCurrentWeather()
  const [preview] = useState(readPreview)
  const sweeping = preview === 'sweep'
  const sweep = useSweep(sweeping)
  const now = useTickingNow(TICK_MS, preview === null)

  /* 낮에는 해가 일출→일몰을, 밤에는 달이 일몰→다음 일출을 같은 길로 건넌다.
   * (실제 달의 뜨고 지는 시각·위상은 따르지 않는다 — "지금은 밤, 밤이 얼마나 깊었나"만 보여 준다) */
  let progress: number
  let moon = false
  if (sweeping) {
    const lap = (sweep % 1) * 2
    moon = lap >= 1
    progress = lap % 1
  } else if (typeof preview === 'number') progress = preview
  else {
    const sun = sunTimes(now, CHURCH_LAT, CHURCH_LON)
    if (!sun) return null
    if (now < sun.rise) {
      const prev = sunTimes(now - DAY_MS, CHURCH_LAT, CHURCH_LON)
      if (!prev) return null
      moon = true
      progress = (now - prev.set) / (sun.rise - prev.set)
    } else if (now > sun.set) {
      const next = sunTimes(now + DAY_MS, CHURCH_LAT, CHURCH_LON)
      if (!next) return null
      moon = true
      progress = (now - sun.set) / (next.rise - sun.set)
    } else progress = (now - sun.rise) / (sun.set - sun.rise)
  }
  if (!(progress > 0 && progress < 1)) return null
  const phase = sweeping ? ((Math.floor(sweep) % 8) + 0.5) / 8 : moonPhase(now).phase

  // 하늘 상태 — 미리보기 중에는 날씨를 보지 않는다
  let sky = 1
  let veiled = false
  if (preview === null && weather) {
    const mode = weatherToRailMode(weather)
    if (mode === 'drizzle') {
      // 가랑비 — 엷은 비구름 뒤로 희미하게(비·뇌우·눈에는 숨는다)
      sky = 0.5
      veiled = true
    } else if (mode) return null
    else if (weather.condition === 'cloudy' && weather.icon !== 'cloud') sky = 0.7 // 구름 조금
    else if (weather.condition !== 'clear') {
      // 흐림·안개 — 구름 뒤로 비치는 해
      sky = 0.68 // 0.42 는 밝은 바탕에서 거의 안 보였다(2026-11-14)
      veiled = true
    }
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
      {/* key — 해↔달이 바뀔 때 오른쪽 끝에서 왼쪽 끝으로 미끄러지지 않게 새로 놓는다 */}
      <span
        key={moon ? 'moon' : 'sun'}
        className={`rail-sun${moon ? ' is-moon' : ''}${sweeping ? ' is-sweep' : ''}${veiled ? ' is-veiled' : ''}`}
        style={style}
      >
        {moon && <MoonGlyph phase={phase} />}
      </span>
    </div>
  )
}
