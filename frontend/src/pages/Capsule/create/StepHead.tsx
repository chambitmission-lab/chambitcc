// 단계 머리글 — 손글씨 안내 줄(작은 배지 + 펜글씨 + 반짝) / 강조어가 있는 제목 / 한 줄 설명.
// 2026-10-27 받는 사람 단계부터 적용. 제목의 강조어는 <em>으로 넘긴다.
import type { ReactNode } from 'react'

const StepHead = ({
  eyebrow,
  badge,
  title,
  sub,
}: {
  /** 펜글씨 한 줄 — 양이 건네는 말투로 */
  eyebrow: string
  /** 안내 줄 앞 둥근 배지 속 선 아이콘(24 viewBox path) */
  badge: ReactNode
  title: ReactNode
  sub?: string
}) => (
  <header className="cw-head">
    <p className="cw-eyebrow" aria-hidden>
      <span className="cw-eyebrow__badge">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {badge}
        </svg>
      </span>
      <span className="cw-eyebrow__text">{eyebrow}</span>
      <svg className="cw-eyebrow__spark" viewBox="0 0 14 26" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M2 5l7-3M3 13h9M2 21l7 3" />
      </svg>
    </p>
    <h2 className="cw-title">{title}</h2>
    {sub && <p className="cw-sub">{sub}</p>}
  </header>
)

export default StepHead
