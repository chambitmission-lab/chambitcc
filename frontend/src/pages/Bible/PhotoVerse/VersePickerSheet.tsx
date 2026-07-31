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

// 검색 없이 한 번에 고를 수 있는 애송 성구 (개역개정) — 하루 단위로 "오늘의 말씀"이 바뀐다
const RECOMMENDED: PickedVerse[] = [
  { refLabel: '시편 23:1', text: '여호와는 나의 목자시니 내게 부족함이 없으리로다' },
  { refLabel: '요한복음 3:16', text: '하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 그를 믿는 자마다 멸망하지 않고 영생을 얻게 하려 하심이라' },
  { refLabel: '빌립보서 4:13', text: '내게 능력 주시는 자 안에서 내가 모든 것을 할 수 있느니라' },
  { refLabel: '이사야 41:10', text: '두려워하지 말라 내가 너와 함께 함이라 놀라지 말라 나는 네 하나님이 됨이라 내가 너를 굳세게 하리라 참으로 너를 도와주리라 참으로 나의 의로운 오른손으로 너를 붙들리라' },
  { refLabel: '마태복음 11:28', text: '수고하고 무거운 짐 진 자들아 다 내게로 오라 내가 너희를 쉬게 하리라' },
  { refLabel: '잠언 3:5', text: '너는 마음을 다하여 여호와를 신뢰하고 네 명철을 의지하지 말라' },
  { refLabel: '예레미야 29:11', text: '여호와의 말씀이니라 너희를 향한 나의 생각을 내가 아나니 평안이요 재앙이 아니니라 너희에게 미래와 희망을 주는 것이니라' },
  { refLabel: '시편 121:1-2', text: '내가 산을 향하여 눈을 들리라 나의 도움이 어디서 올까 나의 도움은 천지를 지으신 여호와에게서로다' },
  { refLabel: '데살로니가전서 5:16-18', text: '항상 기뻐하라 쉬지 말고 기도하라 범사에 감사하라 이는 그리스도 예수 안에서 너희를 향하신 하나님의 뜻이니라' },
  { refLabel: '여호수아 1:9', text: '내가 네게 명령한 것이 아니냐 강하고 담대하라 두려워하지 말며 놀라지 말라 네가 어디로 가든지 네 하나님 여호와가 너와 함께 하느니라' },
]

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
      todayBadge: '오늘의 말씀',
      recommendTitle: '이런 말씀은 어때요?',
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
      todayBadge: "Today's Verse",
      recommendTitle: 'How about these?',
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

  // 하루 단위로 순환하는 오늘의 말씀 인덱스
  const todayIndex = Math.floor(Date.now() / 86_400_000) % RECOMMENDED.length

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

              {/* 오늘의 말씀 — 날짜 기준으로 하나를 골라 맨 위에 띄운다 */}
              <button
                type="button"
                className="pv-today"
                onClick={() => onPick(RECOMMENDED[todayIndex])}
              >
                <span className="pv-today__badge">
                  <span className="material-icons-round text-[13px]">auto_awesome</span>
                  {t.todayBadge}
                </span>
                <span className="pv-today__text">{RECOMMENDED[todayIndex].text}</span>
                <span className="pv-today__ref">{RECOMMENDED[todayIndex].refLabel}</span>
              </button>

              <h3 className="pv-sheet__section">{t.recommendTitle}</h3>
              <div className="pv-sheet__list">
                {RECOMMENDED.filter((_, i) => i !== todayIndex).map((r) => (
                  <button
                    key={r.refLabel}
                    type="button"
                    className="pv-verse"
                    onClick={() => onPick(r)}
                  >
                    <span className="pv-verse__ref">{r.refLabel}</span>
                    <span className="pv-verse__text">{r.text}</span>
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
