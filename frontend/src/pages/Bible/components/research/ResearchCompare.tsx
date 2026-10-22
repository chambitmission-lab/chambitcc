import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import type { InfiniteData } from '@tanstack/react-query'
import type { BibleChapterPaginatedResponse, BibleVerse } from '../../../../types/bible'
import { useChapterCommentaries } from '../../../../hooks/useBibleCommentary'
import { parseCommentary } from '../../../../components/bible/commentaryContent'
import { loadBookOutline, peekBookOutline, type BookOutline } from '../../data/chapterOutlines'
import { loadBookParaphrase, peekBookParaphrase, type BookParaphrase } from '../../data/paraphrase'
import { basketKey, getBasket, subscribeBasket, toggleBasket } from '../../data/researchBasket'
import { visibleVerses, verseNumberLabel, isOmittedVerseText } from '../mergedVerses'
import { bookAbbrev } from '../bibleBookAbbrev'
import ChapterLoader from '../ChapterLoader'
import './research.css'

type CompareMode = 'paraphrase' | 'commentary'

interface Props {
  bookNumber: number
  chapter: number
  chapterData: InfiniteData<BibleChapterPaginatedResponse> | undefined
  isLoading: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
}

interface Section {
  title: string | null
  range: [number, number]
  verses: BibleVerse[]
}

/** 해석 카드 요약 — 마크다운 기호를 걷어 낸 첫 문단 */
const plain = (s: string) =>
  s
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/^>\s?/gm, '')
    .trim()

/**
 * 연구 모드(목회자) — 개역개정을 단락별로 두고, 오른쪽에 쉽게 풀면 또는 해석을 나란히 보여 준다.
 * 절 번호 옆 + 로 말씀 바구니에 담는다. 읽음 기록·오디오 따라가기는 읽기 모드(VerseList) 몫이라
 * 여기서는 건드리지 않는다.
 */
const ResearchCompare = ({
  bookNumber,
  chapter,
  chapterData,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: Props) => {
  const [mode, setMode] = useState<CompareMode>('paraphrase')
  const basket = useSyncExternalStore(subscribeBasket, getBasket)
  const picked = useMemo(() => new Set(basket.map((b) => b.key)), [basket])

  // 나란히 보려면 장 전체가 필요하다 — 남은 페이지를 이어서 받는다
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const [outline, setOutline] = useState<{ book: number; data: BookOutline | null } | null>(() => {
    const peek = peekBookOutline(bookNumber)
    return peek ? { book: bookNumber, data: peek } : null
  })
  const [paraphrase, setParaphrase] = useState<{ book: number; data: BookParaphrase | null } | null>(() => {
    const peek = peekBookParaphrase(bookNumber)
    return peek ? { book: bookNumber, data: peek } : null
  })
  useEffect(() => {
    let alive = true
    loadBookOutline(bookNumber).then((data) => alive && setOutline({ book: bookNumber, data }))
    loadBookParaphrase(bookNumber).then((data) => alive && setParaphrase({ book: bookNumber, data }))
    return () => {
      alive = false
    }
  }, [bookNumber])

  const { data: commentaries, isLoading: commentaryLoading } = useChapterCommentaries(
    bookNumber,
    chapter,
    mode === 'commentary',
  )

  const verses = useMemo(
    () => visibleVerses(chapterData?.pages.flatMap((p) => p.verses) ?? []),
    [chapterData],
  )

  const sections = useMemo<Section[]>(() => {
    if (verses.length === 0) return []
    const outlineSections = outline?.book === bookNumber ? outline.data?.[chapter] : undefined
    const last = verses[verses.length - 1].verse
    if (!outlineSections || outlineSections.length === 0) {
      return [{ title: null, range: [verses[0].verse, last], verses }]
    }
    const list: Section[] = outlineSections.map((s) => ({
      title: s.title,
      range: s.v,
      verses: verses.filter((v) => v.verse >= s.v[0] && v.verse <= s.v[1]),
    }))
    // 개요 범위 밖으로 남는 절이 있으면 빠뜨리지 않고 끝에 따로 묶는다
    const rest = verses.filter((v) => !outlineSections.some((s) => v.verse >= s.v[0] && v.verse <= s.v[1]))
    if (rest.length > 0) {
      list.push({ title: null, range: [rest[0].verse, rest[rest.length - 1].verse], verses: rest })
    }
    return list
  }, [verses, outline, bookNumber, chapter])

  const chapterParaphrase = paraphrase?.book === bookNumber ? paraphrase.data?.[chapter] : undefined
  const abbr = bookAbbrev(bookNumber, 'ko')

  if (isLoading && verses.length === 0) return <ChapterLoader />

  const sideFor = (s: Section) => {
    if (mode === 'paraphrase') {
      const text = chapterParaphrase?.[s.range[0]]
      return text ? (
        <p className="rsc-side__text">{text}</p>
      ) : (
        <p className="rsc-side__empty">이 단락은 아직 쉽게 풀면이 없어요.</p>
      )
    }
    if (commentaryLoading) return <p className="rsc-side__empty">해석을 불러오는 중…</p>
    const items = (commentaries?.items ?? []).filter(
      (c) => c.verse_start <= s.range[1] && c.verse_end >= s.range[0],
    )
    if (items.length === 0) return <p className="rsc-side__empty">이 단락에 등록된 해석이 없어요.</p>
    return items.map((c) => {
      const parsed = parseCommentary(c.content, !!c.title)
      const summary = parsed.lead ?? plain(parsed.preface ?? parsed.body ?? '')
      return (
        <div key={c.id} className="rsc-cmt">
          <p className="rsc-cmt__ref">
            {c.verse_start === c.verse_end ? `${c.verse_start}절` : `${c.verse_start}–${c.verse_end}절`}
            {c.title ? ` · ${c.title}` : ''}
          </p>
          {summary && <p className="rsc-cmt__body">{summary}</p>}
          {parsed.application && <p className="rsc-cmt__apply">적용 · {parsed.application}</p>}
        </div>
      )
    })
  }

  return (
    <div className="rsc">
      <div className="rsc-tool">
        <span className="rsc-tool__label">나란히 보기</span>
        <div className="rsc-seg" role="tablist" aria-label="나란히 볼 내용">
          {(
            [
              ['paraphrase', '쉽게 풀면'],
              ['commentary', '해석'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={mode === key}
              className={mode === key ? 'is-on' : undefined}
              onClick={() => setMode(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="rsc-tool__hint">절 번호 옆 + 로 말씀 바구니에 담아요</span>
      </div>

      {sections.map((s) => (
        <section key={`${s.range[0]}-${s.range[1]}`} className="rsc-sec">
          <h3 className="rsc-sec__title">
            {s.title ?? `${chapter}장`}
            <span>
              {s.range[0]}–{s.range[1]}절
            </span>
          </h3>
          <div className="rsc-sec__grid">
            <div className="rsc-verses">
              {s.verses.map((v) => {
                const key = basketKey(bookNumber, chapter, v.verse)
                const on = picked.has(key)
                const label = verseNumberLabel(v)
                const omitted = isOmittedVerseText(v.text)
                return (
                  <div key={v.id} className={`rsc-verse${on ? ' is-picked' : ''}${omitted ? ' is-omitted' : ''}`}>
                    <div className="rsc-verse__num">
                      <span>{label}</span>
                      {!omitted && (
                        <button
                          type="button"
                          className="rsc-pick"
                          aria-pressed={on}
                          aria-label={on ? `${label}절 바구니에서 빼기` : `${label}절 바구니에 담기`}
                          title={on ? '바구니에서 빼기' : '바구니에 담기'}
                          onClick={() =>
                            toggleBasket({
                              key,
                              bookNumber,
                              chapter,
                              verse: v.verse,
                              label,
                              ref: `${abbr} ${chapter}:${label}`,
                              text: v.text,
                            })
                          }
                        >
                          <span className="material-icons-round" aria-hidden>
                            {on ? 'check' : 'add'}
                          </span>
                        </button>
                      )}
                    </div>
                    <p className="rsc-verse__text">{v.text}</p>
                  </div>
                )
              })}
            </div>
            <div className={`rsc-side rsc-side--${mode}`}>{sideFor(s)}</div>
          </div>
        </section>
      ))}
      {isFetchingNextPage && <p className="rsc-side__empty">나머지 절을 불러오는 중…</p>}
    </div>
  )
}

export default ResearchCompare
