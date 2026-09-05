import { useState, type CSSProperties } from 'react'
import type { GlowLevel } from '../../../types/achievement'
import { GLOW_LEVELS } from '../../../types/achievement'
import { glowTemperature } from '../../../utils/achievementCalculator'
import { toOpaqueColor } from '../../../utils/contrastText'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useGrowthRecentDays } from '../../../hooks/useGrowth'
import { buildWeekCells, type DayCell } from './growthFootprints'
import './LevelProgress.css'
import { tokenStore } from '../../../utils/tokenStore'

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
  const temperature = glowTemperature(currentPoints)
  const nextLevel = GLOW_LEVELS[currentIdx + 1] ?? null
  const selIdx = selectedIdx ?? currentIdx
  const selLevel = GLOW_LEVELS[selIdx]

  // 요일 마이크로 도트 — 스토리 트레이(useGrowthRecentDays 14일)와 같은 쿼리를
  // 공유하므로 추가 요청 없음. 데이터 도착 전에는 자리 잡지 않고 숨긴다.
  const hasToken = !!tokenStore.getAccess()
  const { data: recent } = useGrowthRecentDays(14, hasToken)
  const weekCells = recent?.data ? buildWeekCells(recent.data.events) : null

  // 성장 그래프 창 — 현재 레벨 앞 4단계 + 뒤 1단계(6칸). 끝단에선 창을 밀어 6칸 유지
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
              {t('levelTitle')}
            </h3>
            <button
              type="button"
              className="lp-hint-btn"
              aria-label={t('levelHint')}
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
            {t('levelHint')}
          </p>
        )}

        {/* 온도 히어로 — 왼쪽 큰 온도, 오른쪽 단계 이름·포인트 */}
        <div className="relative z-10 mt-3 flex items-end justify-between gap-3">
          <div className="text-brand font-bold leading-none tracking-[-0.04em]">
            <span className="text-[46px]">{temperature.toFixed(1)}</span>
            <span className="ml-0.5 align-top text-[20px] font-bold">°C</span>
          </div>
          <div className="text-right pb-1">
            <div className="flex items-center justify-end gap-1.5">
              <span
                className="lp-glow-dot"
                style={{ filter: `drop-shadow(0 0 6px ${currentLevel.glowColor})` }}
                aria-hidden="true"
              >
                <span
                  className="lp-glow-dot__ink"
                  style={{ backgroundColor: toOpaqueColor(currentLevel.glowColor) }}
                />
              </span>
              <span className="text-[16px] font-bold text-ink-strong tracking-[-0.01em]">
                {t(currentLevel.nameKey)}
              </span>
            </div>
            <p className="mt-0.5 text-[12.5px] text-gray-500 dark:text-white/55">
              {currentPoints.toLocaleString()} {t('levelPoints')}
            </p>
          </div>
        </div>

        {/* 진행 바 — 브랜드 솔리드 fill + 끝단 손잡이. 레벨 색은 손잡이 glow 로만 */}
        <div className="relative z-10 mt-4">
          <div className="lp-track">
            <div className="lp-fill" style={{ width: `${progress}%` }}>
              {/* 셔머는 클립 레이어 안에서만 움직인다 — 손잡이(fill 밖으로 삐져나옴)는
                  클립 밖에 두어야 하므로 fill 자체에 overflow:hidden 을 걸지 않는다 */}
              <div className="lp-fill__clip" aria-hidden="true">
                <div className="lp-shimmer" />
              </div>
              <span
                className="lp-knob"
                style={{ boxShadow: `0 0 0 3px rgba(255,255,255,0.9), 0 0 12px ${currentLevel.glowColor}` }}
                aria-hidden="true"
              />
            </div>
          </div>

          {pointsToNext && nextLevel ? (
            <>
              <div className="mt-2 text-right text-[12px] font-semibold text-brand">
                {t('levelToNextStage')} {pointsToNext.needed.toLocaleString()}P
              </div>
              <div className="mt-1 text-[12px] text-gray-500 dark:text-white/55">
                {t('levelNextLabel')}: {t(nextLevel.nameKey)} ({nextLevel.minPoints.toLocaleString()}P)
              </div>
            </>
          ) : (
            <div className="text-center mt-2">
              <span className="text-[12px] font-bold text-brand">
                🎉 {t('levelMaxReached')} 🎉
              </span>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* ── 성장 그래프 카드 — 레벨 꺾은선 + 스탯 타일 + 획득 안내 ── */}
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

        <LevelGraph
          levels={winLevels}
          currentIdx={currentIdx - winStart}
          progress={progress}
          selectedIdx={selectedIdx === null ? null : selectedIdx - winStart}
          onSelect={(i) => setSelectedIdx(i + winStart)}
        />
        <div className="relative z-10 mt-1 flex items-center gap-1.5 text-[11.5px]">
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

        {/* 스탯 타일 3개 */}
        <div className="relative z-10 mt-4 grid grid-cols-3 gap-2">
          <TemperatureStat value={totalCount} label={t('totalPrayers')} icon="volunteer_activism" />
          <TemperatureStat
            value={thisWeekCount}
            label={t('profileThisWeek')}
            icon="date_range"
            cells={weekCells}
          />
          <TemperatureStat
            value={streakDays}
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

/* 레벨 성장 꺾은선 — 창에 담긴 레벨들을 완만히 오르는 지그재그로 잇고,
   지나온 구간은 각 단계 색, 남은 구간은 회색 점선. 현재 위치엔 Lv 태그. */
const GRAPH_W = 320
const GRAPH_H = 104
const GRAPH_YS = [78, 62, 70, 50, 56, 32]

/* 그래프용 레벨 색 — 흰색(Lv.6 천상의 광채)처럼 밝기가 높은 색은 흰 카드 위에서 사라진다.
   단색 대체 대신 "흰 빛 = 프리즘을 지난 스펙트럼" 은유로, 파스텔 프리즘 그라데이션 +
   반투명 halo 밑획을 깔아 라이트/다크 어디서든 선이 떠 보이게 한다 */
const PRISM_ID = 'lp-graph-prism'
const isRadiant = (glow: string) => {
  const m = glow.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!m) return false
  const [r, g, b] = [Number(m[1]), Number(m[2]), Number(m[3])]
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.85
}
const graphColor = (glow: string) => (isRadiant(glow) ? `url(#${PRISM_ID})` : toOpaqueColor(glow))

const LevelGraph = ({
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
  const pts = levels.map((_, i) => ({
    x: 26 + ((GRAPH_W - 52) * i) / (n - 1),
    y: GRAPH_YS[i] ?? 50,
  }))
  const seg = (a: number, b: number) => {
    const p = pts[a], q = pts[b]
    const cx = (p.x + q.x) / 2
    return `M ${p.x} ${p.y} C ${cx} ${p.y}, ${cx} ${q.y}, ${q.x} ${q.y}`
  }
  const cur = pts[currentIdx]
  return (
    <div className="relative z-10 mt-2">
      <svg viewBox={`0 0 ${GRAPH_W} ${GRAPH_H + 22}`} className="lp-graph" aria-hidden="true">
        <defs>
          <linearGradient id={PRISM_ID} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--graph-prism-a)" />
            <stop offset="50%" stopColor="var(--graph-prism-b)" />
            <stop offset="100%" stopColor="var(--graph-prism-c)" />
          </linearGradient>
        </defs>
        {/* 지나온 구간 — 도착 단계 색 */}
        {pts.slice(1).map((_, i) =>
          i + 1 <= currentIdx ? (
            <g key={`p${i}`}>
              {isRadiant(levels[i + 1].glowColor) && (
                <path d={seg(i, i + 1)} className="lp-graph__halo" />
              )}
              <path
                d={seg(i, i + 1)}
                className="lp-graph__line"
                style={{ stroke: graphColor(levels[i + 1].glowColor) }}
              />
            </g>
          ) : (
            <path key={`f${i}`} d={seg(i, i + 1)} className="lp-graph__future" />
          ),
        )}
        {/* 현재 단계 안 진행분 — 다음 점을 향해 브랜드색으로 조금 더 뻗는다 */}
        {currentIdx < n - 1 && progress > 0 && (
          <path
            d={seg(currentIdx, currentIdx + 1)}
            className="lp-graph__line lp-graph__progress"
            pathLength={100}
            strokeDasharray={`${Math.min(progress, 100)} 100`}
          />
        )}
        {/* 단계 눈금(짧은 세로 획) + 점 */}
        {pts.map((p, i) => {
          const passed = i <= currentIdx
          const radiant = passed && isRadiant(levels[i].glowColor)
          const color = passed ? graphColor(levels[i].glowColor) : 'var(--graph-future)'
          return (
            <g key={levels[i].level} onClick={() => onSelect(i)} style={{ cursor: 'pointer' }}>
              {radiant && <circle cx={p.x} cy={p.y} r={6.5} className="lp-graph__halo-dot" />}
              <rect x={p.x - 1.5} y={p.y - 9} width={3} height={18} rx={1.5} fill={color} opacity={0.85} />
              <circle cx={p.x} cy={p.y} r={4.2} fill={color} />
              {i === currentIdx && (
                <circle cx={p.x} cy={p.y} r={7} fill="none" stroke="var(--brand)" strokeWidth={2} opacity={0.5} />
              )}
              {selectedIdx === i && i !== currentIdx && (
                <circle cx={p.x} cy={p.y} r={7} fill="none" stroke={color} strokeWidth={1.5} strokeDasharray="2 2" />
              )}
              <text
                x={p.x}
                y={GRAPH_H + 16}
                textAnchor="middle"
                className="lp-graph__label"
                data-current={i === currentIdx}
              >
                Lv.{levels[i].level}
              </text>
            </g>
          )
        })}
        {/* 현재 위치 태그 */}
        <g transform={`translate(${cur.x} ${cur.y - 22})`}>
          <rect x={-19} y={-9} width={38} height={18} rx={9} fill="var(--brand)" />
          <text y={4} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="#fff">
            Lv.{levels[currentIdx].level}
          </text>
        </g>
      </svg>
    </div>
  )
}

const TemperatureStat = ({
  value,
  label,
  icon,
  hot,
  cells,
}: {
  value: number
  label: string
  icon: string
  hot?: boolean
  cells?: DayCell[] | null
}) => (
  <div className="lp-tile">
    <span className="text-brand text-[24px] font-bold leading-none tracking-[-0.02em]">
      {value.toLocaleString()}
    </span>
    <span className={`material-icons-round mt-2 text-[20px] ${hot ? 'text-orange-500' : 'text-brand'}`} aria-hidden="true">
      {icon}
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
    <div className="mt-1.5 text-[11px] font-medium text-gray-500 dark:text-white/50 whitespace-nowrap">
      {label}
    </div>
  </div>
)

export default LevelProgress
