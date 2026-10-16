// 작년 오늘의 편지 — 홈 첫 카드와 /today 상세가 함께 쓰는 '그날의 나' 한 장.
// 기도는 손글씨, 필사는 명조(말씀이라서), 묵상·감사는 손글씨. 응답 전 기도에만
// '응답받았어요 / 아직 기도 중이에요'를 붙인다 — 응답받았어요는 기존 간증 모달로 이어진다.
import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { TodayMemory } from '../../api/todayChurch'
import { useAnswerMemoryPrayer, useStillPraying } from '../../hooks/useTodayChurch'
import { lazyModal } from '../../utils/lazyModal'

const AnswerModal = lazyModal(() => import('../../components/prayer/AnswerModal'))

interface MemoryQuoteProps {
  memory: TodayMemory
  /** 홈 카드는 3줄에서 자르고, 상세는 전부 보여 준다 */
  clamp?: boolean
  className?: string
}

export const MemoryQuote = ({ memory, clamp = false, className = '' }: MemoryQuoteProps) => {
  const verse = memory.kind === 'typing'
  return (
    <p
      className={`break-keep text-ink-strong ${clamp ? 'line-clamp-3' : ''} ${
        verse
          ? 'text-[15px] leading-[1.75] font-serif-kr lg:text-[19px] lg:leading-[1.8]'
          : 'text-[24px] leading-[1.25] lg:text-[32px] lg:leading-[1.3]'
      } ${className}`}
      style={verse ? undefined : { fontFamily: "'Nanum Pen Script', var(--font-serif-kr)" }}
    >
      {memory.text}
    </p>
  )
}

/** 응답 질문 두 버튼 + 간증 모달. 부모 카드가 링크여도 눌림이 새지 않게 전파를 막는다 */
export const AnswerAsk = ({ memory, size = 'md' }: { memory: TodayMemory; size?: 'sm' | 'md' }) => {
  const [open, setOpen] = useState(false)
  const answer = useAnswerMemoryPrayer()
  const { isStillPraying, markStillPraying } = useStillPraying()

  if (memory.kind !== 'prayer') return null
  if (memory.is_answered) {
    return (
      <p className="mt-3 inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-[12.5px] font-semibold text-emerald-700 dark:text-emerald-300 lg:mt-4 lg:px-3.5 lg:py-2 lg:text-[15px]">
        <span className="material-icons-round text-[15px]" aria-hidden>check</span>
        응답받은 기도예요
      </p>
    )
  }
  if (isStillPraying(memory.id)) {
    return (
      <p className="mt-3 text-[12.5px] font-medium text-[var(--text-muted)] lg:mt-4 lg:text-[15px]">응답의 날까지 함께 기도하고 있어요</p>
    )
  }

  const btn = size === 'sm' ? 'px-3 py-2 text-[13px]' : 'px-3.5 py-2.5 text-[14px] lg:h-12 lg:px-5 lg:py-0 lg:text-[16px]'
  const stop = (e: React.SyntheticEvent) => e.stopPropagation()
  return (
    <div className="mt-3 flex gap-2 lg:mt-5 lg:gap-2.5" onClick={stop} onKeyDown={stop}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`rounded-xl bg-brand font-semibold text-white transition-transform active:scale-[0.97] ${btn}`}
      >
        응답받았어요
      </button>
      <button
        type="button"
        onClick={() => markStillPraying(memory.id)}
        className={`rounded-xl bg-[var(--surface-inset)] font-semibold text-[var(--text-body)] transition-transform active:scale-[0.97] ${btn}`}
      >
        아직 기도 중이에요
      </button>
      {/* 카드의 transform(눌림 스케일·등장 애니메이션) 안에선 fixed 가 카드 기준이 된다 — body 로 띄운다.
          포털 안 클릭도 React 트리로는 위 div 를 거쳐 전파가 막힌다 */}
      {open && createPortal(
        <AnswerModal
          isOpen
          onClose={() => setOpen(false)}
          prayerTitle={memory.title || memory.text}
          isSubmitting={answer.isPending}
          onSubmit={async (testimony) => {
            try {
              await answer.mutateAsync({ prayerId: memory.id, testimony, prayerCount: memory.prayer_count ?? 0 })
              setOpen(false)
            } catch {
              // onError 토스트 — 모달은 열어 두고 다시 시도하게 한다
            }
          }}
        />,
        document.body,
      )}
    </div>
  )
}
