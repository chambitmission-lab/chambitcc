import { useState } from 'react'
import type { FormEvent } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useBibleBooks, useBibleSearch } from '../../../hooks/useBible'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import type { BibleVerse } from '../../../types/bible'

/** 사진 카드에 올릴 말씀 — 같은 장의 연속된 절 묶음 */
export interface PickedVerse {
  text: string
  /** "요한복음 3:16" 또는 "요한복음 3:16-17" */
  refLabel: string
}

interface VersePickerSheetProps {
  onPick: (picked: PickedVerse) => void
  onClose: () => void
}

const buildRefLabel = (sel: BibleVerse[]) => {
  const nums = sel.map((v) => v.verse)
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  const range = min === max ? `${min}` : `${min}-${max}`
  return `${sel[0].book_name_ko} ${sel[0].chapter}:${range}`
}

const VersePickerSheet = ({ onPick, onClose }: VersePickerSheetProps) => {
  const { language } = useLanguage()
  const [keyword, setKeyword] = useState('')
  const [query, setQuery] = useState('')
  // 같은 장의 연속된 절만 담긴다 (toggleVerse에서 보장)
  const [selected, setSelected] = useState<BibleVerse[]>([])

  const { data: results, isLoading } = useBibleSearch(query)
  const { data: allBooks } = useBibleBooks()

  useModalBackButton(onClose)

  const texts = {
    ko: {
      title: '말씀 고르기',
      placeholder: '"요 3:16" 또는 "사랑"으로 검색',
      hint: '키워드나 "책 장"(예: 시 23)으로 검색한 뒤, 사진에 올릴 절을 선택하세요. 같은 장의 이어지는 절은 함께 담을 수 있어요.',
      suggested: ['사랑', '믿음', '소망', '위로', '평안', '감사', '은혜'],
      noResults: '검색 결과가 없습니다',
      bookOnly: '책 이름만으로는 절을 고를 수 없어요. "요한복음 3"처럼 장까지 검색해보세요.',
      confirm: '이 말씀으로 만들기',
      close: '닫기',
    },
    en: {
      title: 'Choose a Verse',
      placeholder: 'Try "John 3:16" or "love"',
      hint: 'Search by keyword or "book chapter", then tap verses to select. Consecutive verses in the same chapter can be combined.',
      suggested: ['love', 'faith', 'hope', 'comfort', 'peace', 'grace'],
      noResults: 'No results found',
      bookOnly: 'Search with a chapter (e.g. "John 3") to pick verses.',
      confirm: 'Use this verse',
      close: 'Close',
    },
  }
  const t = texts[language]

  const runSearch = (kw: string) => {
    const q = kw.trim()
    if (!q) return
    setKeyword(q)
    setQuery(q)
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    runSearch(keyword)
  }

  // 탭 한 번 → 선택, 이어지는 절 탭 → 범위 확장, 끝 절 다시 탭 → 제외.
  // 다른 장/떨어진 절을 탭하면 그 절 하나로 새로 시작한다.
  const toggleVerse = (v: BibleVerse) => {
    setSelected((prev) => {
      if (!prev.length) return [v]
      const sameChapter =
        prev[0].book_name_ko === v.book_name_ko && prev[0].chapter === v.chapter
      if (!sameChapter) return [v]
      const nums = prev.map((p) => p.verse)
      const min = Math.min(...nums)
      const max = Math.max(...nums)
      if (nums.includes(v.verse)) {
        if (v.verse === min || v.verse === max) return prev.filter((p) => p.verse !== v.verse)
        return [v] // 중간 절 탭 → 그 절만 남김
      }
      if (v.verse === max + 1 || v.verse === min - 1) {
        return [...prev, v].sort((a, b) => a.verse - b.verse)
      }
      return [v]
    })
  }

  const isSelected = (v: BibleVerse) =>
    selected.some(
      (s) => s.book_name_ko === v.book_name_ko && s.chapter === v.chapter && s.verse === v.verse
    )

  const handleConfirm = () => {
    if (!selected.length) return
    onPick({
      text: selected.map((s) => s.text.trim()).join(' '),
      refLabel: buildRefLabel(selected),
    })
  }

  const isBookOnlySearch = !!(
    results?.is_book_search && (results.books?.length || results.book)
  )
  // 검색 응답의 절 객체에는 책 이름이 없다:
  // 장 검색("창 1")은 응답 최상위 book_name_ko에서, 키워드 검색은 book_number를
  // 책 목록으로 되짚어 이름을 복원한다 (없으면 출처가 "3:4"처럼 잘려 보였음)
  const nameByNumber = new Map((allBooks ?? []).map((b) => [b.book_number, b.book_name_ko]))
  const verses = (results?.results ?? []).map((v) => ({
    ...v,
    book_name_ko:
      v.book_name_ko || results?.book_name_ko || nameByNumber.get(v.book_number ?? -1) || '',
  }))

  return (
    <div className="pv-sheet-overlay" onClick={onClose}>
      <div
        className="pv-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={t.title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pv-sheet__handle" aria-hidden="true" />
        <div className="pv-sheet__header">
          <h2 className="pv-sheet__title">{t.title}</h2>
          <button type="button" className="pv-sheet__close" aria-label={t.close} onClick={onClose}>
            <span className="material-icons-round">close</span>
          </button>
        </div>

        <form className="pv-sheet__search" onSubmit={handleSubmit}>
          <span className="material-icons-round pv-sheet__search-icon">search</span>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={t.placeholder}
            className="pv-sheet__search-input"
          />
        </form>

        <div className="pv-sheet__body">
          {!query && (
            <>
              <p className="pv-sheet__hint">{t.hint}</p>
              <div className="pv-sheet__chips">
                {t.suggested.map((kw) => (
                  <button key={kw} type="button" className="pv-chip" onClick={() => runSearch(kw)}>
                    {kw}
                  </button>
                ))}
              </div>
            </>
          )}

          {query && isLoading && (
            <div className="pv-sheet__loading">
              <span className="material-icons-round pv-spin">refresh</span>
            </div>
          )}

          {query && !isLoading && isBookOnlySearch && (
            <p className="pv-sheet__hint">{t.bookOnly}</p>
          )}

          {query && !isLoading && !isBookOnlySearch && verses.length === 0 && (
            <p className="pv-sheet__hint">{t.noResults}</p>
          )}

          {verses.length > 0 && (
            <div className="pv-sheet__list">
              {verses.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className={`pv-verse${isSelected(v) ? ' pv-verse--selected' : ''}`}
                  onClick={() => toggleVerse(v)}
                >
                  <span className="pv-verse__ref">
                    {v.book_name_ko} {v.chapter}:{v.verse}
                    {isSelected(v) && (
                      <span className="material-icons-round pv-verse__check">check_circle</span>
                    )}
                  </span>
                  <span className="pv-verse__text">{v.text}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {selected.length > 0 && (
          <div className="pv-sheet__footer">
            <button type="button" className="pv-confirm brand-gradient" onClick={handleConfirm}>
              {t.confirm}
              <span className="pv-confirm__ref">{buildRefLabel(selected)}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default VersePickerSheet
