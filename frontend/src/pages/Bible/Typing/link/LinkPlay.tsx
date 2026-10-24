import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useBodyScrollLock } from '../../../../hooks/useBodyScrollLock'
import type { LinkSet } from '../../../../api/bibleTyping'
import type { MannaSkin } from '../manna/mannaSkin'
import { formatNumberKo as fmt } from '../../../../utils/formatNumber'
import {
  BURST_EVERY,
  LIVES,
  LinkRun,
  PERFECT_BONUS,
  SPEED_BONUS_MAX,
  TICK_FROM,
  WRONG_PENALTY,
  comboMult,
  linkBurstText,
  type LinkResult,
} from './linkGame'
import { linkSfx } from './linkSound'

const Jar = ({ broken }: { broken: boolean }) => (
  <svg viewBox="0 0 16 20" className={broken ? 'is-broken' : undefined} aria-hidden>
    <path d="M5 1.5h6M5.5 1.5v3C2.5 6 1.5 8.5 1.5 12c0 4 2.5 6.5 6.5 6.5s6.5-2.5 6.5-6.5c0-3.5-1-6-4-7.5v-3" />
  </svg>
)

const buzz = (p: number | number[]) => {
  try {
    navigator.vibrate?.(p)
  } catch {
    /* 진동 없는 기기 */
  }
}

// ── 레이어 위 연출 — React 밖에서 붙였다 떼는 일회성 요소 ─────────────

const popAt = (host: HTMLElement, anchor: DOMRect, label: string, good: boolean) => {
  const p = document.createElement('div')
  p.className = `vl-pop${good ? ' is-good' : ''}`
  p.textContent = label
  p.style.left = `${anchor.left + anchor.width / 2}px`
  p.style.top = `${anchor.top - 10}px`
  host.appendChild(p)
  window.setTimeout(() => p.remove(), 820)
}

const burstText = (host: HTMLElement, text: string) => {
  const b = document.createElement('div')
  b.className = 'vl-burst'
  b.textContent = text
  host.appendChild(b)
  window.setTimeout(() => b.remove(), 950)
}

/** 누른 조각이 빈칸으로 날아간다 */
const flyTo = (host: HTMLElement, from: DOMRect, to: DOMRect, text: string, done: () => void) => {
  const f = document.createElement('div')
  f.className = 'vl-flyer'
  f.textContent = text
  f.style.left = `${from.left}px`
  f.style.top = `${from.top}px`
  host.appendChild(f)
  const dx = to.left + to.width / 2 - (from.left + from.width / 2)
  const dy = to.top + to.height / 2 - (from.top + from.height / 2)
  f.animate(
    [
      { transform: 'translate(0,0) rotate(0) scale(1)' },
      { transform: `translate(${dx * 0.4}px,${dy * 0.5 - 50}px) rotate(-10deg) scale(1.15)`, offset: 0.45 },
      { transform: `translate(${dx}px,${dy}px) rotate(0) scale(.7)`, opacity: 0.3 },
    ],
    { duration: 360, easing: 'cubic-bezier(.4,0,.2,1)' },
  ).onfinish = () => {
    f.remove()
    done()
  }
}

/** 스티커 색종이(아케이드는 네모 도트) */
const confettiOn = (host: HTMLElement, arcade: boolean) => {
  const cs = getComputedStyle(host)
  const cols = ['--vl-hot', '--vl-acc', '--vl-sky', '--vl-gold'].map((k) => cs.getPropertyValue(k))
  const w = host.clientWidth
  for (let i = 0; i < 34; i++) {
    const c = document.createElement('div')
    c.className = 'vl-conf'
    const s = 8 + Math.random() * 10
    const round = arcade ? '0' : Math.random() < 0.5 ? '50%' : '3px'
    c.style.cssText = `width:${s}px;height:${arcade ? s : s * (Math.random() < 0.5 ? 1 : 0.55)}px;background:${cols[i % 4]};left:${w / 2}px;top:22%;border-radius:${round}`
    host.appendChild(c)
    const ang = Math.random() * Math.PI * 2
    const d = 110 + Math.random() * 190
    c.animate(
      [{ transform: 'translate(0,0) rotate(0)' }, { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d + 220}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }],
      { duration: 1100 + Math.random() * 700, easing: 'cubic-bezier(.1,.7,.3,1)' },
    ).onfinish = () => c.remove()
  }
}

const restart = (el: HTMLElement | null, cls: string) => {
  if (!el) return
  el.classList.remove(cls)
  void el.offsetWidth
  el.classList.add(cls)
}

interface Reveal {
  ref: string
  words: string[]
  perfect: boolean
  secs: number
  speed: number
  last: boolean
}

/**
 * 한 판 — 화면 전체를 덮는 포털. 규칙은 LinkRun 하나에서만 바뀌고 화면은 snapshot 을 그린다.
 * 퓨즈·시계는 다시 그리지 않고 DOM 에 바로 쓰고, 날아가는 조각·점수 팝·색종이는 레이어에 직접 붙인다.
 */
const LinkPlay = ({ set, skin, onOver, onQuit }: { set: LinkSet; skin: MannaSkin; onOver: (r: LinkResult) => void; onQuit: () => void }) => {
  useBodyScrollLock()
  const arcade = skin === 'arcade'
  const [run] = useState(() => new LinkRun(set.verses, set.seed))
  const [view, setView] = useState(() => run.snapshot())
  const sync = useCallback(() => setView(run.snapshot()), [run])
  const [reveal, setReveal] = useState<Reveal | null>(null)
  const [hintId, setHintId] = useState<number | null>(null)
  const [badId, setBadId] = useState<number | null>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const fuseRef = useRef<HTMLDivElement>(null)
  const fuseTxtRef = useRef<HTMLSpanElement>(null)
  const timerRef = useRef<HTMLSpanElement>(null)
  const scoreRef = useRef<HTMLSpanElement>(null)
  const slotRefs = useRef<(HTMLSpanElement | null)[]>([])
  const idleRef = useRef(0)
  const timers = useRef<number[]>([])
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }
  useEffect(() => {
    const ts = timers.current
    return () => {
      ts.forEach(clearTimeout)
      clearTimeout(idleRef.current)
    }
  }, [])

  const finish = useCallback(
    (cleared: boolean) => {
      const r = run.finish(cleared)
      if (r) onOver(r)
    },
    [run, onOver],
  )

  // 스피드 퓨즈·시계 — 30% 아래부터 째깍째깍이 점점 빨라진다
  useEffect(() => {
    let raf = 0
    let nextTick = 0
    let alt = false
    const loop = () => {
      if (run.isActive) {
        const now = performance.now()
        const { left, elapsed } = run.fuse(now)
        fuseRef.current?.style.setProperty('--left', left.toFixed(4))
        fuseRef.current?.classList.toggle('is-low', left < TICK_FROM)
        if (timerRef.current) timerRef.current.textContent = `${(elapsed / 1000).toFixed(1)}초`
        if (fuseTxtRef.current) {
          const bonus = Math.round(left * SPEED_BONUS_MAX)
          fuseTxtRef.current.textContent =
            left > 0 ? (arcade ? `SPEED BONUS +${bonus}` : `스피드 보너스 +${bonus}`) : arcade ? 'NO BONUS' : '보너스 끝 · 천천히 이어도 괜찮아요'
        }
        if (left > 0 && left < TICK_FROM && now >= nextTick) {
          alt = !alt
          linkSfx.tick(alt)
          nextTick = now + 110 + (left / TICK_FROM) * 300
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [run, arcade])

  // 6초 동안 손을 놓으면 다음 조각이 살짝 들썩인다
  const armHint = useCallback(() => {
    clearTimeout(idleRef.current)
    setHintId(null)
    idleRef.current = window.setTimeout(() => setHintId(run.wantedPiece()), 6000)
  }, [run])
  // 첫 절의 힌트 시계 — 이후로는 누를 때마다 armHint 가 다시 건다
  useEffect(() => {
    idleRef.current = window.setTimeout(() => setHintId(run.wantedPiece()), 6000)
  }, [run])

  const completeVerse = () => {
    const { speed, perfect, secs } = run.completeVerse()
    sync()
    const words = view.verse.text.split(/\s+/).filter(Boolean)
    setReveal({ ref: view.verse.ref, words, perfect, secs, speed, last: run.isLastRound })
    // 도장 쾅 → 흔들림·색종이, 그 뒤 하프와 할렐루야
    later(() => {
      linkSfx.stamp()
      restart(layerRef.current, 'is-shake')
      buzz([20, 30, 60])
      if (layerRef.current) confettiOn(layerRef.current, arcade)
    }, 120)
    linkSfx.complete()
    if (arcade) words.forEach((_, i) => later(() => linkSfx.word(i, true), 650 + i * 110))
  }

  const tap = (pieceId: number, el: HTMLElement) => {
    const host = layerRef.current
    const anchor = el.getBoundingClientRect()
    const text = el.textContent ?? ''
    const out = run.tap(pieceId)
    if (out.kind === 'ignored') return
    scoreRef.current?.animate([{ transform: 'scale(1.3) rotate(-4deg)' }, { transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.3,1.6,.5,1)' })
    if (out.kind === 'hit') {
      linkSfx.tap(out.slot, arcade)
      buzz(8)
      if (host) popAt(host, anchor, out.mult > 1 ? `+${out.pts} ×${out.mult}` : `+${out.pts}`, true)
      if (out.combo === 3) linkSfx.slide()
      if (out.combo % BURST_EVERY === 0) {
        if (host) burstText(host, linkBurstText(arcade, out.combo))
        linkSfx.slide()
        linkSfx.crowd(Math.min(3, out.combo / BURST_EVERY) as 1 | 2 | 3)
      }
      const slot = slotRefs.current[out.slot]
      const land = () => {
        run.land(out.slot)
        sync()
      }
      if (host && slot) flyTo(host, anchor, slot.getBoundingClientRect(), text, land)
      else land()
      if (out.roundDone) {
        clearTimeout(idleRef.current)
        setHintId(null)
        later(completeVerse, 480)
      } else armHint()
    } else {
      buzz([30, 40, 30])
      restart(host, 'is-shake')
      if (host) popAt(host, anchor, arcade ? 'MISS' : `−${WRONG_PENALTY}`, false)
      setBadId(null)
      requestAnimationFrame(() => setBadId(pieceId))
      later(() => setBadId((b) => (b === pieceId ? null : b)), 420)
      linkSfx.crack(out.lives <= 0)
      if (out.lives <= 0) later(() => finish(false), 900)
    }
    sync()
  }

  const next = () => {
    linkSfx.click(arcade)
    setReveal(null)
    if (run.isLastRound) return finish(true)
    run.nextRound()
    slotRefs.current = []
    sync()
    armHint()
  }

  const mult = comboMult(view.combo)
  const revealStep = arcade ? 110 : 150
  const revealEnd = reveal ? 650 + reveal.words.length * revealStep : 0

  return createPortal(
    <div ref={layerRef} className={`vl-game vl-skin vl-skin--${skin}`} role="application" aria-label="말씀 잇기">
      <div className="vl-game__col">
        <header className="vl-hud">
          <button type="button" className="vl-hudbtn" onClick={onQuit} aria-label="그만하기">
            <span className="material-icons-round">close</span>
          </button>
          <div className="vl-hud__name">
            <small>
              {view.round + 1} / {run.total}절
            </small>
            <b>{view.verse.ref}</b>
          </div>
          <div className="vl-jars" aria-label={`항아리 ${view.lives}개 남음`}>
            {Array.from({ length: LIVES }, (_, i) => (
              <Jar key={i} broken={i >= view.lives} />
            ))}
          </div>
        </header>
        <div className="vl-scorebox">
          <span ref={scoreRef} className="vl-score">
            {fmt(view.score)}
          </span>
          <span className={`vl-combo${view.combo >= 3 ? ' is-on' : ''}`}>
            {view.combo >= 3 && (arcade ? `${view.combo} COMBO ×${mult}` : `🔥 ${view.combo}콤보 ×${mult}`)}
          </span>
        </div>
        <div ref={fuseRef} className="vl-fuse" style={{ '--left': 1 } as CSSProperties}>
          <i />
        </div>
        <div className="vl-fuse-lbl">
          <span ref={fuseTxtRef} />
          <span ref={timerRef} />
        </div>

        <div className="vl-vcard">
          <span className="vl-vref">{view.verse.ref}</span>
          <div className="vl-vline">
            {view.parts.map((p, i) => (
              <span
                key={`${view.round}-${i}`}
                ref={(el) => {
                  slotRefs.current[i] = el
                }}
                className={`vl-blank${i < view.landed ? ' is-got' : ''}${i === view.idx && !view.roundDone ? ' is-next' : ''}`}
              >
                {i < view.landed ? <span>{p}</span> : <span className="vl-blank__ghost">{p}</span>}
              </span>
            ))}
          </div>
        </div>

        <div className="vl-pool">
          {view.pieces.map((p, k) => (
            <button
              key={`${view.round}-${p.id}`}
              type="button"
              className={`vl-chip${view.used.has(p.id) ? ' is-used' : ''}${hintId === p.id ? ' is-hint' : ''}${badId === p.id ? ' is-bad' : ''}`}
              style={{ '--tilt': `${p.tilt}deg`, animationDelay: `${k * 45}ms` } as CSSProperties}
              onClick={(e) => tap(p.id, e.currentTarget)}
            >
              {p.text}
            </button>
          ))}
        </div>
      </div>

      {reveal && (
        <div className="vl-reveal">
          <div className={`vl-stamp${reveal.perfect ? ' is-perfect' : ''}`}>
            {arcade ? (reveal.perfect ? 'PERFECT!' : 'CLEAR!') : reveal.perfect ? '완벽 새김!' : '새김!'}
          </div>
          <div className="vl-rcard">
            <p className="vl-rverse">
              {reveal.words.map((w, i) => (
                <span key={i} className="vl-w" style={{ animationDelay: `${650 + i * revealStep}ms` }}>
                  {w}{' '}
                </span>
              ))}
            </p>
            <p className="vl-rref" style={{ animationDelay: `${revealEnd + 100}ms` }}>
              — {reveal.ref}
            </p>
            <div className="vl-rstats" style={{ animationDelay: `${revealEnd + 300}ms` }}>
              <div>
                <b>{reveal.secs.toFixed(1)}s</b>
                {arcade ? 'TIME' : '걸린 시간'}
              </div>
              <div className={reveal.speed ? 'is-lime' : ''}>
                <b>+{reveal.speed}</b>
                {arcade ? 'SPEED' : '스피드'}
              </div>
              <div className={reveal.perfect ? 'is-lime' : ''}>
                <b>{reveal.perfect ? `+${PERFECT_BONUS}` : '—'}</b>
                {arcade ? 'NO MISS' : '무실수'}
              </div>
            </div>
            <button type="button" className="vl-cta vl-rnext" style={{ animationDelay: `${revealEnd + 500}ms` }} onClick={next}>
              <span>{reveal.last ? (arcade ? 'RESULT' : '결과 보기') : arcade ? 'NEXT STAGE' : '다음 절'}</span>
              <span aria-hidden>→</span>
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  )
}

export default LinkPlay
