import type { GroupColorTheme } from '../../../../utils/groupColors'

interface PrayerHeaderProps {
  displayName: string
  timeAgo: string
  groupName?: string
  colorTheme: GroupColorTheme
}

const PrayerHeader = ({
  displayName,
  timeAgo,
  groupName,
  colorTheme
}: PrayerHeaderProps) => {
  // 그룹이 없으면 기존 퍼플 스타일 사용
  const useGroupColor = !!groupName
  
  return (
    <div className="px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="relative">
          {/* 주변 빛 확산 효과 */}
          {useGroupColor ? (
            <>
              <div 
                className="absolute inset-0 rounded-full blur-md animate-pulse"
                style={{
                  background: colorTheme.glow,
                  opacity: 0.3
                }}
              ></div>
              <div 
                className="w-8 h-8 rounded-full backdrop-blur-md border-2 flex items-center justify-center text-xs font-bold relative z-10"
                style={{
                  background: colorTheme.gradient,
                  borderColor: colorTheme.primary,
                  boxShadow: colorTheme.shadow,
                  color: '#5D4E37'
                }}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            </>
          ) : (
            <>
              <div className="absolute inset-0 rounded-full bg-purple-400/30 dark:bg-white/20 blur-md animate-pulse"></div>
              <div className="w-8 h-8 rounded-full backdrop-blur-md bg-gradient-to-b from-purple-400/60 via-purple-500/40 to-purple-600/25 dark:from-white/50 dark:via-white/30 dark:to-white/15 border-2 border-purple-500/70 dark:border-white/60 flex items-center justify-center text-white text-xs font-bold shadow-[0_0_25px_rgba(168,85,247,0.6),0_-8px_20px_rgba(168,85,247,0.5),inset_0_1px_3px_rgba(255,255,255,0.8)] dark:shadow-[0_0_25px_rgba(255,255,255,0.4),0_-8px_20px_rgba(255,255,255,0.3),inset_0_1px_3px_rgba(255,255,255,0.6)] relative z-10">
                {displayName.charAt(0).toUpperCase()}
              </div>
            </>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900 dark:text-white leading-none mb-1">
            {displayName}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              {timeAgo}
            </span>
            {groupName && (
              <>
                <span className="text-[11px] text-gray-400">·</span>
                <span 
                  className="text-[11px] font-semibold"
                  style={{ color: colorTheme.accent }}
                >
                  {groupName}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrayerHeader
