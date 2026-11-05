import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { smoothScrollToElement } from '../../../utils/scrollTo'
import { KEYWORD_SCROLL_OFFSET as SCROLL_OFFSET, markedVerses } from './keywordScroll'
import type { ChapterKeyword } from '../data/chapterKeywords'

/**
 * 밝히는 동안 화면 아래에 떠 있는 알약 — 길잡이 카드는 금방 스크롤로 사라지므로
 * "다음 자리로"와 "끄기"를 손 닿는 곳에 둔다.
 */
const KeywordActivePill = ({ keyword, onOff }: { keyword: ChapterKeyword; onOff: () => void }) => {
  const cursor = useRef(0)

  const next = () => {
    const list = markedVerses()
    if (!list.length) return
    // 지금 화면 위쪽 기준선보다 아래에 있는 첫 자리 — 손으로 스크롤한 뒤에도 자연스럽게 이어진다
    const idx = list.findIndex((el) => el.getBoundingClientRect().top > SCROLL_OFFSET + 8)
    cursor.current = idx === -1 ? 0 : idx
    smoothScrollToElement(list[cursor.current], { offset: SCROLL_OFFSET })
  }

  return createPortal(
    // left-1/2 고정 요소는 폭을 안 주면 남은 50vw에 맞춰 줄어든다(모바일에서 '다음'이 두 줄로 꺾임) →
    // 내용 폭(w-max)을 쓰되 화면 양옆 16px 안으로만 제한하고, 줄어드는 건 열쇠말(truncate)만.
    <div className="keyword-pill fixed left-1/2 -translate-x-1/2 z-[60] w-max max-w-[calc(100vw-32px)] flex items-center gap-1 rounded-full pl-3.5 pr-1 py-1 shadow-[0_8px_28px_rgba(0,0,0,0.18)] border bg-[var(--surface-container)] border-[var(--card-border)]">
      <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-[#f6c544]" aria-hidden />
      <span className="ml-1 min-w-0 text-[13px] lg:text-[15px] font-bold text-ink-strong whitespace-nowrap max-w-[46vw] truncate">
        {keyword.word}
      </span>
      <span className="shrink-0 text-[12px] lg:text-[14px] text-ink-muted whitespace-nowrap mr-1">{keyword.count}곳</span>
      <button
        type="button"
        onClick={next}
        className="shrink-0 whitespace-nowrap h-9 lg:h-10 px-3 rounded-full flex items-center gap-0.5 text-[12.5px] lg:text-[14px] font-bold text-[#3d2c00] bg-[#f6c544] hover:bg-[#f1bb2a] transition-colors"
      >
        다음
        <span className="material-icons-round text-[18px]">south</span>
      </button>
      <button
        type="button"
        onClick={onOff}
        aria-label="밝히기 끄기"
        className="shrink-0 w-9 h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-ink-muted hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        <span className="material-icons-round text-[19px]">close</span>
      </button>
    </div>,
    document.body
  )
}

export default KeywordActivePill
