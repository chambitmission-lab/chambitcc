import type { MessiahHit } from '../../data/messiah'
import { CrossIcon, CrownIcon } from '../messiah/PromiseIcons'

interface VersePromiseBadgeProps {
  hits: MessiahHit[]
  /** 이어읽기 문단 안이면 작은 왕관/십자가 단추 하나로 줄인다 (문단을 칩으로 끊지 않게) */
  inline?: boolean
  onOpen: () => void
}

/**
 * 약속과 성취 배지 — 본문 범위의 첫 절 위에 "메시아 약속 · 임마누엘" / "약속의 성취 · 임마누엘".
 * 범위 안 나머지 절은 바탕 표시(.verse-promise--ot/nt)만 하고 배지는 달지 않는다.
 * 글자색은 건드리지 않는다 — 예수님 말씀 붉은 글씨가 그대로 살아 있도록.
 */
const VersePromiseBadge = ({ hits, inline, onOpen }: VersePromiseBadgeProps) => {
  const firsts = hits.filter((h) => h.first)
  if (!firsts.length) return null
  // 한 절이 구약 약속이면서 신약 성취일 일은 없지만, 신약 한 절에 약속 둘(마 21:5 등)은 있을 수 있다
  const side = firsts[0].side
  const label = side === 'ot' ? '메시아 약속' : '약속의 성취'
  const titles = firsts.map((h) => h.promise.title).join(' · ')

  if (inline) {
    return (
      <button
        type="button"
        className={`verse-promise-inline verse-promise-inline--${side}`}
        onClick={(e) => {
          e.stopPropagation()
          onOpen()
        }}
        title={`${label} · ${titles}`}
        aria-label={`${label} ${titles} 보기`}
      >
        {side === 'ot' ? <CrownIcon size={12} /> : <CrossIcon size={12} />}
      </button>
    )
  }

  return (
    <button
      type="button"
      className={`verse-promise-badge verse-promise-badge--${side}`}
      onClick={(e) => {
        e.stopPropagation()
        onOpen()
      }}
    >
      {side === 'ot' ? <CrownIcon size={14} /> : <CrossIcon size={14} />}
      <span className="verse-promise-badge__label">{label}</span>
      <span className="verse-promise-badge__title">{titles}</span>
      <span className="material-icons-round verse-promise-badge__go" aria-hidden>chevron_right</span>
    </button>
  )
}

export default VersePromiseBadge
