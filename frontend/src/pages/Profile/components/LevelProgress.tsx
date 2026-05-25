import type { GlowLevel } from '../../../types/achievement'
import { getReadableTextStyle, toOpaqueColor } from '../../../utils/contrastText'

interface LevelProgressProps {
  currentLevel: GlowLevel
  currentPoints: number
  pointsToNext: { needed: number; total: number } | null
}

const LevelProgress = ({ currentLevel, currentPoints, pointsToNext }: LevelProgressProps) => {
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
              신앙의 온도
            </h3>
            <p className="text-[12px] text-gray-500 dark:text-white/55 mt-0.5">
              {currentPoints.toLocaleString()} 포인트
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
                {currentLevel.name}
              </span>
              <span className="font-semibold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                다음 레벨까지 {pointsToNext.needed.toLocaleString()}P
              </span>
            </div>
          ) : (
            <div className="text-center mt-2">
              <span className="text-[12px] font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                🎉 최고 레벨 달성! 🎉
              </span>
            </div>
          )}
        </div>

        {/* 포인트 획득 방법 안내 */}
        <div
          className="
            relative z-10 mt-5 rounded-xl p-3
            bg-purple-50/70 dark:bg-purple-500/10
            border border-purple-200/40 dark:border-purple-400/20
          "
        >
          <p className="text-[12px] text-gray-700 dark:text-white/80 mb-2 font-semibold">
            💡 포인트 획득 방법
          </p>
          <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[11.5px] text-gray-600 dark:text-white/60 leading-relaxed">
            <div>• 기도 1회: 10P</div>
            <div>• 댓글 1개: 10P</div>
            <div>• 성경 1절: 3P</div>
            <div>• 기도중 1개: 5P</div>
            <div>• 1장 완독: 20P</div>
            <div>• 1권 완독: 200P</div>
            <div>• 연속 기도 1일: 5P</div>
            <div>• 하이라이트 1개: 5P</div>
            <div>• 묵상 노트 1개: 15P</div>
            <div>• 즐겨찾기 1개: 3P</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LevelProgress
