// 업적 상세 모달 — 게임 전리품 카드 감성의 동기부여 카드.
// 해금 전: 큰 % 카운트업 + 남은 양 + 격려 문구 + 바로 실행 CTA + 보상 미리보기(욕구 자극)
// 해금 후: 회전 빛살/오라/스파클 + 도장 스탬프 + 골드 진행바 + (새 해금 시) 컨페티 + 다음 목표 티저
import { useEffect, useMemo, useState } from 'react'
import { AchievementGlyph } from './AchievementGlyph'
import { achievementInk } from './achievementInk'
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

// 해금 카드 위로 떠오르는 스파클 배치 (left%, top%, delay s, char)
const SPARKLES: Array<[number, number, number, string]> = [
  [14, 22, 0.0, '✦'],
  [84, 18, 0.7, '✧'],
  [8, 46, 1.3, '✦'],
  [90, 42, 1.9, '✦'],
  [22, 10, 2.4, '✧'],
  [72, 8, 1.1, '✦'],
]

/** 0 → target 으로 차오르는 숫자 (ease-out) */
const useCountUp = (target: number, duration = 900) => {
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
  const nearUnlock = !unlocked && pct >= 70

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
      className="ach-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={`ach-card ${unlocked ? 'is-unlocked' : 'is-locked'}`}
        style={{ ['--ach-glow' as string]: glowColor }}
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.78, y: 28, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.86, y: 18, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      >
        {/* 앰비언트 레이어: 오라 → 빛살 → 스파클 → 시인 */}
        <div className="ach-aura" aria-hidden />
        {unlocked && <div className="ach-rays" aria-hidden />}
        {unlocked &&
          SPARKLES.map(([left, top, delay, char], i) => (
            <span
              key={i}
              className="ach-sparkle"
              style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${delay}s` }}
              aria-hidden
            >
              {char}
            </span>
          ))}
        <div className="ach-sheen" aria-hidden />

        {/* 엠블럼 — 배지 그리드와 같은 메달 문법, 해금 시 둥실 떠다닌다 */}
        <div className="relative z-10 flex flex-col items-center mb-3">
          <motion.div
            initial={{ scale: 0.35, rotate: -14, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ delay: 0.06, type: 'spring', stiffness: 240, damping: 15 }}
          >
            <div className={unlocked ? 'ach-emblem-float' : undefined}>
              <div
                className={`relative h-[96px] w-[96px] rounded-full p-[3px] ${nearUnlock ? 'ach-ring-near' : ''}`}
                style={{
                  background: unlocked
                    ? 'conic-gradient(from 210deg, #3182f6, #60a5fa, #f59e0b, #60a5fa, #3182f6)'
                    : `conic-gradient(rgba(49, 130, 246, 0.8) ${pct}%, rgba(148, 163, 184, 0.28) 0)`,
                  boxShadow: unlocked ? `0 0 34px ${glowColor}` : undefined,
                }}
              >
                <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white dark:bg-[#1c202c]">
                  {unlocked && (
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{ background: `radial-gradient(circle at 50% 32%, ${glowColor}, transparent 74%)` }}
                    />
                  )}
                  <span
                    className={`relative text-[46px] leading-none ${unlocked ? 'drop-shadow-md' : 'text-gray-500 opacity-55 dark:text-white/70'}`}
                    style={unlocked ? { color: achievementInk(glowColor) } : undefined}
                  >
                    <AchievementGlyph achievementId={achievement.id} fallback={icon} />
                  </span>
                </div>
                {!unlocked && (
                  <div className="absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 dark:bg-[#3a3a3a] ring-[3px] ring-white dark:ring-[#1a1a20]">
                    <span className="material-icons-round text-[15px] text-gray-500 dark:text-white/45">lock</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* 도장 쾅 — 스탬프 애니메이션 */}
          {unlocked && (
            <motion.div
              className="mt-3 inline-block px-4 py-1 -rotate-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[13px] font-extrabold rounded-full shadow-[0_4px_16px_rgba(251,146,60,0.5)] ring-2 ring-yellow-200/70 dark:ring-yellow-300/30"
              initial={{ scale: 2.4, rotate: -16, opacity: 0 }}
              animate={{ scale: 1, rotate: -3, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 420, damping: 17 }}
            >
              ✓ {t('achievementComplete')}
            </motion.div>
          )}
        </div>

        {/* 제목 · 설명 */}
        <motion.h3
          className={`relative z-10 text-[22px] font-extrabold tracking-[-0.01em] text-center mb-1.5 ${
            unlocked ? 'ach-title-gold' : 'text-ink-strong'
          }`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
        >
          {t(achievement.titleKey)}
        </motion.h3>
        <motion.p
          className="relative z-10 text-center text-[13.5px] text-gray-500 dark:text-white/55 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {t(achievement.descKey)}
        </motion.p>

        {/* 진행도 */}
        <motion.div
          className="relative z-10 mb-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
        >
          {!unlocked && (
            <div className="text-center mb-2.5">
              <span className="brand-text-gradient text-[38px] font-extrabold leading-none tabular-nums">
                {animatedPct}
              </span>
              <span className="brand-text-gradient text-[22px] font-extrabold">%</span>
            </div>
          )}

          <div className="ach-bar-track">
            <motion.div
              className={`ach-bar-fill ${unlocked ? 'is-gold' : `is-brand ${pct >= 8 ? 'has-tip' : ''}`}`}
              initial={{ width: 0 }}
              animate={{ width: `${unlocked ? 100 : pct}%` }}
              transition={{ delay: 0.32, duration: 0.75, ease: 'easeOut' }}
            >
              {unlocked && <span className="ach-bar-shine" aria-hidden />}
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
          className={`relative z-10 p-3.5 rounded-xl mb-3 text-left ${
            unlocked
              ? 'ach-reward-unlocked'
              : 'bg-gray-50 dark:bg-white/[0.04] border border-dashed border-gray-300 dark:border-white/[0.12]'
          }`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
        >
          <p className="text-[13px] font-bold text-ink-strong mb-1.5">
            {unlocked ? <>🎁 {t('achievementReward')}</> : <>🔒 {t('achievementRewardPreview')}</>}
          </p>
          <div className={`text-[12px] leading-relaxed ${unlocked ? 'text-amber-800/80 dark:text-amber-100/70' : 'text-gray-400 dark:text-white/35'}`}>
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
              hover:border-[var(--brand-soft-strong)] active:scale-[0.98] transition-all
            "
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200/70 dark:bg-white/[0.07] text-[20px] text-gray-500 dark:text-white/60">
              <AchievementGlyph achievementId={nextGoal.id} fallback={nextGoal.icon} />
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
