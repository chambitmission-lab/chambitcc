// /dev/cursor-trail — 마우스가 지나간 자리에 '빛 잔상' 시안 비교 (DEV 전용)
//
// 화면 전체를 덮는 canvas 한 장(pointer-events:none)에 그린다 — 실제 적용 때도 같은 구조.
// 포인터 좌표는 ref 에만 쌓고 rAF 로 그리므로 React 리렌더 없음.
// 마우스(pointerType=mouse)만 반응, prefers-reduced-motion 이면 실제 적용 땐 끈다.
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import './cursorTrailLab.css'

type Mode = 'light' | 'dark'

interface Variant {
  key: string
  name: string
  bench: string
  idea: string
}

const VARIANTS: Variant[] = [
  {
    key: 'a',
    name: '은은한 꼬리',
    bench: 'Linear · Vercel 랜딩의 얇은 커서 꼬리',
    idea: '가는 브랜드 블루 선이 0.4초 만에 사라져요. 가장 조용해서 매일 쓰는 화면에도 부담이 없어요.',
  },
  {
    key: 'b',
    name: '혜성 빛줄기',
    bench: 'Apple 이벤트 페이지 · 별똥별',
    idea: '흰 심지 + 푸른 번짐의 굵은 꼬리가 끝으로 갈수록 가늘어져요. 빠르게 움직일수록 길게 남아요.',
  },
  {
    key: 'c',
    name: '반딧불 빛가루',
    bench: '디즈니 팅커벨 요정 가루 · 여름밤 반딧불',
    idea: '지나간 자리에 금빛 가루가 톡톡 떨어져 위로 살짝 떠오르며 깜빡이다 사라져요.',
  },
  {
    key: 'd',
    name: '등불 장노출',
    bench: '장노출 사진의 라이트 페인팅',
    idea: '등불을 들고 지나간 것처럼 부드러운 빛 번짐이 겹겹이 쌓였다 천천히 식어요. 다크에선 앰버.',
  },
  {
    key: 'e',
    name: '별빛 반짝',
    bench: '성탄 카드 반짝이 · 듀오링고 축하 반짝',
    idea: '지나간 길 위로 작은 네 갈래 별이 하나씩 반짝 켜졌다 꺼져요. 멈추면 아무것도 없어요.',
  },
  {
    key: 'f',
    name: '새벽 물결',
    bench: '잔잔한 수면 · Stripe 물결',
    idea: '움직인 자리에서 얇은 빛 동그라미가 물결처럼 번져 나가요. 빠르게 움직일 때만 생겨요.',
  },
]

// ─── 그리기 엔진 ────────────────────────────────────────────

interface Pt {
  x: number
  y: number
  t: number
}
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  born: number
  life: number
  size: number
  hue: number
  phase: number
}

const BRAND = '49,130,246'

const useTrail = (variant: string, mode: Mode) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0
    let h = 0
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const pts: Pt[] = []
    const parts: Particle[] = []
    let last: Pt | null = null
    let acc = 0 // 이동 거리 누적 — 일정 거리마다 입자 생성
    const dark = mode === 'dark'

    const spawn = (x: number, y: number, now: number, speed: number) => {
      if (variant === 'c') {
        const n = 1 + Math.floor(Math.random() * 2)
        for (let i = 0; i < n; i++) {
          parts.push({
            x: x + (Math.random() - 0.5) * 6,
            y: y + (Math.random() - 0.5) * 6,
            vx: (Math.random() - 0.5) * 0.25,
            vy: -0.15 - Math.random() * 0.35,
            born: now,
            life: 900 + Math.random() * 700,
            size: 1 + Math.random() * 2.2,
            hue: 38 + Math.random() * 14,
            phase: Math.random() * Math.PI * 2,
          })
        }
      } else if (variant === 'd') {
        parts.push({ x, y, vx: 0, vy: 0, born: now, life: 1500, size: 26, hue: 0, phase: 0 })
      } else if (variant === 'e') {
        parts.push({
          x: x + (Math.random() - 0.5) * 18,
          y: y + (Math.random() - 0.5) * 18,
          vx: 0,
          vy: 0,
          born: now,
          life: 700 + Math.random() * 400,
          size: 4 + Math.random() * 6,
          hue: Math.random() < 0.3 ? 44 : 214,
          phase: Math.random() * Math.PI,
        })
      } else if (variant === 'f' && speed > 0.6) {
        parts.push({ x, y, vx: 0, vy: 0, born: now, life: 1100, size: 40 + speed * 18, hue: 0, phase: 0 })
      }
    }

    const step: Record<string, number> = { c: 9, d: 14, e: 34, f: 46 }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const now = performance.now()
      const events = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : []
      const list = events.length ? events : [e]
      for (const ev of list) {
        const p = { x: ev.clientX, y: ev.clientY, t: now }
        if (last) {
          const d = Math.hypot(p.x - last.x, p.y - last.y)
          const dt = Math.max(1, now - last.t)
          acc += d
          const gap = step[variant]
          if (gap) {
            while (acc >= gap) {
              acc -= gap
              spawn(p.x, p.y, now, d / dt)
            }
          }
        }
        pts.push(p)
        last = p
      }
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    let raf = 0
    const drawRibbon = (now: number, life: number, maxW: number, core: boolean) => {
      while (pts.length && now - pts[0].t > life) pts.shift()
      if (pts.length < 2) return
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1]
        const b = pts[i]
        const k = 1 - (now - b.t) / life // 1=방금, 0=사라짐
        if (k <= 0) continue
        const ease = k * k
        if (core) {
          // 바깥 번짐
          ctx.strokeStyle = `rgba(${BRAND},${0.22 * ease})`
          ctx.lineWidth = maxW * 2.6 * k
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
          ctx.strokeStyle = `rgba(${BRAND},${0.55 * ease})`
          ctx.lineWidth = maxW * 1.3 * k
          ctx.stroke()
          ctx.strokeStyle = dark ? `rgba(255,255,255,${0.9 * ease})` : `rgba(255,255,255,${0.95 * ease})`
          ctx.lineWidth = Math.max(0.6, maxW * 0.45 * k)
          ctx.stroke()
        } else {
          ctx.strokeStyle = `rgba(${dark ? '120,170,255' : BRAND},${0.7 * ease})`
          ctx.lineWidth = Math.max(0.5, maxW * k)
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
      }
    }

    const frame = () => {
      raf = requestAnimationFrame(frame)
      const now = performance.now()
      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over'

      if (variant === 'a') drawRibbon(now, 400, 2.2, false)
      else if (variant === 'b') drawRibbon(now, 650, 5, true)
      else {
        // 점 기록은 입자 생성용 — 오래된 건 버린다
        while (pts.length && now - pts[0].t > 200) pts.shift()
      }

      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]
        const age = now - p.born
        if (age > p.life) {
          parts.splice(i, 1)
          continue
        }
        const k = 1 - age / p.life

        if (variant === 'c') {
          p.x += p.vx
          p.y += p.vy
          p.vy *= 0.995
          const tw = 0.55 + 0.45 * Math.sin(age / 90 + p.phase)
          const a = k * tw
          const r = p.size * (0.6 + 0.4 * k)
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 4)
          const col = dark ? `hsla(${p.hue},100%,70%,` : `hsla(${p.hue},95%,52%,`
          g.addColorStop(0, `${col}${a})`)
          g.addColorStop(0.25, `${col}${a * 0.55})`)
          g.addColorStop(1, `${col}0)`)
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(p.x, p.y, r * 4, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = `rgba(255,255,255,${a * (dark ? 0.9 : 0.8)})`
          ctx.beginPath()
          ctx.arc(p.x, p.y, r * 0.5, 0, Math.PI * 2)
          ctx.fill()
        } else if (variant === 'd') {
          const r = p.size * (1 + (1 - k) * 0.6)
          const a = k * k * (dark ? 0.32 : 0.2)
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r)
          const col = dark ? '255,176,82' : BRAND
          g.addColorStop(0, `rgba(${dark ? '255,236,200' : '170,205,255'},${a * 1.4})`)
          g.addColorStop(0.35, `rgba(${col},${a})`)
          g.addColorStop(1, `rgba(${col},0)`)
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
          ctx.fill()
        } else if (variant === 'e') {
          // 켜졌다(0~30%) 꺼지는(30~100%) 반짝임
          const t = age / p.life
          const s = t < 0.3 ? t / 0.3 : 1 - (t - 0.3) / 0.7
          const r = p.size * s
          const col = p.hue === 44 ? (dark ? '255,214,120' : '230,160,20') : dark ? '150,195,255' : BRAND
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.phase + t * 0.8)
          ctx.fillStyle = `rgba(${col},${0.95 * s})`
          ctx.beginPath()
          for (let j = 0; j < 4; j++) {
            const ang = (j * Math.PI) / 2
            ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r)
            ctx.lineTo(Math.cos(ang + Math.PI / 4) * r * 0.22, Math.sin(ang + Math.PI / 4) * r * 0.22)
          }
          ctx.closePath()
          ctx.fill()
          ctx.fillStyle = `rgba(255,255,255,${0.9 * s})`
          ctx.beginPath()
          ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        } else if (variant === 'f') {
          const t = 1 - k
          const r = 4 + p.size * (1 - Math.pow(1 - t, 3))
          ctx.strokeStyle = `rgba(${dark ? '140,185,255' : BRAND},${0.45 * k * k})`
          ctx.lineWidth = 1.5 * k + 0.3
          ctx.beginPath()
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
          ctx.stroke()
          if (t < 0.5) {
            ctx.strokeStyle = `rgba(${dark ? '140,185,255' : BRAND},${0.2 * (1 - t * 2)})`
            ctx.beginPath()
            ctx.arc(p.x, p.y, r * 0.55, 0, Math.PI * 2)
            ctx.stroke()
          }
        }
      }
      ctx.globalCompositeOperation = 'source-over'
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('resize', resize)
      ctx.clearRect(0, 0, w, h)
    }
  }, [variant, mode])

  return canvasRef
}

// ─── 화면 ──────────────────────────────────────────────────

const CursorTrailLab = () => {
  const [params, setParams] = useSearchParams()
  const vKey = params.get('v') ?? 'a'
  const variant = VARIANTS.find((v) => v.key === vKey) ?? VARIANTS[0]
  const [mode, setMode] = useState<Mode>(() =>
    document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light',
  )
  const canvasRef = useTrail(variant.key, mode)

  return (
    <div className={`ctl-page ctl-${mode}`}>
      <canvas ref={canvasRef} className="ctl-canvas" aria-hidden />

      <header className="ctl-head">
        <p className="ctl-kicker">마우스 빛 잔상 시안 · DEV</p>
        <h1 className="ctl-title">화면 위로 마우스를 움직여 보세요</h1>

        <div className="ctl-switch" role="tablist">
          {VARIANTS.map((v) => (
            <button
              key={v.key}
              type="button"
              role="tab"
              aria-selected={v.key === variant.key}
              className={`ctl-btn ${v.key === variant.key ? 'is-on' : ''}`}
              onClick={() => setParams({ v: v.key }, { replace: true })}
            >
              <span className="ctl-letter">{v.key.toUpperCase()}</span>
              {v.name}
            </button>
          ))}
          <button
            type="button"
            className="ctl-btn ctl-mode"
            onClick={() => setMode((m) => (m === 'dark' ? 'light' : 'dark'))}
          >
            {mode === 'dark' ? '☀ 라이트로' : '☾ 다크로'}
          </button>
        </div>

        <div className="ctl-note">
          <strong>
            {variant.key.toUpperCase()}. {variant.name}
          </strong>
          <span className="ctl-bench">참고: {variant.bench}</span>
          <p>{variant.idea}</p>
        </div>
      </header>

      {/* 실제 화면 위에서 어떻게 보이는지 — 홈 카드 흉내 */}
      <main className="ctl-stage">
        <section className="ctl-card ctl-card-verse">
          <p className="ctl-card-kicker">오늘의 말씀</p>
          <p className="ctl-verse">
            “너희는 세상의 빛이라 산 위에 있는 동네가 숨겨지지 못할 것이요”
          </p>
          <p className="ctl-ref">마태복음 5:14</p>
        </section>
        <section className="ctl-card">
          <p className="ctl-card-kicker">이번 주 예배</p>
          <ul className="ctl-list">
            <li>
              <span>주일 오전 예배</span>
              <b>11:00</b>
            </li>
            <li>
              <span>주일 오후 예배</span>
              <b>14:00</b>
            </li>
            <li>
              <span>수요 기도회</span>
              <b>19:30</b>
            </li>
          </ul>
        </section>
        <section className="ctl-card">
          <p className="ctl-card-kicker">함께 기도해요</p>
          <p className="ctl-body">
            새로 오신 가족들이 교회 안에서 따뜻한 쉼을 얻도록, 이번 주 중보기도에 마음을 모아 주세요.
          </p>
          <button type="button" className="ctl-cta">
            기도하러 가기
          </button>
        </section>
      </main>
    </div>
  )
}

export default CursorTrailLab
