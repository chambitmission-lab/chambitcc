import { useNavigate } from 'react-router-dom'
import { useDailyVerse } from '../../../hooks/useDailyVerse'
import './AnnualThemeVerse.css'

// "에스겔 37장 5,10절" → "에스겔 37:5,10" (형식이 다르면 원문 그대로)
const compactReference = (ref: string) =>
  ref.replace(/(\d+)\s*장\s*/, '$1:').replace(/\s*절$/, '')

// 핵심 어절 형광펜 — 마지막 어절(문장의 결론, "살아나리라!")을 스토리 텍스트 배경 스타일로 감싼다.
// 어절이 하나뿐이면 전체를 감싼다.
const splitHighlight = (text: string): { head: string; mark: string } => {
  const trimmed = text.trim()
  const idx = trimmed.lastIndexOf(' ')
  if (idx < 0) return { head: '', mark: trimmed }
  return { head: trimmed.slice(0, idx + 1), mark: trimmed.slice(idx + 1) }
}

const AnnualThemeVerse = () => {
  const navigate = useNavigate()
  const { data: verse, isLoading, error } = useDailyVerse()

  if (error?.message === 'NOT_FOUND' || (!isLoading && !verse)) {
    return null
  }

  const ref = verse?.verse_reference ? compactReference(verse.verse_reference) : ''
  const { head, mark } = verse?.verse_text ? splitHighlight(verse.verse_text) : { head: '', mark: '' }

  // 말씀 카드 만들기 — 이 구절을 미리 실어 사진 카드 화면으로 (인스타 스토리·카톡 공유 유도)
  const openVerseCard = () => {
    if (!verse?.verse_text) return
    navigate('/bible/photo-verse', {
      state: { presetVerse: { text: verse.verse_text, refLabel: ref || '올해의 말씀' } },
    })
  }

  return (
    <section className="annual-theme-section">
      {/* 인스타 스토리 문법: 상단 세그먼트 바 → 헤더 라인 → 가운데 큰 타이포 → 하단 액션 행 */}
      <figure className="story-card">
        <span className="story-card__blob story-card__blob--a" aria-hidden />
        <span className="story-card__blob story-card__blob--b" aria-hidden />
        <span className="story-card__sheen" aria-hidden />

        <div className="story-card__progress" aria-hidden>
          <span className="story-card__segment" />
        </div>

        <header className="story-card__header">
          <span className="story-card__avatar" aria-hidden>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none" />
              <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
            </svg>
          </span>
          <span className="story-card__who">참빛교회</span>
          <span className="story-card__dot" aria-hidden />
          <span className="story-card__label">올해의 말씀</span>
        </header>

        {isLoading ? (
          <div className="story-card__skeleton" aria-hidden>
            <span />
            <span />
          </div>
        ) : (
          <blockquote className="story-card__quote">
            <p className="story-card__text">
              {head}
              <mark className="story-card__mark">{mark}</mark>
            </p>
          </blockquote>
        )}

        <figcaption className="story-card__footer">
          <span className="story-card__ref">{ref}</span>
          {!isLoading && verse?.verse_text && (
            <button
              type="button"
              onClick={openVerseCard}
              className="story-card__share"
              aria-label="말씀 카드 만들어 공유하기"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 3v12" />
                <path d="M7.5 7.5L12 3l4.5 4.5" />
                <path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
              </svg>
              말씀 카드로 공유
            </button>
          )}
        </figcaption>
      </figure>
    </section>
  )
}

export default AnnualThemeVerse
