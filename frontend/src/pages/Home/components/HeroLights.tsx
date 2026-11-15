import { useEffect, useState, type CSSProperties } from 'react'
import type { NaturalSeason } from '../../../utils/naturalSeason'
import offSpring from '../../../assets/hero/church-spring-night-off.webp'
import offSummer from '../../../assets/hero/church-summer-night-off.webp'
import offAutumn from '../../../assets/hero/church-autumn-night-off.webp'
import offWinter from '../../../assets/hero/church-winter-night-off.webp'
import glowSpring from '../../../assets/hero/church-spring-night-glow.webp'
import glowSummer from '../../../assets/hero/church-summer-night-glow.webp'
import glowAutumn from '../../../assets/hero/church-autumn-night-glow.webp'
import glowWinter from '../../../assets/hero/church-winter-night-glow.webp'
import './styles/meditation-hero-lights.css'

/**
 * 별똥별 점화(다크 · 교회 밤 히어로 전용, 2026-11-15 · 2026-11-16 간판 낙뢰로 변경, styles/meditation-hero-lights.css)
 * 불이 꺼진 예배당 → 하늘에서 별똥별이 간판 '참빛교회' 한가운데 벽에 떨어져 번갯불이 튀고 →
 * 가운데 '빛·교'부터 바깥 '참·회'로 글자가 '틱·틱·팟' 켜지고 → 처마 LED 띠가 흐르고 →
 * 마지막에 십자가가 조용히 켜진다. 그 뒤엔 십자가만 아주 은은하게 숨쉰다.
 * 페이지를 새로 열 때 한 번만(모듈 플래그) — 홈을 오갈 때마다 3초씩 보여 주면 지친다.
 *
 * 꺼진 모습은 사진에서 빛 픽셀만 오려 벽으로 메운 조각(scripts/gen-hero-lights.py → *-off.webp)을
 * 사진 위에 덮어 만든다. 조각을 걷어 내면(opacity 0) 원래 사진 = 불 켜진 모습. 빛만 담은 *-glow.webp 는
 * 켜지는 순간의 번쩍임·숨쉬기(screen 합성)에 쓴다.
 * 좌표는 모두 원본 사진 px(704×900) — 사진이 너비 기준 cover·위쪽 정렬로 깔리므로(meditation-card-hero.css
 * [data-hero^='church-']) 같은 비율 상자(.mhl-photo) 안의 % 로 옮기면 어떤 폭에서도 정확히 겹친다.
 * ★ SPRITE·영역은 gen-hero-lights.py 와 동기.
 */
const IMG_W = 704
const IMG_H = 900
const SPRITE = { x: 340, y: 90, w: 364, h: 290 } as const

const SPRITES: Record<NaturalSeason, { off: string; glow: string }> = {
  spring: { off: offSpring, glow: glowSpring },
  summer: { off: offSummer, glow: glowSummer },
  autumn: { off: offAutumn, glow: glowAutumn },
  winter: { off: offWinter, glow: glowWinter },
}

type Pt = readonly [number, number]
/* 처마 띠 — 종탑 밑(409,311)에서 오른쪽 위로 기울기 -0.299 인 선. 띠 조각은 선 위아래로, 글자 조각은 선 아래로 나눠
 * 두 조각이 겹치지 않는다(겹치면 같은 픽셀이 두 번 덮여 더 어두워진다) */
const lineY = (x: number) => 311 - (x - 409) * 0.299
const STRIP_X0 = 395
const BAND_UP = 26
const BAND_DOWN = 20

/* 원본 px 점들 → 조각 상자(SPRITE) 안 % 다각형 */
const poly = (pts: readonly Pt[]) =>
  `polygon(${pts
    .map(([x, y]) => `${(((x - SPRITE.x) / SPRITE.w) * 100).toFixed(2)}% ${(((y - SPRITE.y) / SPRITE.h) * 100).toFixed(2)}%`)
    .join(', ')})`

const X_END = SPRITE.x + SPRITE.w
const Y_END = SPRITE.y + SPRITE.h
const CROSS_CLIP = poly([
  [346, SPRITE.y],
  [434, SPRITE.y],
  [434, 232],
  [346, 232],
])
const stripPts = (x0: number): Pt[] => [
  [x0, lineY(x0) - BAND_UP],
  [X_END, lineY(X_END) - BAND_UP],
  [X_END, lineY(X_END) + BAND_DOWN],
  [x0, lineY(x0) + BAND_DOWN],
]
const STRIP_CLIP = poly(stripPts(STRIP_X0))
/* 흐름이 끝난 모양 — 왼쪽 두 점이 오른쪽 끝으로 미끄러져 띠가 오른쪽으로 사라진다(점 수가 같아야 보간된다) */
const STRIP_CLIP_DONE = poly(stripPts(X_END))
/* 글자 경계 = 이웃 글자 중심의 가운데(467·506·543·589 사이) */
const LETTER_X = [440, 486, 525, 566, 620] as const
const letterClip = (i: number) => {
  const x0 = LETTER_X[i]
  const x1 = LETTER_X[i + 1]
  return poly([
    [x0, lineY(x0) + BAND_DOWN],
    [x1, lineY(x1) + BAND_DOWN],
    [x1, Y_END],
    [x0, Y_END],
  ])
}

/* 타임라인(s) — CSS 키프레임 길이와 짝.
 * 번개는 십자가가 아니라 간판 '참빛교회' 한가운데 벽에 떨어진다(십자가에 번개 = 보수적인 교회 정서에 거슬림, 2026-11-16).
 * 가운데 '빛·교'부터 바깥 '참·회'로 → 처마 띠 → 마지막에 십자가가 조용히 켜진다.
 */
const T_METEOR = 0.45 // 별똥별 출발(1.0s 비행)
const T_IMPACT = 1.45 // 간판 벽에 닿음 — 번갯불
const T_LETTER = [1.78, 1.5, 1.56, 1.84] as const // 참·빛·교·회 — 맞은 자리에서 가까운 글자부터
const T_STRIP = 2.0 // 처마 띠 흐름(0.8s)
const T_CROSS = 2.75 // 십자가 깜빡이며 켜짐(0.7s)
const T_BREATHE = 4.0

/* 별똥별 — 종탑과 나무 사이 빈 하늘(455,-40)에서 간판 '빛'과 '교' 사이 벽(528,316)으로 */
const IMPACT: Pt = [528, 316]
const FROM: Pt = [455, -40]
const METEOR_LEN = Math.hypot(IMPACT[0] - FROM[0], IMPACT[1] - FROM[1])
const METEOR_ANGLE = (Math.atan2(IMPACT[1] - FROM[1], IMPACT[0] - FROM[0]) * 180) / Math.PI
/* 섬광 배율 — 벽에 맞으니 조금 크게 */
const FLASH_SCALE = 1.35

/* 번갯불 — 맞은 자리 둘레로 튀는 짧은 지그재그(px, 상자 폭과 무관한 작은 크기) */
const BOLTS = ['M0 0l-7 -5l3 -2l-8 -7', 'M0 0l8 -4l-2 -3l9 -5', 'M0 0l-9 3l2 3l-8 4', 'M0 0l6 6l-3 1l5 8'] as const
/* 불티 — 각도 deg, 거리 px. 벽에 맞으니 사방으로 */
const SPARKS = [
  [-165, 26], [-140, 34], [-115, 28], [-90, 38], [-65, 30], [-40, 34], [-15, 26],
  [10, 24], [35, 20], [150, 22], [175, 28], [-100, 46], [-55, 44],
] as const

let played = false

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const pct = (v: number, of: number) => `${(v / of) * 100}%`

const HeroLights = ({ season }: { season: NaturalSeason }) => {
  const { off, glow } = SPRITES[season]
  // 이번 페이지에서 처음이면 조각 두 장을 받은 뒤 점화, 이미 했으면 숨쉬기만
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
    for (const src of [off, glow]) {
      const img = new Image()
      img.onload = done
      img.onerror = () => alive && setPhase('idle')
      img.src = src
    }
    return () => {
      alive = false
    }
  }, [phase, off, glow])

  if (phase === 'wait') return null

  const sprite = (key: string, src: string, clip: string, cls: string, style?: CSSProperties) => (
    <span
      key={key}
      className={`mhl-piece ${cls}`}
      style={{
        backgroundImage: `url(${src})`,
        clipPath: clip,
        WebkitClipPath: clip,
        ...style,
      }}
    />
  )
  const on = (s: number) => ({ '--on': `${s}s` }) as CSSProperties

  return (
    <div className={`mhl${phase === 'play' ? ' is-playing' : ''}`} aria-hidden="true">
      <div className="mhl-photo">
        <div
          className="mhl-sprite"
          style={{
            left: pct(SPRITE.x, IMG_W),
            top: pct(SPRITE.y, IMG_H),
            width: pct(SPRITE.w, IMG_W),
            height: pct(SPRITE.h, IMG_H),
          }}
        >
          {phase === 'play' && (
            <>
              {/* 꺼진 조각 — 차례로 걷힌다 */}
              {sprite('off-cross', off, CROSS_CLIP, 'mhl-off', on(T_CROSS))}
              {sprite('off-strip', off, STRIP_CLIP, 'mhl-off mhl-off--flow', {
                ...on(T_STRIP),
                '--clip-from': STRIP_CLIP,
                '--clip-to': STRIP_CLIP_DONE,
              } as CSSProperties)}
              {[0, 1, 2, 3].map((i) => sprite(`off-l${i}`, off, letterClip(i), 'mhl-off', on(T_LETTER[i])))}
              {/* 켜지는 순간 번쩍 */}
              {sprite('bloom-cross', glow, CROSS_CLIP, 'mhl-bloom', on(T_CROSS + 0.55))}
              {sprite('bloom-strip', glow, STRIP_CLIP, 'mhl-bloom', on(T_STRIP + 0.3))}
              {[0, 1, 2, 3].map((i) => sprite(`bloom-l${i}`, glow, letterClip(i), 'mhl-bloom', on(T_LETTER[i] + 0.4)))}
            </>
          )}
          {/* 숨쉬기 — 십자가만 은은하게(점화 뒤, 다시 들어와도 계속) */}
          {sprite('breathe', glow, CROSS_CLIP, 'mhl-breathe', on(phase === 'play' ? T_BREATHE : 0))}
        </div>

        {phase === 'play' && (
          <>
            <span
              className="mhl-meteor"
              style={
                {
                  left: `calc(${pct(IMPACT[0], IMG_W)} - ${pct(METEOR_LEN, IMG_W)})`,
                  top: pct(IMPACT[1], IMG_H),
                  width: pct(METEOR_LEN, IMG_W),
                  transform: `rotate(${METEOR_ANGLE}deg)`,
                  '--on': `${T_METEOR}s`,
                } as CSSProperties
              }
            >
              <span className="mhl-meteor-train" />
              <span className="mhl-meteor-head" />
            </span>
            <span
              className="mhl-impact"
              style={{ left: pct(IMPACT[0], IMG_W), top: pct(IMPACT[1], IMG_H), '--on': `${T_IMPACT}s`, '--flash-scale': FLASH_SCALE } as CSSProperties}
            >
              <span className="mhl-flash" />
              <svg className="mhl-bolts" width="1" height="1">
                {BOLTS.map((d, i) => (
                  <path key={i} d={d} style={{ animationDelay: `calc(var(--on) + ${i * 0.05}s)` }} />
                ))}
              </svg>
              {SPARKS.map(([a, r], i) => (
                <span
                  key={i}
                  className="mhl-spark"
                  style={{ '--spark-angle': `${a}deg`, '--spark-r': `${r}px` } as CSSProperties}
                />
              ))}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

export default HeroLights
