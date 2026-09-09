import type { ReactNode } from 'react'
import { UsersIcon } from '../../../../components/icons/ActionIcons'

interface ChapterPresencePillProps {
  /** 현황 응답이 아직 안 왔는지 — 자리는 잡되 문구만 비워 둔다 */
  loading: boolean
  /** 지금 이 장을 읽는 중인 사람 수 (나 포함, 서버 값) */
  total: number | undefined
  /** 오늘 이 장을 읽은 성도 수 */
  readersToday: number | null | undefined
  /**
   * 내가 카운트에 포함돼 있는지(공유 켬 + 하트비트 중).
   * 포함돼 있으면 "나를 포함해 N명", 아니면(비로그인·공유 끔) 남의 수만 "N명이 읽는 중".
   */
  meCounted: boolean
  /**
   * 내 하트비트가 아직 서버에 안 들어간 상태(공유는 켰지만 읽는 절 확정 전).
   * 이때 total 에 내가 들어있는지 알 수 없어 남을 셀 수 없다 — 확정될 때까지
   * '함께 읽는 중'은 말하지 않는다.
   */
  mePending: boolean
}

/**
 * 장 상단 "함께" 한 줄.
 *
 * 상자 없는 캡션 한 줄이다 — 문구 하나에 폭이 꽉 찬 pill 을 두면 본문 위에 빈 공간만
 * 커 보인다. 대신 높이(1.5rem)는 절대 안 바뀐다: 사람이 들어오고 나갈 때마다 줄이
 * 생겼다 사라지면 본문 전체가 밀려 읽던 줄을 잃는다.
 * 실시간 동시 읽기는 드물어 '오늘 읽은 성도'를 바닥으로 깔고, 지금 함께 읽는 사람이
 * 있을 때만 브랜드 색 + 맥박 점으로 올라온다.
 *
 * 숫자는 "나 말고 N명"이 아니라 "나를 포함해 N명"이다 — 둘이 읽는데 '1명과 함께'라고
 * 하면 한 명이 빠진 것처럼 읽힌다(2026-09 피드백). 내가 카운트 밖이면(비로그인·공유 끔)
 * 포함할 내가 없으니 남의 수 그대로 "N명이 읽는 중".
 */
const ChapterPresencePill = ({ loading, total, readersToday, meCounted, mePending }: ChapterPresencePillProps) => {
  const others = mePending ? 0 : Math.max(0, (total ?? 0) - (meCounted ? 1 : 0))

  let body: ReactNode
  let live = false
  if (loading) {
    // 확인하는 중이라는 문구조차 두지 않는다 — 잠깐 떴다 바뀌는 글자가 더 시끄럽다
    body = null
  } else if (others > 0) {
    live = true
    body = (
      <>
        <span className="rt-live-dot" aria-hidden />
        {meCounted ? (
          <span>
            지금 나를 포함해 <strong>{others + 1}명</strong>이 함께 읽는 중
          </span>
        ) : (
          <span>
            지금 <strong>{others}명</strong>이 이 장을 읽는 중
          </span>
        )}
      </>
    )
  } else if (readersToday && readersToday > 0) {
    body = (
      <>
        <span className="rt-chapter-line__icon"><UsersIcon size={13} /></span>
        <span>
          오늘 <strong>{readersToday}명</strong>이 이 장을 읽었어요
        </span>
      </>
    )
  } else {
    body = (
      <>
        <span className="rt-chapter-line__icon"><UsersIcon size={13} /></span>
        <span>오늘 이 장의 첫 독자예요</span>
      </>
    )
  }

  return (
    <div className={`rt-chapter-line ${live ? 'rt-chapter-line--live' : ''}`} role="status" aria-live="polite">
      {body && <div key={live ? 'live' : 'quiet'} className="rt-chapter-line__body">{body}</div>}
    </div>
  )
}

export default ChapterPresencePill
