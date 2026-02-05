// 헤더 컴포넌트 (닫기, 삭제 버튼)
interface PrayerDetailHeaderProps {
  isOwner: boolean
  onClose: () => void
  onDeleteClick: () => void
}

const PrayerDetailHeader = ({ isOwner, onClose, onDeleteClick }: PrayerDetailHeaderProps) => {
  return (
    <div className="sticky top-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-5 py-4 flex items-center justify-between z-10">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">기도 요청 상세</h2>
      <div className="flex items-center gap-2">
        {isOwner && (
          <button
            onClick={onDeleteClick}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
            title="삭제"
          >
            <span className="material-icons-outlined text-[22px] text-gray-700 dark:text-gray-300">more_horiz</span>
          </button>
        )}
        <button
          onClick={onClose}
          className="relative w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 dark:from-purple-500/30 dark:to-pink-500/30 hover:from-purple-500/30 hover:to-pink-500/30 dark:hover:from-purple-500/40 dark:hover:to-pink-500/40 transition-all group"
        >
          {/* 강한 빛나는 효과 */}
          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 opacity-60 blur-md group-hover:opacity-80 animate-pulse transition-opacity"></span>
          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 opacity-40 blur-sm group-hover:opacity-60 transition-opacity"></span>
          {/* 빛나는 테두리 */}
          <span className="absolute inset-0 rounded-full border-2 border-purple-500 dark:border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.6)] dark:shadow-[0_0_12px_rgba(168,85,247,0.8)] group-hover:shadow-[0_0_20px_rgba(168,85,247,0.8)] dark:group-hover:shadow-[0_0_20px_rgba(168,85,247,1)] transition-all"></span>
          {/* X 아이콘 */}
          <span className="material-icons-outlined text-[22px] text-purple-700 dark:text-purple-300 relative z-10 font-bold group-hover:scale-110 transition-transform drop-shadow-[0_0_4px_rgba(168,85,247,0.8)]">close</span>
        </button>
      </div>
    </div>
  )
}

export default PrayerDetailHeader
