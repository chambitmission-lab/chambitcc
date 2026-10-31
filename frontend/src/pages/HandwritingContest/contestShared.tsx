// 필사대회 화면 공통 컴포넌트 — 단계 칩·종이 썸네일·메달·아이콘 (값·문구는 contestFormat.ts)
// 셸·레일·섹션 제목은 설문 화면(surveyUi)과 같은 앱 공통 문법을 그대로 쓴다.
import type { CSSProperties, ReactNode } from 'react'
import type { ContestEntry, ContestPhase } from '../../types/handwritingContest'
import { PHASE_META, RANK_META } from './contestFormat'

export const PhaseChip = ({ phase }: { phase: ContestPhase }) => (
  <span
    className={`inline-flex items-center text-[10.5px] font-bold px-2 py-0.5 rounded-full border leading-[1.5] ${PHASE_META[phase].cls}`}
  >
    {PHASE_META[phase].label}
  </span>
)

export const Medal = ({ rank, size = 26 }: { rank: number; size?: number }) => {
  const meta = RANK_META[rank]
  if (!meta) return null
  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-white font-extrabold shadow-sm"
      style={{ width: size, height: size, background: meta.medal, fontSize: size * 0.46 }}
      aria-label={meta.label}
    >
      {rank}
    </span>
  )
}

/** 종이 위 글씨 — 투명 PNG 를 크림 종이에 얹는다(종이·잉크는 실물이라 다크에서도 크림) */
export const PaperThumb = ({
  entry,
  className = '',
  maxRatio = 1.25,
  ratio: fixedRatio,
  style,
}: {
  entry: Pick<ContestEntry, 'image_url' | 'width' | 'height' | 'verse_ref'>
  className?: string
  /** 세로로 긴 글씨도 카드가 너무 길어지지 않게 */
  maxRatio?: number
  /** 종이 비율(세로/가로) 고정 — 글씨는 그 안에 contain */
  ratio?: number
  style?: CSSProperties
}) => {
  const ratio = fixedRatio ?? (entry.width && entry.height ? Math.min(maxRatio, Math.max(0.55, entry.height / entry.width)) : 1)
  return (
    <div className={`hw-paper ${className}`} style={{ ...style, aspectRatio: `1 / ${ratio}` }}>
      {entry.image_url ? (
        <img src={entry.image_url} alt={`${entry.verse_ref} 손글씨`} loading="lazy" decoding="async" draggable={false} />
      ) : null}
    </div>
  )
}

export const Avatar = ({ name, url, size = 28 }: { name: string; url: string | null; size?: number }) =>
  url ? (
    <img src={url} alt="" className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />
  ) : (
    <span
      className="rounded-full shrink-0 inline-flex items-center justify-center bg-[var(--brand-soft)] text-brand font-bold"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {name.slice(0, 1)}
    </span>
  )

const G = ({ children, size = 18, stroke = 1.8 }: { children: ReactNode; size?: number; stroke?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {children}
  </svg>
)

export const HeartIcon = ({ filled = false, size = 18 }: { filled?: boolean; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" aria-hidden>
    <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20Z" />
  </svg>
)

export const QuillIcon = ({ size = 18 }: { size?: number }) => (
  <G size={size}>
    <path d="M20 4c-7 0-12.5 5-14 12l-1.5 4M20 4c0 6-3.5 10.5-9.5 11.5M20 4l-6 6" />
  </G>
)

export const CardIcon = ({ size = 18 }: { size?: number }) => (
  <G size={size}>
    <rect x="4.5" y="3.5" width="15" height="17" rx="2.5" />
    <path d="M8 15.5c1.4-1.6 2.6-1.6 4 0s2.6 1.6 4 0M8.5 8h7" />
  </G>
)

export const TrophyIcon = ({ size = 18 }: { size?: number }) => (
  <G size={size}>
    <path d="M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H5.5a2.5 2.5 0 0 0 2.6 3.4M16 6h2.5a2.5 2.5 0 0 1-2.6 3.4M12 13v3.5M8.5 20h7M10 16.5h4l.5 3.5h-5l.5-3.5Z" />
  </G>
)

export const CenterNote = ({
  title,
  hint,
  action,
}: {
  title: string
  hint?: string
  action?: ReactNode
}) => (
  <div className="px-4 pt-12 pb-16 text-center">
    <span className="mx-auto mb-3 flex w-12 h-12 rounded-2xl bg-[var(--brand-soft)] text-brand items-center justify-center">
      <QuillIcon size={24} />
    </span>
    <p className="text-[15px] font-bold text-ink-strong">{title}</p>
    {hint ? <p className="mt-1.5 text-[13px] text-ink-muted leading-relaxed whitespace-pre-line">{hint}</p> : null}
    {action ? <div className="mt-4">{action}</div> : null}
  </div>
)
