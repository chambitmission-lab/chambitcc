// 하단 고정 액션 바 — 기도하기(풀폭 주 버튼) + 댓글로 이동(컴팩트 아이콘 버튼).
// 같은 폭 버튼 두 개가 나란히 붙어 답답하다는 피드백으로, 주행동 하나만 넓게 남기고
// 댓글은 인라인 섹션으로 항상 펼쳐두되 여기서는 스크롤 바로가기만 제공한다.
import { useState } from 'react'
import { HandHeartIcon, CommentIcon } from '../../../../components/icons/ActionIcons'

interface PrayerActionsProps {
  isPrayed: boolean
  isToggling: boolean
  replyCount: number
  onPrayerToggle: () => void
  onCommentClick: () => void
}

const PrayerActions = ({
  isPrayed,
  isToggling,
  replyCount,
  onPrayerToggle,
  onCommentClick,
}: PrayerActionsProps) => {
  const [isPopping, setIsPopping] = useState(false)

  const handlePrayerToggle = () => {
    onPrayerToggle()

    // 탭 순간에만 팝 애니메이션 (이미 기도된 상태로 로드될 때는 안 튀도록)
    setIsPopping(true)
    setTimeout(() => setIsPopping(false), 450)
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handlePrayerToggle}
        disabled={isToggling}
        aria-pressed={isPrayed}
        className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-[15px] transition-all duration-200 active:scale-[0.97] ${
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

      {/* 댓글 바로가기 — 섹션은 항상 펼쳐져 있으므로 스크롤 이동만 담당 */}
      <button
        onClick={onCommentClick}
        aria-label={`댓글${replyCount > 0 ? ` ${replyCount}개` : ''}로 이동`}
        className="relative shrink-0 flex items-center justify-center w-[52px] h-[52px] rounded-2xl bg-surface-light dark:bg-white/[0.05] border border-transparent dark:border-white/[0.08] text-gray-900 dark:text-white hover:bg-[var(--brand-soft)] dark:hover:bg-white/[0.08] transition-all duration-200 active:scale-[0.97]"
      >
        <CommentIcon size={22} />
        {replyCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[11px] font-bold leading-none bg-[var(--brand)] text-white shadow-sm">
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
