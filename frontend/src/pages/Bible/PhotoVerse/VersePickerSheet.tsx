import { useState } from 'react'
import type { FormEvent } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useBibleBooks, useBibleSearch } from '../../../hooks/useBible'
import { useDailyVerse } from '../../../hooks/useDailyVerse'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { useNowMs } from '../../../hooks/useNowMs'
import type { BibleVerse } from '../../../types/bible'
import { RECOMMENDED, compactReference, getTodayRecommendedIndex } from './recommendedVerses'
import type { PickedVerse } from './recommendedVerses'
import { passageLabel, usePassageVerses } from './churchVerses'
import type { SermonPassage } from './churchVerses'

export type { PickedVerse }

interface VersePickerSheetProps {
  onPick: (picked: PickedVerse) => void
  onClose: () => void
  /** 주일 설교 본문 — 있으면 맨 위에 띄우고, 그 안에서 마음에 남은 절을 고른다 */
  sermon?: SermonPassage | null
  /** 설교 본문 목록을 펼친 채로 연다 (설교 화면·인트로에서 들어온 경우) */
  startInPassage?: boolean
}

const buildRefLabel = (sel: BibleVerse[]) => {
  const nums = sel.map((v) => v.verse)
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  const range = min === max ? `${min}` : `${min}-${max}`
  return `${sel[0].book_name_ko} ${sel[0].chapter}:${range}`
}

/** 설교 본문을 이만큼 이하로 짧으면 '본문 전체 담기'를 권한다 */
const WHOLE_PASSAGE_MAX = 4

const VersePickerSheet = ({ onPick, onClose, sermon, startInPassage = false }: VersePickerSheetProps) => {
  const { language } = useLanguage()
  const [keyword, setKeyword] = useState('')
  const [query, setQuery] = useState('')
  // 같은 장의 연속된 절만 담긴다 (toggleVerse에서 보장)
  const [selected, setSelected] = useState<BibleVerse[]>([])

  // 설교 본문 보기 — 검색 대신 본문 절 목록을 펼친다
  const [passageOpen, setPassageOpen] = useState(startInPassage && !!sermon)
  const passage = usePassageVerses(sermon?.ref, passageOpen)

  const { data: results, isLoading } = useBibleSearch(query)
  const { data: allBooks } = useBibleBooks()
  // 교회가 정한 올해의 표어 말씀 — 등록돼 있을 때만 맨 위에 띄운다
  const { data: themeVerse } = useDailyVerse()
  const themeText = themeVerse?.verse_text?.trim() ?? ''
  const themeRef = themeVerse?.verse_reference ? compactReference(themeVerse.verse_reference) : ''

  useModalBackButton(onClose)

  const texts = {
    ko: {
      title: '말씀 고르기',
      placeholder: '"요 3:16" 또는 "사랑"으로 검색',
      hint: '키워드나 "책 장"(예: 시 23)으로 검색한 뒤, 사진에 올릴 절을 선택하세요. 같은 장의 이어지는 절은 함께 담을 수 있어요.',
      suggested: ['사랑', '믿음', '소망', '위로', '평안', '감사', '은혜'],
      todayBadge: '오늘의 말씀',
      themeBadge: `${new Date().getFullYear()} 올해의 말씀`,
      recommendTitle: '이런 말씀은 어때요?',
      noResults: '검색 결과가 없습니다',
      bookOnly: '책 이름만으로는 절을 고를 수 없어요. "요한복음 3"처럼 장까지 검색해보세요.',
      confirm: '이 말씀으로 만들기',
      close: '닫기',
      sermonBadge: '설교 본문',
      sermonOpen: '본문에서 고르기',
      passageHint: '마음에 남은 절을 골라보세요. 이어지는 절은 함께 담을 수 있어요.',
      passageAll: '본문 전체 담기',
      passageBack: '다른 말씀 보기',
      passageLoading: '본문을 펼치는 중…',
      passageEmpty: '본문을 불러오지 못했어요. 검색으로 찾아보세요.',
    },
    en: {
      title: 'Choose a Verse',
      placeholder: 'Try "John 3:16" or "love"',
      hint: 'Search by keyword or "book chapter", then tap verses to select. Consecutive verses in the same chapter can be combined.',
      suggested: ['love', 'faith', 'hope', 'comfort', 'peace', 'grace'],
      todayBadge: "Today's Verse",
      themeBadge: `${new Date().getFullYear()} Theme Verse`,
      recommendTitle: 'How about these?',
      noResults: 'No results found',
      bookOnly: 'Search with a chapter (e.g. "John 3") to pick verses.',
      confirm: 'Use this verse',
      close: 'Close',
      sermonBadge: 'Sermon passage',
      sermonOpen: 'Pick from passage',
      passageHint: 'Pick the verse that stayed with you. Consecutive verses can be combined.',
      passageAll: 'Use whole passage',
      passageBack: 'Other verses',
      passageLoading: 'Opening the passage…',
      passageEmpty: "Couldn't load the passage. Try searching instead.",
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
      parts: selected.map((s) => ({ verse: s.verse, text: s.text.trim() })),
    })
  }

  // 하루 단위(한국 시간 자정)로 순환하는 오늘의 말씀 인덱스
  const todayIndex = getTodayRecommendedIndex(useNowMs())

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
          {/* 설교 본문 — 절 목록에서 마음에 남은 절을 고른다 */}
          {!query && passageOpen && sermon && (
            <>
              <div className="pv-passage-head">
                <button type="button" className="pv-passage-back" onClick={() => setPassageOpen(false)}>
                  <span className="material-icons-round text-[18px]">chevron_left</span>
                  {t.passageBack}
                </button>
                {passage.verses.length > 1 && passage.verses.length <= WHOLE_PASSAGE_MAX && (
                  <button type="button" className="pv-chip" onClick={() => setSelected(passage.verses)}>
                    {t.passageAll}
                  </button>
                )}
              </div>
              <p className="pv-passage-title">
                <span className="pv-today__badge">
                  <span className="material-icons-round text-[13px]">church</span>
                  {sermon.badge ?? t.sermonBadge}
                </span>
                <span className="pv-passage-title__ref">
                  {passageLabel(sermon.ref)}
                  {sermon.title && <> · 「{sermon.title}」</>}
                </span>
              </p>
              <p className="pv-sheet__hint">{t.passageHint}</p>
              {passage.isLoading ? (
                <div className="pv-sheet__loading">
                  <span className="material-icons-round pv-spin">refresh</span>
                </div>
              ) : passage.verses.length === 0 ? (
                <p className="pv-sheet__hint">{t.passageEmpty}</p>
              ) : (
                <div className="pv-sheet__list">
                  {passage.verses.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      className={`pv-verse${isSelected(v) ? ' pv-verse--selected' : ''}`}
                      onClick={() => toggleVerse(v)}
                    >
                      <span className="pv-verse__ref">
                        {v.book_name_ko} {v.chapter}:{v.verse_label || v.verse}
                        {isSelected(v) && (
                          <span className="material-icons-round pv-verse__check">check_circle</span>
                        )}
                      </span>
                      <span className="pv-verse__text">{v.text}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {!query && !passageOpen && (
            <>
              <p className="pv-sheet__hint">{t.hint}</p>
              <div className="pv-sheet__chips">
                {t.suggested.map((kw) => (
                  <button key={kw} type="button" className="pv-chip" onClick={() => runSearch(kw)}>
                    {kw}
                  </button>
                ))}
              </div>

              {/* 주일 설교 본문 — 이번 주 온 교회가 함께 붙잡는 말씀이라 맨 위 */}
              {sermon && (
                <button
                  type="button"
                  className="pv-today pv-today--theme pv-today--sermon"
                  onClick={() => setPassageOpen(true)}
                >
                  <span className="pv-today__badge">
                    <span className="material-icons-round text-[13px]">church</span>
                    {sermon.badge ?? t.sermonBadge}
                  </span>
                  {sermon.title && <span className="pv-today__text">「{sermon.title}」</span>}
                  <span className="pv-today__ref">
                    {passageLabel(sermon.ref)} · {t.sermonOpen}
                    <span className="material-icons-round text-[15px] align-[-3px]">chevron_right</span>
                  </span>
                </button>
              )}

              {/* 올해의 말씀 — 교회 표어. 한 해 동안 가장 많이 나눌 말씀이라 맨 위 */}
              {themeText && (
                <button
                  type="button"
                  className="pv-today pv-today--theme"
                  onClick={() => onPick({ text: themeText, refLabel: themeRef || t.themeBadge })}
                >
                  <span className="pv-today__badge">
                    <span className="material-icons-round text-[13px]">workspace_premium</span>
                    {t.themeBadge}
                  </span>
                  <span className="pv-today__text">{themeText}</span>
                  {themeRef && <span className="pv-today__ref">{themeRef}</span>}
                </button>
              )}

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
