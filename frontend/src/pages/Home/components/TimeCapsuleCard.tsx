// 홈 타임캡슐 진입 카드 — 편지를 흘리며 시간을 건너 달리는 배달부 양
// 단순 링크가 아니라 내 캡슐 상태를 반영한 살아있는 문구를 보여준다:
//   도착한 캡슐이 있으면 → "도착한 캡슐 N개" (가장 강한 훅)
//   봉인 중이면        → 가장 가까운 개봉일 D-day
//   없으면             → 첫 봉인을 권하는 기본 카피
// 문구는 한 줄에서 끝나야 한다 — 두 줄이 되면 카드가 자라고, 높이맞춤인 삽화도 같이 커진다.
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMyCapsules } from '../../../hooks/useTimeCapsule'
import { isAuthenticated } from '../../../utils/auth'
import { daysUntil } from '../../Capsule/capsuleDates'
import './TimeCapsuleCard.css'

const TimeCapsuleCard = () => {
  const navigate = useNavigate()
  const { data } = useMyCapsules(isAuthenticated())

  // 브라우저는 지금 매칭되는 한 장만 받는다(.tc-card__art / html:not(.dark) .tc-card__art).
  // 테마를 토글하는 순간 반대 테마 파일을 맨땅에서 받기 시작해 카드가 그라데이션만 남으므로,
  // 현재 테마가 그려진 뒤 유휴 시간에 반대 테마도 데워 둔다 (plans/heroPrefetch.ts 와 같은 이유)
  useEffect(() => {
    const dark = document.documentElement.classList.contains('dark')
    const other = `/images/capsule/home-banner-${dark ? 'light' : 'dark'}.webp`
    const warm = () => {
      const img = new Image()
      img.decoding = 'async'
      img.src = other
    }
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(warm, { timeout: 5000 })
      return () => window.cancelIdleCallback(id)
    }
    const id = window.setTimeout(warm, 2500)
    return () => window.clearTimeout(id)
  }, [])

  // 내가 열 수 있는데 아직 안 연 캡슐 (보낸 사람 재열람은 제외)
  const unopened =
    data?.arrived.filter((c) => !c.opened_at && c.role !== 'sender').length ?? 0
  // sealed는 open_at 오름차순 — 첫 항목이 가장 가까운 개봉일
  const nextSealed = data?.sealed[0] ?? null

  let status: React.ReactNode
  if (unopened > 0) {
    status = (
      <span className="tc-card__status tc-card__status--arrived">
        <span className="tc-card__pulse" aria-hidden />
        도착한 캡슐 {unopened}개가 기다려요
      </span>
    )
  } else if (nextSealed) {
    status = (
      <span className="tc-card__status tc-card__status--sealed">
        다음 개봉까지
        <strong className="tc-card__dday tabular-nums">
          D-{daysUntil(nextSealed.open_at)}
        </strong>
        {nextSealed.open_label ? (
          <span className="tc-card__when">· {nextSealed.open_label}</span>
        ) : null}
      </span>
    )
  } else {
    status = <span className="tc-card__status">지금 이 마음을 봉인해보세요</span>
  }

  return (
    <section className="px-4 mt-3">
      <button type="button" onClick={() => navigate('/capsule')} className="tc-card">
        <span className="tc-card__milkyway" aria-hidden />
        <span className="tc-card__stars" aria-hidden />
        <span className="tc-card__meteor" aria-hidden />
        {/* 삽화 — 별 레이어 위, 본문 아래. 오른쪽 끝은 화살표 버튼 자리로 비어 있다 */}
        <span className="tc-card__art" aria-hidden />
        <span className="tc-card__body">
          <span className="tc-card__label">타임캡슐</span>
          <span className="tc-card__title">
            시간을 건너,
            <br />
            그날 <em>도착하는 편지</em>
          </span>
          {status}
        </span>

        <span className="tc-card__go" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12h13M12.5 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
    </section>
  )
}

export default TimeCapsuleCard
