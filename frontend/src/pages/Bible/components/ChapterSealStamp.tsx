import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import './ChapterSealStamp.css'

/**
 * 장 끝 '다 읽었어요' 도장 — 꾹 눌러(HOLD_MS) 잉크를 채우면 낙관이 쾅 찍히며 장 전체 읽음 처리.
 * 누르는 시간이 곧 확인이라 예전 2탭 확인이 필요 없다. 완료 상태에선 찍힌 도장만 보여 준다.
 * 실제 찍히는 애니메이션은 이 화면에서 방금 찍었을 때만(장 이동 후 재진입 시엔 정적 표시).
 */
const HOLD_MS = 1000

interface Props {
  bookName: string
  chapter: number
  totalVerses: number
  unread: number
  pending: boolean
  /** 장 전체 읽음 처리 — 성공 여부를 돌려준다 */
  onStamp: () => Promise<boolean>
}

const buzz = (pattern: number | number[]) => {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* 진동 미지원 기기 */
  }
}

const todayLabel = () => {
  const d = new Date()
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default function ChapterSealStamp({ bookName, chapter, totalVerses, unread, pending, onStamp }: Props) {
  const uid = useId().replace(/:/g, '')
  const done = unread === 0
  const [progress, setProgress] = useState(0)
  const [holding, setHolding] = useState(false)
  // 방금 이 화면에서 찍은 장 — 찍히는 연출·날짜 각인은 이때만(다른 장으로 가면 자연히 풀림)
  const chapterKey = `${bookName}-${chapter}`
  const [stampedKey, setStampedKey] = useState<string | null>(null)
  const justStamped = done && stampedKey === chapterKey
  const [rot] = useState(() => -(5 + Math.round(Math.random() * 9)))
  const raf = useRef<number | null>(null)
  const startAt = useRef(0)
  const firing = useRef(false)

  useEffect(() => () => {
    if (raf.current) cancelAnimationFrame(raf.current)
  }, [])

  const fire = async () => {
    if (firing.current) return
    firing.current = true
    setHolding(false)
    buzz([15, 30, 40])
    const key = chapterKey
    const ok = await onStamp()
    firing.current = false
    setProgress(0)
    if (ok) setStampedKey(key)
  }

  // rAF 타임스탬프 기준 — 첫 프레임을 시작 시각으로 잡는다
  const tick = (now: number) => {
    if (startAt.current < 0) startAt.current = now
    const p = Math.min(1, (now - startAt.current) / HOLD_MS)
    setProgress(p)
    if (p >= 1) {
      raf.current = null
      void fire()
      return
    }
    raf.current = requestAnimationFrame(tick)
  }

  const start = () => {
    if (pending || firing.current || raf.current) return
    buzz(8)
    setHolding(true)
    startAt.current = -1
    raf.current = requestAnimationFrame(tick)
  }

  const cancel = () => {
    if (!raf.current) return
    cancelAnimationFrame(raf.current)
    raf.current = null
    setHolding(false)
    setProgress(0)
  }

  const RING_C = 2 * Math.PI * 66
  const busy = pending || (progress >= 1 && !done)

  let hint: ReactNode
  if (done) hint = `${bookName} ${chapter}장을 다 읽었어요`
  else if (busy) hint = '도장 찍는 중…'
  else if (holding) hint = progress < 0.5 ? '잉크를 묻히는 중…' : '이제 찍을게요!'
  else if (unread === totalVerses) hint = '끝까지 읽으셨다면 꾹 눌러 도장을 찍어 주세요'
  else hint = <>아직 표시 안 된 절 <strong>{unread}절</strong>도 함께 표시돼요</>

  const ringText = justStamped
    ? `${bookName} ${chapter}장 · ${todayLabel()} · 참빛교회 ·`
    : `${bookName} ${chapter}장 · 끝까지 읽음 · 참빛교회 ·`

  return (
    <div className="cseal">
      <div className="cseal__divider">{done ? '읽기 마침' : '끝까지 읽으셨나요?'}</div>
      <div className="cseal__stage">
        {done ? (
          <>
            {justStamped && <div className="cseal__shadow" aria-hidden />}
            <svg
              className={`cseal__seal${justStamped ? ' is-fresh' : ''}`}
              style={{ ['--rot' as string]: `${justStamped ? rot : -8}deg` }}
              viewBox="0 0 140 140"
              role="img"
              aria-label={`${bookName} ${chapter}장 읽음 도장`}
            >
              <defs>
                <filter id={`ink-${uid}`} x="-10%" y="-10%" width="120%" height="120%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="n" />
                  <feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" xChannelSelector="R" yChannelSelector="G" result="d" />
                  <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="1" seed="2" result="n2" />
                  <feColorMatrix in="n2" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 2.05" result="m" />
                  <feComposite in="d" in2="m" operator="in" />
                </filter>
                <path id={`arc-${uid}`} d="M70,70 m-49,0 a49,49 0 1,1 98,0 a49,49 0 1,1 -98,0" />
              </defs>
              <g filter={`url(#ink-${uid})`}>
                <circle cx="70" cy="70" r="64" fill="none" stroke="currentColor" strokeWidth="4.5" />
                <circle cx="70" cy="70" r="40" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <text fontSize="11" fontWeight="800" fill="currentColor">
                  <textPath href={`#arc-${uid}`} textLength="300" lengthAdjust="spacing">
                    {ringText}
                  </textPath>
                </text>
                <text x="70" y="72" textAnchor="middle" fontSize="25" fontWeight="900" fill="currentColor" letterSpacing="1">
                  읽음
                </text>
                <text x="70" y="91" textAnchor="middle" fontSize="11" fontWeight="800" fill="currentColor">
                  {totalVerses}절 ✓
                </text>
              </g>
            </svg>
            {justStamped && (
              <div className="cseal__sparks" aria-hidden>
                {Array.from({ length: 14 }, (_, i) => {
                  const a = (Math.PI * 2 * i) / 14
                  const r = 70 + (i % 3) * 12
                  return (
                    <span
                      key={i}
                      style={{ ['--dx' as string]: `${Math.cos(a) * r}px`, ['--dy' as string]: `${Math.sin(a) * r}px` }}
                    />
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <button
            type="button"
            className={`cseal__ghost${holding ? ' is-holding' : ''}`}
            disabled={busy}
            aria-label={`꾹 눌러 ${bookName} ${chapter}장 다 읽음 도장 찍기`}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId)
              start()
            }}
            onPointerUp={cancel}
            onPointerCancel={cancel}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
                e.preventDefault()
                start()
              }
            }}
            onKeyUp={(e) => {
              if (e.key === 'Enter' || e.key === ' ') cancel()
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            <span
              className="cseal__ink"
              style={{ width: `${progress * 130}px`, height: `${progress * 130}px`, opacity: 0.15 + progress * 0.35 }}
              aria-hidden
            />
            <svg className="cseal__ring" width="138" height="138" aria-hidden>
              <circle
                cx="69"
                cy="69"
                r="66"
                fill="none"
                stroke="var(--brand)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray={RING_C}
                strokeDashoffset={RING_C * (1 - progress)}
                style={{ transition: holding ? 'none' : 'stroke-dashoffset .25s' }}
              />
            </svg>
            <span className="material-icons-round cseal__icon" aria-hidden>approval</span>
            <span className="cseal__label">{busy ? '찍는 중…' : '꾹 눌러 도장 찍기'}</span>
          </button>
        )}
      </div>
      <p className={`cseal__hint${holding || busy ? ' is-active' : ''}`}>{hint}</p>
    </div>
  )
}
