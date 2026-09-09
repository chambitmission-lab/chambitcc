import type { ReactNode } from 'react'
import { UsersIcon } from '../../../../components/icons/ActionIcons'

interface ChapterPresencePillProps {
  /** 현황 응답이 아직 안 왔는지 — 자리는 잡되 문구만 비워 둔다 */
  loading: boolean
  /** 지금 이 장을 읽는 중인 사람 수 (나 포함, 서버 값) */
  total: number | undefined
  /** 오늘 이 장을 읽은 성도 수 */
  readersToday: number | null | undefined
  /** 내가 카운트에 포함돼 있는지(공유 켬 + 하트비트 중) — 표시할 땐 나를 뺀다 */
  meCounted: boolean
}

/**
 * 장 상단 "함께" 한 줄.
 *
 * 항상 같은 높이의 자리를 차지한다 — 사람이 들어오고 나갈 때마다 생겼다 사라지면
 * 본문 전체가 위아래로 밀려 읽던 줄을 잃는다. 문구만 바뀌고 높이는 절대 안 바뀐다.
 * 실시간 동시 읽기는 드물어 '오늘 읽은 성도'를 바닥으로 깔고, 지금 함께 읽는 사람이
 * 있을 때만 브랜드 색 + 맥박 점으로 올라온다.
 */
const ChapterPresencePill = ({ loading, total, readersToday, meCounted }: ChapterPresencePillProps) => {
  const others = Math.max(0, (total ?? 0) - (meCounted ? 1 : 0))

  let body: ReactNode
  let quiet = true
  if (loading) {
    body = <span>함께 읽는 성도를 확인하는 중…</span>
  } else if (others > 0) {
    quiet = false
    body = (
      <>
        <span className="rt-live-dot" aria-hidden />
        <span>
          지금 <strong>{others}명</strong>이 이 장을 함께 읽고 있어요
        </span>
      </>
    )
  } else if (readersToday && readersToday > 0) {
    body = (
      <>
        <span className="rt-chapter-pill__icon"><UsersIcon size={14} /></span>
        <span>
          오늘 <strong>{readersToday}명</strong>의 성도가 이 장을 읽었어요
        </span>
      </>
    )
  } else {
    body = (
      <>
        <span className="rt-chapter-pill__icon"><UsersIcon size={14} /></span>
        <span>오늘 아직 이 장을 읽은 성도가 없어요</span>
      </>
    )
  }

  return (
    <div className={`rt-chapter-pill ${quiet ? 'rt-chapter-pill--quiet' : ''}`} role="status" aria-live="polite">
      <div key={quiet ? 'q' : 'live'} className="rt-chapter-pill__body">{body}</div>
    </div>
  )
}

export default ChapterPresencePill
