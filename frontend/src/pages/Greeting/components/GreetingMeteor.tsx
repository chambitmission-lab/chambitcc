import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, RefObject } from 'react'

/* 인사말 히어로의 별똥별 — 다크(밤 은하수)에서 첫 진입 때 한 번만.
   히어로 오른쪽 위 하늘에서 출발해 아래 편지 카드의 목사님 사진으로 내려앉고,
   닿는 순간 섬광·충격파 링·불티가 터지고 빛무리가 번진 뒤 반짝 별 하나가 남았다 사라진다.
   사진 위치는 화면 폭마다 달라서 실제 좌표를 재서 궤적을 만든다.
   사진이 없거나(미등록) 늦게 뜨면 히어로 안 왼쪽 아래로 떨어진다. */

interface Geo {
  sx: number
  sy: number
  ex: number
  ey: number
  len: number
  angle: number
  dur: number
  tail: number
  landed: boolean
}

const START_DELAY = 800 // 화면이 자리 잡고 한숨 돌린 뒤
const PHOTO_WAIT = 2200 // 사진을 이만큼까지만 기다린다
const POLL = 120

/* 도착 불티 — 렌더마다 모양이 바뀌지 않게 고정값. 각도는 고르게 돌리되 살짝씩 흐트러뜨리고
   거리·길이·시간도 하나씩 달리해 기계적인 방사형으로 보이지 않게 한다 */
const SPARKS = Array.from({ length: 11 }, (_, i) => {
  const jitter = [7, -9, 4, -5, 11, -3, 8, -10, 2, -6, 5][i]
  return {
    a: (360 / 11) * i + jitter,
    d: 26 + ((i * 37) % 24),
    l: 6 + ((i * 5) % 7),
    t: 0.65 + ((i * 13) % 5) * 0.09,
  }
})

const isDark = () => document.documentElement.classList.contains('dark')
const prefersReduced = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function measure(host: HTMLElement, photo: HTMLElement | null): Geo | null {
  const hero = host.querySelector<HTMLElement>('.gr-hero-card')
  if (!hero) return null
  const h = host.getBoundingClientRect()
  const r = hero.getBoundingClientRect()
  const sx = r.left - h.left + r.width * 0.86
  const sy = r.top - h.top + r.height * 0.07

  let ex: number
  let ey: number
  let landed = false
  const p = photo?.getBoundingClientRect()
  if (p && p.width > 0 && p.height > 0) {
    // 얼굴 위로 번쩍이지 않게 사진 오른쪽 위 어깨쯤에 내려앉는다
    ex = p.left - h.left + p.width * 0.8
    ey = p.top - h.top + p.height * 0.12
    landed = true
  } else {
    ex = r.left - h.left + r.width * 0.5
    ey = r.top - h.top + r.height * 0.72
  }

  const dx = ex - sx
  const dy = ey - sy
  const len = Math.hypot(dx, dy)
  if (len < 40) return null
  return {
    sx,
    sy,
    ex,
    ey,
    len,
    angle: (Math.atan2(dy, dx) * 180) / Math.PI,
    dur: Math.min(1.25, Math.max(0.75, len / 650)),
    tail: Math.min(170, len * 0.32),
    landed,
  }
}

export default function GreetingMeteor({ hostRef }: { hostRef: RefObject<HTMLElement | null> }) {
  const [geo, setGeo] = useState<Geo | null>(null)
  const firedRef = useRef(false)

  useEffect(() => {
    if (firedRef.current || !isDark() || prefersReduced()) return
    let timer: ReturnType<typeof setTimeout>
    const startedAt = performance.now()

    const tick = () => {
      const host = hostRef.current
      if (!host) return
      const photo = host.querySelector<HTMLElement>('.gr-photo:not(.gr-photo--empty)')
      const ready =
        !!photo &&
        (!(photo instanceof HTMLImageElement) || photo.complete) &&
        photo.getBoundingClientRect().height > 0
      if (ready || performance.now() - startedAt > PHOTO_WAIT) {
        firedRef.current = true
        setGeo(measure(host, ready ? photo : null))
      } else {
        timer = setTimeout(tick, POLL)
      }
    }
    timer = setTimeout(tick, START_DELAY)
    return () => clearTimeout(timer)
  }, [hostRef])

  if (!geo) return null

  const vars = {
    '--gr-meteor-len': `${geo.len}px`,
    '--gr-meteor-dur': `${geo.dur}s`,
    '--gr-meteor-tail': `${geo.tail}px`,
  } as CSSProperties

  return (
    <span className="gr-meteor-layer" aria-hidden="true" style={vars}>
      <span
        className="gr-meteor-path"
        style={{ left: geo.sx, top: geo.sy, width: geo.len, transform: `rotate(${geo.angle}deg)` }}
      >
        <i className="gr-meteor-train" />
        <i className="gr-meteor" />
      </span>
      {geo.landed && (
        <span className="gr-meteor-land" style={{ left: geo.ex, top: geo.ey }}>
          <i className="gr-land-bloom" />
          <i className="gr-land-ring" />
          <i className="gr-land-ring gr-land-ring--2" />
          {SPARKS.map((sp, i) => (
            <i
              key={i}
              className="gr-land-spark"
              style={
                {
                  '--a': `${sp.a + geo.angle}deg`,
                  '--d': `${sp.d}px`,
                  '--l': `${sp.l}px`,
                  '--t': `${sp.t}s`,
                } as CSSProperties
              }
            />
          ))}
          <i className="gr-land-flash" />
          <i className="gr-land-twinkle" />
        </span>
      )}
    </span>
  )
}
