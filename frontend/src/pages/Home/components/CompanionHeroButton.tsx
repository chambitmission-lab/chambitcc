// 홈 묵상 히어로 우상단 "동행" 발자국 버튼 — 짝이 무언가 건넸을 때만 뜬다.
//
// 오늘의 교회 봉투(TodayChurchEnvelope)와 같은 자리·문법: 오른쪽 정렬 유리 클러스터라
// 나타나고 사라져도 홈을 밀지 않는다. 홈 목록에 카드를 끼우지 않는다(레이아웃 점프).
//
// 노출 규칙(우선순위 순)
//   1. 받은 동행 초대가 있으면 → /companion
//   2. 오늘 짝이 나를 위해 기도했고, 그 동행을 오늘 아직 안 열었으면 → /companion/:id
//   그 밖엔 숨는다. 상시 입구는 전체 메뉴·⌘K(navCatalog '/companion').
import { useNavigate } from 'react-router-dom'
import { useMyCompanions } from '../../../hooks/useCompanion'
import { useHomeBundlePending } from '../../../hooks/useHomeSummary'
import { isAuthenticated } from '../../../utils/auth'
import { isCheerSeenToday } from '../../Companion/cheerSeen'

const FootstepsGlyph = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <ellipse cx="8" cy="8.5" rx="2.6" ry="4" />
    <path d="M6.6 15.2a1.6 1.6 0 0 0 2.8 0" />
    <ellipse cx="16" cy="11.5" rx="2.6" ry="4" />
    <path d="M14.6 18.2a1.6 1.6 0 0 0 2.8 0" />
  </svg>
)

const CompanionHeroButton = () => {
  const navigate = useNavigate()
  const authed = isAuthenticated()
  const bundlePending = useHomeBundlePending()
  const { data } = useMyCompanions(authed && !bundlePending)
  if (!authed || !data) return null

  const invite = data.incoming[0]
  const prayed = data.active.find((c) => c.cheer?.by_partner_today && !isCheerSeenToday(c.id))
  const target = invite
    ? {
        to: '/companion',
        label: `${invite.partner.name}님이 ${invite.together_weeks > 0 ? '다시 ' : ''}함께 걷자고 해요`,
      }
    : prayed
      ? { to: `/companion/${prayed.id}`, label: `${prayed.partner.name}님이 오늘 당신을 위해 기도했어요` }
      : null
  if (!target) return null

  return (
    <button
      type="button"
      className="meditation-alarm-btn today-envelope-btn"
      onClick={() => navigate(target.to)}
      aria-label={target.label}
      title={target.label}
    >
      <FootstepsGlyph />
      <span className="today-envelope-dot" aria-hidden />
    </button>
  )
}

export default CompanionHeroButton
