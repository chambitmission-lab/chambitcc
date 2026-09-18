import { useEffect, useState } from 'react'
import { useMyIdentity } from '../../../hooks/useProfile'

interface DesktopComposerCardProps {
  onCompose: () => void
  onThanks: () => void
  onVerseCard: () => void
}

// 자리표시 문구 — 한 문장에 고정하지 않고 "무엇을 나눌 수 있는지"를 번갈아 보여 준다
const PROMPTS = [
  '함께 기도할 제목을 나눠주세요',
  '오늘 감사한 일이 있었나요?',
  '누구를 위해 기도하고 싶으세요?',
]
const PROMPT_INTERVAL_MS = 9000
// 천천히 사라졌다가 다음 문구로 떠오르는 시간 — 짧으면 "휙 바뀌는" 느낌이라 눈에 걸린다
const PROMPT_FADE_MS = 700

// PC 전용 작성 카드 — 가짜 인풋 한 줄 대신 "내 아바타 + 말 걸기 + 나눔 3종" 2단 카드.
// 위 영역 전체가 기도 작성 진입이고, 아래 줄은 FAB 스피드 다이얼(기도·감사·말씀카드)을 펼쳐 놓은 것.
const DesktopComposerCard = ({ onCompose, onThanks, onVerseCard }: DesktopComposerCardProps) => {
  const { avatarUrl, displayName } = useMyIdentity()
  const [promptIdx, setPromptIdx] = useState(0)
  const [promptVisible, setPromptVisible] = useState(true)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let swapId = 0
    const id = window.setInterval(() => {
      // 백그라운드 탭에선 돌리지 않는다 — 돌아왔을 때 문구가 몇 칸씩 튀지 않게
      if (document.hidden) return
      setPromptVisible(false)
      swapId = window.setTimeout(() => {
        setPromptIdx(i => (i + 1) % PROMPTS.length)
        setPromptVisible(true)
      }, PROMPT_FADE_MS)
    }, PROMPT_INTERVAL_MS)
    return () => {
      window.clearInterval(id)
      window.clearTimeout(swapId)
    }
  }, [])

  return (
    <div className="feed-card rounded-2xl overflow-hidden transition-[border-color,box-shadow] duration-150 hover:border-[var(--brand-glow)] hover:shadow-[0_6px_18px_-6px_var(--brand-glow)]">
      <button
        type="button"
        onClick={onCompose}
        className="w-full flex items-center gap-3 pl-4 pr-4 pt-4 pb-3 text-left"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="w-10 h-10 rounded-full object-cover shrink-0 border border-[var(--card-border)]"
          />
        ) : (
          <span className="w-10 h-10 rounded-full bg-[var(--brand-soft-strong)] text-brand flex items-center justify-center shrink-0 text-[15px] font-bold">
            {displayName ? (
              displayName.charAt(0)
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M11 6.5 C11.65 10.4 13.8 12.55 17.7 13.2 C13.8 13.85 11.65 16 11 19.9 C10.35 16 8.2 13.85 4.3 13.2 C8.2 12.55 10.35 10.4 11 6.5 Z" />
              </svg>
            )}
          </span>
        )}
        <span className="flex-1 min-w-0">
          {displayName && (
            <span className="block text-[12px] font-semibold text-ink-strong leading-tight mb-0.5">
              {displayName}님
            </span>
          )}
          {/* 완전히 사라진 뒤에 문구를 바꾸고 다시 떠오른다 — 움직임 없이 투명도만 */}
          <span
            className={`block text-[15px] text-gray-400 dark:text-white/40 truncate transition-opacity ease-in-out ${promptVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{ transitionDuration: `${PROMPT_FADE_MS}ms` }}
          >
            {PROMPTS[promptIdx]}
          </span>
        </span>
      </button>

      <div className="flex items-center gap-1 pl-3 pr-3 py-2 border-t border-[var(--card-border)]">
        <QuickAction label="기도제목" onClick={onCompose}>
          <path d="M12 3.5c.6 3.9 2.6 5.9 6.5 6.5-3.9.6-5.9 2.6-6.5 6.5-.6-3.9-2.6-5.9-6.5-6.5 3.9-.6 5.9-2.6 6.5-6.5Z" />
          <path d="M18.5 16.5v4M16.5 18.5h4" />
        </QuickAction>
        <QuickAction label="감사 한 줄" onClick={onThanks}>
          <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
        </QuickAction>
        <QuickAction label="말씀카드" onClick={onVerseCard}>
          <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
          <path d="m3.5 15.5 4.5-4 4 3.5 3-2.5 5.5 4.5" />
        </QuickAction>
        <button
          type="button"
          onClick={onCompose}
          className="ml-auto px-4 py-1.5 rounded-full brand-gradient text-[13px] font-bold active:scale-[0.97] transition-transform"
        >
          나누기
        </button>
      </div>
    </div>
  )
}

const QuickAction = ({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12.5px] font-medium text-gray-500 dark:text-gray-400 hover:bg-[var(--brand-soft-strong)] hover:text-brand transition-colors"
  >
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
    {label}
  </button>
)

export default DesktopComposerCard
