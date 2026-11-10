// 그림 위에 뜬 조작 버튼 (뒤로가기·글씨 크기·더보기·닫기) — 제목 띠는 없다.
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
    <div className="pd-chrome">
      <div className="flex items-center">
        <button
          onClick={onClose}
          className="pd-glass pd-glass-btn flex md:hidden"
          aria-label="뒤로가기"
          title="뒤로가기"
        >
          <span className="material-icons-outlined text-[22px]">arrow_back</span>
        </button>
      </div>
      <div className="flex items-center gap-1.5">
        {/* PC 글씨 크기 — 피드에서 고른 값과 같은 설정이라 여기서 바꾸면 피드도 따라간다 */}
        <div className="pd-glass hidden lg:flex items-center h-11 pl-3.5 pr-1 rounded-full">
          <FeedTextScaleToggle />
        </div>
        {canDelete && (
          <button onClick={onDeleteClick} className="pd-glass pd-glass-btn flex" aria-label="삭제" title="삭제">
            <span className="material-icons-outlined text-[22px]">more_vert</span>
          </button>
        )}
        <button
          onClick={onClose}
          className="pd-glass pd-glass-btn hidden md:flex"
          aria-label="닫기"
          title="닫기"
        >
          <span className="material-icons-outlined text-[24px]">close</span>
        </button>
      </div>
    </div>
  )
}

export default PrayerDetailHeader
