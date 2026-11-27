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
 * 움직임은 CSS 애니메이션(transform, linear)뿐이라 JS 루프가 없다. 동작 줄이기면 제자리에 멈춘다. */

type Sky = 'clear' | 'partly' | 'overcast'

/* 구름 한 점: 세로 자리(하늘 구간 안 0~1)·크기·한 바퀴 시간(초)·출발 지연(음수 = 이미 떠 있는 상태로 시작) */
/* ★ 2026-11-27: 한 바퀴 150~240초(초당 2px 남짓)는 "실제 구름은 느릿느릿 가는데 왜 이리 빨리 지나가나"
 *   피드백 — 3배 늦췄다(450~720초, 초당 0.5~0.9px). 눈을 떼었다 보면 조금 옮겨 가 있는 정도가 맞다. */
const CLOUDS = [
  { k: 0.12, scale: 1, dur: 450, delay: -120 },
  { k: 0.62, scale: 0.72, dur: 630, delay: -450 },
  { k: 0.36, scale: 0.85, dur: 540, delay: -315 },
  { k: 0.82, scale: 0.6, dur: 720, delay: -60 },
]
/* ★ 움직임은 linear(매 프레임)로 둔다 — 계단식(steps)으로 되돌리지 말 것.
 *   합성 비용을 줄이려고 초당 5번 → 15번 → 8번 계단식으로 옮겨 봤지만(2026-11-22~27), 걸음을 아무리 잘게 해도
 *   "득득득득 움직인다, 보고 있으면 멀미 난다"는 피드백이 반복됐다(2026-11-27). 멈췄다 가는 박자 자체가 눈에 걸린다.
 *   매 프레임 옮기면 마스크 걸린 칸을 그때마다 다시 합성하는 비용이 들지만(실측: 갱신 횟수에 비례),
 *   끊김 없이 흘러가는 쪽이 우선이다. 비용을 줄여야 하면 계단식 말고 다른 길(구름 수·칸 크기)을 찾을 것 */
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
              animationDelay: `${c.delay}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
