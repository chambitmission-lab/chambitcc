// 도착한 캡슐 = 배달부 양이 걸어온 배달 길. 봉인 → 여행 → 도착까지 지나온 칸이 채워져 있고
// 마지막 '열어 보기' 한 칸만 비어 있다 — 그 한 걸음을 받는 사람이 꾹 눌러 채운다.
// 문법은 캡슐함 목록(입체 타일·볼록 버튼)과 /capsule/new 배달부 양(말풍선·배달 길)에서 가져왔다.

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import type { CapsuleDetail } from '../../../types/timeCapsule'
import { useThemeArt } from '../../../hooks/useThemeArt'
import { CAPSULE_HERO } from '../../../utils/themeAssets'
import { formatKoreanDate } from '../capsuleDates'
import { Icon, MicGlyph } from '../capsuleIcons'
import { addressTo, journeyDays, journeySpanLabel, senderLine, signatureFrom } from './letterText'

/* ── 감정선 ─────────────────────────────────────────────────────────
   1) 기대 — 양이 숨을 몰아쉬며 도착을 알리고, 길의 마지막 칸만 점선으로 비어 있다.
   2) 꾹 누르기 1초 — 아래 버튼과 마지막 칸이 함께 차오른다. 떼면 양이 "앗" 하고 알려 준다.
   3) 한 걸음 — 마지막 칸에 체크가 찍히고, 길이 접히며 그 자리에서 담긴 것이 하나씩 뽁.
      사진 → 음성 → 편지, 색종이, 참빛우체국 "D+N 도착 완료" 도장이 쾅.
   키보드·보조기기는 Enter/Space 로 즉시 연다 — 꾹 누르기는 촉감이지 관문이 아니다. */
const HOLD_MS = 1000
const BYPASS_AFTER_MS = 9000
/** 개봉이 확정된 순간부터의 박자(ms) — 0: 마지막 칸 체크 · 1: 길 접힘+사진·음성 · 2: 편지 · 3: 도장 · 4: 손글씨 */
const BEAT_AT = [0, 900, 1600, 2050, 2450] as const

const CONFETTI_COLORS = ['#3182f6', '#7fb0ff', '#f5c451', '#ff9aa8', '#ffffff', '#2459c7']

const wobble = (amp: number) => (Math.random() - 0.5) * amp

// 색종이 궤적 — 모듈에서 한 번만 정한다 (렌더마다 흩날리면 튄다)
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

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

/** 10.30 금 */
const stopDate = (iso: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getMonth() + 1}.${d.getDate()} ${WEEKDAYS[d.getDay()]}`
}

const isToday = (iso: string): boolean => new Date(iso).toDateString() === new Date().toDateString()

/** 양의 첫마디 — 길이 길수록 자랑이 커진다 */
const arrivalQuip = (days: number, span: string | null): string => {
  if (days === 0 || !span) return '오늘 맡기신 편지, 바로 가져왔어요!'
  if (days === 1) return '헉헉… 어제 맡긴 편지, 방금 도착했어요!'
  if (days < 30) return `헉헉… ${span} 만에 도착했어요!`
  if (days < 365) return `${span} 동안 꼭 품고 왔어요!`
  return `${span} 동안 한 번도 안 잃어버렸어요!`
}

/** 함께 담긴 것 — 열기 전에도 서버가 알려 주는 표식만 쓴다 */
const enclosureLine = (capsule: CapsuleDetail): string => {
  const photos = capsule.photo_count ?? 0
  const parts = [
    capsule.has_handwriting && '손글씨',
    photos > 0 && `사진 ${photos}장`,
    capsule.has_audio && '음성',
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : '마음을 담은 편지 한 통'
}

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

const Check = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <polyline points="5 12 10 17 19 7" />
  </svg>
)

const ArrivalTrail = ({
  capsule,
  opened,
  onOpen,
  onRead,
}: {
  capsule: CapsuleDetail
  /** 서버가 개봉을 확정했다 — 마지막 칸 체크부터 선물 연출이 시작된다 */
  opened: boolean
  /** 개봉 요청. 실패하면 false — 길을 다시 비워 둔다 */
  onOpen: () => Promise<boolean>
  /** 편지 읽기 */
  onRead: () => void
}) => {
  const rootRef = useRef<HTMLElement>(null)
  const raf = useRef<number | undefined>(undefined)
  const startAt = useRef(0)
  const nudgeTimer = useRef<number | undefined>(undefined)
  const [holding, setHolding] = useState(false)
  // 1초를 다 채웠고 서버 응답을 기다리는 중 — 차오른 채로 붙잡아 둔다
  const [charged, setCharged] = useState(false)
  const [nudge, setNudge] = useState(false)
  const [bypass, setBypass] = useState(false)
  const [beat, setBeat] = useState(0)
  // 무대 삽화는 캡슐함 히어로와 같은 그림 — 목록에서 왔으면 이미 데워져 있다
  const artReady = useThemeArt(CAPSULE_HERO)

  const days = journeyDays(capsule.sealed_at, capsule.open_at)
  const span = journeySpanLabel(days)
  const content = capsule.content
  const photo = content?.photos?.[0] ?? null
  const voice = content?.audio_url ? formatDuration(content.audio_duration) ?? '음성' : null

  const setProgress = (p: number) => rootRef.current?.style.setProperty('--p', String(p))

  useEffect(() => {
    const t = window.setTimeout(() => setBypass(true), BYPASS_AFTER_MS)
    return () => {
      window.clearTimeout(t)
      window.clearTimeout(nudgeTimer.current)
      if (raf.current !== undefined) cancelAnimationFrame(raf.current)
    }
  }, [])

  // 개봉 확정 → 체크 · 길 접힘 · 선물 · 도장 · 손글씨의 박자
  useEffect(() => {
    if (!opened) return
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
    if (p >= 1) {
      raf.current = undefined
      setHolding(false)
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

  // 다 누르기 전에 손을 뗐다 — 차오른 칸이 비워지고, 버튼이 흔들려 알려준다
  const abortHold = () => {
    if (raf.current === undefined) return
    cancelAnimationFrame(raf.current)
    raf.current = undefined
    setHolding(false)
    setProgress(0)
    setNudge(true)
    window.clearTimeout(nudgeTimer.current)
    nudgeTimer.current = window.setTimeout(() => setNudge(false), 900)
  }

  const openNow = () => {
    if (opened || charged) return
    setProgress(1)
    void release()
  }

  const stateClass = [
    holding && 'is-holding',
    charged && !opened && 'is-charged',
    opened && 'is-open',
    opened && `beat-${beat}`,
  ]
    .filter(Boolean)
    .join(' ')

  const quip = opened
    ? '짠! 잘 전해 드렸어요'
    : nudge
      ? '앗, 손을 떼면 처음부터예요!'
      : holding || charged
        ? '조금만 더… 인장이 열리고 있어요'
        : arrivalQuip(days, span)

  const arrivedWhen = isToday(capsule.open_at)
    ? '오늘 아침 7시'
    : `${formatKoreanDate(capsule.open_at)} 아침`

  return (
    <section ref={rootRef} className={`capsule-arrival ${stateClass}`}>
      <div className={`capsule-arrival__stage${artReady ? ' is-ready' : ''}`}>
        <p key={quip} className="capsule-arrival__say" aria-live="polite">
          {quip}
        </p>
      </div>

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
            <em>{span}</em> 길을 건너온
            <br />
            편지가 도착했어요
          </>
        ) : (
          <>
            오늘 봉인한 편지가
            <br />
            도착했어요
          </>
        )}
      </h2>

      {/* 길과 선물은 같은 자리에 겹친다 — 길이 접히는 자리에서 선물이 솟아 화면이 출렁이지 않게 */}
      <div className="capsule-arrival__zone">
        <ol className="capsule-trail" aria-hidden={opened}>
          <li className="capsule-trail__stop is-done">
            <span className="capsule-trail__dot">
              <Check />
            </span>
            <span className="capsule-trail__text">
              <b>봉인했어요</b>
              <small>{capsule.title ? `「${capsule.title}」` : `${addressTo(capsule)}에게`}</small>
            </span>
            <span className="capsule-trail__end">{stopDate(capsule.sealed_at)}</span>
          </li>
          <li className="capsule-trail__stop is-done">
            <span className="capsule-trail__dot">
              <Check />
            </span>
            <span className="capsule-trail__text">
              <b>{span ? `${span} 동안 여행` : '바로 출발'}</b>
              <small>{enclosureLine(capsule)}</small>
            </span>
            {span && <span className="capsule-trail__end">{span}</span>}
          </li>
          <li className="capsule-trail__stop is-now">
            <span className="capsule-trail__dot">
              <svg viewBox="0 0 24 24" aria-hidden>
                <rect x="4" y="6.5" width="16" height="11" rx="1.5" />
                <path d="m4.5 7.5 7.5 5.5 7.5-5.5" />
              </svg>
            </span>
            <span className="capsule-trail__text">
              <b>도착했어요</b>
              <small>{arrivedWhen}</small>
            </span>
            <span className="capsule-trail__end">{stopDate(capsule.open_at)}</span>
          </li>
          <li className={`capsule-trail__stop is-next${opened ? ' is-done' : ''}`}>
            <span className="capsule-trail__dot">
              {opened ? (
                <Check />
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d="M12 6v12M6 12h12" />
                </svg>
              )}
            </span>
            <span className="capsule-trail__text">
              <b>{opened ? '열었어요' : '열어 보기'}</b>
              <small>{opened ? '방금' : '남은 한 걸음'}</small>
            </span>
          </li>
        </ol>

        {/* 기다린 보람 — 담긴 것이 하나씩 뽁 */}
        {opened && content && (
          <div className="capsule-gift">
            {photo && (
              <figure className="capsule-gift__photo" aria-hidden>
                <img src={photo.url} alt="" decoding="async" />
                <figcaption>
                  {content.photos.length > 1 ? `사진 ${content.photos.length}장` : photo.caption || '그날의 사진'}
                </figcaption>
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
            {beat >= 2 &&
              beat < 4 &&
              CONFETTI.map((style, i) => <i key={i} className="capsule-confetti" style={style} aria-hidden />)}
          </div>
        )}
      </div>

      <button
        type="button"
        className={`capsule-hold ${nudge ? 'capsule-hold--nudge' : ''}`}
        {...(opened
          ? {}
          : {
              onPointerDown: startHold,
              onPointerUp: abortHold,
              onPointerCancel: abortHold,
              onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
            })}
        // 포인터 클릭은 꾹 누르기가 맡는다. detail === 0 은 키보드(Enter/Space)로 누른 클릭
        onClick={(e) => {
          if (opened) onRead()
          else if (e.detail === 0) openNow()
        }}
        disabled={charged && !opened}
      >
        <span>
          {opened
            ? '편지 읽기'
            : charged
              ? '여는 중…'
              : holding
                ? '인장을 여는 중…'
                : nudge
                  ? '떼지 말고 조금만 더'
                  : '꾹 눌러서 열기'}
        </span>
      </button>
      {!opened && <p className="capsule-arrival__hint">1초 동안 누르고 있으면 열려요</p>}

      {bypass && !opened && !charged && (
        <button type="button" className="capsule-arrival__bypass" onClick={openNow}>
          바로 열기
        </button>
      )}
    </section>
  )
}

// ── 같은 화면의 형제 모듈이 쓴다 ──
export { ArrivalTrail }
