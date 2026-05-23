import type { GrowthSummaryData, MonthDelta } from '../../../types/growth'

interface GrowthStatsProps {
  summary: GrowthSummaryData
}

const fmt = (n: number) => n.toLocaleString('ko-KR')

const cardCls =
  'relative overflow-hidden rounded-xl p-3 bg-white/80 dark:bg-card-dark ' +
  'border border-gray-200/70 dark:border-white/[0.06] shadow-sm ' +
  'dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)]'

const gradientNum =
  'bg-gradient-to-br from-purple-500 to-pink-500 bg-clip-text text-transparent'

const SectionTitle = ({ icon, children }: { icon: string; children: React.ReactNode }) => (
  <h3 className="text-[14px] font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 tracking-[-0.01em]">
    <span className="material-icons-outlined text-xl bg-gradient-to-br from-purple-500 to-pink-500 bg-clip-text text-transparent">
      {icon}
    </span>
    {children}
  </h3>
)

const StatCell = ({ icon, value, label }: { icon: string; value: string; label: string }) => (
  <div className={`${cardCls} text-center`}>
    <div className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />
    <div className="relative z-10 text-base mb-0.5">{icon}</div>
    <div className={`relative z-10 text-[20px] font-bold tracking-[-0.015em] ${gradientNum}`}>
      {value}
    </div>
    <div className="relative z-10 text-[10px] font-medium text-gray-700 dark:text-white/70 whitespace-nowrap">
      {label}
    </div>
  </div>
)

const DeltaRow = ({ d }: { d: MonthDelta }) => {
  const diff = d.this_month - d.last_month
  const up = diff > 0
  const down = diff < 0
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-base w-6 text-center">{d.icon}</span>
      <span className="flex-1 text-[13px] font-semibold text-gray-800 dark:text-white/85">
        {d.label}
      </span>
      <span className="text-[13px] font-bold text-gray-900 dark:text-white tabular-nums">
        {fmt(d.this_month)}
      </span>
      <span
        className={
          'text-[12px] font-bold tabular-nums w-12 text-right ' +
          (up
            ? 'text-emerald-500'
            : down
              ? 'text-gray-400 dark:text-white/40'
              : 'text-gray-400 dark:text-white/40')
        }
      >
        {up ? '▲' : down ? '▼' : '–'}
        {diff !== 0 ? Math.abs(diff) : ''}
      </span>
    </div>
  )
}

const GrowthStats = ({ summary }: GrowthStatsProps) => {
  const { totals, streak, deltas, milestones } = summary

  return (
    <div className="px-4 pt-5 space-y-5">
      {/* 연속 활동 */}
      <div>
        <SectionTitle icon="local_fire_department">연속 활동</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          <StatCell
            icon="🔥"
            value={`${streak.current}일`}
            label="현재 연속"
          />
          <StatCell icon="🏆" value={`${streak.best}일`} label="최장 연속" />
        </div>
      </div>

      {/* 누적 활동 */}
      <div>
        <SectionTitle icon="insights">지금까지의 발자취</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          <StatCell icon="🙏" value={fmt(totals.prayers)} label="기도" />
          <StatCell icon="🤝" value={fmt(totals.intercessions)} label="함께 기도" />
          <StatCell icon="✨" value={fmt(totals.answered)} label="응답" />
          <StatCell icon="📖" value={fmt(totals.verses_read)} label="읽은 절" />
          <StatCell icon="📝" value={fmt(totals.devotional_notes)} label="묵상 노트" />
          <StatCell icon="🌸" value={fmt(totals.thanks)} label="감사" />
        </div>

        {/* 보조 기록 */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          <MiniChip label={`${fmt(totals.chapters_read)}장 통독`} />
          {totals.books_completed > 0 && (
            <MiniChip label={`완독 ${totals.books_completed}권`} />
          )}
          {totals.prayer_minutes > 0 && (
            <MiniChip label={`집중기도 ${fmt(totals.prayer_minutes)}분`} />
          )}
          {totals.plan_days > 0 && (
            <MiniChip label={`플랜 ${fmt(totals.plan_days)}일`} />
          )}
          {totals.games_completed > 0 && (
            <MiniChip label={`게임 ${totals.games_completed}완주`} />
          )}
        </div>
      </div>

      {/* 이번 달 vs 지난 달 */}
      {deltas.length > 0 && (
        <div>
          <SectionTitle icon="trending_up">이번 달 vs 지난 달</SectionTitle>
          <div className={`${cardCls} px-4 py-1.5`}>
            <div className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />
            <div className="relative z-10 divide-y divide-gray-100 dark:divide-white/[0.06]">
              {deltas.map((d) => (
                <DeltaRow key={d.key} d={d} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 마일스톤 칩 */}
      {milestones.length > 0 && (
        <div>
          <SectionTitle icon="emoji_events">여정의 이정표</SectionTitle>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {milestones.map((m) => (
              <div
                key={m.key}
                className="
                  shrink-0 flex items-center gap-2 rounded-full pl-2.5 pr-3 py-2
                  bg-gradient-to-r from-purple-500/10 to-pink-500/10
                  border border-purple-300/40 dark:border-purple-400/20
                "
              >
                <span className="text-base">{m.icon}</span>
                <div className="leading-tight">
                  <div className={`text-[13px] font-bold ${gradientNum}`}>
                    {m.value}
                  </div>
                  <div className="text-[10px] text-gray-600 dark:text-white/55">
                    {m.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const MiniChip = ({ label }: { label: string }) => (
  <span className="text-[11px] font-medium text-gray-600 dark:text-white/60 bg-gray-100 dark:bg-white/[0.06] rounded-full px-2.5 py-1">
    {label}
  </span>
)

export default GrowthStats
