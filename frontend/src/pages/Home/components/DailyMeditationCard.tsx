import { useNavigate } from 'react-router-dom'
import { useDailyMeditation } from '../../../hooks/useDailyMeditation'
import { useAuth } from '../../../hooks/useAuth'
import { useChapterReadStatus } from '../../../hooks/useBibleReading'
import { useCurrentWeather } from '../../../hooks/useWeather'
import { useLanguage } from '../../../contexts/LanguageContext'
import type { Language } from '../../../locales'
import { getCurrentUser } from '../../../utils/auth'
import { showToast } from '../../../utils/toast'
import {
  dayOfYear,
  getCurrentSeason,
  getSeasonSegments,
  type ChurchSeason,
} from '../../../utils/churchCalendar'
import type { TimeOfDay } from '../../../types/meditation'
import heroMorning from '../../../assets/hero/morning.jpg'
import heroAfternoon from '../../../assets/hero/afternoon.jpg'
import heroEvening from '../../../assets/hero/evening.jpg'
import './DailyMeditationCard.css'

const GREETING_KEYS = {
  morning: 'homeGreetingMorning',
  afternoon: 'homeGreetingAfternoon',
  evening: 'homeGreetingEvening',
} as const satisfies Record<TimeOfDay, string>

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

const HEADLINE_KEYS = {
  morning: ['homeHeadlineMorning1', 'homeHeadlineMorning2'],
  afternoon: ['homeHeadlineAfternoon1', 'homeHeadlineAfternoon2'],
  evening: ['homeHeadlineEvening1', 'homeHeadlineEvening2'],
} as const satisfies Record<TimeOfDay, readonly [string, string]>

const SEASON_LABEL_KEYS = {
  advent: 'homeSeasonAdvent',
  christmas: 'homeSeasonChristmas',
  lent: 'homeSeasonLent',
  easter: 'homeSeasonEaster',
  epiphany: 'homeSeasonEpiphany',
  ordinary: 'homeSeasonOrdinary',
} as const satisfies Record<ChurchSeason, string>

/* 절기 리본 탭 시 보여줄 한 줄 의미 — 모바일에서 절기를 배우는 통로 */
const SEASON_MEANING_KEYS = {
  advent: 'homeSeasonMeaningAdvent',
  christmas: 'homeSeasonMeaningChristmas',
  epiphany: 'homeSeasonMeaningEpiphany',
  lent: 'homeSeasonMeaningLent',
  easter: 'homeSeasonMeaningEaster',
  ordinary: 'homeSeasonMeaningOrdinary',
} as const satisfies Record<ChurchSeason, string>

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

const buildGreeting = (base: string, fullName: string | null, language: Language): string => {
  if (!fullName) return base
  return language === 'en' ? `${base}, ${fullName}` : `${fullName} 님, ${base}`
}

/* 예상 소요시간 — 절당 약 10초(묵독 기준) 가정, 최소 1분 */
const READ_SECONDS_PER_VERSE = 10

const estimateMinutes = (verseCount: number): number =>
  Math.max(1, Math.ceil((verseCount * READ_SECONDS_PER_VERSE) / 60))

interface DailyMeditationCardProps {
  /** [나의 묵상 나누기] 버튼 — 기도/묵상 작성기를 여는 콜백 (없으면 버튼 미노출) */
  onWriteMeditation?: () => void
}

const DailyMeditationCard = ({ onWriteMeditation }: DailyMeditationCardProps) => {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const { data, isLoading, error } = useDailyMeditation()
  // 실황 날씨(이모지+기온) — 못 불러오면 null: 칩을 숨기고 인사말 이모지로 폴백
  const weather = useCurrentWeather()
  const { fullName } = getCurrentUser()
  const { isLoggedIn } = useAuth()

  // 오늘 본문(장)의 절 단위 읽음 상태 — 비로그인/로딩 중엔 미조회
  const { data: readStatus } = useChapterReadStatus(
    data?.passage.book_number ?? 0,
    data?.passage.chapter ?? 0,
    isLoggedIn(),
  )

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

  /* ── 교회력 절기 리본 ──
   * 백엔드 plan_day.season은 시드 플레이스홀더(전부 epiphany)라
   * 절기 태그·리본 모두 프론트 계산값(churchCalendar)을 쓴다. */
  const today = new Date()
  const season = getCurrentSeason(today)
  const todayDoy = dayOfYear(today)
  const ribbonSegments = getSeasonSegments(today.getFullYear()).map((seg) => {
    const startDoy = dayOfYear(seg.start)
    const endDoy = dayOfYear(seg.end)
    const span = endDoy - startDoy + 1
    const fillPercent =
      todayDoy > endDoy
        ? 100
        : todayDoy < startDoy
          ? 0
          : ((todayDoy - startDoy + 1) / span) * 100
    const range = `${seg.start.getMonth() + 1}/${seg.start.getDate()} ~ ${seg.end.getMonth() + 1}/${seg.end.getDate()}`
    const label = t(SEASON_LABEL_KEYS[seg.key])
    const meaning = t(SEASON_MEANING_KEYS[seg.key])
    return {
      key: seg.key,
      span,
      fillPercent,
      isCurrent: todayDoy >= startDoy && todayDoy <= endDoy,
      title: `${label} · ${range}`,
      meaning,
      description: `${label} (${range}) — ${meaning}`,
    }
  })

  /* ── 본문 읽기 CTA 상태 (안 읽음 / 읽는 중 / 완료) ──
   * 오늘 본문 범위(verse_start~verse_end)의 읽음 상태로 레이블·딥링크가 바뀐다.
   * 읽는 중이면 첫 안 읽은 절로 이어가고, 완료면 처음부터 다시 읽기. */
  const rangeStatuses = readStatus?.verses.filter(
    (v) =>
      v.verse >= data.passage.verse_start && v.verse <= data.passage.verse_end,
  )
  const readCount = rangeStatuses?.filter((v) => v.is_read).length ?? 0
  const firstUnreadVerse =
    rangeStatuses?.find((v) => !v.is_read)?.verse ?? data.passage.verse_start
  const totalVerses =
    rangeStatuses?.length ??
    data.passage.verse_end - data.passage.verse_start + 1
  const isDone = readCount > 0 && readCount >= totalVerses
  const inProgress = !isDone && readCount > 0
  const remainingMinutes = estimateMinutes(totalVerses - (isDone ? 0 : readCount))

  const handleContinueReading = () => {
    const resumeVerse = inProgress ? firstUnreadVerse : data.passage.verse_start
    navigate(
      `/bible/${data.passage.book_number}/${data.passage.chapter}?verse=${resumeVerse}`,
    )
  }

  return (
    <section className="meditation-section">
      <article
        className="meditation-card"
        data-time={timeOfDay}
        data-season={season}
      >
        {/* 시간대별 히어로 — 배경 이미지 위에 인사말 + 헤드라인.
         * 이미지는 ::before 레이어에서 하단 마스크로 카드 배경에 녹아든다 (Apple TV/Netflix식 페이드) */}
        <div
          className="meditation-hero"
          style={{ '--hero-image': `url(${HERO_IMAGES[timeOfDay]})` } as React.CSSProperties}
        >
          <div className="meditation-hero-overlay" aria-hidden />
          {/* 실황 날씨 칩 — 우측 상단 유리 칩(이모지+기온). 맑으면 시간대 이모지,
           * API 실패 시엔 칩을 숨기고 인사말 끝 이모지로 폴백한다. */}
          {weather && (
            <span
              className="meditation-weather-chip"
              aria-label={`${t('homeWeatherAria')} ${weather.temperature}°C`}
            >
              <span aria-hidden>{weather.emoji ?? HERO_EMOJI[timeOfDay]}</span>
              {weather.temperature}°
            </span>
          )}
          <div className="meditation-hero-text">
            <p className="meditation-hero-greeting">
              {buildGreeting(t(GREETING_KEYS[timeOfDay]), fullName, language)}
              {!weather && ` ${HERO_EMOJI[timeOfDay]}`}
            </p>
            <h2 className="meditation-hero-headline">
              {t(HEADLINE_KEYS[timeOfDay][0])}
              <br />
              {t(HEADLINE_KEYS[timeOfDay][1])}
            </h2>
          </div>
        </div>

        <div className="meditation-body">
        <header className="meditation-meta-row">
          <span className="meditation-season-tag" data-season={season}>
            {t(SEASON_LABEL_KEYS[season])}
          </span>
          {/* 구절 알람 설정 진입점 — 원하는 시간에 오늘의 말씀 푸시 */}
          <button
            type="button"
            className="meditation-alarm-btn"
            onClick={() => navigate('/bible/alarm')}
            aria-label={t('homeVerseAlarmAria')}
            title={t('homeVerseAlarmAria')}
          >
            <span className="material-icons-round" aria-hidden>notifications</span>
          </button>
        </header>

        {/* 연간 여정 — 교회력 절기 리본. 한 해를 절기 색 구간으로 펼치고
         * 지나온 길은 채워지며, 오늘 위치에 빛 마커가 놓인다. */}
        <div
          className="meditation-journey"
          aria-label={`${t('homeJourneyLabel')} ${t('homeJourneyDay').replace('{n}', String(data.day_number))}, ${t(SEASON_LABEL_KEYS[season])}`}
        >
          <div className="meditation-journey-label">
            <span className="meditation-journey-day">
              <span className="material-icons-round" aria-hidden>auto_stories</span>
              {t('homeJourneyLabel')}{' '}
              <strong>{t('homeJourneyDay').replace('{n}', String(data.day_number))}</strong>
              <span className="meditation-journey-total">
                {t('homeJourneyTotal').replace('{n}', String(data.total_days))}
              </span>
            </span>
            <span className="meditation-journey-date">
              {language === 'en'
                ? `${MONTH_NAMES_EN[today.getMonth()]} ${today.getDate()}`
                : `${today.getMonth() + 1}월 ${today.getDate()}일`}
            </span>
          </div>
          {/* 각 구간은 탭 가능 — 모바일에서 절기 이름·기간·의미를 토스트로 알려준다 */}
          <div className="meditation-ribbon">
            {ribbonSegments.map((seg, i) => (
              <button
                key={i}
                type="button"
                className={`meditation-ribbon-seg${seg.isCurrent ? ' is-current' : ''}`}
                data-season={seg.key}
                style={{ flexGrow: seg.span }}
                title={seg.title}
                aria-label={seg.description}
                onClick={() => showToast(seg.meaning, 'info', { title: seg.title })}
              >
                <span className="meditation-ribbon-track" aria-hidden>
                  <span
                    className="meditation-ribbon-fill"
                    style={{ width: `${seg.fillPercent}%` }}
                  />
                </span>
                {/* 오늘 위치 — 오디오 플레이어와 같은 네 갈래 별이 여정 위에서 빛난다 */}
                {seg.isCurrent && (
                  <span
                    className="meditation-ribbon-star"
                    style={{ left: `${seg.fillPercent}%` }}
                    aria-hidden
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 1.5 L14 9.5 L22 12 L14 14.5 L12 22.5 L10 14.5 L2 12 L10 9.5 Z" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="meditation-passage">
          <span className="meditation-passage-label">{data.passage.label}</span>
          {data.passage.theme && (
            <span className="meditation-passage-theme">{data.passage.theme}</span>
          )}
          {!isDone && (
            <span className="meditation-passage-time">
              <span className="material-icons-round" aria-hidden>schedule</span>
              {inProgress
                ? t('homePassageFromVerse')
                    .replace('{v}', String(firstUnreadVerse))
                    .replace('{m}', String(remainingMinutes))
                : t('homePassageMinutes').replace('{m}', String(remainingMinutes))}
            </span>
          )}
        </div>

        <blockquote className="meditation-verse-quote">
          <p className="meditation-verse-text">"{data.verse.text}"</p>
          <cite className="meditation-verse-reference">— {data.verse.reference}</cite>
        </blockquote>

        <div className="meditation-question-block">
          <span className="meditation-question-label">
            <span aria-hidden>💭</span> {t('homeTodaysQuestion')}
          </span>
          <p className="meditation-question-text">{data.meditation_question}</p>
          <button
            type="button"
            className="meditation-deepen-link"
            onClick={() => navigate('/bible/meditation')}
          >
            {t('homeContinueMeditation')}
            <span className="material-icons-round" aria-hidden>arrow_forward</span>
          </button>
        </div>

        <div className="meditation-actions">
          <button
            type="button"
            className={`meditation-cta is-primary${isDone ? ' is-done' : ''}`}
            onClick={handleContinueReading}
          >
            {isDone ? (
              <>
                <span className="material-icons-round" aria-hidden>check_circle</span>
                {t('homePassageDone')}
              </>
            ) : (
              <>
                {inProgress ? t('homeContinueReading') : t('homeReadPassage')}
                <span
                  className="material-icons-round meditation-cta-arrow"
                  aria-hidden
                >
                  arrow_forward
                </span>
              </>
            )}
          </button>
          {onWriteMeditation && (
            <button
              type="button"
              className="meditation-cta"
              onClick={onWriteMeditation}
            >
              <span className="material-icons-round">edit_note</span>
              {t('homeShareMeditation')}
            </button>
          )}
        </div>
        </div>
      </article>
    </section>
  )
}

export default DailyMeditationCard
