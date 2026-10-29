// 도착한 캡슐 = 빛에 비춰보는 봉투 → 빛 속에서 하나씩 튀어나오는 선물.

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
import type { CapsuleDetail } from '../../../types/timeCapsule'
import { formatKoreanDate } from '../capsuleDates'
import { Icon, MicGlyph, PenGlyph, PhotoGlyph } from '../capsuleIcons'
import {
  addressTo,
  journeyDays,
  journeySpanLabel,
  senderLine,
  signatureFrom,
} from './letterText'

/* ── 도착 화면의 감정선 ─────────────────────────────────────────
   1) 기대 — 봉투가 가끔 "두근" 움찔하고, 첫 문장은 빛 알갱이 뒤에 가려져 있다.
   2) 꾹 누르기 1초 — 봉투를 빛에 비춰보듯 뒤에서 빛이 차오르고, 안에 든 편지·사진의
      그림자가 비친다. 봉투가 떨리다가
   3) 빛 터짐 — 봉투가 빛 속으로 녹아 사라진다(접힌 덮개를 젖히는 기계적 개봉은 쓰지 않는다:
      시안 비교에서 "어색하다"로 탈락).
   4) 기다린 보람 — 담긴 것이 하나씩 뽁! 사진 → 음성 → 편지, 색종이,
      마지막에 참빛우체국 "D+N 도착 완료" 도장이 쾅. 손글씨 첫 줄이 다시 써진다.
   키보드·보조기기는 Enter/Space 로 즉시 연다 — 꾹 누르기는 촉감이지 관문이 아니다. */
const HOLD_MS = 1000
const BYPASS_AFTER_MS = 9000
/** 개봉이 확정된 순간부터의 박자(ms) */
const BEAT_AT = [0, 700, 1500, 1950, 2350] as const

const CONFETTI_COLORS = ['#3182f6', '#7fb0ff', '#f5c451', '#ff9aa8', '#ffffff', '#2459c7']

/** 가운데에서 ±amp/2 사이로 흔들리는 값 */
const wobble = (amp: number) => (Math.random() - 0.5) * amp

// 색종이·빛 조각 궤적 — 모듈에서 한 번만 정한다 (렌더마다 흩날리면 튄다)
const CONFETTI = Array.from({ length: 30 }, (_, i) => {
  const a = -Math.PI / 2 + wobble(2.4)
  const d = 90 + Math.random() * 120
  return {
    '--dx': `${Math.cos(a) * d}px`,
    '--dy': `${Math.sin(a) * d}px`,
    '--r': `${Math.random() * 720 - 360}deg`,
    background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  } as CSSProperties
})

const SPARKS = Array.from({ length: 16 }, () => {
  const a = Math.random() * Math.PI * 2
  const d = 60 + Math.random() * 90
  return {
    '--dx': `${Math.cos(a) * d}px`,
    '--dy': `${Math.sin(a) * d - 30}px`,
    animationDelay: `${Math.random() * 120}ms`,
  } as CSSProperties
})

/** 선물 편지에 미리 써 보일 첫 줄들 — 편지 본문을 다 읽히지 않고 세 줄까지만 */
const previewLines = (capsule: CapsuleDetail): string[] => {
  const content = capsule.content
  const lines = (content?.message ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 3)
  if (lines.length > 0) return lines
  if ((content?.handwriting?.length ?? 0) > 0) return ['손으로 쓴 편지가 들어 있어요']
  return [content?.title || capsule.title || '그날의 마음이 담겨 있어요']
}

const formatDuration = (sec: number | null): string | null => {
  if (!sec || sec <= 0) return null
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/* 봉투 뒷면 — 몸통·옆 접힘선·아래 날개·덮개가 한 장의 SVG.
   --p(누른 정도 0~1)에 따라 뒤에서 빛이 차오르고 안의 실루엣이 비친다. */
const FLAP = 'M0 8 Q0 0 8 0 H292 Q300 0 300 8 L174 110 Q150 126 126 110 Z'

const EnvelopeBack = ({ hasPhoto }: { hasPhoto: boolean }) => {
  const silhouette = (
    <>
      <rect x="30" y="20" width="240" height="150" rx="3" fill="#6b4a26" opacity=".45" />
      {hasPhoto && (
        <rect x="200" y="12" width="74" height="92" rx="3" fill="#5a3a1a" opacity=".55" transform="rotate(9 237 58)" />
      )}
      <path d="M56 52h110M56 74h150M56 96h130" stroke="#5a3a1a" strokeWidth="3" strokeLinecap="round" opacity=".35" />
    </>
  )
  return (
    <svg className="capsule-env" viewBox="0 0 300 194" aria-hidden>
      <defs>
        <linearGradient id="ca-paper" x1="0" y1="0" x2=".3" y2="1">
          <stop offset="0" className="capsule-env__stop-paper1" />
          <stop offset="1" className="capsule-env__stop-paper2" />
        </linearGradient>
        <linearGradient id="ca-bottom" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="capsule-env__stop-bottom1" />
          <stop offset="1" className="capsule-env__stop-bottom2" />
        </linearGradient>
        <linearGradient id="ca-flap" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="capsule-env__stop-flap1" />
          <stop offset="1" className="capsule-env__stop-flap2" />
        </linearGradient>
        <radialGradient id="ca-backlit" cx="50%" cy="52%" r="60%">
          <stop offset="0" stopColor="#fff3d6" stopOpacity=".95" />
          <stop offset=".55" stopColor="#ffe2a8" stopOpacity=".45" />
          <stop offset="1" stopColor="#ffe2a8" stopOpacity="0" />
        </radialGradient>
        <clipPath id="ca-flap-clip">
          <path d={FLAP} />
        </clipPath>
        <filter id="ca-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 .45  0 0 0 0 .33  0 0 0 0 .2  0 0 0 .5 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <filter id="ca-flap-shadow" x="-5%" y="-5%" width="110%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.4" floodColor="#5a3c1e" floodOpacity=".2" />
        </filter>
        <filter id="ca-wobble" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="2" seed="5" />
          <feDisplacementMap in="SourceGraphic" scale="6" />
        </filter>
        <radialGradient id="ca-wax" cx="36%" cy="30%" r="78%">
          <stop offset="0" stopColor="#6aa5ff" />
          <stop offset=".42" stopColor="#2d6ae0" />
          <stop offset="1" stopColor="#173f99" />
        </radialGradient>
      </defs>

      <rect width="300" height="194" rx="8" fill="url(#ca-paper)" />
      <g className="capsule-env__see">{silhouette}</g>
      <rect className="capsule-env__lit" width="300" height="194" rx="8" fill="url(#ca-backlit)" />
      <path d="M0 8 L128 116 M300 8 L172 116" className="capsule-env__seam" fill="none" strokeWidth="1.2" />
      <path d="M0 194 L0 186 L126 112 Q150 98 174 112 L300 186 L300 194 Z" fill="url(#ca-bottom)" />

      {/* 덮개 — 빛이 덮개 종이도 통과해 실루엣이 이어져 보이게 같은 그림을 한 번 더 비춘다 */}
      <g filter="url(#ca-flap-shadow)">
        <path d={FLAP} fill="url(#ca-flap)" />
      </g>
      <g clipPath="url(#ca-flap-clip)">
        <g className="capsule-env__see capsule-env__see--flap">{silhouette}</g>
        <rect className="capsule-env__lit capsule-env__lit--flap" width="300" height="194" fill="url(#ca-backlit)" />
      </g>

      <rect width="300" height="194" rx="8" fill="#fff" filter="url(#ca-grain)" opacity=".55" />
    </svg>
  )
}

/** 밀랍 한 덩이 — 갈라질 때 좌·우 두 쪽으로 같은 그림을 잘라 쓴다 */
const WaxDisc = () => (
  <svg viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="27" fill="url(#ca-wax)" filter="url(#ca-wobble)" />
    <circle cx="32" cy="32" r="18.5" fill="none" stroke="rgba(0,0,0,.22)" strokeWidth="1.6" />
    <circle cx="32" cy="32" r="17.5" fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="1" />
    <path d="M32 23v18M26 29h12" stroke="rgba(0,20,70,.35)" strokeWidth="3.2" strokeLinecap="round" transform="translate(.6 .8)" />
    <path d="M32 23v18M26 29h12" stroke="rgba(226,236,255,.95)" strokeWidth="2.4" strokeLinecap="round" />
    <ellipse cx="23" cy="19" rx="8" ry="3.4" fill="rgba(255,255,255,.3)" transform="rotate(-32 23 19)" />
  </svg>
)

const ArrivalEnvelope = ({
  capsule,
  opened,
  onOpen,
  onRead,
}: {
  capsule: CapsuleDetail
  /** 서버가 개봉을 확정했다 — 빛 터짐부터 선물 연출이 시작된다 */
  opened: boolean
  /** 개봉 요청. 실패하면 false — 봉투를 다시 닫힌 상태로 되돌린다 */
  onOpen: () => Promise<boolean>
  /** 편지 읽기 */
  onRead: () => void
}) => {
  const rootRef = useRef<HTMLElement>(null)
  const raf = useRef<number | undefined>(undefined)
  const startAt = useRef(0)
  const nudgeTimer = useRef<number | undefined>(undefined)
  const [holding, setHolding] = useState(false)
  // 1초를 다 채웠고 서버 응답을 기다리는 중 — 빛이 차오른 채로 붙잡아 둔다
  const [charged, setCharged] = useState(false)
  const [nudge, setNudge] = useState(false)
  const [bypass, setBypass] = useState(false)
  const [beat, setBeat] = useState(0)

  const days = journeyDays(capsule.sealed_at, capsule.open_at)
  const span = journeySpanLabel(days)
  const photoCount = capsule.photo_count ?? 0
  const content = capsule.content
  const photo = content?.photos?.[0] ?? null
  const voice = content?.audio_url ? formatDuration(content.audio_duration) ?? '음성' : null

  const setVar = (name: string, value: string) => rootRef.current?.style.setProperty(name, value)
  const setProgress = (p: number) => setVar('--p', String(p))
  const setJitter = (x: number, y: number) => {
    setVar('--jx', `${x}px`)
    setVar('--jy', `${y}px`)
  }

  useEffect(() => {
    const t = window.setTimeout(() => setBypass(true), BYPASS_AFTER_MS)
    return () => {
      window.clearTimeout(t)
      window.clearTimeout(nudgeTimer.current)
      if (raf.current !== undefined) cancelAnimationFrame(raf.current)
    }
  }, [])

  // 개봉 확정 → 빛 터짐 · 선물 · 도장 · 손글씨의 박자
  useEffect(() => {
    if (!opened) return
    rootRef.current?.style.setProperty('--p', '0')
    // 움직임 줄이기 — 박자 없이 마지막 장면(선물·도장·편지)으로 바로
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const t = window.setTimeout(() => setBeat(BEAT_AT.length - 1), 0)
      return () => window.clearTimeout(t)
    }
    const timers = BEAT_AT.slice(1).map((ms, i) =>
      window.setTimeout(() => {
        setBeat(i + 1)
        // 도장이 쾅 찍히는 순간의 손맛
        if (i + 1 === 3) navigator.vibrate?.(30)
      }, ms),
    )
    return () => timers.forEach(window.clearTimeout)
  }, [opened])

  const release = async () => {
    setCharged(true)
    const ok = await onOpen()
    if (!ok) {
      setCharged(false)
      setProgress(0)
    }
  }

  const tick = (now: number) => {
    const p = Math.min(1, (now - startAt.current) / HOLD_MS)
    setProgress(p)
    // 다 차오를수록 봉투가 떨린다 — 안에서 무언가 나오려는 듯
    const amp = p * p * 2.4
    setJitter(wobble(amp), wobble(amp))
    if (p >= 1) {
      raf.current = undefined
      setHolding(false)
      setJitter(0, 0)
      void release()
      return
    }
    raf.current = requestAnimationFrame(tick)
  }

  const startHold = (e: PointerEvent<HTMLButtonElement>) => {
    if (opened || charged || raf.current !== undefined) return
    e.preventDefault()
    // 손가락이 살짝 미끄러져도 누르기가 끊기지 않게
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setHolding(true)
    navigator.vibrate?.(10)
    startAt.current = performance.now()
    raf.current = requestAnimationFrame(tick)
  }

  // 다 누르기 전에 손을 뗐다 — 빛이 가라앉고, 안내가 흔들려 알려준다
  const abortHold = () => {
    if (raf.current === undefined) return
    cancelAnimationFrame(raf.current)
    raf.current = undefined
    setHolding(false)
    setProgress(0)
    setJitter(0, 0)
    setNudge(true)
    window.clearTimeout(nudgeTimer.current)
    nudgeTimer.current = window.setTimeout(() => setNudge(false), 700)
  }

  const openNow = () => {
    if (opened || charged) return
    setProgress(1)
    void release()
  }

  // 포인터 클릭은 꾹 누르기가 맡는다. detail === 0 은 키보드(Enter/Space)로 누른 클릭
  const holdHandlers = {
    onPointerDown: startHold,
    onPointerUp: abortHold,
    onPointerCancel: abortHold,
    onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
  }

  const stateClass = [
    holding && 'is-holding',
    charged && !opened && 'is-charged',
    opened && 'is-open',
    opened && `beat-${beat}`,
  ]
    .filter(Boolean)
    .join(' ')

  const chips = [
    capsule.has_handwriting && { key: 'pen', icon: <PenGlyph />, label: '손글씨 편지' },
    photoCount > 0 && { key: 'photo', icon: <PhotoGlyph />, label: `사진 ${photoCount}장` },
    capsule.has_audio && { key: 'mic', icon: <MicGlyph />, label: '음성 편지' },
  ].filter(Boolean) as { key: string; icon: ReactNode; label: string }[]

  return (
    <section ref={rootRef} className={`capsule-arrival ${stateClass}`}>
      <div className="capsule-arrival__inner">
        <p className="capsule-arrival__eyebrow">{senderLine(capsule)}</p>
        <h2 className="capsule-arrival__headline">
          {opened ? (
            <span key="after" className="capsule-arrival__swap">
              그날의 마음이
              <br />
              오늘에 닿았어요
            </span>
          ) : span ? (
            <>
              <em>{span}</em>을 건너온 편지가
              <br />
              도착했어요
            </>
          ) : (
            <>
              오늘 봉인한 편지가
              <br />
              도착했어요
            </>
          )}
        </h2>
        {capsule.title && <p className="capsule-arrival__sub">「{capsule.title}」</p>}

        <div className="capsule-envstage">
          <span className="capsule-envstage__glow" aria-hidden />
          <span className="capsule-envstage__shadow" aria-hidden />

          {/* 봉투 — 개봉되면 빛 속으로 녹아 사라진다 */}
          <div className="capsule-envstage__mover">
            <div className="capsule-envstage__jit">
              <EnvelopeBack hasPhoto={photoCount > 0} />
              <button
                type="button"
                className="capsule-wax"
                {...holdHandlers}
                onClick={(e) => {
                  if (e.detail === 0) openNow()
                }}
                disabled={opened || charged}
                aria-label="밀랍 인장을 꾹 눌러 열기"
              >
                <span className="capsule-wax__invite" aria-hidden />
                <span className="capsule-wax__half capsule-wax__half--l" aria-hidden>
                  <WaxDisc />
                </span>
                <span className="capsule-wax__half capsule-wax__half--r" aria-hidden>
                  <WaxDisc />
                </span>
                <svg className="capsule-wax__ring" viewBox="0 0 84 84" aria-hidden>
                  <circle cx="42" cy="42" r="38" />
                </svg>
              </button>
            </div>
          </div>

          <span className="capsule-envstage__flash" aria-hidden />
          {opened && beat < 2 && SPARKS.map((style, i) => <i key={i} className="capsule-spark" style={style} aria-hidden />)}

          {/* 기다린 보람 — 담긴 것이 하나씩 뽁 */}
          {opened && content && (
            <div className="capsule-gift">
              {photo && (
                <figure className="capsule-gift__photo" aria-hidden>
                  <img src={photo.url} alt="" decoding="async" />
                  <figcaption>{content.photos.length > 1 ? `사진 ${content.photos.length}장` : photo.caption || '그날의 사진'}</figcaption>
                </figure>
              )}
              {voice && (
                <span className="capsule-gift__voice" aria-hidden>
                  <Icon size={16}>
                    <MicGlyph />
                  </Icon>
                  <b>
                    {[6, 12, 17, 9, 14, 7, 11].map((h, i) => (
                      <i key={i} style={{ height: h }} />
                    ))}
                  </b>
                  {voice}
                </span>
              )}

              <div className="capsule-giftletter">
                <div className="capsule-giftletter__head">
                  <svg viewBox="0 0 24 24" aria-hidden>
                    <path d="M12 3.5v17M6.5 9h11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                  <span>참빛 타임캡슐</span>
                  <span className="capsule-giftletter__date">{formatKoreanDate(capsule.sealed_at)}</span>
                </div>
                <div className="capsule-giftletter__body">
                  {[`${addressTo(capsule)}에게,`, ...previewLines(capsule)].map((line, i) => (
                    <span key={i} className="capsule-giftletter__ln" style={{ '--i': i } as CSSProperties}>
                      {line}
                    </span>
                  ))}
                  <span className="capsule-giftletter__ln capsule-giftletter__sig" style={{ '--i': 4 } as CSSProperties}>
                    — {signatureFrom(capsule)}
                  </span>
                </div>

                {/* 참빛우체국 도착 도장 — 오래 기다린 편지일수록 숫자가 크다 */}
                <span className={`capsule-arrivestamp ${days >= 365 ? 'capsule-arrivestamp--gold' : ''}`} aria-hidden>
                  <small>참빛우체국</small>
                  <b>{days > 0 ? `D+${days.toLocaleString()}` : 'D-DAY'}</b>
                  <small>도착 완료</small>
                </span>
              </div>
            </div>
          )}
          {opened &&
            beat >= 2 &&
            beat < 4 &&
            CONFETTI.map((style, i) => <i key={i} className="capsule-confetti" style={style} aria-hidden />)}
        </div>

        {/* 안에 든 것 — 첫 문장은 열기 전엔 빛 알갱이 뒤에 가려 둔다(내용은 서버가 아직 주지 않는다) */}
        <div className="capsule-teaser" aria-hidden={opened}>
          <div className="capsule-teaser__lab">
            <span>안에 든 것</span>
            <span>열면 보여요</span>
          </div>
          <div className="capsule-teaser__veil" aria-hidden>
            <i />
            <i />
          </div>
          {chips.length > 0 && (
            <div className="capsule-teaser__chips">
              {chips.map((c) => (
                <span key={c.key} className="capsule-teaser__chip">
                  <Icon size={14}>{c.icon}</Icon>
                  {c.label}
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          className={`capsule-hold ${nudge ? 'capsule-hold--nudge' : ''}`}
          {...(opened ? {} : holdHandlers)}
          onClick={(e) => {
            if (opened) onRead()
            else if (e.detail === 0) openNow()
          }}
          disabled={charged && !opened}
        >
          <span>
            {opened
              ? '편지 읽기 →'
              : charged
                ? '여는 중…'
                : holding
                  ? '빛에 비춰보는 중…'
                  : nudge
                    ? '떼지 말고 조금만 더 —'
                    : '꾹 눌러서 열기'}
          </span>
        </button>
        <p className="capsule-arrival__hint">
          {opened ? '그날의 마음이 오늘 도착했어요' : '손을 떼지 않고 1초 — 봉투의 인장을 눌러도 돼요'}
        </p>

        {bypass && !opened && !charged && (
          <button type="button" className="capsule-arrival__bypass" onClick={openNow}>
            바로 열기
          </button>
        )}
      </div>
    </section>
  )
}

// ── 같은 화면의 형제 모듈이 쓴다 ──
export { ArrivalEnvelope }
