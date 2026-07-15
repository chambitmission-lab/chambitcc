// 홈 "오늘의 읽기" 카드 — 진행 중인 구독형 읽기 플랜(bible_plans)의 오늘 분량.
// 활성 구독이 없거나 비로그인 시 아무것도 렌더하지 않는다 (홈 클러터 방지).
import { useNavigate } from 'react-router-dom'
import { useTodayReadings } from '../../../hooks/useBiblePlan'
import { isAuthenticated } from '../../../utils/auth'

const RING_SIZE = 54
const RING_STROKE = 5
const RING_R = (RING_SIZE - RING_STROKE) / 2
const RING_C = 2 * Math.PI * RING_R

const TodayPlanCard = () => {
  const navigate = useNavigate()
  const authed = isAuthenticated()
  const { data } = useTodayReadings(authed)

  const items = data?.items ?? []
  if (!authed || items.length === 0) return null

  const today = items[0]
  const refs = today.passages.map((p) => p.reference).filter(Boolean).join(' · ')

  return (
    <section className="px-4 pt-3">
      <button
        type="button"
        onClick={() => navigate(`/bible/plans/${today.plan_id}`)}
        className="glass-card w-full text-left rounded-2xl p-4"
      >
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[15px]">{today.emoji || '📖'}</span>
              <span className="text-[11px] font-bold tracking-[0.08em] text-brand">
                오늘의 읽기
              </span>
              <span className="text-[11.5px] text-gray-400 dark:text-white/45 truncate">
                · {today.plan_title}
              </span>
            </div>
            {today.streak_count > 0 && (
              <span className="shrink-0 text-[11px] font-semibold text-gray-500 dark:text-white/55">
                🔥 {today.streak_count}일
              </span>
            )}
          </div>

          <div className="flex items-center gap-3.5 mt-3">
            <div
              className="relative shrink-0"
              style={{ width: RING_SIZE, height: RING_SIZE }}
            >
              <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90">
                <circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_R}
                  fill="none"
                  strokeWidth={RING_STROKE}
                  className="stroke-gray-100 dark:stroke-white/[0.08]"
                />
                <circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_R}
                  fill="none"
                  strokeWidth={RING_STROKE}
                  strokeLinecap="round"
                  stroke="var(--brand)"
                  strokeDasharray={RING_C}
                  strokeDashoffset={RING_C * (1 - Math.min(100, today.percent) / 100)}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[12px] font-bold text-brand">
                {today.percent}%
              </span>
            </div>

            <div className="min-w-0">
              <p className="text-[15.5px] font-bold text-gray-900 dark:text-white tracking-[-0.01em]">
                {today.day_number}일차{today.day_title ? ` · ${today.day_title}` : ''}
              </p>
              {refs && (
                <p className="text-[12.5px] text-brand mt-0.5">{refs}</p>
              )}
            </div>
          </div>

          <div className="mt-3">
            {today.done_today ? (
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-emerald-600 dark:text-emerald-300">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                오늘 읽기 완료!
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full brand-gradient text-[12.5px] font-bold"
              >
                지금 읽기
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            )}
            {items.length > 1 && (
              <span className="ml-2 text-[11.5px] text-gray-400 dark:text-white/45">
                외 {items.length - 1}개 플랜
              </span>
            )}
          </div>
        </div>
      </button>
    </section>
  )
}

export default TodayPlanCard
