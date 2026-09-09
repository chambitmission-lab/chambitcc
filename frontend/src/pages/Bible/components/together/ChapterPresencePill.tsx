import { UsersIcon } from '../../../../components/icons/ActionIcons'

interface ChapterPresencePillProps {
  /** 지금 이 장을 읽는 중인 사람 수 (나 포함, 서버 값) */
  total: number | undefined
  /** 오늘 이 장을 읽은 성도 수 */
  readersToday: number | null | undefined
  /** 내가 카운트에 포함돼 있는지(공유 켬 + 하트비트 중) — 표시할 땐 나를 뺀다 */
  meCounted: boolean
}

/**
 * 장 상단 "함께" 한 줄.
 * 실시간 동시 읽기는 드물다 — 그래서 비동기 '오늘 읽은 성도'를 바닥으로 깔고,
 * 지금 함께 읽는 사람이 있을 때만 브랜드 색 + 맥박 점으로 올라온다.
 */
const ChapterPresencePill = ({ total, readersToday, meCounted }: ChapterPresencePillProps) => {
  const others = Math.max(0, (total ?? 0) - (meCounted ? 1 : 0))
  if (others > 0) {
    return (
      <div className="rt-chapter-pill" role="status">
        <span className="rt-live-dot" aria-hidden />
        <span>
          지금 <strong>{others}명</strong>이 이 장을 함께 읽고 있어요
        </span>
      </div>
    )
  }
  if (readersToday && readersToday > 0) {
    return (
      <div className="rt-chapter-pill rt-chapter-pill--quiet" role="status">
        <span className="rt-chapter-pill__icon">
          <UsersIcon size={14} />
        </span>
        <span>
          오늘 <strong>{readersToday}명</strong>의 성도가 이 장을 읽었어요
        </span>
      </div>
    )
  }
  return null
}

export default ChapterPresencePill
