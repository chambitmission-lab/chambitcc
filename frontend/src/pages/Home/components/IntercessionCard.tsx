// 홈 '누군가의 기도' 카드 — 운영이 열려 있을 때만 뜬다.
//   미참여/비로그인 → 소개 한 줄 + 함께하기
//   대기 중        → 첫 짝이 정해지는 날 D-day / 인원 모으는 중
//   진행 중        → 오늘 기도할 분 + 나를 위한 등불(작게)
//   쉬는 중        → 띄우지 않는다 (쉬기로 한 분을 홈에서 조르지 않는다)
import { useNavigate } from 'react-router-dom'
import { useMyIntercession } from '../../../hooks/useIntercession'
import { preloadRoute } from '../../../utils/routePreload'
import { FlameGlyph, Lamp } from '../../Intercession/intercessionUi'
import { daysUntil, formatDay } from '../../Intercession/intercessionDates'
import '../../Intercession/intercession.css'

const IntercessionCard = () => {
  const navigate = useNavigate()
  const { data } = useMyIntercession()

  if (!data?.open) return null
  const p = data.participant
  if (p?.status === 'paused') return null

  let title: string
  let sub: string
  if (!p) {
    title = '서로를 위해 몰래 기도해요'
    sub = '한 달에 한 분, 이름 모를 기도가 오가요 · 함께하기'
  } else if (data.target) {
    title = data.target.prayed_today
      ? `오늘 ${data.target.display_name} 님을 위해 기도했어요`
      : `오늘 ${data.target.display_name} 님을 위해 기도해 주세요`
    sub = data.lamp?.received_today
      ? '오늘 누군가 당신을 위해서도 기도했어요'
      : '누군가 당신을 위해서도 기도하고 있어요'
  } else if (data.waiting_reason === 'not_started' && data.next_start_date) {
    const d = daysUntil(data.next_start_date)
    title = `${formatDay(data.next_start_date)}, 기도할 분이 정해져요`
    sub = d > 0 ? `D-${d} · 알림으로 먼저 알려 드릴게요` : '곧 알림으로 알려 드릴게요'
  } else {
    title = '함께할 분을 기다리고 있어요'
    sub = '조금 더 모이면 기도할 분이 정해져요'
  }

  return (
    <section className="px-4 mt-3">
      <button
        type="button"
        onClick={() => navigate('/intercession')}
        onMouseEnter={() => void preloadRoute('/intercession')}
        onTouchStart={() => void preloadRoute('/intercession')}
        className="feed-card w-full rounded-2xl px-4 py-3.5 flex items-center gap-3 text-left transition active:scale-[0.99] hover:border-[var(--brand-soft-strong)]"
      >
        <span className="shrink-0 w-10 h-10 rounded-2xl bg-[var(--brand-soft)] text-brand flex items-center justify-center">
          <FlameGlyph size={20} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[11.5px] font-bold text-brand">누군가의 기도</span>
          <span className="mt-0.5 block text-[14.5px] font-bold text-ink-strong tracking-[-0.015em] truncate">
            {title}
          </span>
          <span className="mt-0.5 block text-[12px] text-[var(--text-muted)] truncate">{sub}</span>
        </span>
        {data.lamp && data.target ? (
          <span className="shrink-0 pl-1">
            <Lamp weeks={data.lamp.weeks} size="sm" />
          </span>
        ) : (
          <span className="material-icons-outlined shrink-0 text-[20px] text-gray-400 dark:text-white/35" aria-hidden>
            chevron_right
          </span>
        )}
      </button>
    </section>
  )
}

export default IntercessionCard
