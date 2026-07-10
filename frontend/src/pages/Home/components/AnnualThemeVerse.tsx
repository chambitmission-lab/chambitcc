import { useDailyVerse } from '../../../hooks/useDailyVerse'
import './AnnualThemeVerse.css'

const AnnualThemeVerse = () => {
  const { data: verse, isLoading, error } = useDailyVerse()

  if (error?.message === 'NOT_FOUND' || (!isLoading && !verse)) {
    return null
  }

  return (
    <section className="annual-theme-section">
      <article className="annual-theme-card">
        <div className="annual-theme-emblem" aria-hidden>
          <span className="material-icons-round">flare</span>
        </div>

        <div className="annual-theme-body">
          {isLoading ? (
            <div className="annual-theme-skeleton" />
          ) : (
            <blockquote className="annual-theme-quote">
              <p className="annual-theme-text">{verse?.verse_text}</p>
            </blockquote>
          )}

          <div className="annual-theme-meta">
            <span className="annual-theme-label">올해의 말씀</span>
            {verse?.verse_reference && (
              <span className="annual-theme-reference">{verse.verse_reference}</span>
            )}
          </div>
        </div>
      </article>
    </section>
  )
}

export default AnnualThemeVerse
