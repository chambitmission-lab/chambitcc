// 입력 중 성구 제안 카드 — "빌 4:7" 을 친 자리 바로 아래에 말씀을 미리 보여 주고,
// Tab(또는 버튼)으로 쓰던 문장 안에 “말씀” (빌립보서 4:7) 을 넣는다.

import { useEffect, useReducer } from 'react'
import { useBibleChapter } from '../../hooks/useBible'
import { formatReference, parseBibleReference } from '../Sermon/utils/sermonMeta'
import type { PickedPassage } from './VerseFinderDialog'
import type { VerseSuggestState } from './verseSuggestion'
import { SERIF } from './letterFormat'

interface VerseSuggestCardProps {
  ko: boolean
  suggest: VerseSuggestState
  /** 말씀이 준비되면(또는 사라지면) 부모의 Tab 처리기에 알린다 */
  onReady: (passage: PickedPassage | null) => void
  onInline: (passage: PickedPassage) => void
  onQuote: (passage: PickedPassage) => void
  onDismiss: () => void
}

const CARD_W = 460

const VerseSuggestCard = ({ ko, suggest, onReady, onInline, onQuote, onDismiss }: VerseSuggestCardProps) => {
  const ref = parseBibleReference(suggest.query.replace(/(\d)\s?편/, '$1장'))
  const chapter = useBibleChapter(ref?.bookNumber ?? 0, ref?.chapter ?? 0, !!ref?.bookNumber)

  const from = ref?.verse ?? 0
  const to = Math.max(from, ref?.verseEnd ?? from)
  const verses = (chapter.data?.verses ?? []).filter((v) => !v.merged_into && v.verse >= from && v.verse <= to)
  const passage: PickedPassage | null =
    ref && verses.length
      ? {
          text: verses.map((v) => v.text.trim()).join(' '),
          cite: formatReference({ ...ref, verseEnd: to > from ? to : null }),
        }
      : null

  const passageKey = passage ? `${passage.cite}|${passage.text.length}` : ''
  useEffect(() => {
    onReady(passage)
    // passage 는 매 렌더 새 객체라 내용 키로만 알린다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passageKey])
  useEffect(() => () => onReady(null), [onReady])

  // 편지지가 스크롤되면 카드도 따라가야 한다 — 위치는 렌더 때 커서 좌표로 다시 잰다
  const [, bump] = useReducer((n: number) => n + 1, 0)
  useEffect(() => {
    window.addEventListener('scroll', bump, true)
    window.addEventListener('resize', bump)
    return () => {
      window.removeEventListener('scroll', bump, true)
      window.removeEventListener('resize', bump)
    }
  }, [])

  const rect = suggest.clientRect?.()
  if (!rect) return null
  const left = Math.max(16, Math.min(rect.left, window.innerWidth - CARD_W - 16))
  const below = rect.bottom + 10
  // 화면 아래쪽이면 줄 위로 띄운다
  const placeAbove = below + 240 > window.innerHeight
  const style = placeAbove
    ? { left, bottom: window.innerHeight - rect.top + 10, width: CARD_W }
    : { left, top: below, width: CARD_W }

  const notFound = chapter.isError || (chapter.isSuccess && !verses.length)

  return (
    <div
      className="fixed z-[125] max-w-[calc(100vw-32px)] rounded-2xl border border-border-light dark:border-white/[0.1] bg-[var(--surface-container)] shadow-[0_16px_40px_rgba(15,23,42,0.18)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.55)] p-4"
      style={style}
      // 버튼을 눌러도 편집기 커서를 잃지 않게
      onMouseDown={(e) => e.preventDefault()}
      role="dialog"
      aria-label={ko ? '성구 넣기 제안' : 'Verse suggestion'}
    >
      <p className="flex items-center gap-2 text-[14px] lg:text-[15px] font-bold text-[var(--brand)]">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-[18px] h-[18px]">
          <path d="M10 5.6C8.4 4.4 6.4 3.9 3.5 4v11c2.9-.1 4.9.4 6.5 1.6 1.6-1.2 3.6-1.7 6.5-1.6V4c-2.9-.1-4.9.4-6.5 1.6z" />
          <path d="M10 5.6v11" />
        </svg>
        {ref ? formatReference({ ...ref, verseEnd: to > from ? to : null }) : suggest.query}
      </p>

      <p
        className="mt-2 text-[16px] lg:text-[17px] leading-[1.7] text-ink-strong break-keep line-clamp-4"
        style={{ fontFamily: SERIF }}
      >
        {passage
          ? passage.text
          : notFound
            ? ko
              ? '그 절을 찾지 못했습니다. 장·절 번호를 확인해 주세요.'
              : 'Verse not found.'
            : ko
              ? '말씀을 불러오는 중…'
              : 'Loading…'}
      </p>

      <div className="mt-3.5 flex items-center gap-2">
        <button
          type="button"
          disabled={!passage}
          onClick={() => passage && onInline(passage)}
          className="flex-1 h-11 rounded-xl bg-[var(--brand)] text-white text-[15px] font-bold disabled:opacity-40 inline-flex items-center justify-center gap-2"
        >
          {ko ? '문장에 넣기' : 'Insert'}
          <kbd className="px-1.5 py-0.5 rounded-md bg-white/20 font-sans text-[12px] font-semibold">Tab</kbd>
        </button>
        <button
          type="button"
          disabled={!passage}
          onClick={() => passage && onQuote(passage)}
          className="h-11 px-4 rounded-xl bg-surface-light dark:bg-white/[0.06] text-[15px] font-bold text-ink-strong disabled:opacity-40 hover:bg-black/[0.05] dark:hover:bg-white/[0.09]"
        >
          {ko ? '인용 상자로' : 'As quote'}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          title={ko ? '그냥 두기 (Esc)' : 'Dismiss (Esc)'}
          className="h-11 px-3 rounded-xl text-[14px] font-semibold text-gray-500 dark:text-gray-400 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
        >
          {ko ? '그냥 두기' : 'Dismiss'}
        </button>
      </div>
    </div>
  )
}

export default VerseSuggestCard
