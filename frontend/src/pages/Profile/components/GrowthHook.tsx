import { useNavigate } from 'react-router-dom'
import { useGrowthSummary, useGrowthRecentDays } from '../../../hooks/useGrowth'
import { useLanguage } from '../../../contexts/LanguageContext'
import { buildRecentCells, cellLevel } from './growthFootprints'
import { SproutIcon, StreakFlameIcon } from '../../../components/icons/GrowthIcons'
import './GrowthHook.css'
import { tokenStore } from '../../../utils/tokenStore'

/** 발자국 스트립 일수 — 2주면 "요즘의 리듬"이 보이고 카드 한 줄에 들어간다 */
const STRIP_DAYS = 14

/**
 * 프로필 → 신앙 여정(/growth) 진입 카드.
 *
 * "함께한 지 N일째" 한 줄만 있으면 그 N일이 무엇으로 채워졌는지 알 수 없어
 * 숫자가 붕 뜬다. 그래서 (1) 자기 최고 연속 기록 대비 지금을 보여주는 성장 링과
 * (2) 최근 2주 발자국 스트립을 함께 둔다 — 카드 안에서 "얼마나, 어떤 리듬으로"가
 * 같이 읽히게.
 */
const GrowthHook = () => {
  const navigate = useNavigate()
  const hasToken = !!tokenStore.getAccess()
  const { data } = useGrowthSummary(hasToken)
  const { data: recent } = useGrowthRecentDays(STRIP_DAYS, hasToken)
  const summary = data?.data
  const { t, language } = useLanguage()

  const days = summary?.days_together ?? 0
  const hasActivity = !!summary?.has_activity
  const streak = summary?.streak
  const current = streak?.current ?? 0
  const best = Math.max(streak?.best ?? 0, current)

  const cells = buildRecentCells(recent?.data?.events, STRIP_DAYS)
  const activeDays = cells.filter(c => c.count > 0).length

  const teaser = hasActivity
    ? (language === 'en' ? `Day ${days} together` : `함께한 지 ${days}일째`)
    : t('growthHookEmpty')

  // 링 채움 = 지금 연속 기록 / 자기 최고 기록. 최고 기록을 갱신 중이면 꽉 찬다.
  const ringPct = best > 0 ? Math.min(100, (current / best) * 100) : 0
  const R = 26
  const CIRC = 2 * Math.PI * R

  const streakLine = language === 'en'
    ? current > 0
      ? `${current}-day streak · best ${best}`
      : `${activeDays} active days in ${STRIP_DAYS}`
    : current > 0
      ? `${current}일 연속 · 최고 ${best}일`
      : `최근 ${STRIP_DAYS}일 중 ${activeDays}일 기록`

  return (
    <div className="px-4 py-3">
      <button
        type="button"
        onClick={() => navigate('/growth')}
        className="
          group relative w-full overflow-hidden text-left
          rounded-2xl px-5 py-4
          bg-white/80 dark:bg-card-dark
          border border-gray-200/70 dark:border-white/[0.08]
          shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_24px_var(--brand-soft)]
          transition-all duration-200 hover:-translate-y-0.5
        "
      >
        <div className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />
        <div
          className="pointer-events-none absolute -top-8 -right-8 w-28 h-28 rounded-full bg-[var(--brand-soft-strong)] blur-2xl"
          aria-hidden="true"
        />

        <div className="relative flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-brand mb-1">
              {t('growthHookLabel')}
            </div>
            <div className="text-[16px] font-bold text-ink-strong leading-snug tracking-[-0.015em]">
              {teaser}
            </div>
            {hasActivity ? (
              <div className="mt-1.5 flex items-center gap-1 text-[12px] font-semibold text-gray-500 dark:text-white/60">
                {current > 0 && (
                  <span
                    className={`gh-flame${streak?.active_today ? ' is-lit' : ''}`}
                    aria-hidden="true"
                  >
                    <StreakFlameIcon size={14} />
                  </span>
                )}
                <span>{streakLine}</span>
              </div>
            ) : (
              <div className="text-[12px] text-gray-500 dark:text-white/55 mt-1">
                {t('growthHookSub')}
              </div>
            )}
          </div>

          {/* 성장 링 — 자기 최고 연속 기록 대비 현재. 가운데 새싹은 카드의 정체성 */}
          <div className="shrink-0 relative w-[60px] h-[60px] group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 60 60" className="w-full h-full -rotate-90" aria-hidden="true">
              <circle
                cx="30"
                cy="30"
                r={R}
                fill="none"
                stroke="var(--brand-soft-strong)"
                strokeWidth="4"
              />
              {ringPct > 0 && (
                <circle
                  className="gh-ring-fill"
                  cx="30"
                  cy="30"
                  r={R}
                  fill="none"
                  stroke="var(--brand)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC * (1 - ringPct / 100)}
                />
              )}
            </svg>
            <span
              className="absolute inset-0 flex items-center justify-center text-brand"
              aria-hidden="true"
            >
              <SproutIcon size={26} />
            </span>
          </div>
        </div>

        {/* 최근 2주 발자국 — "173일"에 실체를 준다. 칸이 순차적으로 피어난다 */}
        {hasActivity && (
          <div className="relative mt-3.5">
            <div className="flex items-center gap-[3px]">
              {cells.map((cell, i) => (
                <span
                  key={cell.date}
                  className="gh-cell"
                  data-level={cellLevel(cell.count)}
                  data-today={cell.isToday}
                  style={{ animationDelay: `${i * 28}ms` }}
                  aria-hidden="true"
                />
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400 dark:text-white/40">
              <span>
                {language === 'en' ? `Last ${STRIP_DAYS} days` : `최근 ${STRIP_DAYS}일`}
              </span>
              <span className="inline-flex items-center gap-0.5 font-semibold text-brand">
                {language === 'en' ? 'See journey' : '여정 보기'}
                <span className="material-icons-round text-[14px] transition-transform group-hover:translate-x-0.5">
                  chevron_right
                </span>
              </span>
            </div>
          </div>
        )}
      </button>
    </div>
  )
}

export default GrowthHook
