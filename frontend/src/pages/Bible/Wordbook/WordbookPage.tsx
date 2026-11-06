// 내 단어장 (/bible/wordbook)
// 성경을 읽다가 체크한 모르는 단어들을 "읽으며 주운 단어"로 모아 보는 페이지.
// 히어로(권 수·단어 수 + 66권 막대) → 정렬 칩 → 책별 목록. lg+ 는 오른쪽에 사전형 상세 패널,
// 그보다 좁으면 행을 누를 때 WordNoteSheet(읽기·수정·삭제)를 연다.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMyWordNotes } from '../../../hooks/useBibleWordNote'
import type { WordNoteWithVerse } from '../../../api/bibleWordNote'
import { isAuthenticated } from '../../../utils/auth'
import BibleBottomNav from '../../../components/bible/BibleBottomNav'
import BibleSideRail from '../../../components/bible/BibleSideRail'
import WordNoteSheet from '../components/WordNoteSheet'
import { BOOK_ABBREV_KO } from '../components/bibleBookAbbrev'
import {
  cleanNote,
  countByBook,
  groupWords,
  highlightRange,
  noteSummary,
  type WordbookSort,
} from './wordbookShape'

const SORT_KEY = 'chambit.wordbook.sort'
const SORTS: { id: WordbookSort; label: string }[] = [
  { id: 'book', label: '성경 순서' },
  { id: 'alpha', label: '가나다' },
  { id: 'recent', label: '최근 모은' },
]

const readSort = (): WordbookSort => {
  try {
    const v = window.localStorage.getItem(SORT_KEY)
    if (v === 'book' || v === 'alpha' || v === 'recent') return v
  } catch {
    /* 저장소 막힘 — 기본값 */
  }
  return 'book'
}

const refOf = (item: WordNoteWithVerse) => `${item.book_name_ko} ${item.chapter}:${item.verse}`

const WordbookPage = () => {
  const navigate = useNavigate()
  const loggedIn = isAuthenticated()

  // 검색어는 300ms 디바운스 후 서버로 (단어·뜻 부분 일치)
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  useEffect(() => {
    const id = window.setTimeout(() => setQuery(searchInput.trim()), 300)
    return () => window.clearTimeout(id)
  }, [searchInput])

  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useMyWordNotes(
    query || undefined,
    loggedIn,
  )

  // 책 순서·가나다 정렬과 66권 막대는 전체가 있어야 맞으므로 남은 쪽을 이어 받는다
  // (한 쪽 100개 — 대부분은 첫 요청으로 끝난다)
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const items = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data])
  const total = data?.pages[0]?.total ?? 0

  const [sort, setSortState] = useState<WordbookSort>(readSort)
  const setSort = (s: WordbookSort) => {
    setSortState(s)
    try {
      window.localStorage.setItem(SORT_KEY, s)
    } catch {
      /* 무시 */
    }
  }
  const [memoOnly, setMemoOnly] = useState(false)

  const visible = useMemo(
    () => (memoOnly ? items.filter((it) => !!it.note?.trim()) : items),
    [items, memoOnly],
  )
  const groups = useMemo(() => groupWords(visible, sort), [visible, sort])
  const ordered = useMemo(() => groups.flatMap((g) => g.items), [groups])
  const bookCounts = useMemo(() => countByBook(items), [items])
  const memoCount = useMemo(() => items.filter((it) => !!it.note?.trim()).length, [items])

  // lg+ 상세 패널 선택 — 지워졌거나 걸러지면 첫 단어로
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const selected = ordered.find((it) => it.id === selectedId) ?? ordered[0] ?? null

  // 보기/수정/삭제 시트 — edit: 연필로 열면 읽기 모드 없이 바로 편집 폼
  const [editing, setEditing] = useState<{ item: WordNoteWithVerse; edit: boolean } | null>(null)

  // 상세 패널이 실제로 보이는지(lg+ 이고 좁은 zoom 이 아님)로 행 탭 동작을 가른다
  const detailRef = useRef<HTMLElement | null>(null)
  const openWord = (item: WordNoteWithVerse) => {
    if (detailRef.current && detailRef.current.offsetParent !== null) setSelectedId(item.id)
    else setEditing({ item, edit: false })
  }

  const goToVerse = (item: WordNoteWithVerse) => {
    navigate(`/bible/${item.book_number}/${item.chapter}?verse=${item.verse}`)
  }

  // 66권 막대 → 그 권 묶음으로
  const jumpToBook = (bookNumber: number) => {
    const first = [...items]
      .filter((it) => it.book_number === bookNumber)
      .sort((a, b) => a.chapter - b.chapter || a.verse - b.verse)[0]
    if (!first) return
    setSort('book')
    setMemoOnly(false)
    setSelectedId(first.id)
    window.requestAnimationFrame(() => {
      document
        .getElementById(`wb-book-${bookNumber}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const hasWords = total > 0 || !!query

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 page-stage">
      {/* lg+: 좌측 섹션 레일 + 본문. 하단 도크는 lg에서 숨고 좌측 레일이 섹션 내비를 맡는다 */}
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-2 lg:pb-12">
        <BibleSideRail active="wordbook" />
        <div className="max-w-md mx-auto min-h-screen pb-bottomnav-safe lg:max-w-none lg:mx-0 lg:flex-1 lg:min-w-0 lg:min-h-0 lg:pb-8">
          {/* 모바일 헤더 — PC에선 좌측 레일이 내비를 맡는다 */}
          <div className="lg:hidden sticky top-14 z-20 bg-[var(--app-canvas)] dark:bg-background-dark/95 backdrop-blur-sm px-4 py-3 flex items-center gap-2">
            <button
              onClick={() => navigate('/bible')}
              className="flex items-center gap-1.5 text-gray-600 dark:text-white/70 hover:text-brand transition-colors"
              aria-label="성경 공부로"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span className="text-sm font-semibold">성경</span>
            </button>
            <h1 className="text-base font-bold tracking-[-0.015em] text-ink-strong mx-auto pr-10">내 단어장</h1>
          </div>

          <div className="px-4 pt-1 lg:px-0 lg:pt-0 space-y-4 lg:space-y-5">
            {!loggedIn ? (
              <EmptyCard
                icon="lock"
                title="로그인하면 나만의 성경 단어장을 만들 수 있어요"
              />
            ) : isLoading ? (
              <div className="rounded-[24px] bg-white dark:bg-card-dark px-6 py-16 text-center text-[13.5px] text-gray-400 dark:text-white/35">
                단어장을 불러오는 중...
              </div>
            ) : !hasWords ? (
              <EmptyCard
                icon="spellcheck"
                title="아직 모은 단어가 없어요"
                body={
                  <>
                    성경을 읽다가 절을 탭한 뒤{' '}
                    <span className="material-icons-round align-middle text-[14px] text-brand">spellcheck</span>{' '}
                    버튼을 누르고
                    <br />
                    모르는 단어를 탭하면 여기에 모여요
                  </>
                }
                action={{ label: '성경 읽으러 가기', onClick: () => navigate('/bible') }}
              />
            ) : (
              <>
                {/* 히어로 — 몇 권에서 몇 개를 주웠는지 + 66권 막대 */}
                <section className="rounded-[24px] lg:rounded-[28px] bg-white dark:bg-card-dark border border-transparent dark:border-white/[0.06] px-5 py-5 lg:px-9 lg:py-8 space-y-5 lg:space-y-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0">
                      <p className="hidden lg:block text-[13.5px] font-medium text-gray-500 dark:text-white/50">
                        성경 · 내 단어장
                      </p>
                      <h2 className="mt-1 text-[22px] lg:text-[28px] font-extrabold tracking-[-0.02em] leading-[1.35] text-ink-strong">
                        {query ? (
                          <>
                            ‘{query}’ 찾은 단어 <span className="text-brand">{total}개</span>
                          </>
                        ) : (
                          <>
                            <span className="text-brand">{bookCounts.size}권</span>을 읽으며{' '}
                            <span className="text-brand">{total}개</span>의 단어를 주웠어요
                          </>
                        )}
                      </h2>
                    </div>
                    <label className="flex items-center gap-2 px-3.5 h-12 rounded-[14px] bg-gray-100 dark:bg-white/[0.06] focus-within:ring-2 focus-within:ring-[var(--brand-soft-strong)] lg:w-[280px] lg:shrink-0">
                      <span className="material-icons-round text-[20px] text-gray-400 dark:text-white/35" aria-hidden="true">search</span>
                      <input
                        type="search"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="단어·뜻 찾기"
                        aria-label="단어 검색"
                        className="flex-1 min-w-0 bg-transparent text-[15px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
                      />
                      {searchInput && (
                        <button
                          type="button"
                          onClick={() => setSearchInput('')}
                          className="text-gray-400 dark:text-white/35 hover:text-brand"
                          aria-label="검색어 지우기"
                        >
                          <span className="material-icons-round text-[18px]">close</span>
                        </button>
                      )}
                    </label>
                  </div>

                  {!query && (
                    <BookStrip
                      counts={bookCounts}
                      activeBook={selected?.book_number ?? null}
                      names={items}
                      onPick={jumpToBook}
                    />
                  )}
                </section>

                {/* 정렬·거르기 칩 */}
                <div className="flex flex-wrap gap-2" role="group" aria-label="단어 정렬">
                  {SORTS.map((s) => (
                    <Chip key={s.id} on={sort === s.id} onClick={() => setSort(s.id)}>
                      {s.label}
                    </Chip>
                  ))}
                  {memoCount > 0 && (
                    <Chip on={memoOnly} onClick={() => setMemoOnly((v) => !v)} pressed>
                      뜻 적은 단어 {memoCount}
                    </Chip>
                  )}
                </div>

                {ordered.length === 0 ? (
                  <div className="rounded-[22px] bg-white dark:bg-card-dark px-6 py-14 text-center">
                    <p className="text-[14.5px] font-semibold text-gray-600 dark:text-white/60">
                      {query ? '찾는 단어가 없어요' : '뜻을 적은 단어가 아직 없어요'}
                    </p>
                  </div>
                ) : (
                  <div className="lg:flex lg:items-start lg:gap-5">
                    {/* 목록 */}
                    <div className="space-y-5 lg:flex-1 lg:min-w-0">
                      {groups.map((g) => (
                        <section
                          key={g.key}
                          id={g.bookNumber ? `wb-book-${g.bookNumber}` : undefined}
                          className="scroll-mt-32 lg:scroll-mt-20"
                        >
                          {g.label && (
                            <div className="flex items-baseline gap-2 px-1 pb-2">
                              <h3 className="text-[17px] lg:text-[19px] font-extrabold text-ink-strong">{g.label}</h3>
                              <span className="text-[13.5px] font-bold text-brand tabular-nums">{g.items.length}개</span>
                            </div>
                          )}
                          <div className="rounded-[22px] bg-white dark:bg-card-dark border border-transparent dark:border-white/[0.06] p-1.5 space-y-0.5">
                            {g.items.map((item) => (
                              <WordRow
                                key={item.id}
                                item={item}
                                selected={selected?.id === item.id}
                                onOpen={() => openWord(item)}
                              />
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>

                    {/* 사전형 상세 (lg+) */}
                    <aside
                      ref={detailRef}
                      className="hidden lg:block lg:w-[400px] xl:w-[440px] lg:shrink-0 lg:sticky lg:top-[4.5rem] zoom-narrow-hide"
                      aria-label="단어 자세히"
                    >
                      {selected && (
                        <WordDetail
                          item={selected}
                          onEdit={() => setEditing({ item: selected, edit: true })}
                          onGo={() => goToVerse(selected)}
                        />
                      )}
                    </aside>
                  </div>
                )}

                {isFetchingNextPage && (
                  <p className="py-2 text-center text-[13px] text-gray-400 dark:text-white/35">나머지 단어를 불러오는 중...</p>
                )}
              </>
            )}
          </div>

          {/* 보기/수정/삭제 시트 */}
          {editing && (
            <WordNoteSheet
              verseId={editing.item.verse_id}
              verseReference={refOf(editing.item)}
              verseText={editing.item.text}
              initialWord={editing.item.word}
              charStart={editing.item.char_start}
              charEnd={editing.item.char_end}
              existing={editing.item}
              startInEdit={editing.edit}
              onClose={() => setEditing(null)}
            />
          )}
        </div>
      </div>

      <BibleBottomNav active="wordbook" />
    </div>
  )
}

/** 66권 막대 — 단어를 주운 권만 솟는다. 지금 보는 단어의 권은 진하게 */
const BookStrip = ({
  counts,
  activeBook,
  names,
  onPick,
}: {
  counts: Map<number, number>
  activeBook: number | null
  names: WordNoteWithVerse[]
  onPick: (bookNumber: number) => void
}) => {
  const nameOf = useMemo(() => {
    const m = new Map<number, string>()
    for (const it of names) m.set(it.book_number, it.book_name_ko)
    return m
  }, [names])
  return (
    <div>
      <div className="flex items-end gap-[2px] lg:gap-[3px] h-9">
        {Array.from({ length: 66 }, (_, i) => {
          const n = i + 1
          const c = counts.get(n) ?? 0
          if (!c) {
            return (
              <span
                key={n}
                aria-hidden="true"
                className="flex-1 min-w-0 h-[10px] rounded-[3px] bg-gray-200 dark:bg-white/10"
              />
            )
          }
          const on = activeBook === n
          return (
            <button
              key={n}
              type="button"
              onClick={() => onPick(n)}
              title={`${nameOf.get(n) ?? BOOK_ABBREV_KO[n]} ${c}개`}
              aria-label={`${nameOf.get(n) ?? BOOK_ABBREV_KO[n]} 단어 ${c}개로 가기`}
              className="flex-1 min-w-0 rounded-[3px] bg-brand transition-opacity hover:opacity-100"
              style={{ height: c >= 3 ? 36 : c === 2 ? 30 : 24, opacity: on ? 1 : 0.4 }}
            />
          )
        })}
      </div>
      <div className="mt-2 flex text-[12px] lg:text-[13px] text-gray-500 dark:text-white/45">
        <span style={{ flex: '39 1 0' }}>구약 39권</span>
        <span style={{ flex: '27 1 0' }} className="pl-1 border-l border-gray-300 dark:border-white/15">
          신약 27권
        </span>
      </div>
    </div>
  )
}

const Chip = ({
  on,
  onClick,
  pressed,
  children,
}: {
  on: boolean
  onClick: () => void
  /** 켜고 끄는 거르기 칩 */
  pressed?: boolean
  children: ReactNode
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={pressed ? on : undefined}
    aria-current={!pressed && on ? 'true' : undefined}
    className={`h-10 px-4 rounded-full text-[14px] transition-colors ${
      on
        ? 'bg-gray-900 text-white font-bold dark:bg-white dark:text-gray-900'
        : 'bg-white text-gray-600 font-medium hover:text-ink-strong dark:bg-white/[0.06] dark:text-white/65'
    }`}
  >
    {children}
  </button>
)

/** 본문 속 단어 강조 — row: 형광펜 밑줄 / detail: 칠한 칸 */
const VerseWithWord = ({ item, variant }: { item: WordNoteWithVerse; variant: 'row' | 'detail' }) => {
  const range = highlightRange(item)
  if (!range) return <>{item.text}</>
  const [s, e] = range
  return (
    <>
      {item.text.slice(0, s)}
      <mark
        className={
          variant === 'row'
            ? 'bg-[linear-gradient(transparent_60%,var(--brand-soft-strong)_60%)] text-brand font-bold'
            : 'bg-[var(--brand-soft-strong)] text-brand font-bold rounded-md px-1'
        }
      >
        {item.text.slice(s, e)}
      </mark>
      {item.text.slice(e)}
    </>
  )
}

const WordRow = ({
  item,
  selected,
  onOpen,
}: {
  item: WordNoteWithVerse
  selected: boolean
  onOpen: () => void
}) => {
  const summary = noteSummary(item.note)
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group w-full text-left rounded-[18px] px-4 py-3.5 lg:px-5 lg:py-4 border-2 transition-colors ${
        selected
          ? 'border-transparent lg:border-brand lg:bg-[var(--brand-soft)]'
          : 'border-transparent hover:bg-gray-50 dark:hover:bg-white/[0.04]'
      }`}
    >
      <span className="flex items-baseline gap-3 min-w-0">
        <span className="shrink-0 text-[17.5px] lg:text-[19px] font-extrabold tracking-[-0.01em] text-ink-strong">
          {item.word}
        </span>
        {summary && (
          <span className="min-w-0 flex-1 truncate text-[13.5px] text-gray-500 dark:text-white/50">{summary}</span>
        )}
      </span>
      <span className="mt-1.5 block font-serif-kr text-[15px] lg:text-[16px] leading-[1.8] text-gray-600 dark:text-white/65 line-clamp-2">
        <VerseWithWord item={item} variant="row" />
      </span>
      <span className="mt-1 block text-[12.5px] font-medium text-gray-500 dark:text-white/40">{refOf(item)}</span>
    </button>
  )
}

/** 사전형 상세 — 큰 명조 표제어, 뜻·메모, 말씀 속에서, 이어 읽기 */
const WordDetail = ({
  item,
  onEdit,
  onGo,
}: {
  item: WordNoteWithVerse
  onEdit: () => void
  onGo: () => void
}) => {
  const note = cleanNote(item.note)
  return (
    <div className="max-h-[calc(100vh-6rem)] overflow-y-auto rounded-[28px] bg-white dark:bg-card-dark border border-transparent dark:border-white/[0.06] shadow-[0_12px_32px_rgba(0,23,51,0.06)] dark:shadow-none px-8 pt-8 pb-7 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onGo}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[var(--brand-soft)] text-[13.5px] font-bold text-brand hover:bg-[var(--brand-soft-strong)] transition-colors"
        >
          <span className="material-icons-round text-[15px]" aria-hidden="true">menu_book</span>
          {refOf(item)}
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="w-11 h-11 rounded-xl inline-flex items-center justify-center bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-white/55 hover:text-brand transition-colors"
          aria-label={`${item.word} 수정 또는 삭제`}
          title="수정 · 삭제"
        >
          <span className="material-icons-round text-[18px]">edit</span>
        </button>
      </div>

      <h2 className="font-serif-kr text-[44px] xl:text-[50px] font-bold leading-[1.15] tracking-[-0.02em] text-ink-strong break-keep">
        {item.word}
      </h2>

      <div className="space-y-2">
        <p className="text-[12.5px] font-bold tracking-[0.04em] text-gray-500 dark:text-white/45">뜻 · 메모</p>
        {note ? (
          <p className="text-[16px] leading-[1.8] text-gray-700 dark:text-white/80 whitespace-pre-line break-words">
            {note}
          </p>
        ) : (
          <button
            type="button"
            onClick={onEdit}
            className="w-full text-left rounded-2xl border border-dashed border-gray-300 dark:border-white/15 px-4 py-3.5 text-[14.5px] text-gray-500 dark:text-white/50 hover:border-brand hover:text-brand transition-colors"
          >
            아직 뜻을 적지 않았어요. 눌러서 남겨 보세요.
          </button>
        )}
      </div>

      <div className="rounded-[20px] bg-gray-50 dark:bg-white/[0.04] px-5 py-4 space-y-2">
        <p className="text-[12.5px] font-bold tracking-[0.04em] text-gray-500 dark:text-white/45">말씀 속에서</p>
        <p className="font-serif-kr text-[16.5px] leading-[1.9] text-gray-700 dark:text-white/80">
          <VerseWithWord item={item} variant="detail" />
        </p>
      </div>

      <button
        type="button"
        onClick={onGo}
        className="w-full h-[52px] rounded-2xl bg-brand text-white text-[15.5px] font-bold inline-flex items-center justify-center gap-1.5 hover:brightness-105 transition"
      >
        본문에서 이어 읽기
        <span className="material-icons-round text-[18px]" aria-hidden="true">arrow_forward</span>
      </button>
    </div>
  )
}

const EmptyCard = ({
  icon,
  title,
  body,
  action,
}: {
  icon: string
  title: string
  body?: ReactNode
  action?: { label: string; onClick: () => void }
}) => (
  <div className="rounded-[24px] bg-white dark:bg-card-dark border border-transparent dark:border-white/[0.06] px-6 py-16 text-center">
    <span className="material-icons-round text-[44px] text-gray-300 dark:text-white/20" aria-hidden="true">{icon}</span>
    <p className="mt-3 text-[15px] font-semibold text-gray-700 dark:text-white/70">{title}</p>
    {body && <p className="mt-1.5 text-[13px] leading-[1.75] text-gray-500 dark:text-white/45">{body}</p>}
    {action && (
      <button
        type="button"
        onClick={action.onClick}
        className="mt-5 h-11 px-5 rounded-xl bg-brand text-white text-[14px] font-bold hover:brightness-105 transition"
      >
        {action.label}
      </button>
    )}
  </div>
)

export default WordbookPage
