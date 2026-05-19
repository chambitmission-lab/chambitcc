import { useNavigate } from 'react-router-dom'

interface WeeklyStoryHookProps {
  thisWeekCount: number
}

const WeeklyStoryHook = ({ thisWeekCount }: WeeklyStoryHookProps) => {
  const navigate = useNavigate()

  return (
    <div className="px-4 py-3">
      <button
        type="button"
        onClick={() => navigate('/weekly-story')}
        className="
          group relative w-full overflow-hidden text-left
          rounded-2xl px-5 py-4
          bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500
          shadow-[0_4px_16px_rgba(0,0,0,0.10),0_8px_24px_rgba(168,85,247,0.30)]
          dark:shadow-[0_4px_16px_rgba(0,0,0,0.4),0_12px_28px_rgba(168,85,247,0.35),inset_0_1px_0_rgba(255,255,255,0.10)]
          transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl
        "
      >
        {/* 글로우 장식 — brand purple/pink 톤 통일 */}
        <div
          className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full bg-pink-300/25 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-12 -left-8 w-28 h-28 rounded-full bg-purple-300/25 blur-2xl"
          aria-hidden="true"
        />

        <div className="relative flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-white/80 mb-1">
              이번 주 신앙 타임라인
            </div>
            <div className="text-[16px] font-bold text-white leading-snug tracking-[-0.015em]">
              {thisWeekCount > 0
                ? `이번 주 ${thisWeekCount}번 기도했어요`
                : '이번 주 첫 발자국을 남겨보세요'}
            </div>
            <div className="text-[12px] text-white/85 mt-1">
              스토리로 한 주를 돌아보기 →
            </div>
          </div>
          <div
            className="
              shrink-0 w-12 h-12 rounded-2xl
              bg-white/15 backdrop-blur
              flex items-center justify-center text-2xl
              group-hover:scale-110 transition-transform
            "
            aria-hidden="true"
          >
            📖
          </div>
        </div>
      </button>
    </div>
  )
}

export default WeeklyStoryHook
