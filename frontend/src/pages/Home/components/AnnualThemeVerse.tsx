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
          <span className="material-icons-round">auto_stories</span>
        </div>

        <header className="annual-theme-header">
          <span className="annual-theme-label">올해의 말씀</span>
          {verse?.verse_reference && (
            <span className="annual-theme-reference">{verse.verse_reference}</span>
          )}
        </header>

        {isLoading ? (
          <div className="annual-theme-skeleton" />
        ) : (
          <blockquote className="annual-theme-quote">
            <span className="annual-theme-mark" aria-hidden>"</span>
            <p className="annual-theme-text">{verse?.verse_text}</p>
          </blockquote>
        )}
      </article>
    </section>
  )
}

export default AnnualThemeVerse
