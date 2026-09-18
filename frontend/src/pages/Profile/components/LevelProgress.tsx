import { useId, useState, type CSSProperties } from 'react'
import type { GlowLevel } from '../../../types/achievement'
import { GLOW_LEVELS } from '../../../types/achievement'
import { useLanguage } from '../../../contexts/LanguageContext'
import './LevelProgress.css'

interface LevelProgressProps {
  currentLevel: GlowLevel
  currentPoints: number
  pointsToNext: { needed: number; total: number } | null
  thisWeekCount: number
  totalCount: number
  streakDays: number
}

/* 온기 메뉴판 — 활동을 온기 그룹으로 묶고, 점수 크기를 배지 농도로 표현.
   tier: 1(잔잔한 온기) · 2(또렷한 온기) · 3(가장 뜨거운 한 걸음, 1권 완독) */
const EARN_GROUPS = [
  {
    titleKey: 'earnGroupPrayer',
    icon: 'flame',
    items: [
      { key: 'earnPrayer', points: 10 },
      { key: 'earnPrayingFor', points: 5 },
      { key: 'earnStreak', points: 5 },
    ],
  },
  {
    titleKey: 'earnGroupBible',
    icon: 'book',
    items: [
      { key: 'earnVerse', points: 3 },
      { key: 'earnChapter', points: 20 },
      { key: 'earnBook', points: 200 },
      { key: 'earnHighlight', points: 5 },
      { key: 'earnFavorite', points: 3 },
    ],
  },
  {
    titleKey: 'earnGroupShare',
    icon: 'message',
    items: [
      { key: 'earnNote', points: 15 },
      { key: 'earnReply', points: 10 },
    ],
  },
] as const

const earnTier = (points: number) => (points >= 100 ? 3 : points >= 10 ? 2 : 1)

const EARN_ICON_PATHS: Record<string, string[]> = {
  flame: [
    'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',
  ],
  book: [
    'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z',
    'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
  ],
  message: ['M7.9 20A9 9 0 1 0 4 16.1L2 22Z'],
}

const EarnIcon = ({ name }: { name: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {EARN_ICON_PATHS[name].map((d) => (
      <path key={d} d={d} />
    ))}
  </svg>
)

/**
 * '나의 등불' 카드 — 이 화면에서 숫자를 말하는 유일한 자리.
 *
 * 예전 '신앙의 온도'(당근 매너온도식 °C)를 마 25장 슬기로운 처녀 비유로 교체:
 * - 등잔에 차오르는 기름 = 다음 단계까지 진행률 (레벨 이름 '등불·별'과 세계관 일치)
 * - 불꽃은 은은한 흔들림만, 무한 글로우 없음
 * - 아래 성장 카드: 등불 계단 + 스탯 타일 + 획득 안내
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
  const nextLevel = GLOW_LEVELS[currentIdx + 1] ?? null
  const selIdx = selectedIdx ?? currentIdx
  const selLevel = GLOW_LEVELS[selIdx]

  // 계단 창 — 현재 레벨 앞 4단계 + 뒤 1단계(6칸). 끝단에선 창을 밀어 6칸 유지
  const WIN = 6
  const winStart = Math.max(0, Math.min(currentIdx - 4, GLOW_LEVELS.length - WIN))
  const winLevels = GLOW_LEVELS.slice(winStart, winStart + WIN)
  const [hintOpen, setHintOpen] = useState(false)

  return (
    <>
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
        <div className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />

        {/* 헤더 — 제목 + (?) 힌트, 오른쪽 Lv 필 */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h3 className="text-[15px] font-bold text-ink-strong tracking-[-0.01em]">
              {t('lampTitle')}
            </h3>
            <button
              type="button"
              className="lp-hint-btn"
              aria-label={t('lampHint')}
              aria-expanded={hintOpen}
              onClick={() => setHintOpen((v) => !v)}
            >
              ?
            </button>
          </div>
          <div className="lp-level-pill">Lv.{currentLevel.level}</div>
        </div>
        {hintOpen && (
          <p className="relative z-10 mt-2 rounded-lg bg-[var(--brand-soft)] px-3 py-2 text-[12px] leading-snug text-gray-600 dark:text-white/70">
            {t('lampHint')}
          </p>
        )}

        {/* 등불 히어로 — 왼쪽 등잔(기름 = 다음 단계 진행률), 오른쪽 단계 이름·말씀·채움률 */}
        <div className="relative z-10 mt-3 flex items-center gap-4">
          <OilLamp progress={progress} />
          <div className="min-w-0 flex-1">
            <div className="text-[22px] font-extrabold leading-tight text-ink-strong tracking-[-0.03em]">
              {t(currentLevel.nameKey)}
            </div>
            <p className="mt-1 break-keep text-[12px] leading-snug text-gray-500 dark:text-white/55">
              {t('lampVerse')}
            </p>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-[30px] font-extrabold leading-none text-brand tracking-[-0.03em] tabular-nums">
                {Math.floor(progress)}%
              </span>
              <span className="text-[12.5px] text-gray-500 dark:text-white/55">
                {t('lampFilled')}
              </span>
            </div>
          </div>
        </div>

        {/* 하단 — 모은 포인트 · 다음 단계까지 */}
        <div className="relative z-10 mt-4 flex items-center justify-between gap-3 border-t border-dashed border-gray-200 pt-3 text-[12.5px] dark:border-white/[0.1]">
          <span className="text-gray-500 dark:text-white/55 tabular-nums">
            {currentPoints.toLocaleString()} {t('levelPoints')}
          </span>
          {pointsToNext && nextLevel ? (
            <span className="font-bold text-brand tabular-nums">
              {t(nextLevel.nameKey)}{t('lampUntil')} {pointsToNext.needed.toLocaleString()}P
            </span>
          ) : (
            <span className="font-bold text-brand">{t('levelMaxReached')}</span>
          )}
        </div>
      </div>
    </div>

    {/* ── 성장 카드 — 등불 계단 + 스탯 타일 + 획득 안내 ── */}
    <div className="px-4 py-1">
      <div
        className="
          relative overflow-hidden rounded-2xl p-5
          bg-white/80 dark:bg-card-dark
          border border-gray-200/70 dark:border-white/[0.08]
          shadow-sm
          dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_24px_var(--brand-soft)]
        "
      >
        <div className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-ink-strong tracking-[-0.01em]">
            {t('growthGraphTitle')}
          </h3>
          <a href="#/growth" className="flex items-center gap-0.5 text-[12.5px] font-semibold text-gray-500 dark:text-white/55 hover:text-brand">
            {t('growthGraphMore')}
            <span className="material-icons-round text-[16px]" aria-hidden>chevron_right</span>
          </a>
        </div>

        <LevelStairs
          levels={winLevels}
          currentIdx={currentIdx - winStart}
          progress={progress}
          selectedIdx={selectedIdx === null ? null : selectedIdx - winStart}
          onSelect={(i) => setSelectedIdx(i + winStart)}
        />
        <div className="relative z-10 mt-2.5 flex items-center gap-1.5 text-[11.5px]">
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

        {/* 스탯 타일 3개 — 라벨(아이콘) 위, 숫자 크게, 단위 작게 */}
        <div className="relative z-10 mt-4 grid grid-cols-3 gap-2">
          <GrowthStat value={totalCount} unit={t('statUnitTimes')} label={t('totalPrayers')} icon="volunteer_activism" />
          <GrowthStat value={thisWeekCount} unit={t('statUnitTimes')} label={t('profileThisWeek')} icon="date_range" />
          <GrowthStat
            value={streakDays}
            unit={t('statUnitDays')}
            label={t('consecutivePrayers')}
            icon="local_fire_department"
            hot={streakDays >= 7}
          />
        </div>

        {/* 포인트 획득 방법 안내 — 행 카드, 탭하면 펼침 */}
        <div className="relative z-10 mt-3 overflow-hidden rounded-xl border border-gray-200/70 dark:border-white/[0.08] bg-gray-50/70 dark:bg-white/[0.03]">
          <button
            type="button"
            onClick={() => setGuideOpen((v) => !v)}
            aria-expanded={guideOpen}
            aria-controls="level-earn-guide"
            className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-[var(--brand-soft)]"
          >
            <span className="lp-earn__badge" aria-hidden="true">
              <EarnIcon name="flame" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-bold text-ink-strong tracking-[-0.01em]">
                {t('levelHowToEarn')}
              </span>
              <span className="block text-[11.5px] text-gray-500 dark:text-white/55">
                {t('levelHowToEarnSub')}
              </span>
            </span>
            <span
              className={`material-icons-round text-[20px] text-gray-400 dark:text-white/40 transition-transform duration-300 ${
                guideOpen ? 'rotate-90' : ''
              }`}
              aria-hidden="true"
            >
              chevron_right
            </span>
          </button>
          <div
            id="level-earn-guide"
            className={`grid transition-[grid-template-rows] duration-300 ease-out ${
              guideOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            }`}
          >
            <div className="overflow-hidden">
              <div className="lp-earn px-3 pb-3" data-open={guideOpen}>
                {EARN_GROUPS.map((group, gi) => {
                  const base = EARN_GROUPS.slice(0, gi).reduce(
                    (n, g) => n + g.items.length + 1,
                    0,
                  )
                  return (
                    <div key={group.titleKey} className="lp-earn__group">
                      <div
                        className="lp-earn__title"
                        style={{ '--i': base } as CSSProperties}
                      >
                        <span className="lp-earn__title-icon" aria-hidden="true">
                          <EarnIcon name={group.icon} />
                        </span>
                        {t(group.titleKey)}
                      </div>
                      {group.items.map((item, ii) => (
                        <div
                          key={item.key}
                          className="lp-earn__row"
                          style={{ '--i': base + 1 + ii } as CSSProperties}
                        >
                          <span className="lp-earn__label">{t(item.key)}</span>
                          <span className="lp-earn__leader" aria-hidden="true" />
                          <span className="lp-earn__pill" data-tier={earnTier(item.points)}>
                            {earnTier(item.points) === 3 && (
                              <span className="lp-earn__pill-flame" aria-hidden="true">
                                <EarnIcon name="flame" />
                              </span>
                            )}
                            +{item.points}P
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

/* 등불 계단 — 창에 담긴 레벨을 한 칸씩 높아지는 계단으로. 지나온 칸은 연한 브랜드,
   지금 칸은 브랜드 솔리드 + 위에 작은 등불, 다음 칸은 진행률만큼 차오른다. 탭하면 아래 줄에 단계 정보 */
const LevelStairs = ({
  levels,
  currentIdx,
  progress,
  selectedIdx,
  onSelect,
}: {
  levels: GlowLevel[]
  currentIdx: number
  progress: number
  selectedIdx: number | null
  onSelect: (i: number) => void
}) => {
  const n = levels.length
  return (
    <div className="lp-stairs relative z-10">
      {levels.map((lv, i) => {
        const state = i < currentIdx ? 'done' : i === currentIdx ? 'current' : i === currentIdx + 1 ? 'next' : 'future'
        return (
          <button
            key={lv.level}
            type="button"
            className="lp-stair"
            data-state={state}
            data-selected={selectedIdx === i}
            style={{ height: `${30 + (70 * i) / Math.max(n - 1, 1)}%` }}
            onClick={() => onSelect(i)}
            aria-label={`Lv.${lv.level}`}
          >
            {state === 'next' && (
              <span className="lp-stair__fill" style={{ height: `${Math.min(progress, 100)}%` }} aria-hidden="true" />
            )}
            {state === 'current' && <OilLamp progress={100} className="lp-stair__lamp" />}
            <span className="lp-stair__lv">Lv.{lv.level}</span>
          </button>
        )
      })}
    </div>
  )
}

/* 등잔 삽화 — 그릇 안 기름 높이가 진행률. 불꽃은 금빛(빛 자체의 색), 그릇·심지는 중립 톤 */
const LAMP_TOP = 70
const LAMP_BOTTOM = 104
const OilLamp = ({ progress, className = 'lp-lamp' }: { progress: number; className?: string }) => {
  const id = useId().replace(/:/g, '')
  const oilY = LAMP_BOTTOM - ((LAMP_BOTTOM - LAMP_TOP) * Math.min(Math.max(progress, 0), 100)) / 100
  const vessel = 'M14 70 Q14 104 50 104 Q86 104 86 70 Z'
  return (
    <svg viewBox="0 0 100 120" className={className} aria-hidden="true">
      <defs>
        <clipPath id={`${id}-v`}><path d={vessel} /></clipPath>
        <linearGradient id={`${id}-o`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd76a" />
          <stop offset="1" stopColor="#f5a300" />
        </linearGradient>
        <radialGradient id={`${id}-h`}>
          <stop offset="0" stopColor="#ffd76a" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ffd76a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="40" r="36" fill={`url(#${id}-h)`} />
      <g className="lp-lamp__flame">
        <path d="M50 16 C58 30 62 40 56 52 Q50 60 44 52 C38 42 44 30 50 16Z" fill="#ffb300" />
        <path d="M50 32 C54 40 55 46 52 52 Q50 55 48 52 C46 47 47 40 50 32Z" fill="#fff4c2" />
      </g>
      <rect x="47" y="58" width="6" height="12" rx="2" className="lp-lamp__metal" />
      <path d={vessel} className="lp-lamp__vessel" />
      <g clipPath={`url(#${id}-v)`}>
        <rect x="0" y={oilY} width="100" height="40" fill={`url(#${id}-o)`} className="lp-lamp__oil" />
      </g>
      <path d="M14 70 H86" className="lp-lamp__rim" />
      <path d="M86 78 q14 2 10 14" className="lp-lamp__rim" fill="none" />
    </svg>
  )
}

const GrowthStat = ({
  value,
  unit,
  label,
  icon,
  hot,
}: {
  value: number
  unit: string
  label: string
  icon: string
  hot?: boolean
}) => (
  <div className="lp-tile">
    <div className="flex items-center gap-1 text-[11.5px] font-medium text-gray-500 dark:text-white/55 whitespace-nowrap">
      <span className={`material-icons-round text-[15px] ${hot ? 'text-orange-500' : 'text-brand'}`} aria-hidden="true">
        {icon}
      </span>
      {label}
    </div>
    <div className="mt-1.5 leading-none">
      <span className="text-[22px] font-extrabold text-ink-strong tracking-[-0.03em] tabular-nums">
        {value.toLocaleString()}
      </span>
      {unit && (
        <span className="ml-0.5 text-[12px] font-semibold text-gray-500 dark:text-white/55">{unit}</span>
      )}
    </div>
  </div>
)

export default LevelProgress
