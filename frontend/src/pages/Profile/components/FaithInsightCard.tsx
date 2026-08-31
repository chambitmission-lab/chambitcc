import { useGrowthSummary, useGrowthRecentDays } from '../../../hooks/useGrowth'
import { useLanguage } from '../../../contexts/LanguageContext'
import { buildRecentCells } from './growthFootprints'
import {
  AnsweredIcon,
  IntercessionIcon,
  ThanksRecordIcon,
} from '../../../components/icons/GrowthIcons'

/** GrowthHook 발자국 스트립과 같은 기간을 공유해 요청이 하나로 합쳐진다 */
const WINDOW_DAYS = 14

/**
 * '요즘 나의 걸음' — 숫자 나열 대신 변화·관계를 한 문장으로 읽어주는 카드.
 *
 * AI 없이 룰 기반(말씀 여정 인사이트와 같은 철학):
 * - 헤드라인: 최근 7일 vs 그 전 7일 활동일 비교
 * - 칩: 응답된 기도(앰버 시맨틱) · 함께한 기도 · 감사 기록 — 0이면 숨김
 * 칩 앞의 마크는 duotone 아이콘(GrowthIcons)이라 칩의 글자색을 그대로 따라간다.
 * 활동이 아예 없으면 카드 자체를 렌더하지 않는다 (첫 방문자에게 빈 훈수 금지).
 */
const FaithInsightCard = () => {
  const { t, language } = useLanguage()
  const hasToken = !!localStorage.getItem('access_token')
  const { data: summaryRes } = useGrowthSummary(hasToken)
  const { data: recent } = useGrowthRecentDays(WINDOW_DAYS, hasToken)
  const summary = summaryRes?.data

  if (!summary?.has_activity) return null

  const cells = buildRecentCells(recent?.data?.events, WINDOW_DAYS)
  const thisWeek = cells.slice(7).filter((c) => c.count > 0).length
  const lastWeek = cells.slice(0, 7).filter((c) => c.count > 0).length
  const diff = thisWeek - lastWeek

  const headline =
    language === 'en'
      ? diff > 0
        ? `${diff} more day${diff > 1 ? 's' : ''} with God than last week`
        : diff === 0 && thisWeek > 0
          ? 'Keeping the same steady pace as last week'
          : thisWeek > 0
            ? 'A slower week — and that is okay'
            : 'Waiting for your first footprint this week'
      : diff > 0
        ? `지난주보다 ${diff}일 더 하나님과 함께한 요즘이에요`
        : diff === 0 && thisWeek > 0
          ? '지난주와 같은 걸음을 꾸준히 지키고 있어요'
          : thisWeek > 0
            ? '조금 쉬어가는 한 주예요 — 천천히 가도 괜찮아요'
            : '이번 주 첫 발자국을 기다리고 있어요'

  const chips = [
    {
      key: 'answered',
      icon: <AnsweredIcon size={14} />,
      label: t('insightAnsweredChip'),
      value: summary.totals.answered,
      // 앰버는 '응답됨' 시맨틱 전용
      className:
        'bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400',
    },
    {
      key: 'intercessions',
      icon: <IntercessionIcon size={14} />,
      label: t('insightIntercessionChip'),
      value: summary.totals.intercessions,
      className: 'bg-[var(--brand-soft)] border-[var(--brand-soft-strong)] text-brand',
    },
    {
      key: 'thanks',
      icon: <ThanksRecordIcon size={14} />,
      label: t('insightThanksChip'),
      value: summary.totals.thanks,
      className: 'bg-[var(--brand-soft)] border-[var(--brand-soft-strong)] text-brand',
    },
  ].filter((c) => c.value > 0)

  return (
    <div className="px-4 py-3">
      <div
        className="
          relative overflow-hidden rounded-2xl px-5 py-4
          bg-white/80 dark:bg-card-dark
          border border-gray-200/70 dark:border-white/[0.08]
          shadow-sm
          dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_24px_var(--brand-soft)]
        "
      >
        <div className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />

        <div className="relative z-10">
          <div className="text-[11px] font-semibold text-brand mb-1">
            {t('insightLabel')}
          </div>
          <div className="text-[16px] font-bold text-ink-strong leading-snug tracking-[-0.015em]">
            {headline}
          </div>

          {chips.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {chips.map((chip) => (
                <span
                  key={chip.key}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11.5px] font-semibold ${chip.className}`}
                >
                  <span className="inline-flex shrink-0" aria-hidden="true">
                    {chip.icon}
                  </span>
                  {chip.label}
                  <span className="tabular-nums font-bold">
                    {chip.value.toLocaleString()}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FaithInsightCard
