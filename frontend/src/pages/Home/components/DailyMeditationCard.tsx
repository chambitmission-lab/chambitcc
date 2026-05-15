import { useNavigate } from 'react-router-dom'
import { useDailyMeditation } from '../../../hooks/useDailyMeditation'
import { getCurrentUser } from '../../../utils/auth'
import type { TimeOfDay } from '../../../types/meditation'
import './DailyMeditationCard.css'

const GREETINGS: Record<TimeOfDay, string> = {
  morning: '좋은 아침이에요',
  afternoon: '오늘 하루도 평안하시길',
  evening: '오늘 하루도 수고하셨어요',
}

const SEASON_LABELS: Record<string, string> = {
  advent: '대림절',
  lent: '사순절',
  easter: '부활절',
  epiphany: '주현절',
  ordinary: '연중',
}

const buildGreeting = (timeOfDay: TimeOfDay, fullName: string | null): string => {
  const base = GREETINGS[timeOfDay]
  if (!fullName) return base
  return `${fullName} 님, ${base}`
}

const DailyMeditationCard = () => {
  const navigate = useNavigate()
  const { data, isLoading, error } = useDailyMeditation()
  const { fullName } = getCurrentUser()

  if (error) {
    return null
  }

  if (isLoading || !data) {
    return (
      <section className="meditation-section">
        <div className="meditation-card is-loading" data-time="morning">
          <div className="meditation-skeleton sm" />
          <div className="meditation-skeleton lg" />
          <div className="meditation-skeleton" />
          <div className="meditation-skeleton" />
        </div>
      </section>
    )
  }

  const timeOfDay: TimeOfDay = data.context.time_of_day ?? 'morning'
  const season = data.season ?? 'ordinary'

  const handleContinueReading = () => {
    navigate(`/bible/${data.passage.book_number}/${data.passage.chapter}`)
  }

  return (
    <section className="meditation-section">
      <article
        className="meditation-card"
        data-time={timeOfDay}
        data-season={season}
      >
        <header className="meditation-header">
          <span className="meditation-greeting">
            {buildGreeting(timeOfDay, fullName)}
          </span>
          <span className="meditation-progress">
            <span className="material-icons-round" style={{ fontSize: 12, verticalAlign: 'middle', marginRight: 4 }}>
              auto_stories
            </span>
            {SEASON_LABELS[season] ?? ''} · 통독 {data.day_number}/{data.total_days}일
          </span>
        </header>

        <div className="meditation-passage">
          <span className="meditation-passage-label">{data.passage.label}</span>
          {data.passage.theme && (
            <span className="meditation-passage-theme">{data.passage.theme}</span>
          )}
        </div>

        <blockquote className="meditation-verse-quote">
          <p className="meditation-verse-text">"{data.verse.text}"</p>
          <cite className="meditation-verse-reference">— {data.verse.reference}</cite>
        </blockquote>

        <div className="meditation-question-block">
          <span className="meditation-question-icon" aria-hidden="true">💭</span>
          <p className="meditation-question-text">{data.meditation_question}</p>
        </div>

        <button
          type="button"
          className="meditation-cta"
          onClick={handleContinueReading}
        >
          <span className="material-icons-round">menu_book</span>
          본문 이어 읽기
        </button>
      </article>
    </section>
  )
}

export default DailyMeditationCard
