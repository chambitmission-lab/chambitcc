// 헤더 컴포넌트 (닫기, 삭제 버튼)
// 모바일에서는 전체 화면(페이지처럼 보임) → 좌측 상단 뒤로가기(←),
// 데스크톱에서는 중앙 모달 → 우측 상단 닫기(X). 플랫폼 관례에 맞춘다.
import FeedTextScaleToggle from '../FeedTextScaleToggle'

interface PrayerDetailHeaderProps {
  canDelete: boolean
  onClose: () => void
  onDeleteClick: () => void
}

const PrayerDetailHeader = ({ canDelete, onClose, onDeleteClick }: PrayerDetailHeaderProps) => {
  return (
    <div className="flex-shrink-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-border-light dark:border-border-dark px-5 py-3.5 lg:px-8 lg:py-4 flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <button
          onClick={onClose}
          className="md:hidden -ml-2 w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--brand-soft)] transition-colors"
          aria-label="뒤로가기"
          title="뒤로가기"
        >
          <span className="material-icons-outlined text-[20px] text-gray-600 dark:text-gray-400">arrow_back</span>
        </button>
        <h2 className="text-[15px] lg:text-[length:calc(17px*var(--fs,1))] font-semibold text-ink-strong tracking-[-0.01em]">기도 요청 상세</h2>
      </div>
      <div className="flex items-center gap-1">
        {/* PC 글씨 크기 — 피드에서 고른 값과 같은 설정이라 여기서 바꾸면 피드도 따라간다 */}
        <div className="hidden lg:block mr-2">
          <FeedTextScaleToggle />
        </div>
        {canDelete && (
          <button
            onClick={onDeleteClick}
            className="w-9 h-9 lg:w-11 lg:h-11 flex items-center justify-center rounded-full hover:bg-surface-light dark:hover:bg-white/[0.06] transition-colors"
            title="삭제"
          >
            <span className="material-icons-outlined text-[20px] lg:text-[24px] text-gray-600 dark:text-gray-400">more_vert</span>
          </button>
        )}
        <button
          onClick={onClose}
          className="hidden md:flex w-9 h-9 lg:w-11 lg:h-11 items-center justify-center rounded-full hover:bg-[var(--brand-soft)] transition-colors"
          aria-label="닫기"
          title="닫기"
        >
          <span className="material-icons-outlined text-[20px] lg:text-[26px] text-gray-600 dark:text-gray-400">close</span>
        </button>
      </div>
    </div>
  )
}

export default PrayerDetailHeader
