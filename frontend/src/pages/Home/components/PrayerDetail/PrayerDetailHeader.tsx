// 헤더 컴포넌트 (닫기, 삭제 버튼)
// 모바일에서는 전체 화면(페이지처럼 보임) → 좌측 상단 뒤로가기(←),
// 데스크톱에서는 중앙 모달 → 우측 상단 닫기(X). 플랫폼 관례에 맞춘다.
interface PrayerDetailHeaderProps {
  isOwner: boolean
  onClose: () => void
  onDeleteClick: () => void
}

const PrayerDetailHeader = ({ isOwner, onClose, onDeleteClick }: PrayerDetailHeaderProps) => {
  return (
    <div className="flex-shrink-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-border-light dark:border-border-dark px-5 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <button
          onClick={onClose}
          className="md:hidden -ml-2 w-9 h-9 flex items-center justify-center rounded-full hover:bg-purple-50 dark:hover:bg-purple-500/15 transition-colors"
          aria-label="뒤로가기"
          title="뒤로가기"
        >
          <span className="material-icons-outlined text-[20px] text-gray-600 dark:text-gray-400">arrow_back</span>
        </button>
        <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-[-0.01em]">기도 요청 상세</h2>
      </div>
      <div className="flex items-center gap-1">
        {isOwner && (
          <button
            onClick={onDeleteClick}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-light dark:hover:bg-white/[0.06] transition-colors"
            title="삭제"
          >
            <span className="material-icons-outlined text-[20px] text-gray-600 dark:text-gray-400">more_vert</span>
          </button>
        )}
        <button
          onClick={onClose}
          className="hidden md:flex w-9 h-9 items-center justify-center rounded-full hover:bg-purple-50 dark:hover:bg-purple-500/15 transition-colors"
          aria-label="닫기"
          title="닫기"
        >
          <span className="material-icons-outlined text-[20px] text-gray-600 dark:text-gray-400">close</span>
        </button>
      </div>
    </div>
  )
}

export default PrayerDetailHeader
