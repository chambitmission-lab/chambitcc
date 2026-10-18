import type { CSSProperties, KeyboardEvent, ReactNode } from 'react'
import { ensureFontFamily } from '../../../utils/deferredFonts'
import { ROTATION, type DoodleName, type NotebookTone } from './notebookLook'
import './PrayerNotebook.css'

// 손글씨(날짜·제목)는 이 화면 전용 서체 — 모듈이 로드될 때 붙인다(오기 전엔 Pretendard 폴백)
void ensureFontFamily('gaegu')

/*
 * /profile 기도 수첩 공용 조각 — 낱장 카드·낙서·응답 도장·하트 줄.
 * 목록 4개(내 기도·함께 기도·댓글·묵상노트)가 같은 낱장 문법을 쓴다. 색은 PrayerNotebook.css 의 --nb-* 토큰.
 */

// 낱장마다 살짝 다른 기울기 — 책상에 손으로 펼쳐 둔 느낌(호버하면 바로 선다)
const TILTS = [-0.9, 0.7, -0.4, 0.9, -0.7, 0.5]
const tiltOf = (index: number) => `${TILTS[index % TILTS.length]}deg`

const DOODLE_PATHS: Record<DoodleName, ReactNode> = {
  heart: <path d="M16 26s-9-5.5-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.5-9 12-9 12z" />,
  sprout: <><path d="M16 27V14" /><path d="M16 17c-5 0-8-3-8-8 5 0 8 3 8 8zM16 14c0-5 3-8 8-8 0 5-3 8-8 8z" /><path d="M10 27h12" /></>,
  sun: <><circle cx="16" cy="16" r="5.5" /><path d="M16 4v3M16 25v3M4 16h3M25 16h3M7.5 7.5l2 2M22.5 22.5l2 2M7.5 24.5l2-2M22.5 9.5l2-2" /></>,
  drop: <><path d="M16 5c4 6 7 10 7 14a7 7 0 0 1-14 0c0-4 3-8 7-14z" /><path d="M13 19a3 3 0 0 0 3 3" /></>,
  cloud: <><path d="M9 20a5 5 0 0 1 1-10 6.5 6.5 0 0 1 12.5 1.5A4.3 4.3 0 0 1 22 20z" /><path d="M12 24l-1 2.5M17 24l-1 2.5M22 24l-1 2.5" /></>,
  moon: <><path d="M21 6a10 10 0 1 0 5 15 8 8 0 0 1-5-15z" /><path d="M9 8l.5 1.5L11 10l-1.5.5L9 12l-.5-1.5L7 10l1.5-.5z" /></>,
  swirl: <path d="M16 16c0-1.6 2.2-1.6 2.2 0 0 2.8-4.4 2.8-4.4 0 0-4.2 6.6-4.2 6.6 0 0 5.8-8.8 5.8-8.8 0 0-7.4 11-7.4 11 0" />,
  lock: <><rect x="9" y="14" width="14" height="11" rx="2" /><path d="M12 14v-3a4 4 0 0 1 8 0v3" /><circle cx="16" cy="19.5" r="1" /></>,
  church: <><path d="M16 4v6M13.5 6.5h5" /><path d="M9 26V16l7-6 7 6v10z" /><path d="M14 26v-5a2 2 0 0 1 4 0v5" /></>,
  bubble: <><path d="M7 9.5A3.5 3.5 0 0 1 10.5 6h11A3.5 3.5 0 0 1 25 9.5v8a3.5 3.5 0 0 1-3.5 3.5H14l-5 4v-4.2A3.5 3.5 0 0 1 7 17.5z" /><path d="M12 13.5h.01M16 13.5h.01M20 13.5h.01" /></>,
  book: <><path d="M16 9c-3-2-7-2-10-1v16c3-1 7-1 10 1 3-2 7-2 10-1V8c-3-1-7-1-10 1z" /><path d="M16 9v16" /></>,
  pencil: <><path d="M20 6l6 6-13 13H7v-6z" /><path d="M17 9l6 6" /></>,
}

export const Doodle = ({ name }: { name: DoodleName }) => (
  <svg className="nb-doodle" viewBox="0 0 32 32" aria-hidden>
    {DOODLE_PATHS[name]}
  </svg>
)

const HEART_MAX = 6

/** 함께 기도한 사람 수 — 작은 하트 6개까지, 넘으면 +n */
export const HeartRow = ({ count }: { count: number }) => {
  if (count <= 0) return null
  return (
    <span className="nb-hearts" aria-hidden>
      {Array.from({ length: Math.min(count, HEART_MAX) }, (_, i) => (
        <svg key={i} viewBox="0 0 32 32" width="12" height="12">
          <path d="M16 26s-9-5.5-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.5-9 12-9 12z" fill="currentColor" />
        </svg>
      ))}
      {count > HEART_MAX && <span className="ml-0.5 text-[11px] font-bold">+{count - HEART_MAX}</span>}
    </span>
  )
}

export const AnsweredStamp = ({ label, date }: { label: string; date: string }) => (
  <div className="nb-stamp" aria-label={label}>
    <div>
      <b>{label}</b>
      {date && <small>{date}</small>}
    </div>
  </div>
)

interface NotebookCardProps {
  index: number
  tone: NotebookTone
  /** 테이프 색을 톤 대신 직접 줄 때(말씀 노트의 형광펜 색) */
  washi?: string
  onOpen?: () => void
  ariaLabel?: string
  children: ReactNode
}

/** 스프링 구멍 + 마스킹테이프가 붙은 수첩 낱장. 카드 전체가 눌림 영역이다. */
export const NotebookCard = ({ index, tone, washi, onOpen, ariaLabel, children }: NotebookCardProps) => {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onOpen?.()
    }
  }
  const style = { '--nb-tilt': tiltOf(index), ...(washi ? { '--nb-washi': washi } : {}) } as CSSProperties
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={onOpen}
      onKeyDown={onKeyDown}
      className={`nb-card nb-tone-${tone}`}
      style={style}
    >
      <div className="nb-holes" aria-hidden>
        <i /><i /><i /><i /><i />
      </div>
      <span className="nb-washi" aria-hidden />
      {children}
    </div>
  )
}

export const NotebookEmpty = ({ doodle, text, hint }: { doodle: DoodleName; text: string; hint?: string }) => (
  <div className="nb-empty">
    <Doodle name={doodle} />
    <p>{text}</p>
    {hint && <small>{hint}</small>}
  </div>
)

export const NotebookSkeleton = ({ index }: { index: number }) => (
  <div className={`nb-card nb-skel nb-tone-${ROTATION[index % ROTATION.length].tone}`} style={{ '--nb-tilt': tiltOf(index) } as CSSProperties} aria-hidden>
    <div className="nb-holes"><i /><i /><i /><i /><i /></div>
    <span className="nb-washi" />
    <div className="nb-skel-bar w-24 mb-3" />
    <div className="nb-skel-bar w-2/3 mb-4 h-4" />
    <div className="nb-skel-bar w-full mb-2.5" />
    <div className="nb-skel-bar w-4/5" />
  </div>
)
