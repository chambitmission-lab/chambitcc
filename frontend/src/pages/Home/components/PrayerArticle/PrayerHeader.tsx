import type { GroupColorTheme } from '../../../../utils/groupColors'

interface PrayerHeaderProps {
  displayName: string
  avatarUrl?: string | null
  timeAgo: string
  groupName?: string
  colorTheme: GroupColorTheme
}

const PrayerHeader = ({
  displayName,
  avatarUrl = null,
  timeAgo,
  groupName,
  colorTheme
}: PrayerHeaderProps) => {
  // 그룹이 없으면 기존 퍼플 스타일 사용
  const useGroupColor = !!groupName
  
  return (
    <div className="px-5 pt-4 pb-3 flex items-center justify-between">
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
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="w-8 h-8 rounded-full border-2 object-cover relative z-10"
                  style={{
                    borderColor: colorTheme.primary,
                    boxShadow: colorTheme.shadow,
                  }}
                />
              ) : (
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
              )}
            </>
          ) : avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="w-9 h-9 rounded-full object-cover shadow-[0_2px_10px_var(--brand-glow)]"
            />
          ) : (
            <div className="w-9 h-9 rounded-full brand-gradient flex items-center justify-center text-xs font-bold shadow-[0_2px_10px_var(--brand-glow)]">
              {displayName.charAt(0).toUpperCase()}
            </div>
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
