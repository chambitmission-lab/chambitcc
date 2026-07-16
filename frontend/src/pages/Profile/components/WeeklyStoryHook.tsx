import { useNavigate } from 'react-router-dom'
import './WeeklyStoryHook.css'

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
          bg-gradient-to-br from-[#1b6ef3] via-[#3182f6] to-[#5ba3ff]
          shadow-[0_4px_16px_rgba(0,0,0,0.10),0_8px_24px_var(--brand-glow)]
          dark:shadow-[0_4px_16px_rgba(0,0,0,0.4),0_12px_28px_var(--brand-glow),inset_0_1px_0_rgba(255,255,255,0.10)]
          transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl
          active:scale-[0.99]
        "
      >
        {/* 글로우 장식 */}
        <div
          className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full bg-sky-300/25 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-12 -left-8 w-28 h-28 rounded-full bg-blue-300/25 blur-2xl"
          aria-hidden="true"
        />

        {/* 반짝이 장식 */}
        <span
          className="pointer-events-none absolute top-2.5 right-16 text-[13px] animate-twinkle"
          aria-hidden="true"
        >
          ✨
        </span>
        <span
          className="pointer-events-none absolute bottom-3 left-1/2 text-[11px] animate-twinkle"
          style={{ animationDelay: '0.9s' }}
          aria-hidden="true"
        >
          ✨
        </span>

        {/* 주기적 하이라이트 스윕 */}
        <span className="wsh-shine" aria-hidden="true" />

        <div className="relative flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="mb-1.5 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white backdrop-blur-sm">
                <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                </span>
                STORY
              </span>
              <span className="text-[11px] font-semibold text-white/80">
                이번 주 신앙 타임라인
              </span>
            </div>

            <div className="text-[17px] font-bold text-white leading-snug tracking-[-0.015em]">
              {thisWeekCount > 0
                ? `이번 주 ${thisWeekCount}번 기도했어요`
                : '이번 주 첫 발자국을 남겨보세요'}
            </div>

            <span className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-white px-3.5 py-1.5 text-[12.5px] font-bold text-brand shadow-md transition-transform group-hover:scale-[1.03] group-active:scale-95">
              <span className="material-icons-round text-[15px]">
                play_arrow
              </span>
              스토리로 한 주 돌아보기
            </span>
          </div>

          {/* 인스타 스토리풍 그라데이션 링 아이콘 */}
          <div
            className="story-ring-gradient shrink-0 rounded-full p-[3px] transition-transform group-hover:scale-110 group-hover:rotate-6"
            aria-hidden="true"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-2xl ring-2 ring-white/40 backdrop-blur">
              📖
            </div>
          </div>
        </div>
      </button>
    </div>
  )
}

export default WeeklyStoryHook
