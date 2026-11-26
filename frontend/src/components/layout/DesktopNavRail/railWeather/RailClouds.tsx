import type { CSSProperties } from 'react'
import { useCurrentWeather } from '../../../../hooks/useWeather'
import { weatherToRailMode } from './railWeatherMode'

/* PC 좌측 레일 하단 삽화의 갠 날 구름 — 라이트·다크 공통(색만 테마별, DesktopNavRail.css).
 *
 * 비·눈이 올 때의 먹구름은 캔버스(RailWeatherFx)가 그린다. 여기는 그 밖의 날:
 * 옅은 하늘빛 수채 번짐 몇 점이 언덕 위 하늘을 아주 천천히 건너간다.
 *  - 맑음      : 2점
 *  - 구름 조금 : 3점
 *  - 흐림      : 4점, 한 톤 가라앉은 회청색
 *  - 안개      : 구름 대신 능선에 걸친 안개 띠 두 줄(.rail-fog)
 *  - 비·눈     : 없음(캔버스 몫)
 * 바탕이 밝은 회색(#f1f3f6)이라 흰 구름은 안 보인다 — 바탕보다 살짝 짙은 푸른 워시로 그린다.
 * 움직임은 CSS 애니메이션(transform, 계단식 — 아래 STEPS_PER_SEC)뿐이라 JS 루프가 없다. 동작 줄이기면 제자리에 멈춘다. */

type Sky = 'clear' | 'partly' | 'overcast'

/* 구름 한 점: 세로 자리(하늘 구간 안 0~1)·크기·한 바퀴 시간(초)·출발 지연(음수 = 이미 떠 있는 상태로 시작) */
const CLOUDS = [
  { k: 0.12, scale: 1, dur: 150, delay: -40 },
  { k: 0.62, scale: 0.72, dur: 210, delay: -150 },
  { k: 0.36, scale: 0.85, dur: 180, delay: -105 },
  { k: 0.82, scale: 0.6, dur: 240, delay: -20 },
]
/* 구름은 초당 2px 남짓 움직인다 — 매 프레임(60fps) 옮기면 마스크 걸린 칸 전체를 그때마다 다시 합성한다.
 * 그래서 계단식으로 옮긴다(2026-11-22 실측: 레일 상시 비용의 절반 이상이 구름이었다).
 * ★ 초당 5번(한 걸음 ≈0.5px)은 구름이 뚝뚝 끊겨 보였다(2026-11-26) — 초당 15번(한 걸음 ≈0.17px)으로 올렸다.
 *   실측: 비용은 초당 갱신 횟수에 비례한다(구름을 마스크 밖으로 빼도 줄지 않는다 — 구조 변경은 헛수고).
 *   지연(delay)이 정수 초라 구름들이 같은 프레임에 함께 옮겨진다 */
const STEPS_PER_SEC = 15
const COUNT: Record<Sky, number> = { clear: 2, partly: 3, overcast: 4 }

export default function RailClouds() {
  const { weather, isLoading } = useCurrentWeather()
  // 날씨를 아직 못 받았으면 기다린다 — 맑은 날 구름을 먼저 띄웠다가 거두지 않게(실패로 끝나면 맑은 날로)
  if (isLoading) return null

  let sky: Sky = 'clear'
  if (weather) {
    if (weatherToRailMode(weather)) return null
    if (weather.condition === 'clear') sky = 'clear'
    else if (weather.condition === 'cloudy') sky = weather.icon === 'cloud' ? 'overcast' : 'partly'
    else if (weather.condition === 'fog') {
      return (
        <div className="rail-fog" aria-hidden>
          <span />
          <span />
        </div>
      )
    } else return null
  }

  return (
    <div className="rail-clouds" data-sky={sky} aria-hidden>
      {CLOUDS.slice(0, COUNT[sky]).map((c, i) => (
        <span
          key={i}
          className="rail-cloud"
          style={
            {
              '--ck': c.k,
              '--cs': c.scale,
              animationDuration: `${c.dur}s`,
              animationTimingFunction: `steps(${c.dur * STEPS_PER_SEC})`,
              animationDelay: `${c.delay}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
