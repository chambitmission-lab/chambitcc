import { useNavigate } from 'react-router-dom'
import { useSituationVerses } from '../../../../hooks/useSituation'
import type { SituationMatch } from './situationMatch'

// 마음으로 찾기 — "요즘 너무 불안해요"처럼 마음을 적으면 상황별 성구(관리자 큐레이션)를 먼저 건넨다.
// AI 를 쓰지 않는다: 고르는 규칙은 situationMatch.ts.

const SearchMindAnswer = ({
  match,
  onOpenVerse,
}: {
  match: SituationMatch
  onOpenVerse: (book: number, chapter: number, verse: number) => void
}) => {
  const navigate = useNavigate()
  const { category, sentence } = match
  const { data, isLoading } = useSituationVerses(category.id)
  const verses = (data?.verses ?? []).slice(0, sentence ? 3 : 2)

  return (
    <section
      className={`search-mind${sentence ? ' search-mind--lead' : ''}`}
      aria-label={`${category.name} 말씀`}
    >
      <div className="search-mind__head">
        <span className="search-mind__icon material-icons-round" aria-hidden="true">{category.icon}</span>
        <div className="min-w-0">
          <p className="search-mind__eyebrow">마음에 닿는 말씀</p>
          <h3 className="search-mind__title">{category.name} 붙드는 말씀</h3>
        </div>
      </div>
      {isLoading ? (
        <div className="search-mind__skeleton" aria-hidden="true">
          <i />
          <i />
        </div>
      ) : (
        <div className="search-mind__list">
          {verses.map(v => (
            <button
              key={v.id}
              type="button"
              className="search-mind__verse"
              onClick={() => onOpenVerse(v.book_number, v.chapter, v.verse)}
            >
              <span className="search-mind__ref">
                {v.book_name_ko} {v.chapter}:{v.verse}
              </span>
              <span className="search-mind__text">{v.text}</span>
              {v.message && <span className="search-mind__msg">{v.message}</span>}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        className="search-mind__all"
        onClick={() => navigate(`/bible/situation?c=${category.id}`)}
      >
        ‘{category.name}’ 말씀 {category.verse_count}개 모두 보기
        <span className="material-icons-round" aria-hidden="true">chevron_right</span>
      </button>
    </section>
  )
}

export default SearchMindAnswer
