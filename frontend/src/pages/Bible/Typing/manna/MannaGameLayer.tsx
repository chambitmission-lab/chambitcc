import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useBodyScrollLock } from '../../../../hooks/useBodyScrollLock'
import { useTickingNow } from '../../../../hooks/useTickingNow'
import type { MannaLiveEvent, MannaSet } from '../../../../api/bibleTyping'
import { notificationStream } from '../../../../utils/notificationStream'
import { parseApiDate } from '../../../../utils/dateUtils'
import { formatNumberKo as fmt } from '../../../../utils/formatNumber'
import { playTypingSound } from '../typingSound'
import {
  MAX_JARS,
  MannaGame,
  SLOW_SECONDS,
  PLACES,
  type MannaBanner,
  type MannaFlow,
  type MannaHud,
  type MannaMode,
  type MannaResult,
  type MannaVerseView,
} from './mannaEngine'
import { BURST_EVERY, burstText, isTouchDevice } from './mannaSkin'
import { Avatar } from './MannaAvatar'
import { leftLabel, modeLabel, type Rival } from './mannaPageShared'

const Dunes = () => (
  <svg className="mn-dunes" viewBox="0 0 400 56" preserveAspectRatio="none" aria-hidden>
    <path className="mn-dunes__back" d="M0 24 C 60 8, 120 36, 200 20 S 330 4, 400 22 V56 H0Z" />
    <path className="mn-dunes__front" d="M0 38 C 80 24, 150 48, 240 34 S 360 26, 400 36 V56 H0Z" />
  </svg>
)

// ── 한 판 ─────────────────────────────────────────────

export const MannaGameLayer = ({
  set,
  mode,
  rival,
  liveKey,
  liveEndsAt,
  onOver,
  onQuitEarly,
}: {
  set: MannaSet
  mode: MannaMode
  rival: Rival | null
  liveKey: string | null
  liveEndsAt: string | null
  onOver: (r: MannaResult) => void
  onQuitEarly: () => void
}) => {
  // 휴대폰 타이핑은 화면 키보드가 아래 절반을 덮는다 — 남은 낮고 넓은 무대에 맞춰 가로로 흘려 보낸다
  const flow: MannaFlow = isTouchDevice() ? 'left' : 'down'
  const layerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<MannaGame | null>(null)
  const pendingEnter = useRef(false)
  const keySoundAt = useRef(0)

  const [hud, setHud] = useState<MannaHud>({ score: 0, combo: 0, mult: 1, jars: MAX_JARS, done: 0, fever: false, slow: false })
  const [verse, setVerse] = useState<MannaVerseView | null>(null)
  const [banner, setBanner] = useState<MannaBanner | null>(null)
  const [toast, setToast] = useState<{ id: number; text: string; tone?: 'live' | 'rival' } | null>(null)
  const [ticker, setTicker] = useState<{ id: number; text: string } | null>(null)
  const [paused, setPaused] = useState(false)
  const [lostJar, setLostJar] = useState(-1)
  // 10콤보마다 화면 가운데 한 번 터지는 문구(스킨마다 말투가 다르다)
  const [burst, setBurst] = useState<{ id: number; text: string } | null>(null)
  const lastBurst = useRef(0)
  const prevJars = useRef(MAX_JARS)
  const aheadRef = useRef<boolean | null>(null)
  const rivalRef = useRef(rival)
  const onOverRef = useRef(onOver)
  useEffect(() => {
    onOverRef.current = onOver
    rivalRef.current = rival
  }, [onOver, rival])
  const now = useTickingNow(1000, !!liveEndsAt)

  // 게임 층이 떠 있는 동안 뒤 페이지는 스크롤되지 않게
  useBodyScrollLock()

  // 화면 키보드가 올라와도 입력칸이 보이게 — 보이는 영역에 맞춘다
  useEffect(() => {
    const layer = layerRef.current
    const vv = window.visualViewport
    if (!layer) return
    const fit = () => {
      if (!vv) return
      layer.style.setProperty('--mn-vvh', `${vv.height}px`)
      layer.style.setProperty('--mn-vvt', `${vv.offsetTop}px`)
    }
    fit()
    vv?.addEventListener('resize', fit)
    vv?.addEventListener('scroll', fit)
    return () => {
      vv?.removeEventListener('resize', fit)
      vv?.removeEventListener('scroll', fit)
    }
  }, [])

  useEffect(() => {
    // 마운트마다 새 판 — StrictMode 는 붙였다 떼고 다시 붙이므로 '한 번만' 막으면 정리된 판만 남는다
    const stage = stageRef.current
    if (!stage) return
    prevJars.current = MAX_JARS
    aheadRef.current = null
    const game = new MannaGame({
      stage,
      verses: set.verses.map((v) => ({ ref: v.ref, text: v.text })),
      mode,
      seed: set.seed,
      flow,
      callbacks: {
        onHud: (h) => {
          if (h.jars < prevJars.current) setLostJar(h.jars)
          prevJars.current = h.jars
          if (h.combo < lastBurst.current) lastBurst.current = 0
          if (h.combo >= BURST_EVERY && h.combo % BURST_EVERY === 0 && h.combo !== lastBurst.current) {
            lastBurst.current = h.combo
            setBurst({ id: Date.now(), text: burstText(h.combo) })
          }
          setHud(h)
        },
        onVerse: setVerse,
        onBanner: (b) => {
          setBanner(b)
          // 고스트 라이벌 — 절을 새길 때 같은 자리에서 비교해 앞지름·역전을 알린다
          const rv = rivalRef.current
          if (!b || !rv || rv.is_me) return
          const theirs = rv.checkpoints[b.done - 1]
          const ahead = theirs === undefined ? b.score > rv.score : b.score > theirs
          if (aheadRef.current !== null && ahead !== aheadRef.current) {
            setToast({ id: Date.now(), text: ahead ? `${rv.name}님을 앞질렀어요!` : `${rv.name}님이 다시 앞섰어요`, tone: 'rival' })
          }
          aheadRef.current = ahead
        },
        onToast: (text) => setToast({ id: Date.now(), text }),
        onShake: () => {
          const bar = barRef.current
          if (!bar) return
          bar.classList.remove('is-shake')
          void bar.offsetWidth
          bar.classList.add('is-shake')
        },
        onOver: (r) => onOverRef.current(r),
      },
    })
    gameRef.current = game
    game.start()
    inputRef.current?.focus()
    return () => {
      game.destroy()
      gameRef.current = null
    }
  }, [set, mode, flow])

  // 라이브 — 창 안에서 한 판을 마친 사람의 점수가 흘러간다
  useEffect(() => {
    if (!liveKey) return
    const off = notificationStream.on('manna_live', (raw) => {
      try {
        const ev = JSON.parse(raw) as MannaLiveEvent
        if (ev.live_key !== liveKey) return
        setTicker({
          id: Date.now(),
          text: `${ev.name}님 ${fmt(ev.score)}점${ev.reached_canaan ? ' · 가나안 도착' : ` · ${ev.verses_done}절`}${ev.rank ? ` · 지금 ${ev.rank}위` : ''}`,
        })
      } catch {
        /* 무시 */
      }
    })
    return off
  }, [liveKey])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(t)
  }, [toast])
  useEffect(() => {
    if (!burst) return
    const t = setTimeout(() => setBurst(null), 900)
    return () => clearTimeout(t)
  }, [burst])
  useEffect(() => {
    if (!ticker) return
    const t = setTimeout(() => setTicker(null), 3600)
    return () => clearTimeout(t)
  }, [ticker])

  const pause = useCallback((p: boolean) => {
    gameRef.current?.setPaused(p)
    setPaused(p)
    if (!p) setTimeout(() => inputRef.current?.focus(), 0)
  }, [])

  useEffect(() => {
    const onVis = () => {
      if (document.hidden) pause(true)
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [pause])

  const submitInput = () => {
    const input = inputRef.current
    if (!input) return
    const v = input.value
    input.value = ''
    gameRef.current?.submit(v)
    gameRef.current?.aim('')
  }

  const quit = () => {
    const g = gameRef.current
    if (!g || (hud.score === 0 && hud.done === 0)) {
      onQuitEarly()
      return
    }
    g.quit()
  }

  const place = PLACES[Math.min(hud.done, PLACES.length - 1)]
  // 라이벌이 지금 내가 치는 절을 다 새겼을 때의 점수 — 이걸 넘기면 이 절에서 앞선다
  const rivalTarget = rival ? rival.checkpoints[hud.done] : undefined
  const rivalStopped = !!rival && rivalTarget === undefined
  const rivalDelta = rival ? hud.score - (rivalStopped ? rival.score : (rivalTarget ?? 0)) : 0
  const liveLeft = liveEndsAt ? parseApiDate(liveEndsAt).getTime() - now : null

  return createPortal(
    <div
      ref={layerRef}
      className={`mn-game mn-skin--drop${flow === 'left' ? ' is-flow-left' : ''}${hud.fever ? ' is-fever' : ''}${hud.slow ? ' is-slow' : ''}${mode === 'easy' ? ' is-easy' : ''}${paused ? ' is-paused' : ''}`}
      style={{ '--mn-dawn': Math.min(1, hud.done / (set.verses.length - 1 || 1)).toFixed(2) } as CSSProperties}
      role="application"
      aria-label="만나 내리기"
    >
      <div className="mn-sky" aria-hidden />
      <div className="mn-sun" aria-hidden />
      <div className="mn-game__glow" aria-hidden />
      {/* 구름기둥 — 화면 양옆에서 피어오르는 구름(단어 뒤) */}
      <div className={`mn-cloudveil${hud.slow ? ' is-on' : ''}`} aria-hidden>
        <i />
        <i />
      </div>

      <header className="mn-hud">
        <div className="mn-hud__place">
          <button type="button" className="mn-hud__btn" onClick={() => pause(true)} aria-label="잠시 멈춤">
            <span className="material-icons-round">pause</span>
          </button>
          <span>
            <span className="mn-hud__day">
              {liveKey ? (
                <>
                  <i className="mn-hud__live">LIVE</i>
                  {liveLeft !== null ? leftLabel(liveLeft) : '라이브'} · {modeLabel(mode)}
                </>
              ) : (
                <>
                  {hud.done + 1}일째 · {set.kind === 'daily' ? '오늘의 만나' : '연습'} · {modeLabel(mode)}
                </>
              )}
            </span>
            <span className="mn-hud__name">{place}</span>
          </span>
        </div>
        <div className="mn-hud__score">
          <span className="mn-hud__num">{fmt(hud.score)}</span>
          {hud.combo >= 2 ? (
            <span key={hud.combo} className="mn-hud__combo">
              {hud.combo} 콤보{hud.mult > 1 ? ` ×${hud.mult}` : ''}
            </span>
          ) : (
            <span className="mn-hud__combo mn-hud__combo--empty" />
          )}
        </div>
        <div className="mn-hud__right">
          <span className="mn-jars" aria-label={`만나 항아리 ${hud.jars}개 남음`}>
            {Array.from({ length: MAX_JARS }, (_, i) => (
              <svg key={i} viewBox="0 0 16 20" className={`mn-jar${i < hud.jars ? ' is-full' : ''}${i === lostJar ? ' is-lost' : ''}`} aria-hidden>
                <path d="M5 1.5h6M5.5 1.5v3C2.5 6 1.5 8.5 1.5 12c0 4 2.5 6.5 6.5 6.5s6.5-2.5 6.5-6.5c0-3.5-1-6-4-7.5v-3" />
              </svg>
            ))}
          </span>
        </div>
      </header>
      <div className="mn-track" aria-label={`노정 ${hud.done}/${set.verses.length} · 지금 ${place}`}>
        <div className="mn-track__rail">
          <span className="mn-track__fill" style={{ width: `calc((100% - 8px) * ${Math.min(1, hud.done / (set.verses.length || 1))})` }} />
          {Array.from({ length: set.verses.length + 1 }, (_, i) => (
            <span
              key={i}
              className={`mn-track__dot${i < hud.done ? ' is-done' : ''}${i === hud.done ? ' is-now' : ''}${i === set.verses.length && i !== hud.done ? ' is-goal' : ''}`}
            />
          ))}
          {rival && !rival.is_me && (
            <span
              className="mn-track__ghost"
              style={{ left: `calc(4px + (100% - 8px) * ${Math.min(1, rival.verses_done / (set.verses.length || 1))})` }}
              title={`${rival.name} ${rival.verses_done}절`}
              aria-hidden
            >
              {rival.name.trim().charAt(0)}
            </span>
          )}
        </div>
      </div>
      <div className="mn-chips">
        {rival && !rival.is_me && (
          <span className={`mn-chip mn-chip--rival${rivalDelta >= 0 ? ' is-ahead' : ' is-behind'}`} aria-live="polite">
            <Avatar name={rival.name} url={rival.avatar_url} className="mn-chip__ava" />
            {rival.name}
            {rivalStopped ? ` 멈춤` : ''}
            <b>
              {rivalDelta >= 0 ? '+' : '−'}
              {fmt(Math.abs(rivalDelta))}
            </b>
          </span>
        )}
        {rival && rival.is_me && (
          <span className={`mn-chip mn-chip--rival${rivalDelta >= 0 ? ' is-ahead' : ' is-behind'}`}>
            오늘의 나
            <b>
              {rivalDelta >= 0 ? '+' : '−'}
              {fmt(Math.abs(rivalDelta))}
            </b>
          </span>
        )}
        {hud.fever && <span className="mn-chip mn-chip--fever">여섯째 날 · 점수 2배</span>}
        {hud.slow && (
          <span className="mn-chip mn-chip--slow" style={{ '--mn-slow-sec': `${SLOW_SECONDS}s` } as CSSProperties}>
            구름기둥 · 천천히
          </span>
        )}
      </div>

      {verse && (
        <section className={`mn-verse${mode === 'easy' ? ' is-hint' : ''}`} aria-live="polite">
          <div className="mn-verse__card">
            <p className="mn-verse__ref">
              {verse.ref}
              <span className="mn-verse__count">
                {verse.index + 1}/{set.verses.length}절
              </span>
            </p>
            <p className="mn-verse__line">
              {verse.words.map((w, i) => (
                <span
                  key={`${verse.index}-${i}`}
                  className={
                    (verse.states[i] === 'got'
                      ? `mn-w-got${i === verse.fresh ? ' is-fresh' : ''}`
                      : verse.states[i] === 'miss'
                        ? 'mn-w-miss'
                        : `mn-w-blank${i === verse.turn ? ' is-next' : ''}`) + (i === verse.gold ? ' is-gold' : '')
                  }
                >
                  {w}
                </span>
              ))}
            </p>
          </div>
        </section>
      )}

      <div className="mn-stage" ref={stageRef} onPointerDown={() => setTimeout(() => inputRef.current?.focus(), 0)}>
        {flow === 'left' ? <div className="mn-stage__basket" aria-hidden /> : <Dunes />}
        <div className="mn-stage__closeline" aria-hidden />
        {ticker && (
          <div key={ticker.id} className="mn-ticker" role="status">
            <span className="mn-ticker__live">LIVE</span>
            {ticker.text}
          </div>
        )}
      </div>

      <div className="mn-typebar" ref={barRef}>
        <div className="mn-typebar__field">
          <input
            ref={inputRef}
            className="mn-input"
            type="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="send"
            placeholder="금빛 '차례' 단어를 입력"
            aria-label="단어 입력"
            onInput={(e) => {
              const input = e.currentTarget
              // 화면 키보드는 keydown 이 'Unidentified' 로 오거나 아예 안 와서 — 그때는 입력 자체로 소리를 낸다
              if (performance.now() - keySoundAt.current > 80) {
                const ne = e.nativeEvent as InputEvent
                playTypingSound(ne.inputType?.startsWith('delete') ? 'back' : ne.data?.includes(' ') ? 'space' : 'key')
              }
              const v = input.value
              if (/\s/.test(v)) {
                const parts = v.split(/\s+/)
                const rest = parts.pop() ?? ''
                parts.filter(Boolean).forEach((p) => gameRef.current?.submit(p))
                input.value = rest
              }
              gameRef.current?.aim(input.value)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                // 한글 조합 중 엔터는 조합이 끝난 뒤에 거둔다
                if (e.nativeEvent.isComposing || e.keyCode === 229) {
                  pendingEnter.current = true
                  return
                }
                submitInput()
                return
              }
              if (e.key === 'Escape') {
                pause(true)
                return
              }
              const kind = e.key === ' ' ? 'space' : e.key === 'Backspace' ? 'back' : e.key.length === 1 || e.key === 'Process' || e.keyCode === 229 ? 'key' : null
              if (kind) {
                playTypingSound(kind)
                keySoundAt.current = performance.now()
              }
            }}
            onCompositionEnd={() => {
              if (pendingEnter.current) {
                pendingEnter.current = false
                setTimeout(submitInput, 0)
              }
            }}
          />
          <button
            type="button"
            className="mn-send"
            aria-label="거두기"
            // 화면 키보드가 내려가지 않게 입력칸 포커스를 지킨다
            onPointerDown={(e) => e.preventDefault()}
            onClick={submitInput}
          >
            <span className="material-icons-round" aria-hidden>
              arrow_upward
            </span>
          </button>
        </div>
        <p className="mn-typebar__hint">
          말씀은 순서대로 내려와요 · <kbd>Space</kbd> 또는 <kbd>Enter</kbd>로 거두기
        </p>
      </div>

      {banner && (
        <div className="mn-banner" role="status">
          <div className="mn-banner__card">
            <span className="mn-seal" aria-hidden>
              새김
            </span>
            <p className="mn-banner__ref">{banner.perfect ? `${banner.ref} · 온전히 새김` : banner.ref}</p>
            <p className="mn-banner__text">{banner.text}</p>
            <p className="mn-banner__next">
              {banner.perfect ? `한 단어도 놓치지 않았어요 +${banner.bonus}` : `놓친 단어 ${banner.missed}개`}
              {banner.last ? ' · 가나안에 닿았어요!' : ` · 다음 노정 ${banner.nextPlace}`}
            </p>
            {rival && <RivalCompare rival={rival} banner={banner} />}
          </div>
        </div>
      )}

      {burst && (
        <div key={burst.id} className="mn-burst" aria-hidden>
          {burst.text}
        </div>
      )}

      {toast && (
        <div key={toast.id} className={`mn-toast${toast.tone ? ` mn-toast--${toast.tone}` : ''}`} role="status">
          {toast.text}
        </div>
      )}

      {paused && (
        <div className="mn-overlay">
          <div className="mn-overlay__card">
            <span className="mn-overlay__icon" aria-hidden>
              <span className="material-icons-round">pause</span>
            </span>
            <p className="mn-overlay__title">잠시 쉬는 중</p>
            <p className="mn-overlay__text">만나는 기다려 줘요 · 지금 {fmt(hud.score)}점</p>
            <div className="mn-overlay__score">
              <span className="mn-pill">{place}</span>
              <span className="mn-pill">
                {hud.done}/{set.verses.length}절
              </span>
              <span className="mn-pill">항아리 {hud.jars}</span>
            </div>
            <button type="button" className="mn-cta" onClick={() => pause(false)}>
              이어서 거두기
            </button>
            <button
              type="button"
              className="mn-cta mn-cta--ghost"
              onClick={() => {
                setPaused(false)
                quit()
              }}
            >
              여기서 마치기
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  )
}

/** 새김 카드 안 — 같은 자리에서 라이벌은 몇 점이었나 */
const RivalCompare = ({ rival, banner }: { rival: Rival; banner: MannaBanner }) => {
  const theirs = rival.checkpoints[banner.done - 1]
  const who = rival.is_me ? '오늘의 나' : `${rival.name}님`
  if (theirs === undefined) {
    const ahead = banner.score > rival.score
    return (
      <p className={`mn-banner__rival${ahead ? ' is-ahead' : ' is-behind'}`}>
        {who}은 {rival.verses_done}절에서 멈췄어요 · {ahead ? `이미 ${fmt(banner.score - rival.score)}점 앞서요` : `${fmt(rival.score - banner.score + 1)}점 더 거두면 앞서요`}
      </p>
    )
  }
  const d = banner.score - theirs
  return (
    <p className={`mn-banner__rival${d >= 0 ? ' is-ahead' : ' is-behind'}`}>
      {who}은 여기서 {fmt(theirs)}점 · 나 {fmt(banner.score)}점 ({d >= 0 ? '+' : '−'}
      {fmt(Math.abs(d))})
    </p>
  )
}
