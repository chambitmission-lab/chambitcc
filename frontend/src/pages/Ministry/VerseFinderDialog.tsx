// 성구 찾아 넣기 — 편지 편집기 안에서 성경을 펼쳐 절을 고르고 바로 본문에 넣는다.
// AI 없이 앱의 성경 데이터(장 조회·키워드 검색)만 쓴다.
//
//   "요 3:16" / "요한복음 3:16-18"  → 그 장을 펼치고 해당 절을 미리 골라 둔다
//   "시 23" / "시편 23편"            → 그 장을 펼친다
//   "사랑"                           → 키워드 검색 → 결과를 누르면 그 장으로 들어간다
//
// 노안을 고려해 글자·버튼을 크게 두고, 앞뒤 장 이동·Shift 클릭 범위 선택을 지원한다.

import { useEffect, useMemo, useRef, useState } from 'react'
import { useBibleBooks, useBibleChapter, useBibleSearch } from '../../hooks/useBible'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import { formatReference, matchBibleBooks, parseBibleReference } from '../Sermon/utils/sermonMeta'
import { SERIF } from './letterFormat'

export interface PickedPassage {
  /** 고른 절 본문을 이어 붙인 것 */
  text: string
  /** "요한복음 3:16–18" */
  cite: string
}

interface VerseFinderDialogProps {
  language: string
  onInsert: (passage: PickedPassage, mode: 'quote' | 'inline') => void
  onClose: () => void
}

const EXAMPLES = ['요 3:16', '시 23', '롬 8:28', '빌 4:6-7', '사랑', '평안']

const useDebounced = (value: string, ms: number) => {
  const [v, setV] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setV(value), ms)
    return () => window.clearTimeout(id)
  }, [value, ms])
  return v
}

/** 입력 → 펼칠 장(있으면)과 미리 고를 절 범위 */
const resolveQuery = (q: string) => {
  const ref = parseBibleReference(q)
  if (ref?.bookNumber) {
    return {
      chapter: { bookNumber: ref.bookNumber, book: ref.book, chapter: ref.chapter },
      preset: ref.verse ? { from: ref.verse, to: Math.max(ref.verse, ref.verseEnd ?? ref.verse) } : null,
      bookOnly: null,
    }
  }
  // "시 23" · "시편 23편" 처럼 장만 적은 경우 — 약자 정확 일치("요"=요한복음)를 앞부분 일치("요"→요엘)보다 먼저 본다
  const bare = q.replace(/\s*[편장]\s*$/, '')
  const chapterOnly = bare.match(/^(\D+?)\s*(\d+)$/)
  const exact = chapterOnly ? parseBibleReference(`${chapterOnly[1]} ${chapterOnly[2]}장`) : null
  if (exact?.bookNumber) {
    return { chapter: { bookNumber: exact.bookNumber, book: exact.book, chapter: exact.chapter }, preset: null, bookOnly: null }
  }
  const match = matchBibleBooks(bare, 1)[0]
  if (match?.chapter) {
    return { chapter: { bookNumber: match.bookNumber, book: match.book, chapter: match.chapter }, preset: null, bookOnly: null }
  }
  return { chapter: null, preset: null, bookOnly: match ?? null }
}

type Range = { from: number; to: number } | null

const VerseFinderDialog = ({ language, onInsert, onClose }: VerseFinderDialogProps) => {
  const ko = language === 'ko'
  const [input, setInput] = useState('')
  const query = useDebounced(input.trim(), 250)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useModalBackButton(onClose)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const resolved = useMemo(() => resolveQuery(query), [query])
  const target = resolved.chapter

  const chapterQuery = useBibleChapter(target?.bookNumber ?? 0, target?.chapter ?? 0, !!target)
  const searchQuery = useBibleSearch(target ? '' : query, 40)
  const { data: books } = useBibleBooks()

  // 선택 범위 — 입력이 바뀌면 입력이 가리키는 절(없으면 비움)로 돌아간다
  const [picked, setPicked] = useState<{ key: string; range: Range } | null>(null)
  const range: Range = picked?.key === query ? picked.range : resolved.preset

  const verses = useMemo(
    () => (chapterQuery.data?.verses ?? []).filter((v) => !v.merged_into),
    [chapterQuery.data],
  )
  const chapterCount = books?.find((b) => b.book_number === target?.bookNumber)?.chapter_count ?? 0

  // 장이 펼쳐지면 미리 고른 절이 보이게 스크롤
  useEffect(() => {
    if (!resolved.preset || !verses.length) return
    const el = listRef.current?.querySelector<HTMLElement>(`[data-verse="${resolved.preset.from}"]`)
    el?.scrollIntoView({ block: 'center' })
  }, [resolved.preset, verses.length])

  /** 탭 → 선택, 이어지는 절 → 범위 확장, 끝 절 다시 → 제외, Shift 클릭 → 그 절까지 범위 */
  const toggle = (n: number, shift: boolean) => {
    const cur = range
    let next: Range
    if (!cur) next = { from: n, to: n }
    else if (shift) next = { from: Math.min(cur.from, n), to: Math.max(cur.to, n) }
    else if (n >= cur.from && n <= cur.to) {
      if (cur.from === cur.to) next = null
      else if (n === cur.from) next = { from: n + 1, to: cur.to }
      else if (n === cur.to) next = { from: cur.from, to: n - 1 }
      else next = { from: n, to: n }
    } else if (n === cur.to + 1) next = { from: cur.from, to: n }
    else if (n === cur.from - 1) next = { from: n, to: cur.to }
    else next = { from: n, to: n }
    setPicked({ key: query, range: next })
  }

  const selected = range ? verses.filter((v) => v.verse >= range.from && v.verse <= range.to) : []
  const passage: PickedPassage | null =
    target && selected.length && range
      ? {
          text: selected.map((v) => v.text.trim()).join(' '),
          cite: formatReference({
            book: target.book,
            bookNumber: target.bookNumber,
            chapter: target.chapter,
            verse: range.from,
            verseEnd: range.to > range.from ? range.to : null,
          }),
        }
      : null

  const go = (text: string) => {
    setInput(text)
    inputRef.current?.focus()
  }

  const insert = (mode: 'quote' | 'inline') => {
    if (passage) onInsert(passage, mode)
  }

  // 키워드 결과에는 책 이름이 비어 오는 경우가 있어 책 번호로 되짚는다
  const nameByNumber = useMemo(() => new Map((books ?? []).map((b) => [b.book_number, b.book_name_ko])), [books])

  const iconBtn =
    'h-11 px-4 rounded-xl text-[15px] font-semibold text-ink-strong bg-surface-light dark:bg-white/[0.06] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)] disabled:opacity-35 disabled:hover:bg-surface-light transition-colors'

  return (
    <div
      className="fixed inset-0 z-[130] bg-black/50 dark:bg-black/70 flex items-stretch lg:items-center justify-center lg:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation()
          onClose()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ko ? '성구 찾기' : 'Find a verse'}
        className="bg-[var(--surface-container)] w-full h-full lg:h-[min(860px,calc(100dvh-3rem))] lg:max-w-[780px] lg:rounded-3xl flex flex-col overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)]"
      >
        {/* 머리 — 제목 · 검색칸 */}
        <div className="flex-shrink-0 px-5 lg:px-7 pt-4 lg:pt-6 pb-4 border-b border-border-light dark:border-border-dark">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <h2 className="text-[18px] lg:text-[21px] font-bold text-ink-strong tracking-[-0.015em]">{ko ? '성구 찾기' : 'Find a Verse'}</h2>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 lg:w-11 lg:h-11 flex items-center justify-center rounded-full hover:bg-[var(--brand-soft)]"
              aria-label={ko ? '닫기' : 'Close'}
            >
              <span className="material-icons-outlined text-[22px] lg:text-[24px] text-gray-600 dark:text-gray-400">close</span>
            </button>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing && passage) {
                e.preventDefault()
                insert('quote')
              }
            }}
            placeholder={ko ? '예) 요 3:16 · 시편 23 · 사랑' : 'e.g. 요 3:16 · 시 23 · keyword'}
            className="w-full h-14 lg:h-16 px-5 rounded-2xl border-2 border-border-light dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-ink-strong text-[18px] lg:text-[20px] font-semibold placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-[var(--brand)] transition-colors"
          />
        </div>

        {/* 몸통 */}
        <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto px-5 lg:px-7 py-4 lg:py-5">
          {!query && (
            <div>
              <p className="text-[15px] lg:text-[17px] leading-[1.7] text-gray-600 dark:text-gray-300">
                {ko
                  ? '책 이름과 장·절을 적으면 그 장이 펼쳐지고, 낱말을 적으면 그 낱말이 들어간 말씀을 찾습니다. 약자(요·롬·시)도 됩니다.'
                  : 'Type a reference to open the chapter, or a word to search. Abbreviations work too.'}
              </p>
              <div className="flex flex-wrap gap-2 lg:gap-2.5 mt-4">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => go(ex)}
                    className="px-4 py-2.5 rounded-full border border-border-light dark:border-white/[0.12] text-[15px] lg:text-[16px] font-semibold text-ink-strong hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] transition-colors"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 장 펼침 — 절을 눌러 고른다 */}
          {target && (
            <div>
              <div className="flex items-center gap-2 mb-3 lg:mb-4">
                <button
                  type="button"
                  onClick={() => go(`${target.book} ${target.chapter - 1}장`)}
                  disabled={target.chapter <= 1}
                  className={iconBtn}
                >
                  ‹ {ko ? '앞 장' : 'Prev'}
                </button>
                <p className="flex-1 text-center text-[18px] lg:text-[21px] font-bold text-ink-strong" style={{ fontFamily: SERIF }}>
                  {target.book} {target.chapter}
                  {target.bookNumber === 19 ? '편' : '장'}
                </p>
                <button
                  type="button"
                  onClick={() => go(`${target.book} ${target.chapter + 1}장`)}
                  disabled={!!chapterCount && target.chapter >= chapterCount}
                  className={iconBtn}
                >
                  {ko ? '다음 장' : 'Next'} ›
                </button>
              </div>
              <p className="text-[13px] lg:text-[14px] text-gray-500 dark:text-gray-400 mb-3 text-center">
                {ko ? '넣을 절을 누르세요 · 이어지는 절을 누르면 함께 담깁니다 · Shift+클릭은 그 절까지' : 'Tap verses to select · Shift+click selects a range'}
              </p>

              {chapterQuery.isPending && <p className="py-10 text-center text-[16px] text-gray-500">{ko ? '말씀을 펼치는 중…' : 'Loading…'}</p>}
              {chapterQuery.isError && (
                <p className="py-10 text-center text-[16px] text-gray-500">{ko ? '이 장을 찾지 못했습니다' : 'Chapter not found'}</p>
              )}

              <div className="space-y-1">
                {verses.map((v) => {
                  const on = !!range && v.verse >= range.from && v.verse <= range.to
                  return (
                    <button
                      key={v.id}
                      type="button"
                      data-verse={v.verse}
                      onClick={(e) => toggle(v.verse, e.shiftKey)}
                      aria-pressed={on}
                      className={`w-full text-left flex gap-3 lg:gap-4 px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl transition-colors ${
                        on ? 'bg-[var(--brand-soft-strong)] ring-2 ring-[var(--brand)]' : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'
                      }`}
                    >
                      <span
                        className={`flex-shrink-0 w-8 text-right text-[14px] lg:text-[15px] font-bold tabular-nums pt-[3px] ${
                          on ? 'text-[var(--brand)]' : 'text-gray-400 dark:text-gray-500'
                        }`}
                      >
                        {v.verse_label || v.verse}
                      </span>
                      <span
                        className="text-[17px] lg:text-[19px] leading-[1.75] text-ink-strong break-keep"
                        style={{ fontFamily: SERIF }}
                      >
                        {v.text}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* 키워드 검색 결과 — 누르면 그 장으로 들어가 앞뒤 문맥과 함께 고른다 */}
          {!target && query && (
            <div>
              {resolved.bookOnly && (
                <p className="mb-4 rounded-xl bg-[var(--brand-soft)] px-4 py-3 text-[15px] lg:text-[16px] text-ink-strong">
                  {ko
                    ? `${resolved.bookOnly.book} — 장 번호도 함께 적어 주세요 (예: ${resolved.bookOnly.book} 3)`
                    : `Add a chapter number (e.g. ${resolved.bookOnly.book} 3)`}
                </p>
              )}
              {query.length < 2 ? null : searchQuery.isPending ? (
                <p className="py-10 text-center text-[16px] text-gray-500">{ko ? '찾는 중…' : 'Searching…'}</p>
              ) : (searchQuery.data?.results ?? []).length === 0 ? (
                !resolved.bookOnly && <p className="py-10 text-center text-[16px] text-gray-500">{ko ? '찾는 말씀이 없습니다' : 'No results'}</p>
              ) : (
                <>
                  <p className="text-[13px] lg:text-[14px] text-gray-500 dark:text-gray-400 mb-2">
                    {ko
                      ? `"${query}" 이(가) 들어간 말씀 ${searchQuery.data?.total ?? 0}곳 — 누르면 그 장이 펼쳐집니다`
                      : `${searchQuery.data?.total ?? 0} verses — click to open the chapter`}
                  </p>
                  <div className="space-y-1">
                    {(searchQuery.data?.results ?? []).map((v) => {
                      const book = v.book_name_ko || nameByNumber.get(v.book_number ?? -1) || ''
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => go(`${book} ${v.chapter}:${v.verse}`)}
                          className="w-full text-left px-3 lg:px-4 py-3 rounded-xl hover:bg-[var(--brand-soft)] transition-colors"
                        >
                          <span className="block text-[14px] lg:text-[15px] font-bold text-[var(--brand)]">
                            {book} {v.chapter}:{v.verse}
                          </span>
                          <span className="block mt-1 text-[16px] lg:text-[18px] leading-[1.7] text-ink-strong break-keep" style={{ fontFamily: SERIF }}>
                            {v.text}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 발 — 고른 말씀 · 넣는 방식 */}
        <div className="flex-shrink-0 border-t border-border-light dark:border-border-dark px-5 lg:px-7 py-4 flex flex-col lg:flex-row lg:items-center gap-3">
          <p className="flex-1 min-w-0 text-[15px] lg:text-[16px] font-semibold text-ink-strong truncate">
            {passage
              ? `${passage.cite} · ${ko ? `${selected.length}절` : `${selected.length} verses`}`
              : <span className="text-gray-400 dark:text-gray-500 font-normal">{ko ? '아직 고른 절이 없습니다' : 'No verse selected'}</span>}
          </p>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => insert('inline')}
              disabled={!passage}
              title={ko ? '“말씀” (요한복음 3:16) 처럼 문장 안에 넣습니다' : 'Insert inline as “text” (ref)'}
              className="flex-1 lg:flex-none h-12 lg:h-[52px] px-5 rounded-2xl bg-surface-light dark:bg-white/[0.06] text-[15px] lg:text-[16px] font-bold text-ink-strong disabled:opacity-40 transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.09]"
            >
              {ko ? '문장 안에 넣기' : 'Insert inline'}
            </button>
            <button
              type="button"
              onClick={() => insert('quote')}
              disabled={!passage}
              title={ko ? '인용 상자와 출처로 넣습니다 (Enter)' : 'Insert as a quote with citation (Enter)'}
              className="flex-1 lg:flex-none h-12 lg:h-[52px] px-6 rounded-2xl bg-[var(--brand)] text-white text-[15px] lg:text-[16px] font-bold shadow-[0_2px_10px_var(--brand-glow)] disabled:opacity-40 disabled:shadow-none"
            >
              {ko ? '인용으로 넣기' : 'Insert as quote'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerseFinderDialog
