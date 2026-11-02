import { useState, type CSSProperties } from 'react'
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
  /** 성경 전권 통독 횟수 — 1회 이상일 때만 행을 보인다 */
  bibleCompletions?: number
}

/* 기름 채우는 법 — 활동을 묶어 보여 주고, 점수 크기를 배지 농도로 표현.
   tier: 1(잔잔) · 2(또렷) · 3(가장 큰 한 걸음, 1권 완독) */
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
 * 나의 등불 · 내 기록 · 기름 채우는 법 — 2026-11-02 D안(토스 '전체' 탭 문법).
 *
 * 예전 '등잔 삽화 + 등불 계단 + 점선 스탯 타일'은 레벨 진행을 두 번 보여 주고
 * 종이 수첩 톤이 위 칭호 무대·아래 카드와 끊겨 어색하다는 피드백으로 교체:
 * - 요약 카드: 한 문장("○○까지 왔어요 / 다음 단계까지 N%") + 진행바 하나
 * - 내 기록: 아이콘 + 이름 + 숫자가 오른쪽 정렬된 목록(남는 칸이 생기지 않는다)
 * - 채우는 법: 한 줄 요약 행, 누르면 전체 표가 펼쳐진다
 */
const LevelProgress = ({
  currentLevel,
  currentPoints,
  pointsToNext,
  thisWeekCount,
  totalCount,
  streakDays,
  bibleCompletions = 0,
}: LevelProgressProps) => {
  const { t } = useLanguage()
  const [guideOpen, setGuideOpen] = useState(false)
  const [hintOpen, setHintOpen] = useState(false)

  const currentIdx = GLOW_LEVELS.findIndex((l) => l.level === currentLevel.level)
  const nextLevel = GLOW_LEVELS[currentIdx + 1] ?? null
  const progress = pointsToNext
    ? ((pointsToNext.total - pointsToNext.needed) / pointsToNext.total) * 100
    : 100
  const filledPct = Math.floor(Math.min(Math.max(progress, 0), 100))
  const remainPct = 100 - filledPct

  return (
    // PC(lg+) 본문 칼럼은 ~860px — 한 줄 목록이 너무 길어지지 않게 요약|기록 2단, 채우는 법은 전체 폭
    <div className="flex flex-col gap-3 px-4 py-3 lg:grid lg:grid-cols-2 lg:items-stretch">
      {/* ── 요약 — 한 문장 + 진행바 ── */}
      <section className="pd-card pd-summary">
        <div className="flex items-center gap-1.5">
          <h3 className="pd-label">{t('lampTitle')}</h3>
          <button
            type="button"
            className="pd-hint-btn"
            aria-label={t('lampHint')}
            aria-expanded={hintOpen}
            onClick={() => setHintOpen((v) => !v)}
          >
            ?
          </button>
        </div>
        {hintOpen && (
          <p className="pd-hint">
            {t('lampHint')}
            <span className="pd-hint__verse">{t('lampVerse')}</span>
          </p>
        )}

        <p className="pd-headline">
          {t('lampHeadline').replace('{name}', t(currentLevel.nameKey))}
          <br />
          <span className="pd-headline__accent">
            {nextLevel && pointsToNext
              ? t('lampToNextPct').replace('{n}', String(remainPct))
              : t('levelMaxReached')}
          </span>
        </p>

        <div
          className="pd-bar lg:mt-auto"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={filledPct}
          aria-label={`${t('lampFilled')} ${filledPct}%`}
        >
          <span className="pd-bar__fill" style={{ width: `${filledPct}%` }} />
        </div>
        <div className="pd-bar-foot">
          <span>
            Lv.{currentLevel.level} · {currentPoints.toLocaleString()}P
          </span>
          {nextLevel && (
            <span className="text-right">
              Lv.{nextLevel.level} {t(nextLevel.nameKey)} · {nextLevel.minPoints.toLocaleString()}P
            </span>
          )}
        </div>
      </section>

      {/* ── 내 기록 — 아이콘·이름·숫자 목록 ── */}
      <section className="pd-card pd-list">
        <div className="pd-list__head">
          <h3 className="pd-label">{t('recordsTitle')}</h3>
          <a href="#/growth" className="pd-more">
            {t('growthGraphMore')}
            <span className="material-icons-round text-[16px]" aria-hidden>chevron_right</span>
          </a>
        </div>
        <RecordRow icon="volunteer_activism" tone="rose" label={t('totalPrayers')} value={totalCount} unit={t('statUnitTimes')} />
        <RecordRow icon="date_range" tone="blue" label={t('profileThisWeekPrayers')} value={thisWeekCount} unit={t('statUnitTimes')} />
        <RecordRow icon="local_fire_department" tone="amber" label={t('consecutivePrayers')} value={streakDays} unit={t('statUnitDays')} />
        {bibleCompletions > 0 && (
          <RecordRow icon="menu_book" tone="green" label={t('bibleCompletions')} value={bibleCompletions} unit={t('statUnitReadThrough')} />
        )}
      </section>

      {/* ── 기름 채우는 법 — 한 줄 요약, 누르면 펼침 ── */}
      <section className="pd-card pd-guide lg:col-span-2">
        <button
          type="button"
          onClick={() => setGuideOpen((v) => !v)}
          aria-expanded={guideOpen}
          aria-controls="level-earn-guide"
          className="pd-guide__btn"
        >
          <span className="min-w-0 flex-1">
            <span className="pd-guide__title">{t('levelHowToEarnQuestion')}</span>
            <span className="pd-guide__sub">{t('levelHowToEarnSummary')}</span>
          </span>
          <span
            className={`pd-chevron material-icons-round text-[20px] transition-transform duration-300 ${
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
            <div className="lp-earn px-[22px] pb-5" data-open={guideOpen}>
              {EARN_GROUPS.map((group, gi) => {
                const base = EARN_GROUPS.slice(0, gi).reduce((n, g) => n + g.items.length + 1, 0)
                return (
                  <div key={group.titleKey} className="lp-earn__group">
                    <div className="lp-earn__title" style={{ '--i': base } as CSSProperties}>
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
      </section>
    </div>
  )
}

const RecordRow = ({
  icon,
  tone,
  label,
  value,
  unit,
}: {
  icon: string
  tone: 'rose' | 'blue' | 'amber' | 'green'
  label: string
  value: number
  unit: string
}) => (
  <div className="pd-row">
    <span className="pd-row__icon" data-tone={tone} aria-hidden="true">
      <span className="material-icons-round">{icon}</span>
    </span>
    <span className="pd-row__label">{label}</span>
    <span className="pd-row__value">
      {value.toLocaleString()}
      {unit}
    </span>
  </div>
)

export default LevelProgress
