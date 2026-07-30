// 홈 타임캡슐 진입 카드 — 밤하늘에 봉인된 편지 무드의 히어로
// 단순 링크가 아니라 내 캡슐 상태를 반영한 살아있는 문구를 보여준다:
//   도착한 캡슐이 있으면 → "도착한 캡슐 N개" (가장 강한 훅)
//   봉인 중이면        → 가장 가까운 개봉일 D-day
//   없으면             → 첫 봉인을 권하는 기본 카피
import { useNavigate } from 'react-router-dom'
import { useMyCapsules } from '../../../hooks/useTimeCapsule'
import { isAuthenticated } from '../../../utils/auth'
import { daysUntil } from '../../Capsule/capsuleDates'
import './TimeCapsuleCard.css'

const TimeCapsuleCard = () => {
  const navigate = useNavigate()
  const { data } = useMyCapsules(isAuthenticated())

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
        도착한 캡슐 {unopened}개가 기다리고 있어요
      </span>
    )
  } else if (nextSealed) {
    status = (
      <span className="tc-card__status tc-card__status--sealed">
        다음 개봉까지{' '}
        <strong className="tabular-nums">D-{daysUntil(nextSealed.open_at)}</strong>
        {nextSealed.open_label ? ` · ${nextSealed.open_label}` : ''}
      </span>
    )
  } else {
    status = (
      <span className="tc-card__status">
        미래의 나에게, 사랑하는 이에게 — 지금의 마음을 봉인해보세요
      </span>
    )
  }

  return (
    <section className="px-4 mt-3">
      <button type="button" onClick={() => navigate('/capsule')} className="tc-card">
        {/* 밤사막 사진 배경 + 좌측 스크림(텍스트 가독성) */}
        <span className="tc-card__bg" aria-hidden />
        <span className="tc-card__stars" aria-hidden />
        <span className="tc-card__body">
          <span className="tc-card__label">Time Capsule</span>
          <span className="tc-card__title">
            시간을 건너,
            <br />
            그날 도착하는 편지
          </span>
          {status}
        </span>

        {/* 봉인 편지 — 사진 속 금빛 궤적과 같은 언어(빛으로 그린 선)로 그린다.
            입체 일러스트는 실사 배경과 재질이 충돌해서 선화로 대체 */}
        <span className="tc-card__visual" aria-hidden>
          <svg className="tc-env" viewBox="0 0 68 50" fill="none">
            <rect
              x="1.1"
              y="1.1"
              width="65.8"
              height="47.8"
              rx="7"
              className="tc-env__stroke tc-env__panel"
            />
            <path d="M3 6.5 L34 30 L65 6.5" className="tc-env__stroke" />
            <circle cx="34" cy="27.5" r="4.6" className="tc-env__seal" />
          </svg>
        </span>
      </button>
    </section>
  )
}

export default TimeCapsuleCard
