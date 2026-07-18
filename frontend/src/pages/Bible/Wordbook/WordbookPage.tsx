// 내 단어장 (/bible/wordbook)
// 성경을 읽다가 체크한 모르는 단어들을 모아 보는 페이지.
// 단어·뜻 검색, 무한 목록, 카드 탭으로 수정/삭제, 출처 구절 딥링크 제공.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMyWordNotes } from '../../../hooks/useBibleWordNote'
import type { WordNoteWithVerse } from '../../../api/bibleWordNote'
import { isAuthenticated } from '../../../utils/auth'
import BibleBottomNav from '../../../components/bible/BibleBottomNav'
import WordNoteSheet from '../components/WordNoteSheet'

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

  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useMyWordNotes(query || undefined, loggedIn)

  const items = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  )
  const total = data?.pages[0]?.total ?? 0

  // 수정/삭제 시트
  const [editing, setEditing] = useState<WordNoteWithVerse | null>(null)

  const goToVerse = (item: WordNoteWithVerse) => {
    navigate(`/bible/${item.book_number}/${item.chapter}?verse=${item.verse}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark border-x border-border-light dark:border-border-dark min-h-screen pb-bottomnav-safe">
        {/* 헤더 */}
        <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center gap-2">
          <button
            onClick={() => navigate('/bible')}
            className="flex items-center gap-1.5 text-gray-600 dark:text-white/70 hover:text-brand transition-colors"
            aria-label="성경 공부로"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-sm font-semibold">성경</span>
          </button>
          <h1 className="text-base font-bold tracking-[-0.015em] text-gray-900 dark:text-white mx-auto pr-10">
            내 단어장
          </h1>
        </div>

        {!loggedIn ? (
          <div className="px-6 py-20 text-center">
            <span className="material-icons-round text-[44px] text-gray-300 dark:text-white/20">lock</span>
            <p className="mt-3 text-[14.5px] font-semibold text-gray-600 dark:text-white/60">
              로그인하면 나만의 성경 단어장을 만들 수 있어요
            </p>
          </div>
        ) : (
          <>
            {/* 검색 + 개수 */}
            <div className="px-4 pt-4 pb-1">
              <div className="flex items-center gap-2 px-3.5 h-11 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] focus-within:border-brand transition-colors">
                <span className="material-icons-round text-[20px] text-gray-400 dark:text-white/35">search</span>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="단어·뜻 검색"
                  className="flex-1 min-w-0 bg-transparent text-[14.5px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none"
                />
                {searchInput && (
                  <button
                    onClick={() => setSearchInput('')}
                    className="text-gray-400 dark:text-white/35 hover:text-brand"
                    aria-label="검색어 지우기"
                  >
                    <span className="material-icons-round text-[18px]">close</span>
                  </button>
                )}
              </div>
              {total > 0 && (
                <p className="mt-2 px-1 text-[12px] text-gray-500 dark:text-white/45">
                  모은 단어 <span className="font-bold text-brand">{total}</span>개
                </p>
              )}
            </div>

            {/* 목록 */}
            <div className="px-4 py-3 space-y-2.5">
              {isLoading ? (
                <div className="py-16 text-center text-gray-400 dark:text-white/35 text-[13.5px]">
                  단어장을 불러오는 중...
                </div>
              ) : items.length === 0 ? (
                <div className="px-2 py-16 text-center">
                  <span className="material-icons-round text-[44px] text-gray-300 dark:text-white/20">spellcheck</span>
                  <p className="mt-3 text-[14.5px] font-semibold text-gray-600 dark:text-white/60">
                    {query ? '검색 결과가 없어요' : '아직 모은 단어가 없어요'}
                  </p>
                  {!query && (
                    <p className="mt-1.5 text-[12.5px] leading-[1.7] text-gray-400 dark:text-white/40">
                      성경을 읽다가 절을 탭한 뒤{' '}
                      <span className="material-icons-round align-middle text-[14px] text-brand">spellcheck</span>{' '}
                      버튼을 누르고
                      <br />
                      모르는 단어를 탭하면 여기에 모여요
                    </p>
                  )}
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] px-4 py-3.5"
                  >
                    {/* 단어 + 출처 */}
                    <div className="flex items-start gap-2">
                      <button
                        onClick={() => setEditing(item)}
                        className="min-w-0 flex-1 text-left"
                        title="뜻 보기 · 수정"
                      >
                        <p className="text-[16.5px] font-bold text-gray-900 dark:text-white tracking-[-0.01em]">
                          {item.word}
                        </p>
                        {item.note && (
                          <p className="mt-1 text-[13.5px] leading-[1.65] text-gray-600 dark:text-white/65 whitespace-pre-wrap break-words">
                            {item.note}
                          </p>
                        )}
                      </button>
                      <button
                        onClick={() => goToVerse(item)}
                        className="shrink-0 inline-flex items-center gap-1 px-2.5 h-7 rounded-full bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] text-[11.5px] font-bold text-brand hover:shadow-[0_2px_10px_var(--brand-glow)] transition-shadow"
                        title="말씀으로 이동"
                      >
                        <span className="material-icons-round text-[13px]">menu_book</span>
                        {item.book_name_ko} {item.chapter}:{item.verse}
                      </button>
                      {/* 수정/삭제 진입점 — 단어 영역 탭과 같은 시트지만,
                          눈에 보이는 버튼이 없으면 편집 가능하다는 걸 모른다 */}
                      <button
                        onClick={() => setEditing(item)}
                        className="shrink-0 w-7 h-7 rounded-full inline-flex items-center justify-center text-gray-400 dark:text-white/40 hover:text-brand hover:bg-[var(--brand-soft)] transition-colors"
                        title="수정 · 삭제"
                        aria-label={`${item.word} 수정 또는 삭제`}
                      >
                        <span className="material-icons-round text-[16px]">edit</span>
                      </button>
                    </div>

                    {/* 출처 구절 미리보기 — 단어 강조 */}
                    <button
                      onClick={() => goToVerse(item)}
                      className="mt-2 w-full text-left text-[12.5px] leading-[1.65] text-gray-400 dark:text-white/40 line-clamp-2"
                    >
                      {highlightWord(item)}
                    </button>
                  </div>
                ))
              )}

              {/* 더 보기 */}
              {hasNextPage && (
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="w-full h-11 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[13.5px] font-semibold text-gray-600 dark:text-white/65 hover:border-brand hover:text-brand transition-colors disabled:opacity-50"
                >
                  {isFetchingNextPage ? '불러오는 중...' : '더 보기'}
                </button>
              )}
            </div>
          </>
        )}

        {/* 수정/삭제 시트 (본문 미리보기·단어 강조 포함) */}
        {editing && (
          <WordNoteSheet
            verseId={editing.verse_id}
            verseReference={`${editing.book_name_ko} ${editing.chapter}:${editing.verse}`}
            verseText={editing.text}
            initialWord={editing.word}
            charStart={editing.char_start}
            charEnd={editing.char_end}
            existing={editing}
            onClose={() => setEditing(null)}
          />
        )}
      </div>

      <BibleBottomNav active="wordbook" />
    </div>
  )
}

/** 구절 미리보기에서 저장한 단어를 강조.
 * 저장된 위치(char 범위)가 본문과 맞으면 그 자리를, 아니면 단어 검색으로 fallback —
 * 같은 단어가 절에 두 번 나올 때 indexOf만 쓰면 엉뚱한 쪽이 칠해진다. */
const highlightWord = (item: WordNoteWithVerse) => {
  const { text, word, char_start, char_end } = item
  let start = -1
  let end = -1
  if (
    char_start != null &&
    char_end != null &&
    char_start >= 0 &&
    char_end > char_start &&
    char_end <= text.length
  ) {
    const slice = text.slice(char_start, char_end)
    if (slice.includes(word) || word.includes(slice)) {
      start = char_start
      end = char_end
    }
  }
  if (start < 0) {
    const idx = text.indexOf(word)
    if (idx < 0) return text
    start = idx
    end = idx + word.length
  }
  return (
    <>
      {text.slice(0, start)}
      <span className="font-bold text-brand">{text.slice(start, end)}</span>
      {text.slice(end)}
    </>
  )
}

export default WordbookPage
