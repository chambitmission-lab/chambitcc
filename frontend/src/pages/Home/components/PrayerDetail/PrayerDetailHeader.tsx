// 헤더 컴포넌트 (닫기, 삭제 버튼)
interface PrayerDetailHeaderProps {
  isOwner: boolean
  onClose: () => void
  onDeleteClick: () => void
}

const PrayerDetailHeader = ({ isOwner, onClose, onDeleteClick }: PrayerDetailHeaderProps) => {
  return (
    <div className="flex-shrink-0 bg-background-light dark:bg-background-dark border-b border-border-light dark:border-border-dark px-5 py-4 flex items-center justify-between">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">기도 요청 상세</h2>
      <div className="flex items-center gap-2">
        {isOwner && (
          <button
            onClick={onDeleteClick}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
            title="삭제"
          >
            <span className="material-icons-outlined text-[22px] text-gray-700 dark:text-gray-300">more_vert</span>
          </button>
        )}
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
          aria-label="닫기"
          title="닫기"
        >
          <span className="material-icons-outlined text-[22px] text-gray-700 dark:text-gray-300">close</span>
        </button>
      </div>
    </div>
  )
}

export default PrayerDetailHeader
