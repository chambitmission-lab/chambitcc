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
  // 익명 기도는 아바타를 튀지 않게(뉴트럴) 처리 — 브랜드/그룹 색 미사용
  const isAnonymous = displayName === '익명'
  // 그룹이 없으면 기존 퍼플 스타일 사용
  const useGroupColor = !!groupName && !isAnonymous

  return (
    <div className="px-5 pt-4 pb-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="relative">
          {/* 주변 빛 확산 효과 */}
          {isAnonymous ? (
            <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-400 dark:text-gray-500">
              <span className="material-icons-outlined text-[18px]">person</span>
            </div>
          ) : useGroupColor ? (
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
          <span className={`text-sm leading-none mb-1 ${
            isAnonymous
              ? 'font-medium text-gray-500 dark:text-gray-400'
              : 'font-semibold text-gray-900 dark:text-white'
          }`}>
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
