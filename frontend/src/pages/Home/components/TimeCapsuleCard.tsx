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
        <span className="tc-card__milkyway" aria-hidden />
        <span className="tc-card__stars" aria-hidden />
        <span className="tc-card__meteor" aria-hidden />
        <span className="tc-card__body">
          <span className="tc-card__label">타임캡슐</span>
          <span className="tc-card__title">
            시간을 건너,
            <br />
            그날 도착하는 편지
          </span>
          {status}
        </span>

        {/* 봉인 편지 — 선화 아이콘이 아니라 '빛을 머금은 오브젝트'로.
            옅은 종이빛 채움 + 플랩 틈으로 새어 나오는 빛(봉인된 편지 안에
            미래에 열릴 빛이 담겨 있다는 타임캡슐 서사) + 별 모양 밀랍 도장 */}
        <span className="tc-card__visual" aria-hidden>
          <svg className="tc-env" viewBox="0 0 68 50" fill="none">
            <defs>
              <linearGradient id="tc-env-paper" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ffe9c4" stopOpacity="0.17" />
                <stop offset="0.55" stopColor="#ffdfae" stopOpacity="0.07" />
                <stop offset="1" stopColor="#ffd894" stopOpacity="0.14" />
              </linearGradient>
              <filter id="tc-env-leak" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="1.7" />
              </filter>
            </defs>
            <rect
              x="1.1"
              y="1.1"
              width="65.8"
              height="47.8"
              rx="4.5"
              className="tc-env__stroke tc-env__panel"
            />
            {/* 플랩 틈에서 새어 나오는 빛 — 본선 아래에 블러로 깔린다 */}
            <path
              d="M2.5 6 L34 29 L65.5 6"
              className="tc-env__leak"
              filter="url(#tc-env-leak)"
            />
            {/* 봉인 플랩 */}
            <path d="M2.5 6 L34 29 L65.5 6" className="tc-env__stroke" />
            {/* 밀랍 인장 + 별 도장 */}
            <circle cx="34" cy="26.5" r="4.4" className="tc-env__seal" />
            <path
              d="M34 23.3 L34.9 25.6 L37.2 26.5 L34.9 27.4 L34 29.7 L33.1 27.4 L30.8 26.5 L33.1 25.6 Z"
              className="tc-env__seal-star"
            />
          </svg>
        </span>
      </button>
    </section>
  )
}

export default TimeCapsuleCard
