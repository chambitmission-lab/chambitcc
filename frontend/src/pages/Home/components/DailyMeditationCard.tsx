import { useNavigate } from 'react-router-dom'
import { useDailyMeditation } from '../../../hooks/useDailyMeditation'
import { getCurrentUser } from '../../../utils/auth'
import { showToast } from '../../../utils/toast'
import type { TimeOfDay } from '../../../types/meditation'
import heroMorning from '../../../assets/hero/morning.jpg'
import heroAfternoon from '../../../assets/hero/afternoon.jpg'
import heroEvening from '../../../assets/hero/evening.jpg'
import './DailyMeditationCard.css'

const GREETINGS: Record<TimeOfDay, string> = {
  morning: '좋은 아침이에요',
  afternoon: '오늘 하루도 평안하시길',
  evening: '오늘 하루도 수고하셨어요',
}

/* 시간대별 히어로 — 이미지·이모지·헤드라인이 함께 바뀌며 분위기를 만든다 */
const HERO_IMAGES: Record<TimeOfDay, string> = {
  morning: heroMorning,
  afternoon: heroAfternoon,
  evening: heroEvening,
}

const HERO_EMOJI: Record<TimeOfDay, string> = {
  morning: '☀️',
  afternoon: '🌤️',
  evening: '🌙',
}

const HERO_HEADLINES: Record<TimeOfDay, [string, string]> = {
  morning: ['오늘도 말씀과 함께', '빛나는 하루 보내세요!'],
  afternoon: ['잠시 멈추어', '말씀 안에서 쉬어가세요'],
  evening: ['오늘 하루의 끝을', '말씀으로 마무리해요'],
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

interface DailyMeditationCardProps {
  /** [나의 묵상 나누기] 버튼 — 기도/묵상 작성기를 여는 콜백 (없으면 버튼 미노출) */
  onWriteMeditation?: () => void
}

const DailyMeditationCard = ({ onWriteMeditation }: DailyMeditationCardProps) => {
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
  const progressPercent = Math.min(
    100,
    Math.round((data.day_number / Math.max(1, data.total_days)) * 100),
  )

  const handleContinueReading = () => {
    navigate(`/bible/${data.passage.book_number}/${data.passage.chapter}`)
  }

  const handleShare = async () => {
    const body =
      `📖 ${data.passage.label}${data.passage.theme ? ` · ${data.passage.theme}` : ''}\n\n` +
      `"${data.verse.text}"\n— ${data.verse.reference}\n\n` +
      `💭 ${data.meditation_question}\n\n` +
      `— 참빛교회 오늘의 묵상`
    try {
      if (navigator.share) {
        await navigator.share({ title: data.verse.reference, text: body })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(body)
        showToast('오늘의 말씀을 복사했어요', 'success')
      } else {
        showToast('이 브라우저는 공유를 지원하지 않아요', 'info')
      }
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return
      showToast('공유 중 문제가 발생했어요', 'error')
    }
  }

  return (
    <section className="meditation-section">
      <article
        className="meditation-card"
        data-time={timeOfDay}
        data-season={season}
      >
        {/* 시간대별 히어로 — 배경 이미지 위에 인사말 + 헤드라인 */}
        <div
          className="meditation-hero"
          style={{ backgroundImage: `url(${HERO_IMAGES[timeOfDay]})` }}
        >
          <div className="meditation-hero-overlay" aria-hidden />
          <div className="meditation-hero-text">
            <p className="meditation-hero-greeting">
              {buildGreeting(timeOfDay, fullName)} {HERO_EMOJI[timeOfDay]}
            </p>
            <h2 className="meditation-hero-headline">
              {HERO_HEADLINES[timeOfDay][0]}
              <br />
              {HERO_HEADLINES[timeOfDay][1]}
            </h2>
          </div>
        </div>

        <div className="meditation-body">
        <header className="meditation-meta-row">
          <div className="meditation-day-tags">
            <span className="meditation-season-tag" data-season={season}>
              {SEASON_LABELS[season] ?? '연중'}
            </span>
            <span className="meditation-day-tag">
              <span className="material-icons-round" aria-hidden>auto_stories</span>
              {data.day_number}/{data.total_days}일
              <span className="meditation-day-bar" aria-hidden>
                <span
                  className="meditation-day-bar-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </span>
            </span>
          </div>
          <button
            type="button"
            className="meditation-share-btn"
            onClick={handleShare}
            aria-label="오늘의 말씀 공유하기"
          >
            <span className="material-icons-round">ios_share</span>
          </button>
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
          <span className="meditation-question-label">
            <span aria-hidden>💭</span> 오늘의 질문
          </span>
          <p className="meditation-question-text">{data.meditation_question}</p>
        </div>

        <div className="meditation-actions">
          <button
            type="button"
            className="meditation-cta is-primary"
            onClick={handleContinueReading}
          >
            <span className="material-icons-round">menu_book</span>
            본문 이어 읽기
          </button>
          {onWriteMeditation && (
            <button
              type="button"
              className="meditation-cta"
              onClick={onWriteMeditation}
            >
              <span className="material-icons-round">edit_note</span>
              나의 묵상 나누기
            </button>
          )}
        </div>
        </div>
      </article>
    </section>
  )
}

export default DailyMeditationCard
