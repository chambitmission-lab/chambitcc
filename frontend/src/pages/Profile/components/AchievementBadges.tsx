import { useState, type CSSProperties } from 'react'
import type { Achievement } from '../../../types/achievement'
import { useLanguage } from '../../../contexts/LanguageContext'
import { AchievementGlyph } from './AchievementGlyph'
import { achievementInk } from './achievementInk'
import './LevelProgress.css'
import './AchievementBadges.css'

interface AchievementBadgesProps {
  achievements: Achievement[]
  onAchievementClick?: (achievement: Achievement) => void
}

interface BadgeMedallionProps {
  achievement: Achievement
  shineDelay: number
  /** sm: 접힌 대표 배지 행용 작은 메달 */
  size?: 'sm' | 'md'
}

const BadgeMedallion = ({ achievement, shineDelay, size = 'md' }: BadgeMedallionProps) => {
  const progressPct = Math.min(
    (achievement.progress / achievement.requirement) * 100,
    100,
  )
  const dim = size === 'sm' ? 'h-11 w-11' : 'h-16 w-16'
  const iconSize = size === 'sm' ? 'text-[19px]' : 'text-[26px]'
  const checkDim = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'

  if (achievement.unlocked) {
    return (
      <div
        className={`ach-ring-unlocked relative ${dim} rounded-full p-[2.5px] transition-transform duration-300 group-hover:scale-110 group-active:scale-95`}
      >
        <div className="ach-face relative flex h-full w-full items-center justify-center overflow-hidden rounded-full">
          {/* 배지 색상 은은한 내부 틴트 */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(circle at 50% 35%, ${achievement.glowColor}, transparent 72%)`,
            }}
          />
          <span
            className={`relative ${iconSize} leading-none drop-shadow-sm`}
            style={{ color: achievementInk(achievement.glowColor) }}
          >
            <AchievementGlyph achievementId={achievement.id} fallback={achievement.icon} />
          </span>
          <span
            className="ach-badge-shine"
            style={{ animationDelay: `${shineDelay}s` }}
            aria-hidden="true"
          />
        </div>
        <div className={`ach-check absolute -right-0.5 -bottom-0.5 flex ${checkDim} items-center justify-center rounded-full`}>
          <span className="text-[10px] font-bold">✓</span>
        </div>
      </div>
    )
  }

  // 링 자체가 진행률 게이지 — 채워질수록 해금이 가까워 보이게
  return (
    <div
      className={`ach-ring-locked relative ${dim} rounded-full p-[2.5px] transition-transform duration-300 group-hover:scale-105 group-active:scale-95`}
      style={{ '--ach-pct': `${progressPct}%` } as CSSProperties}
    >
      <div className="ach-face ach-face--locked flex h-full w-full items-center justify-center rounded-full">
        <span className={`${iconSize} leading-none opacity-60`}>
          <AchievementGlyph achievementId={achievement.id} fallback={achievement.icon} />
        </span>
      </div>
      <div className={`ach-lock absolute -right-0.5 -bottom-0.5 flex ${checkDim} items-center justify-center rounded-full`}>
        <span className="material-icons-round text-[11px]">
          lock
        </span>
      </div>
    </div>
  )
}

const AchievementBadges = ({ achievements, onAchievementClick }: AchievementBadgesProps) => {
  const { t } = useLanguage()
  const [showAll, setShowAll] = useState(false)

  const unlockedCount = achievements.filter((a) => a.unlocked).length
  // 해금된 배지를 앞으로 — 접힌 상태에서 컬러 배지가 먼저 보이게
  const sorted = [...achievements].sort(
    (a, b) => Number(b.unlocked) - Number(a.unlocked),
  )

  // 접힌 상태: 받은 수 막대 + "다음에 받을 업적" 하나만 (2026-11-02 D안).
  // 컬렉션 전시는 펼쳤을 때의 몫 — 프로필 기본 화면은 조용하게
  const nextTarget = achievements
    .filter((a) => !a.unlocked)
    .sort(
      (a, b) => b.progress / b.requirement - a.progress / a.requirement,
    )[0]

  return (
    <div className="px-4 py-3">
      <section className="pd-card pd-ach">
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          aria-expanded={showAll}
          className="pd-ach__head"
          disabled={achievements.length === 0}
        >
          <span className="pd-label flex-1 text-left">{t('achievementTitle')}</span>
          <span className="pd-ach__count">
            {showAll ? t('achievementCollapse') : t('achievementEarnedCount').replace('{n}', String(unlockedCount))}
          </span>
          <span className="pd-chevron material-icons-round text-[18px]" aria-hidden>
            {showAll ? 'expand_less' : 'chevron_right'}
          </span>
        </button>

        <div className="pd-ach__body">
          {/* 받은 수 / 전체 — 두 토막 막대 */}
          {achievements.length > 0 && (
            <div
              className="pd-ach__bar"
              role="img"
              aria-label={`${unlockedCount}/${achievements.length}`}
            >
              <span style={{ flexGrow: Math.max(unlockedCount, 0.0001) }} data-on="true" />
              <span style={{ flexGrow: Math.max(achievements.length - unlockedCount, 0.0001) }} />
            </div>
          )}

          {showAll ? (
            <div className="grid grid-cols-4 gap-x-2 gap-y-4 pt-1">
              {sorted.map((achievement, index) => (
                <button
                  key={achievement.id}
                  type="button"
                  onClick={() => onAchievementClick?.(achievement)}
                  className="group flex flex-col items-center gap-1.5"
                  aria-label={`${t(achievement.titleKey)}${
                    achievement.unlocked ? '' : ` (${t('achievementProgress')} ${achievement.progress}/${achievement.requirement})`
                  }`}
                >
                  <BadgeMedallion achievement={achievement} shineDelay={(index % 4) * 0.4} />
                  <span
                    className={`w-full text-center text-[11px] font-semibold leading-tight line-clamp-1 ${
                      achievement.unlocked ? 'pd-text-body' : 'pd-text-muted'
                    }`}
                  >
                    {t(achievement.titleKey)}
                  </span>
                  {!achievement.unlocked && (
                    <span className="pd-text-muted -mt-1 text-[10px] tabular-nums">
                      {achievement.progress}/{achievement.requirement}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : nextTarget ? (
            /* 다음에 받을 업적 — 진행률이 가장 높은 미해금 배지 */
            <button
              type="button"
              onClick={() => onAchievementClick?.(nextTarget)}
              className="pd-ach__next group"
              aria-label={`${t(nextTarget.titleKey)} (${t('achievementProgress')} ${nextTarget.progress}/${nextTarget.requirement})`}
            >
              <BadgeMedallion achievement={nextTarget} shineDelay={0} size="sm" />
              <span className="min-w-0 flex-1 text-left">
                <span className="pd-ach__next-label">{t('achievementNextToEarn')}</span>
                <span className="pd-ach__next-title">{t(nextTarget.titleKey)}</span>
              </span>
              <span className="pd-ach__next-progress">
                {nextTarget.progress.toLocaleString()}/{nextTarget.requirement.toLocaleString()}
              </span>
            </button>
          ) : null}

          {unlockedCount === 0 && (
            <p className="pd-text-muted m-0 text-center text-[12.5px]">{t('achievementStartPraying')}</p>
          )}
        </div>
      </section>
    </div>
  )
}

export default AchievementBadges
