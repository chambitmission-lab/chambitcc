import type { GrowthSummaryData, MonthDelta } from '../../../types/growth'

interface GrowthStatsProps {
  summary: GrowthSummaryData
}

const fmt = (n: number) => n.toLocaleString('ko-KR')

const cardCls =
  'relative overflow-hidden rounded-xl p-3 bg-white/80 dark:bg-card-dark ' +
  'border border-gray-200/70 dark:border-white/[0.06] shadow-sm ' +
  'dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)]'

const gradientNum = 'text-brand'

const SectionTitle = ({ icon, children }: { icon: string; children: React.ReactNode }) => (
  <h3 className="text-[14px] font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 tracking-[-0.01em]">
    <span className="material-icons-outlined text-xl text-brand">
      {icon}
    </span>
    {children}
  </h3>
)

type StatTone = 'top' | 'zero' | 'normal'

const toneNum: Record<StatTone, string> = {
  // 가장 활발한 항목 — 브랜드 블루 + 글로우
  top: 'text-[22px] text-brand drop-shadow-[0_0_10px_var(--brand-glow)]',
  // 아직 0인 항목 — 톤다운
  zero: 'text-[20px] text-gray-300 dark:text-white/25',
  normal: `text-[20px] ${gradientNum}`,
}

const StatCell = ({
  icon,
  value,
  label,
  tone = 'normal',
}: {
  icon: string
  value: string
  label: string
  tone?: StatTone
}) => (
  <div className={`${cardCls} text-center`}>
    <div className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />
    <div className={`relative z-10 text-base mb-0.5 ${tone === 'zero' ? 'grayscale opacity-50' : ''}`}>
      {icon}
    </div>
    <div className={`relative z-10 font-bold tracking-[-0.015em] ${toneNum[tone]}`}>
      {value}
    </div>
    <div
      className={
        'relative z-10 text-[10px] font-medium whitespace-nowrap ' +
        (tone === 'zero'
          ? 'text-gray-400 dark:text-white/40'
          : 'text-gray-700 dark:text-white/70')
      }
    >
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

  // 오늘 활동을 완료해 스트릭을 지킨 상태 (구버전 백엔드면 current>0으로 근사)
  const keptToday = streak.active_today ?? streak.current > 0

  // 발자취 6칸 — 가장 활발한 항목(상위 2개)은 네온 강조, 0인 항목은 톤다운
  const footprints = [
    { key: 'prayers', icon: '🙏', value: totals.prayers, label: '기도' },
    { key: 'intercessions', icon: '🤝', value: totals.intercessions, label: '함께 기도' },
    { key: 'answered', icon: '✨', value: totals.answered, label: '응답', zeroLabel: '응답 대기 중 ✨' },
    { key: 'verses_read', icon: '📖', value: totals.verses_read, label: '읽은 절' },
    { key: 'devotional_notes', icon: '📝', value: totals.devotional_notes, label: '묵상 노트' },
    { key: 'thanks', icon: '🌸', value: totals.thanks, label: '감사', zeroLabel: '첫 감사 기다리는 중' },
  ]
  const topKeys = footprints
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 2)
    .map((c) => c.key)

  return (
    <div className="px-4 pt-5 space-y-5">
      {/* 연속 활동 — 블루 서피스, 온기는 불꽃 이모지에만 */}
      <div>
        <SectionTitle icon="local_fire_department">연속 활동</SectionTitle>
        <div
          className="
            relative overflow-hidden rounded-2xl p-3.5
            bg-white/80 dark:bg-card-dark
            border border-gray-200/70 dark:border-white/[0.06] shadow-sm
            dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)]
          "
        >
          <div className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />
          <div
            className="pointer-events-none absolute -top-10 -right-8 w-32 h-32 rounded-full bg-[var(--brand-soft-strong)] blur-2xl"
            aria-hidden="true"
          />
          <div className="relative grid grid-cols-2 gap-2">
            <div className="flex flex-col items-center justify-center rounded-xl py-3 bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)]">
              <div className="flex items-end gap-1">
                <span
                  className={
                    'text-[34px] leading-none ' +
                    (streak.current === 0
                      ? 'grayscale opacity-40'
                      : keptToday
                        ? 'animate-streak-flame motion-reduce:animate-none'
                        : '')
                  }
                >
                  🔥
                </span>
                <span className="text-[30px] leading-none font-extrabold tracking-[-0.02em] text-brand">
                  {streak.current}
                </span>
                <span className="text-[13px] font-bold text-[var(--brand-muted)] pb-0.5">
                  일
                </span>
              </div>
              <div className="mt-1.5 text-[10px] font-medium text-gray-700 dark:text-white/70">
                현재 연속
              </div>
            </div>
            <div className="flex flex-col items-center justify-center rounded-xl py-3 bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)]">
              <div className="flex items-end gap-1">
                <span className="text-[22px] leading-none">🏆</span>
                <span className="text-[24px] leading-none font-extrabold tracking-[-0.02em] text-brand">
                  {streak.best}
                </span>
                <span className="text-[12px] font-bold text-[var(--brand-muted)] pb-0.5">
                  일
                </span>
              </div>
              <div className="mt-1.5 text-[10px] font-medium text-gray-700 dark:text-white/70">
                최장 연속
              </div>
            </div>
          </div>
          <p className="relative mt-2.5 text-center text-[11px] font-semibold text-[var(--brand-muted)]">
            {keptToday && streak.current > 0
              ? '오늘도 불꽃을 지켰어요! 내일도 이어가 볼까요? 🔥'
              : streak.current > 0
                ? '오늘 활동하면 불꽃이 계속 타올라요!'
                : '오늘 말씀 한 절이면 불꽃이 다시 타올라요'}
          </p>
        </div>
      </div>

      {/* 누적 활동 */}
      <div>
        <SectionTitle icon="insights">지금까지의 발자취</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {footprints.map((c) => {
            const isZero = c.value === 0
            return (
              <StatCell
                key={c.key}
                icon={c.icon}
                value={fmt(c.value)}
                label={isZero && c.zeroLabel ? c.zeroLabel : c.label}
                tone={isZero ? 'zero' : topKeys.includes(c.key) ? 'top' : 'normal'}
              />
            )
          })}
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
                  bg-[var(--brand-soft)]
                  border border-[var(--brand-soft-strong)]
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
