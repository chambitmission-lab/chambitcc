import { useState } from 'react'
import type { GlowLevel } from '../../../types/achievement'
import { GLOW_LEVELS } from '../../../types/achievement'
import { glowTemperature } from '../../../utils/achievementCalculator'
import { getReadableTextStyle, toOpaqueColor } from '../../../utils/contrastText'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useGrowthRecentDays } from '../../../hooks/useGrowth'
import { buildWeekCells, type DayCell } from './growthFootprints'
import './LevelProgress.css'

interface LevelProgressProps {
  currentLevel: GlowLevel
  currentPoints: number
  pointsToNext: { needed: number; total: number } | null
  thisWeekCount: number
  totalCount: number
  streakDays: number
}

/**
 * '신앙의 온도' 통합 카드 — 이 화면에서 숫자를 말하는 유일한 자리.
 *
 * 카드 이름이 '온도'인데 온도라는 시각 언어가 없던 문제를 해소:
 * - 온도 리딩(36.5° 시작, 당근 매너온도 벤치마크)이 히어로
 * - 진행 바 → 수은구 달린 온도계 게이지
 * - 새싹→구원의 별 9단계 여정 스트립(탭하면 각 단계 이름 확인)
 * - '이번 주' 스탯 밑에 요일 마이크로 도트 (아래 스토리 트레이의 축약판)
 */
const LevelProgress = ({
  currentLevel,
  currentPoints,
  pointsToNext,
  thisWeekCount,
  totalCount,
  streakDays,
}: LevelProgressProps) => {
  const { t, language } = useLanguage()
  const [guideOpen, setGuideOpen] = useState(false)
  const currentIdx = GLOW_LEVELS.findIndex((l) => l.level === currentLevel.level)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const progress = pointsToNext
    ? ((pointsToNext.total - pointsToNext.needed) / pointsToNext.total) * 100
    : 100
  const badgeText = getReadableTextStyle(currentLevel.glowColor)
  const temperature = glowTemperature(currentPoints)
  const nextLevel = GLOW_LEVELS[currentIdx + 1] ?? null
  const selIdx = selectedIdx ?? currentIdx
  const selLevel = GLOW_LEVELS[selIdx]

  // 요일 마이크로 도트 — 스토리 트레이(useGrowthRecentDays 14일)와 같은 쿼리를
  // 공유하므로 추가 요청 없음. 데이터 도착 전에는 자리 잡지 않고 숨긴다.
  const hasToken = !!localStorage.getItem('access_token')
  const { data: recent } = useGrowthRecentDays(14, hasToken)
  const weekCells = recent?.data ? buildWeekCells(recent.data.events) : null

  return (
    <div className="px-4 py-3">
      <div
        className="
          relative overflow-hidden rounded-2xl p-5
          bg-white/80 dark:bg-card-dark
          border border-gray-200/70 dark:border-white/[0.08]
          shadow-sm
          dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_24px_var(--brand-soft)]
        "
      >
        {/* 다크 카드 표면 미세 그라데이션 */}
        <div className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />

        {/* 헤더 */}
        <div className="relative z-10 flex items-center justify-between mb-3">
          <div>
            <h3 className="text-[14px] font-bold text-ink-strong tracking-[-0.01em]">
              {t('levelTitle')}
            </h3>
            <p className="text-[12px] text-gray-500 dark:text-white/55 mt-0.5">
              {currentPoints.toLocaleString()} {t('levelPoints')}
            </p>
          </div>
          <div
            className="px-4 py-1.5 rounded-full text-[13px] font-bold shadow-lg"
            style={{
              backgroundColor: toOpaqueColor(currentLevel.glowColor),
              border: '1px solid rgba(0, 0, 0, 0.08)',
              boxShadow: `0 0 18px ${currentLevel.glowColor}`,
              color: badgeText.color,
              textShadow: badgeText.textShadow,
            }}
          >
            Lv.{currentLevel.level}
          </div>
        </div>

        {/* 온도 히어로 — 온도 리딩 + 현재 단계 이름 */}
        <div className="relative z-10 mb-3 flex items-end justify-between">
          <div className="brand-text-gradient font-bold leading-none tracking-[-0.03em]">
            <span className="text-[38px]">{temperature.toFixed(1)}</span>
            <span className="ml-0.5 align-top text-[19px]">°C</span>
          </div>
          <div className="flex items-center gap-1.5 pb-1">
            <span
              className="lp-glow-dot"
              style={{
                backgroundColor: toOpaqueColor(currentLevel.glowColor),
                boxShadow: `0 0 8px ${currentLevel.glowColor}`,
              }}
              aria-hidden="true"
            />
            <span className="text-[14px] font-bold text-ink-strong tracking-[-0.01em]">
              {t(currentLevel.nameKey)}
            </span>
          </div>
        </div>

        {/* 온도계 게이지 — 수은구 + 트랙. fill 은 브랜드 블루 솔리드(라이트
            트랙 위에서도 항상 가독), 레벨 색은 glow 로만 표현. */}
        <div className="relative z-10">
          <div className="flex items-center">
            <div
              className="lp-bulb"
              style={{ boxShadow: `0 0 12px ${currentLevel.glowColor}` }}
              aria-hidden="true"
            />
            <div className="relative flex-1 -ml-1.5 h-3 rounded-r-full bg-gray-200 dark:bg-white/[0.06] overflow-hidden">
              <div
                className="h-3 transition-all duration-500 relative"
                style={{
                  width: `${progress}%`,
                  borderRadius: progress >= 99 ? '0 9999px 9999px 0' : '0',
                  background: 'var(--brand)',
                  boxShadow: `0 0 10px ${currentLevel.glowColor}`,
                }}
              >
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"
                  style={{ animation: 'shimmer 2s infinite' }}
                />
              </div>
            </div>
          </div>

          {pointsToNext && nextLevel ? (
            <div className="flex items-center justify-between mt-2 text-[12px]">
              <span className="text-gray-600 dark:text-white/65">
                {t('levelNext')} · {t(nextLevel.nameKey)}
              </span>
              <span className="font-semibold text-brand">
                {t('levelToNext')} {pointsToNext.needed.toLocaleString()}P
              </span>
            </div>
          ) : (
            <div className="text-center mt-2">
              <span className="text-[12px] font-bold text-brand">
                🎉 {t('levelMaxReached')} 🎉
              </span>
            </div>
          )}
        </div>

        {/* 레벨 여정 — 새싹부터 구원의 별까지, 탭하면 각 단계 확인 */}
        <div className="relative z-10 mt-4">
          <div className="lp-journey">
            <div className="lp-journey__line" aria-hidden="true" />
            <div
              className="lp-journey__fill"
              style={{ width: `${(currentIdx / (GLOW_LEVELS.length - 1)) * 100}%` }}
              aria-hidden="true"
            />
            {GLOW_LEVELS.map((lv, i) => (
              <button
                key={lv.level}
                type="button"
                className="lp-journey__stop"
                data-state={i < currentIdx ? 'passed' : i === currentIdx ? 'current' : 'future'}
                data-selected={i === selIdx}
                onClick={() => setSelectedIdx(i)}
                aria-label={`Lv.${lv.level} ${t(lv.nameKey)}`}
              >
                <span
                  className="lp-journey__dot"
                  style={
                    i <= currentIdx
                      ? {
                          backgroundColor: toOpaqueColor(lv.glowColor),
                          boxShadow:
                            i === currentIdx ? `0 0 10px ${lv.glowColor}` : undefined,
                        }
                      : undefined
                  }
                />
              </button>
            ))}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[11.5px]">
            <span className="font-semibold text-gray-600 dark:text-white/65">
              Lv.{selLevel.level} {t(selLevel.nameKey)}
            </span>
            {selIdx === currentIdx && (
              <span className="rounded-full bg-[var(--brand-soft)] px-2 py-[1.5px] text-[10px] font-bold text-brand">
                {t('levelJourneyHere')}
              </span>
            )}
            <span className="text-gray-400 dark:text-white/40">
              · {language === 'en'
                ? `from ${selLevel.minPoints.toLocaleString()}P`
                : `${selLevel.minPoints.toLocaleString()}P부터`}
            </span>
          </div>
        </div>

        {/* 활동 스탯 — 숫자는 브랜드 강조, '이번 주'는 요일 도트로 리듬 표시 */}
        <div className="relative z-10 mt-4 grid grid-cols-3 divide-x divide-gray-200/70 dark:divide-white/[0.06] rounded-xl border border-gray-200/70 dark:border-white/[0.06] bg-gray-50/70 dark:bg-white/[0.03]">
          <TemperatureStat value={totalCount} label={t('totalPrayers')} />
          <TemperatureStat
            value={thisWeekCount}
            label={t('profileThisWeek')}
            cells={weekCells}
          />
          <TemperatureStat
            value={streakDays}
            label={t('consecutivePrayers')}
            suffix={streakDays >= 7 ? '🔥' : undefined}
          />
        </div>

        {/* 포인트 획득 방법 안내 — 기본 접힘, 탭하면 펼침 */}
        <div
          className="
            relative z-10 mt-4 overflow-hidden rounded-xl
            bg-[var(--brand-soft)]
            border border-[var(--brand-soft-strong)]
          "
        >
          <button
            type="button"
            onClick={() => setGuideOpen((v) => !v)}
            aria-expanded={guideOpen}
            aria-controls="level-earn-guide"
            className="
              flex w-full items-center justify-between px-3 py-2.5
              text-left transition-colors
              hover:bg-[var(--brand-soft-strong)]
            "
          >
            <span className="text-[12px] font-semibold text-gray-700 dark:text-white/80">
              💡 {t('levelHowToEarn')}
            </span>
            <span
              className={`material-icons-round text-[18px] text-[var(--brand-muted)] transition-transform duration-300 ${
                guideOpen ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            >
              expand_more
            </span>
          </button>
          <div
            id="level-earn-guide"
            className={`grid transition-[grid-template-rows] duration-300 ease-out ${
              guideOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            }`}
          >
            <div className="overflow-hidden">
              <div className="grid grid-cols-2 gap-y-1 gap-x-2 px-3 pb-3 text-[11.5px] text-gray-600 dark:text-white/60 leading-relaxed">
                <div>• {t('earnPrayer')}: 10P</div>
                <div>• {t('earnReply')}: 10P</div>
                <div>• {t('earnVerse')}: 3P</div>
                <div>• {t('earnPrayingFor')}: 5P</div>
                <div>• {t('earnChapter')}: 20P</div>
                <div>• {t('earnBook')}: 200P</div>
                <div>• {t('earnStreak')}: 5P</div>
                <div>• {t('earnHighlight')}: 5P</div>
                <div>• {t('earnNote')}: 15P</div>
                <div>• {t('earnFavorite')}: 3P</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const TemperatureStat = ({
  value,
  label,
  suffix,
  cells,
}: {
  value: number
  label: string
  suffix?: string
  cells?: DayCell[] | null
}) => (
  <div className="px-2 py-3 text-center">
    <div className="brand-text-gradient text-[24px] font-bold leading-none tracking-[-0.02em]">
      {value.toLocaleString()}
      {suffix && (
        <span className="ml-0.5 align-baseline text-[14px] leading-none">{suffix}</span>
      )}
    </div>
    {cells && (
      <div className="mt-1.5 flex items-center justify-center gap-[3px]" aria-hidden="true">
        {cells.map((c) => (
          <span
            key={c.date}
            className="lp-weekdot"
            data-on={c.count > 0}
            data-today={c.isToday}
            data-future={c.isFuture}
          />
        ))}
      </div>
    )}
    <div className="mt-1.5 text-[10.5px] font-medium text-gray-500 dark:text-white/50 whitespace-nowrap">
      {label}
    </div>
  </div>
)

export default LevelProgress
