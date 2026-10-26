// 읽는 중인 플랜 한 장 — 제목·진행률 링 → 말씀 오솔길 → 25/50/75/완주 이정표.
// 오늘 카드(TodayHero)에 오른 플랜은 오늘 분량을 거기서 말하므로 여기선 빼고,
// 함께 읽는 다른 플랜만 카드 아래에 오늘 분량 한 줄을 붙인다.

import type { PlanSummary, TodayReading } from '../../../../types/biblePlan'
import { FlagIcon, FlameIcon } from '../PlanIcons'
import { PlanVisual } from './PlanCards'
import PlanTrail from './PlanTrail'
import {
  buildTrailStops,
  currentBookName,
  formatStartLabel,
  planNumbers,
  streakAlive,
  todayInfo,
  trailProgress,
} from './planJourney'

const Ring = ({ percent }: { percent: number }) => {
  const r = 24
  const c = 2 * Math.PI * r
  return (
    <span className="relative shrink-0 w-[58px] h-[58px] lg:w-[66px] lg:h-[66px]">
      <svg viewBox="0 0 58 58" className="w-full h-full -rotate-90">
        <circle cx="29" cy="29" r={r} fill="none" strokeWidth="6" className="stroke-[var(--brand-soft-strong)]" />
        <circle
          cx="29"
          cy="29"
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - percent / 100)}
          className="stroke-brand transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[15px] lg:text-[17px] font-extrabold tracking-[-0.03em] text-brand tabular-nums">
        {percent}%
      </span>
    </span>
  )
}

const Medal = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="14" r="6" />
    <path d="M8.2 9.4 5 2h4l3 6" />
    <path d="M15.8 9.4 19 2h-4l-3 6" />
  </svg>
)

const MILESTONES = [
  { at: 25, label: '25%' },
  { at: 50, label: '절반' },
  { at: 75, label: '75%' },
  { at: 100, label: '완주' },
] as const

const Milestones = ({ percent, remainDays }: { percent: number; remainDays: number }) => (
  <div className="relative mt-4 grid grid-cols-4">
    <span className="absolute left-[12.5%] right-[12.5%] top-[15px] h-[3px] rounded-full bg-gray-100 dark:bg-white/[0.07]" />
    <span
      className="absolute left-[12.5%] top-[15px] h-[3px] rounded-full bg-gradient-to-r from-[#f2cf6b] to-[#d4a63a]"
      style={{ width: `${Math.max(0, Math.min(75, ((percent - 25) / 75) * 75))}%` }}
    />
    {MILESTONES.map((m) => {
      const got = percent >= m.at
      return (
        <div key={m.at} className="relative text-center">
          <span
            className={`mx-auto flex w-8 h-8 items-center justify-center rounded-full ${
              got
                ? 'text-[#7a5a10] bg-[radial-gradient(circle_at_35%_30%,#fff6d6,#f2cf6b_60%,#d4a63a)] shadow-[0_3px_8px_-3px_rgba(180,130,20,0.6)]'
                : 'bg-white dark:bg-card-dark border-2 border-gray-200 dark:border-white/[0.12] text-gray-300 dark:text-white/30'
            }`}
          >
            {got ? <Medal /> : m.at === 100 ? <FlagIcon size={14} /> : null}
          </span>
          <span
            className={`mt-1.5 block text-[11px] lg:text-[13px] font-bold ${
              m.at === 100 ? 'text-brand' : 'text-gray-500 dark:text-white/55'
            }`}
          >
            {m.at === 100 && !got ? `완주 · ${remainDays}일` : m.label}
          </span>
        </div>
      )
    })}
  </div>
)

const JourneyBoard = ({
  plan,
  today,
  showToday,
  onClick,
}: {
  plan: PlanSummary
  today?: TodayReading
  /** 오늘 카드에 오르지 않은 플랜만 true — 오늘 분량 한 줄을 붙인다 */
  showToday: boolean
  onClick: () => void
}) => {
  const { totalDays, doneDays, remainDays, percent } = planNumbers(plan)
  const stops = buildTrailStops(plan.book_route, totalDays)
  const { position, states } = trailProgress(stops, doneDays, totalDays)
  const book = currentBookName(plan, today, doneDays)
  const here = stops[states.indexOf('current')]?.label
  const startLabel = formatStartLabel(plan.progress?.start_date)
  const streak = streakAlive(plan.progress) ? plan.progress?.streak_count ?? 0 : 0
  const info = showToday ? todayInfo(plan, today) : null

  return (
    <button
      type="button"
      onClick={onClick}
      className="group block w-full text-left rounded-3xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-[0_10px_24px_-20px_rgba(0,30,80,0.4)] dark:shadow-[0_6px_18px_rgba(0,0,0,0.3)] p-4 lg:p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-[var(--brand-soft-strong)] active:scale-[0.99]"
    >
      <div className="flex items-center gap-3">
        <span className="relative block w-11 h-11 lg:w-12 lg:h-12 shrink-0 overflow-hidden rounded-[13px] ring-1 ring-black/[0.06] dark:ring-white/10">
          <PlanVisual plan={plan} size="thumb" />
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="text-[17px] lg:text-[20px] font-extrabold text-ink-strong tracking-[-0.02em] leading-snug truncate">
            {plan.title}
          </h4>
          <p className="mt-0.5 flex items-center gap-1.5 flex-wrap text-[12px] lg:text-[14.5px] tracking-[-0.01em] text-gray-500 dark:text-white/50">
            {plan.is_personal && (
              <span className="inline-flex items-center px-1.5 py-[2px] rounded-md bg-[var(--brand-soft-strong)] text-brand text-[10.5px] lg:text-[12.5px] font-bold leading-none lg:px-2 lg:py-1">
                {plan.is_owner ? '내 플랜' : `${plan.owner_name ?? '친구'}님의 플랜`}
                {(plan.participant_count ?? 0) > 1 && ` · ${plan.participant_count}명`}
              </span>
            )}
            <span>{totalDays}일 플랜</span>
            {startLabel && (
              <>
                <span aria-hidden className="text-gray-300 dark:text-white/20">·</span>
                <span>{startLabel}</span>
              </>
            )}
          </p>
        </div>
        <Ring percent={percent} />
      </div>

      <div className="mt-3 lg:mt-4">
        <PlanTrail stops={stops} states={states} position={position} meLabel={book ?? `${doneDays + 1}일차`} />
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[12px] lg:text-[14px] tracking-[-0.01em] text-gray-500 dark:text-white/50 tabular-nums">
        <span className="min-w-0">
          지금{' '}
          <b className="font-bold text-gray-800 dark:text-white/80">
            {[here, book].filter((v, i, a) => v && a.indexOf(v) === i).join(' · ') || `${doneDays + 1}일차`}
          </b>
        </span>
        <span className="shrink-0 inline-flex items-center gap-2">
          {streak > 0 && (
            <span className="inline-flex items-center gap-0.5 font-bold text-amber-600 dark:text-amber-300">
              <FlameIcon size={12} />
              {streak}일
            </span>
          )}
          <span>
            <b className="font-bold text-gray-700 dark:text-white/75">{doneDays}일</b> 읽음 · {remainDays}일 남음
          </span>
        </span>
      </div>

      <Milestones percent={percent} remainDays={remainDays} />

      {info && info.day != null && (
        <div
          className={`mt-4 rounded-2xl px-3.5 py-3 flex items-center justify-between gap-3 ${
            info.doneToday ? 'bg-emerald-500/[0.07] dark:bg-emerald-400/[0.08]' : 'bg-[var(--brand-soft)]'
          }`}
        >
          <div className="min-w-0">
            <p
              className={`text-[11.5px] lg:text-[14px] font-bold ${
                info.doneToday ? 'text-emerald-600 dark:text-emerald-300' : 'text-brand'
              }`}
            >
              {info.doneToday ? '오늘 도장 찍었어요' : `오늘 읽을 말씀 · ${info.day}일차`}
            </p>
            <p className="mt-0.5 text-[15px] lg:text-[18px] font-extrabold tracking-[-0.02em] text-ink-strong truncate">
              {info.doneToday ? info.calendarAfter ?? `다음 ${info.day}일차 · ${info.headline}` : info.headline}
            </p>
          </div>
          <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-brand text-white pl-3.5 pr-2.5 py-2 text-[12.5px] lg:text-[15px] font-bold leading-none transition-transform group-hover:scale-[1.04]">
            {info.doneToday ? '더 읽기' : '읽기'}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
        </div>
      )}
    </button>
  )
}

export default JourneyBoard
