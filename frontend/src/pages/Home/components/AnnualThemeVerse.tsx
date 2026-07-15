import { useDailyVerse } from '../../../hooks/useDailyVerse'
import './AnnualThemeVerse.css'

// "에스겔 37장 5,10절" → "에스겔 37:5,10" (형식이 다르면 원문 그대로)
const compactReference = (ref: string) =>
  ref.replace(/(\d+)\s*장\s*/, '$1:').replace(/\s*절$/, '')

const AnnualThemeVerse = () => {
  const { data: verse, isLoading, error } = useDailyVerse()

  if (error?.message === 'NOT_FOUND' || (!isLoading && !verse)) {
    return null
  }

  return (
    <section className="annual-theme-section">
      <figure className="annual-theme-epigraph">
        <div className="annual-theme-ornament" aria-hidden>
          <span className="annual-theme-ornament-line" />
          <span className="material-icons-round annual-theme-ornament-icon">flare</span>
          <span className="annual-theme-ornament-line" />
        </div>

        {isLoading ? (
          <div className="annual-theme-skeleton" />
        ) : (
          <blockquote className="annual-theme-quote">
            <p className="annual-theme-text">{verse?.verse_text}</p>
          </blockquote>
        )}

        <figcaption className="annual-theme-meta">
          올해의 말씀
          {verse?.verse_reference && (
            <>
              <span className="annual-theme-meta-dot">·</span>
              {compactReference(verse.verse_reference)}
            </>
          )}
        </figcaption>
      </figure>
    </section>
  )
}

export default AnnualThemeVerse
