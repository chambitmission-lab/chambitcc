// 업적 상세 모달 — 단순 '확인 창'이 아니라 동기부여 카드.
// 해금 전: 큰 % 카운트업 + 남은 양 + 격려 문구 + 바로 실행 CTA + 보상 미리보기(욕구 자극)
// 해금 후: 글로우 엠블럼 + 골드 진행바 + (새 해금 시) 컨페티 + 다음 목표 티저(체인 유도)
import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import type { Achievement, AchievementType, TranslationKey } from '../../../types/achievement'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { celebrateAchievement } from '../../../utils/confettiEffects'
import './AchievementModal.css'

interface AchievementModalProps {
  achievement: Achievement | null
  /** 전체 업적 목록 — '다음 목표' 티저 계산용 */
  achievements?: Achievement[]
  /** 새로 해금되어 자동으로 열린 경우 true → 컨페티 발사 */
  celebrate?: boolean
  /** '다음 목표' 티저 클릭 시 해당 업적으로 전환 */
  onSelect?: (achievement: Achievement) => void
  onClose: () => void
}

// 업적 유형별 진행 단위
const UNIT_KEYS: Record<AchievementType, TranslationKey> = {
  prayer_time: 'achievementUnitMinutes',
  bible_reading: 'achievementUnitChapters',
  streak: 'achievementUnitDays',
  prayer_count: 'achievementUnitTimes',
  community: 'achievementUnitItems',
  bible_note: 'achievementUnitItems',
  bible_highlight: 'achievementUnitItems',
  bluemarble_correct: 'achievementUnitQuestions',
  bluemarble_lap: 'achievementUnitLaps',
  bluemarble_clear: 'achievementUnitTimes',
  bluemarble_score: 'achievementUnitPoints',
}

// 유형별 '지금 하러 가기' 딥링크 — 보는 것에서 행동으로 이어지게
const CTA_BY_TYPE: Record<AchievementType, { route: string; labelKey: TranslationKey }> = {
  prayer_time: { route: '/', labelKey: 'achievementGoPray' },
  prayer_count: { route: '/', labelKey: 'achievementGoPray' },
  streak: { route: '/', labelKey: 'achievementGoPray' },
  community: { route: '/', labelKey: 'achievementGoCommunity' },
  bible_reading: { route: '/bible', labelKey: 'achievementGoBible' },
  bible_note: { route: '/bible', labelKey: 'achievementGoBible' },
  bible_highlight: { route: '/bible', labelKey: 'achievementGoBible' },
  bluemarble_correct: { route: '/bluemarble', labelKey: 'achievementGoBluemarble' },
  bluemarble_lap: { route: '/bluemarble', labelKey: 'achievementGoBluemarble' },
  bluemarble_clear: { route: '/bluemarble', labelKey: 'achievementGoBluemarble' },
  bluemarble_score: { route: '/bluemarble', labelKey: 'achievementGoBluemarble' },
}

/** 0 → target 으로 차오르는 숫자 (ease-out) */
const useCountUp = (target: number, duration = 850) => {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let raf: number
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(target * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

interface CardProps {
  achievement: Achievement
  achievements: Achievement[]
  celebrate: boolean
  onSelect?: (achievement: Achievement) => void
  onClose: () => void
}

const AchievementCard = ({ achievement, achievements, celebrate, onSelect, onClose }: CardProps) => {
  const { t, language } = useLanguage()
  const navigate = useNavigate()
  useModalBackButton(onClose)

  const { unlocked, progress, requirement, glowColor, icon, type } = achievement
  const pct = Math.min(Math.round((progress / requirement) * 100), 100)
  const animatedPct = useCountUp(unlocked ? 100 : pct)
  const remaining = Math.max(requirement - progress, 0)
  const unit = t(UNIT_KEYS[type])
  const sep = language === 'ko' ? '' : ' '
  const cta = CTA_BY_TYPE[type]

  // 새로 해금된 순간에만 축하 폭죽 — 이미 해금된 배지를 다시 볼 때는 조용히
  useEffect(() => {
    if (unlocked && celebrate) celebrateAchievement()
  }, [achievement.id, unlocked, celebrate])

  // 같은 유형에서 아직 잠긴 다음 단계 — 해금 직후 다음 욕구로 연결
  const nextGoal = useMemo(() => {
    if (!unlocked) return null
    return (
      achievements
        .filter((a) => a.type === type && !a.unlocked && a.requirement > requirement)
        .sort((a, b) => a.requirement - b.requirement)[0] ?? null
    )
  }, [achievements, unlocked, type, requirement])

  const encourageKey: TranslationKey =
    pct >= 70 ? 'achievementEncourageAlmost'
    : pct >= 25 ? 'achievementEncourageMid'
    : 'achievementEncourageStart'

  const handleCta = () => {
    onClose()
    navigate(cta.route)
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="
          relative overflow-hidden w-full max-w-sm rounded-[26px] p-6
          bg-white dark:bg-card-dark
          border border-gray-200/80 dark:border-white/[0.09]
          dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_60px_rgba(0,0,0,0.45)]
        "
        style={unlocked ? { boxShadow: `0 0 54px ${glowColor}, 0 24px 60px rgba(0, 0, 0, 0.35)` } : undefined}
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.8, y: 26, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.86, y: 18, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      >
        {/* 해금 카드 상단 광채 */}
        {unlocked && (
          <div
            className="ach-modal-burst"
            style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 68%)` }}
            aria-hidden
          />
        )}

        {/* 엠블럼 — 배지 그리드와 같은 메달 문법 */}
        <div className="relative z-10 flex flex-col items-center mb-4">
          <motion.div
            className="relative h-[92px] w-[92px] rounded-full p-[3px]"
            style={{
              background: unlocked
                ? 'conic-gradient(from 210deg, #3182f6, #60a5fa, #f59e0b, #60a5fa, #3182f6)'
                : `conic-gradient(rgba(49, 130, 246, 0.75) ${pct}%, rgba(148, 163, 184, 0.28) 0)`,
              boxShadow: unlocked ? `0 0 26px ${glowColor}` : 'none',
            }}
            initial={{ scale: 0.4, rotate: -12, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ delay: 0.06, type: 'spring', stiffness: 260, damping: 16 }}
          >
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white dark:bg-black/40">
              {unlocked && (
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{ background: `radial-gradient(circle at 50% 35%, ${glowColor}, transparent 72%)` }}
                />
              )}
              <span
                className={`relative text-[42px] leading-none ${unlocked ? 'drop-shadow-md' : 'opacity-40'}`}
                style={unlocked ? undefined : { filter: 'grayscale(1)' }}
              >
                {icon}
              </span>
            </div>
            {!unlocked && (
              <div className="absolute -right-0.5 -bottom-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-gray-300 dark:bg-[#3a3a3a] ring-[3px] ring-white dark:ring-card-dark">
                <span className="material-icons-round text-[14px] text-gray-500 dark:text-white/45">lock</span>
              </div>
            )}
          </motion.div>

          {unlocked && (
            <motion.div
              className="mt-3 inline-block px-4 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[13px] font-bold rounded-full shadow-lg"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
            >
              ✓ {t('achievementComplete')}
            </motion.div>
          )}
        </div>

        {/* 제목 · 설명 */}
        <motion.h3
          className="relative z-10 text-[21px] font-extrabold tracking-[-0.01em] text-center text-ink-strong mb-1.5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
        >
          {t(achievement.titleKey)}
        </motion.h3>
        <motion.p
          className="relative z-10 text-center text-[13.5px] text-gray-500 dark:text-white/55 mb-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {t(achievement.descKey)}
        </motion.p>

        {/* 진행도 */}
        <motion.div
          className="relative z-10 mb-5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
        >
          {!unlocked && (
            <div className="text-center mb-3">
              <span className="brand-text-gradient text-[36px] font-extrabold leading-none tabular-nums">
                {animatedPct}%
              </span>
            </div>
          )}

          <div className="relative w-full h-2.5 rounded-full overflow-hidden bg-gray-200 dark:bg-white/10">
            <motion.div
              className="relative h-full rounded-full overflow-hidden"
              style={{
                background: unlocked
                  ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                  : 'linear-gradient(90deg, var(--brand), #60a5fa)',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${unlocked ? 100 : pct}%` }}
              transition={{ delay: 0.3, duration: 0.7, ease: 'easeOut' }}
            >
              {unlocked && <span className="ach-modal-bar-shine" aria-hidden />}
            </motion.div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="text-[12.5px] font-semibold tabular-nums text-gray-500 dark:text-white/50">
              {Math.min(progress, requirement).toLocaleString()} / {requirement.toLocaleString()}
            </span>
            {unlocked ? (
              progress > requirement && (
                <span className="text-[11.5px] font-bold tabular-nums px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
                  {t('achievementTotalPrefix')} {progress.toLocaleString()}{sep}{unit}
                </span>
              )
            ) : (
              <span className="text-[11.5px] font-bold tabular-nums px-2.5 py-0.5 rounded-full bg-[var(--brand-soft)] text-brand">
                {remaining.toLocaleString()}{sep}{unit} {t('achievementRemainSuffix')}
              </span>
            )}
          </div>

          {!unlocked && (
            <p className="mt-3 text-center text-[13px] font-medium text-gray-600 dark:text-white/60">
              {t(encourageKey)}
            </p>
          )}
        </motion.div>

        {/* 보상 — 잠긴 상태에서도 미리 보여줘 해금 욕구를 자극 */}
        <motion.div
          className={`relative z-10 p-4 rounded-xl mb-4 border ${
            unlocked
              ? 'bg-[var(--brand-soft)] border-[var(--brand-soft-strong)]'
              : 'bg-gray-50 dark:bg-white/[0.04] border-gray-200/80 dark:border-white/[0.07]'
          }`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
        >
          <p className="text-[13px] font-semibold text-ink-strong mb-1.5">
            {unlocked ? <>🎁 {t('achievementReward')}</> : <>🔒 {t('achievementRewardPreview')}</>}
          </p>
          <div className={`text-[12px] leading-relaxed ${unlocked ? 'text-gray-600 dark:text-white/60' : 'text-gray-400 dark:text-white/35'}`}>
            • {t('achievementRewardGlow')}
            <br />
            • {t('achievementRewardBadge')}
          </div>
        </motion.div>

        {/* 다음 목표 티저 — 해금 직후 다음 도전으로 연결 */}
        {nextGoal && (
          <motion.button
            type="button"
            onClick={() => onSelect?.(nextGoal)}
            className="
              relative z-10 w-full flex items-center gap-3 p-3 mb-4 rounded-xl text-left
              bg-gray-50 dark:bg-white/[0.04]
              border border-gray-200/80 dark:border-white/[0.07]
              hover:border-[var(--brand-soft-strong)] transition-colors
            "
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200/70 dark:bg-white/[0.07] text-[20px]" style={{ filter: 'grayscale(1)' }}>
              {nextGoal.icon}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[11px] font-bold text-brand mb-0.5">{t('achievementNextGoal')}</span>
              <span className="block text-[13.5px] font-semibold text-ink-strong truncate">
                {t(nextGoal.titleKey)} · {nextGoal.requirement.toLocaleString()}{sep}{t(UNIT_KEYS[nextGoal.type])}
              </span>
            </span>
            <span className="material-icons-round text-[18px] text-gray-400 dark:text-white/35">chevron_right</span>
          </motion.button>
        )}

        {/* 액션 */}
        <motion.div
          className="relative z-10 flex flex-col gap-2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34 }}
        >
          {unlocked ? (
            <button
              onClick={onClose}
              className="w-full py-3 brand-gradient font-bold rounded-xl shadow-[0_2px_10px_var(--brand-glow)] hover:shadow-[0_4px_16px_var(--brand-glow)] transition-all"
            >
              {t('achievementConfirm')}
            </button>
          ) : (
            <>
              <button
                onClick={handleCta}
                className="w-full py-3 brand-gradient font-bold rounded-xl shadow-[0_2px_10px_var(--brand-glow)] hover:shadow-[0_4px_16px_var(--brand-glow)] transition-all"
              >
                {t(cta.labelKey)} →
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 text-[13.5px] font-semibold rounded-xl text-gray-500 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                {t('achievementClose')}
              </button>
            </>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

const AchievementModal = ({ achievement, achievements = [], celebrate = false, onSelect, onClose }: AchievementModalProps) => (
  <AnimatePresence>
    {achievement && (
      <AchievementCard
        key={achievement.id}
        achievement={achievement}
        achievements={achievements}
        celebrate={celebrate}
        onSelect={onSelect}
        onClose={onClose}
      />
    )}
  </AnimatePresence>
)

export default AchievementModal
