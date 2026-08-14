import { useState, type CSSProperties } from 'react'
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

/* 레벨 여정 굽잇길 — 새싹(왼쪽 아래)에서 생명의 면류관(오른쪽 위)로 오르는 길.
   골짜기와 오르막을 오가며 전체적으로는 위로 향한다.
   y 는 viewBox(0~100) 기준이라 값이 작을수록 높은 자리.
   GLOW_LEVELS 개수만큼 필요 — 모자라면 새 레벨이 중간 높이(50)에 떠 버린다 */
const JOURNEY_YS = [80, 64, 72, 50, 60, 38, 48, 28, 36, 18, 7]
const JOURNEY_PTS = GLOW_LEVELS.map((_, i) => ({
  x: 5 + (90 * i) / (GLOW_LEVELS.length - 1),
  y: JOURNEY_YS[i] ?? 50,
}))

/* 앞 count 개 구간을 Catmull-Rom → cubic Bezier 로 잇는다.
   컨트롤 포인트는 항상 전체 경로 기준이라 부분 경로(지나온 길)가
   전체 트랙 위에 정확히 겹친다 */
const buildJourneyD = (count: number) => {
  const pts = JOURNEY_PTS
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < count; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}
const JOURNEY_TRACK_D = buildJourneyD(GLOW_LEVELS.length - 1)

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
 * '신앙의 온도' 통합 카드 — 이 화면에서 숫자를 말하는 유일한 자리.
 *
 * 카드 이름이 '온도'인데 온도라는 시각 언어가 없던 문제를 해소:
 * - 온도 리딩(36.5° 시작, 당근 매너온도 벤치마크)이 히어로
 * - 진행 바 → 수은구 달린 온도계 게이지
 * - 새싹→생명의 면류관 11단계 여정 스트립(탭하면 각 단계 이름 확인)
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
              // 글로우는 래퍼 drop-shadow 로 — 마스크가 box-shadow 를 잘라내므로
              style={{ filter: `drop-shadow(0 0 6px ${currentLevel.glowColor})` }}
              aria-hidden="true"
            >
              <span
                className="lp-glow-dot__ink"
                style={{ backgroundColor: toOpaqueColor(currentLevel.glowColor) }}
              />
            </span>
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
                className="lp-mercury h-3 transition-all duration-500 relative"
                style={{
                  width: `${progress}%`,
                  background: 'var(--brand)',
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

        {/* 레벨 여정 — 새싹부터 생명의 면류관까지 굽이진 순례길. 탭하면 각 단계 확인 */}
        <div className="relative z-10 mt-4">
          <div className="lp-journey">
            <svg
              className="lp-journey__map"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path className="lp-journey__track" d={JOURNEY_TRACK_D} />
              {currentIdx > 0 && (
                <path className="lp-journey__trail" d={buildJourneyD(currentIdx)} />
              )}
            </svg>
            {GLOW_LEVELS.map((lv, i) => (
              <button
                key={lv.level}
                type="button"
                className="lp-journey__stop"
                data-state={i < currentIdx ? 'passed' : i === currentIdx ? 'current' : 'future'}
                data-selected={i === selIdx}
                onClick={() => setSelectedIdx(i)}
                aria-label={`Lv.${lv.level} ${t(lv.nameKey)}`}
                style={{
                  left: `${JOURNEY_PTS[i].x}%`,
                  top: `${JOURNEY_PTS[i].y}%`,
                  // 마스크가 box-shadow 를 잘라내므로 글로우는 부모 버튼의
                  // drop-shadow 로 붓자국 실루엣을 따라가게 한다
                  ...(i === currentIdx
                    ? { filter: `drop-shadow(0 0 7px ${lv.glowColor})` }
                    : undefined),
                }}
              >
                <span
                  className="lp-journey__dot"
                  style={
                    i <= currentIdx
                      ? { backgroundColor: toOpaqueColor(lv.glowColor) }
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

        {/* 활동 스탯 — 딱딱한 괘선 대신 숫자 뒤 붓 스와치로 감성 강조,
            '이번 주'는 요일 붓 획(탤리)으로 리듬 표시 */}
        <div className="relative z-10 mt-4 grid grid-cols-3 rounded-xl bg-gray-50/70 dark:bg-white/[0.03]">
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
            <span className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-700 dark:text-white/80">
              <span className="lp-earn__header-icon text-brand" aria-hidden="true">
                <EarnIcon name="flame" />
              </span>
              {t('levelHowToEarn')}
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
              <div className="lp-earn px-3 pb-3" data-open={guideOpen}>
                {EARN_GROUPS.map((group, gi) => {
                  // 그룹 제목·행에 이어지는 스태거 순번 (펼침 애니메이션용)
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
    <span className="lp-stat-num">
      <span className="relative brand-text-gradient text-[24px] font-bold leading-none tracking-[-0.02em]">
        {value.toLocaleString()}
        {suffix && (
          <span className="ml-0.5 align-baseline text-[14px] leading-none">{suffix}</span>
        )}
      </span>
    </span>
    {cells && (
      <div className="mt-1.5 flex items-end justify-center gap-[3px]" aria-hidden="true">
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
