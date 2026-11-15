import { useEffect, useState, type CSSProperties } from 'react'
import crossOff from '../../../../assets/prayer-week/window-dark-cross-off.webp'
import crossGlow from '../../../../assets/prayer-week/window-dark-cross-glow.webp'

/**
 * '이번주 기도' 카드(다크) 본당 십자가 점등 — 2026-11-16, prayerWeek.css 의 pw-cross-*.
 * 그림이 뜰 때 강단 벽 십자가는 불이 꺼져 있다가 '틱·틱·팟' 깜빡이며 켜지고, 그 뒤엔 아주 은은하게 숨쉰다.
 * 홈 히어로 점화(HeroLights)와 같은 방식 — 꺼진 조각(scripts/gen-prayer-cross.py → *-cross-off.webp)을
 * 사진 위에 덮었다가 걷어 내면 원래 사진 = 불 켜진 모습. 빛만 담은 *-cross-glow.webp 는 번쩍임·숨쉬기(screen).
 * 좌표는 원본 px(960×848) — 사진이 같은 비율 상자(.pw-art)에 너비 기준으로 깔리므로 % 로 정확히 겹친다.
 * 페이지를 새로 열 때 한 번만(모듈 플래그). ★BOX 는 gen-prayer-cross.py SX·SY·SW·SH 와 동기.
 */
const IMG_W = 960
const IMG_H = 848
const BOX = { x: 560, y: 300, w: 140, h: 200 } as const

let played = false

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const pct = (v: number, of: number) => `${(v / of) * 100}%`

const PrayerCrossLight = () => {
  // 조각 두 장을 받은 뒤 점화, 이미 했으면(또는 움직임 줄이기) 숨쉬기만
  const [phase, setPhase] = useState<'wait' | 'play' | 'idle'>(() => (played || reducedMotion() ? 'idle' : 'wait'))

  useEffect(() => {
    if (phase !== 'wait') return
    let alive = true
    let left = 2
    const done = () => {
      if (--left === 0 && alive) {
        played = true
        setPhase('play')
      }
    }
    for (const src of [crossOff, crossGlow]) {
      const img = new Image()
      img.onload = done
      img.onerror = () => alive && setPhase('idle')
      img.src = src
    }
    return () => {
      alive = false
    }
  }, [phase])

  if (phase === 'wait') return null

  const piece = (cls: string, src: string) => (
    <span className={`pw-cross-piece ${cls}`} style={{ backgroundImage: `url(${src})` } as CSSProperties} />
  )

  return (
    <div
      className={`pw-cross${phase === 'play' ? ' is-playing' : ''}`}
      style={{ left: pct(BOX.x, IMG_W), top: pct(BOX.y, IMG_H), width: pct(BOX.w, IMG_W), height: pct(BOX.h, IMG_H) }}
      aria-hidden="true"
    >
      {phase === 'play' && (
        <>
          {piece('pw-cross-off', crossOff)}
          {piece('pw-cross-bloom', crossGlow)}
        </>
      )}
      {piece('pw-cross-breathe', crossGlow)}
    </div>
  )
}

export default PrayerCrossLight
