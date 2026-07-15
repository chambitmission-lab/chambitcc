// 기도하기, 댓글 버튼 컴포넌트
// 기도 버튼은 명확한 토글: 누르기 전 = 댓글 버튼과 같은 무난한 스타일(사용자 확정),
// 누른 후 = 브랜드 블루 채움 + 체크 "함께 기도했어요"(완료 피드백).
import { useState } from 'react'
import { HandHeartIcon, CommentIcon } from '../../../../components/icons/ActionIcons'

interface PrayerActionsProps {
  isPrayed: boolean
  isToggling: boolean
  showReplies: boolean
  replyCount: number
  onPrayerToggle: () => void
  onRepliesToggle: () => void
}

const PrayerActions = ({
  isPrayed,
  isToggling,
  showReplies,
  replyCount,
  onPrayerToggle,
  onRepliesToggle,
}: PrayerActionsProps) => {
  const [isPopping, setIsPopping] = useState(false)

  const handlePrayerToggle = () => {
    onPrayerToggle()

    // 탭 순간에만 팝 애니메이션 (이미 기도된 상태로 로드될 때는 안 튀도록)
    setIsPopping(true)
    setTimeout(() => setIsPopping(false), 450)
  }

  return (
    <div className="flex items-center gap-3 mb-4">
      <button
        onClick={handlePrayerToggle}
        disabled={isToggling}
        aria-pressed={isPrayed}
        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 active:scale-[0.97] ${
          isPrayed
            ? 'brand-gradient shadow-[0_8px_24px_-8px_var(--brand-glow)]'
            : 'bg-surface-light dark:bg-white/[0.05] border border-transparent dark:border-white/[0.08] text-gray-900 dark:text-white hover:bg-[var(--brand-soft)] dark:hover:bg-white/[0.08]'
        }`}
      >
        <HandHeartIcon
          size={20}
          filled={isPrayed}
          style={isPopping ? { animation: 'pray-pop-detail 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)' } : undefined}
        />
        <span>{isPrayed ? '함께 기도했어요' : '함께 기도하기'}</span>
      </button>
      <button
        onClick={onRepliesToggle}
        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 active:scale-[0.97] ${
          showReplies
            ? 'brand-gradient shadow-[0_8px_24px_-8px_var(--brand-glow)]'
            : 'bg-surface-light dark:bg-white/[0.05] border border-transparent dark:border-white/[0.08] text-gray-900 dark:text-white hover:bg-[var(--brand-soft)] dark:hover:bg-white/[0.08]'
        }`}
      >
        <CommentIcon size={20} />
        <span>댓글</span>
        {replyCount > 0 && (
          <span
            className={`inline-flex items-center justify-center min-w-[1.375rem] px-1.5 py-0.5 rounded-full text-xs font-bold leading-none ${
              showReplies
                ? 'bg-white/25 text-white'
                : 'bg-[var(--brand-soft-strong)] text-[var(--brand)]'
            }`}
          >
            {replyCount}
          </span>
        )}
      </button>

      <style>{`
        @keyframes pray-pop-detail {
          0% { transform: scale(1); }
          35% { transform: scale(1.35) rotate(-8deg); }
          65% { transform: scale(0.92); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

export default PrayerActions
