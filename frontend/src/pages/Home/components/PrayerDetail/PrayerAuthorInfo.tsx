// 작성자 정보 컴포넌트
// 번역 버튼은 본문(PrayerContent) 쪽으로 이동 — 프로필 옆 국기는 작성자
// 국적처럼 오인된다. 내 글 여부는 큰 안내 박스 대신 이름 옆 작은 태그로.
interface PrayerAuthorInfoProps {
  displayName: string
  timeAgo: string
  isOwner: boolean
}

const PrayerAuthorInfo = ({ displayName, timeAgo, isOwner }: PrayerAuthorInfoProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {/* 피드 PrayerHeader와 동일한 보랏빛 글로우 아바타 — 화면 간 일관성 */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-purple-400/30 dark:bg-purple-500/40 blur-md animate-pulse"></div>
          <div className="w-10 h-10 rounded-full backdrop-blur-md bg-gradient-to-b from-purple-400/60 via-purple-500/40 to-purple-600/25 dark:from-purple-400/50 dark:via-purple-500/30 dark:to-purple-600/20 border-2 border-purple-500/70 dark:border-purple-400/50 flex items-center justify-center text-white text-sm font-bold shadow-[0_0_25px_rgba(168,85,247,0.6),inset_0_1px_3px_rgba(255,255,255,0.8)] dark:shadow-[0_0_25px_rgba(168,85,247,0.4),inset_0_1px_3px_rgba(255,255,255,0.3)] relative z-10">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="flex flex-col">
          <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none mb-1 flex items-center gap-1.5">
            {displayName}
            {isOwner && (
              <span className="px-1.5 py-0.5 rounded-full bg-purple-500/[0.12] dark:bg-purple-400/[0.16] text-[10px] font-bold leading-none text-purple-600 dark:text-purple-300">
                내 기도
              </span>
            )}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">{timeAgo}</p>
        </div>
      </div>
    </div>
  )
}

export default PrayerAuthorInfo
