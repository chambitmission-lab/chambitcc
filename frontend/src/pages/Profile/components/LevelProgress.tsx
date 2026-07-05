import { useState } from 'react'
import type { GlowLevel } from '../../../types/achievement'
import { getReadableTextStyle, toOpaqueColor } from '../../../utils/contrastText'
import { useLanguage } from '../../../contexts/LanguageContext'

interface LevelProgressProps {
  currentLevel: GlowLevel
  currentPoints: number
  pointsToNext: { needed: number; total: number } | null
}

const LevelProgress = ({ currentLevel, currentPoints, pointsToNext }: LevelProgressProps) => {
  const { t } = useLanguage()
  const [guideOpen, setGuideOpen] = useState(false)
  const progress = pointsToNext
    ? ((pointsToNext.total - pointsToNext.needed) / pointsToNext.total) * 100
    : 100
  const badgeText = getReadableTextStyle(currentLevel.glowColor)

  return (
    <div className="px-4 py-3">
      <div
        className="
          relative overflow-hidden rounded-2xl p-5
          bg-white/80 dark:bg-card-dark
          border border-gray-200/70 dark:border-white/[0.08]
          shadow-sm
          dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_24px_rgba(168,85,247,0.10)]
        "
      >
        {/* 다크 카드 표면 미세 그라데이션 */}
        <div className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />

        {/* 헤더 */}
        <div className="relative z-10 flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[14px] font-bold text-gray-900 dark:text-white tracking-[-0.01em]">
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

        {/* 진행 바 */}
        <div className="relative z-10">
          <div className="w-full bg-gray-200 dark:bg-white/[0.06] rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full transition-all duration-500 relative"
              style={{
                width: `${progress}%`,
                // fill 은 브랜드 purple→pink 솔리드(라이트 트랙 위에서도 항상 가독).
                // 레벨 색은 glow(box-shadow)로 표현 — 흰색/회색 레벨도 사라지지 않게.
                background: 'linear-gradient(to right, #a855f7, #ec4899)',
                boxShadow: `0 0 10px ${currentLevel.glowColor}`,
              }}
            >
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"
                style={{ animation: 'shimmer 2s infinite' }}
              />
            </div>
          </div>

          {pointsToNext ? (
            <div className="flex items-center justify-between mt-2 text-[12px]">
              <span className="text-gray-600 dark:text-white/65">
                {t(currentLevel.nameKey)}
              </span>
              <span className="font-semibold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                {t('levelToNext')} {pointsToNext.needed.toLocaleString()}P
              </span>
            </div>
          ) : (
            <div className="text-center mt-2">
              <span className="text-[12px] font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                🎉 {t('levelMaxReached')} 🎉
              </span>
            </div>
          )}
        </div>

        {/* 포인트 획득 방법 안내 — 기본 접힘, 탭하면 펼침 */}
        <div
          className="
            relative z-10 mt-4 overflow-hidden rounded-xl
            bg-purple-50/70 dark:bg-purple-500/10
            border border-purple-200/40 dark:border-purple-400/20
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
              hover:bg-purple-100/50 dark:hover:bg-purple-500/[0.08]
            "
          >
            <span className="text-[12px] font-semibold text-gray-700 dark:text-white/80">
              💡 {t('levelHowToEarn')}
            </span>
            <span
              className={`material-icons-round text-[18px] text-purple-500/70 dark:text-purple-300/60 transition-transform duration-300 ${
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

export default LevelProgress
