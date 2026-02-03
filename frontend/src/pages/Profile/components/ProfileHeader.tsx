interface ProfileHeaderProps {
  username: string
  fullName: string
}

const ProfileHeader = ({ username, fullName }: ProfileHeaderProps) => {
  return (
    <div className="flex flex-col items-center py-8 px-4">
      <div className="relative mb-4">
        {/* 하늘에서 내려오는 빛 효과 - 테마별 색상 */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-[4px] h-12 bg-gradient-to-b from-transparent via-purple-400/60 to-purple-500/80 dark:via-white/60 dark:to-white/80 blur-[2px]"></div>
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-[2px] h-12 bg-gradient-to-b from-transparent via-purple-500/80 to-purple-600 dark:via-white/80 dark:to-white"></div>
        {/* 주변 빛 확산 효과 */}
        <div className="absolute inset-0 rounded-full bg-purple-400/30 dark:bg-white/20 blur-xl animate-pulse"></div>
        <div className="w-24 h-24 rounded-full backdrop-blur-md bg-gradient-to-b from-purple-400/60 via-purple-500/40 to-purple-600/25 dark:from-white/50 dark:via-white/30 dark:to-white/15 border-4 border-purple-500/70 dark:border-white/60 flex items-center justify-center text-white text-3xl font-bold shadow-[0_0_40px_rgba(168,85,247,0.6),0_-12px_30px_rgba(168,85,247,0.5),inset_0_2px_4px_rgba(255,255,255,0.8)] dark:shadow-[0_0_40px_rgba(255,255,255,0.4),0_-12px_30px_rgba(255,255,255,0.3),inset_0_2px_4px_rgba(255,255,255,0.6)] relative z-10">
          {fullName.charAt(0).toUpperCase()}
        </div>
      </div>
      <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1 drop-shadow-[0_0_12px_rgba(168,85,247,0.4)] dark:drop-shadow-[0_0_16px_rgba(255,255,255,0.5)]">
        {fullName}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">@{username}</p>
    </div>
  )
}

export default ProfileHeader
