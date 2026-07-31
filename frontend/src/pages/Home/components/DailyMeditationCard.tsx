import { lazy, Suspense, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDailyMeditation } from '../../../hooks/useDailyMeditation'
import { useAuth } from '../../../hooks/useAuth'
import { useChapterReadStatus } from '../../../hooks/useBibleReading'
import { useCurrentWeather, type WeatherCondition } from '../../../hooks/useWeather'
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
import { getNaturalSeason, type NaturalSeason } from '../../../utils/naturalSeason'
import heroSummerMorning from '../../../assets/hero/morning.jpg'
import heroSummerAfternoon from '../../../assets/hero/afternoon.jpg'
import heroSummerEvening from '../../../assets/hero/evening.jpg'
import heroSpringMorning from '../../../assets/hero/spring-morning.jpg'
import heroSpringAfternoon from '../../../assets/hero/spring-afternoon.jpg'
import heroSpringEvening from '../../../assets/hero/spring-evening.jpg'
import heroAutumnMorning from '../../../assets/hero/autumn-morning.jpg'
import heroAutumnAfternoon from '../../../assets/hero/autumn-afternoon.jpg'
import heroAutumnEvening from '../../../assets/hero/autumn-evening.jpg'
import heroWinterMorning from '../../../assets/hero/winter-morning.jpg'
import heroWinterAfternoon from '../../../assets/hero/winter-afternoon.jpg'
import heroWinterEvening from '../../../assets/hero/winter-evening.jpg'
import './DailyMeditationCard.css'

/* 주간 예보 시트 — 칩을 누를 때만 필요하므로 홈 첫 로딩에서 분리한다 */
const WeatherForecastSheet = lazy(() => import('./WeatherForecastSheet'))

const GREETING_KEYS = {
  morning: 'homeGreetingMorning',
  afternoon: 'homeGreetingAfternoon',
  evening: 'homeGreetingEvening',
} as const satisfies Record<TimeOfDay, string>

/* 계절 × 시간대 히어로 — 이미지·이모지·헤드라인이 함께 바뀌며 분위기를 만든다.
 * CSS 배경으로만 참조되므로 실제 다운로드는 현재 계절·시간대 1장뿐이다. */
const HERO_IMAGES: Record<NaturalSeason, Record<TimeOfDay, string>> = {
  spring: {
    morning: heroSpringMorning,
    afternoon: heroSpringAfternoon,
    evening: heroSpringEvening,
  },
  summer: {
    morning: heroSummerMorning,
    afternoon: heroSummerAfternoon,
    evening: heroSummerEvening,
  },
  autumn: {
    morning: heroAutumnMorning,
    afternoon: heroAutumnAfternoon,
    evening: heroAutumnEvening,
  },
  winter: {
    morning: heroWinterMorning,
    afternoon: heroWinterAfternoon,
    evening: heroWinterEvening,
  },
}

/* 계절 앰비언트 — 히어로 안에서만 아주 은은하게 떨어지는 글리프.
 * 여름은 배경 자체가 청량해 연출 없이 둔다. */
const AMBIENT_GLYPHS: Partial<Record<NaturalSeason, string>> = {
  spring: '🌸',
  autumn: '🍂',
  winter: '❄️',
}

/* 파티클 배치 상수 — 렌더마다 흔들리지 않도록 고정값 사용 */
const AMBIENT_PARTICLES = [
  { left: '8%', delay: '0s', duration: '13s', drift: '18px', size: '11px', opacity: 0.5 },
  { left: '24%', delay: '4.5s', duration: '16s', drift: '-14px', size: '9px', opacity: 0.4 },
  { left: '43%', delay: '9s', duration: '12s', drift: '22px', size: '12px', opacity: 0.55 },
  { left: '61%', delay: '2s', duration: '17s', drift: '-20px', size: '10px', opacity: 0.45 },
  { left: '76%', delay: '6.5s', duration: '14s', drift: '16px', size: '13px', opacity: 0.5 },
  { left: '90%', delay: '11s', duration: '15s', drift: '-12px', size: '9px', opacity: 0.4 },
] as const

/* 비 앰비언트 — 눈·꽃잎과 달리 이모지가 아니라 얇은 빗줄기(CSS 선)로 떨어진다.
 * 사진 위에서 이모지 비는 장난스러워 보여 사선 스트릭으로 대신했다. */
const RAIN_DROPS = [
  { left: '6%', delay: '0s', duration: '1.1s', length: '16px', opacity: 0.5 },
  { left: '14%', delay: '0.5s', duration: '1.35s', length: '12px', opacity: 0.38 },
  { left: '23%', delay: '0.2s', duration: '1s', length: '18px', opacity: 0.46 },
  { left: '31%', delay: '0.8s', duration: '1.25s', length: '14px', opacity: 0.34 },
  { left: '39%', delay: '0.35s', duration: '1.15s', length: '17px', opacity: 0.5 },
  { left: '48%', delay: '0.95s', duration: '1.05s', length: '13px', opacity: 0.4 },
  { left: '56%', delay: '0.15s', duration: '1.3s', length: '15px', opacity: 0.44 },
  { left: '64%', delay: '0.65s', duration: '1.1s', length: '18px', opacity: 0.36 },
  { left: '72%', delay: '0.3s', duration: '1.2s', length: '13px', opacity: 0.48 },
  { left: '81%', delay: '0.85s', duration: '1.05s', length: '16px', opacity: 0.38 },
  { left: '89%', delay: '0.45s', duration: '1.3s', length: '14px', opacity: 0.44 },
  { left: '96%', delay: '0.1s', duration: '1.15s', length: '17px', opacity: 0.34 },
] as const

/* 젖은 하늘일 때만 칩에 한 단어를 붙인다 — 맑음·흐림·안개는 이모지로 충분 */
const WEATHER_LABEL_KEYS = {
  drizzle: 'homeWeatherDrizzle',
  rain: 'homeWeatherRain',
  snow: 'homeWeatherSnow',
  thunder: 'homeWeatherThunder',
} as const satisfies Partial<Record<WeatherCondition, string>>

/* 이 확률 이상이면 강수확률을 함께 보여준다 (우산 챙길 판단선) */
const POP_VISIBLE_THRESHOLD = 40

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
  /* 실황 날씨(이모지+기온) — 못 불러오면 null: 칩을 숨기고 인사말 이모지로 폴백.
   * 로딩 중(isWeatherLoading)에는 폴백을 띄우지 않는다 — 띄우면 응답이 도착하는
   * 순간 사라져 새로고침마다 이모지가 깜빡인다. 대신 칩 자리에 스켈레톤을 둔다. */
  const { weather, isLoading: isWeatherLoading } = useCurrentWeather()
  // 날씨 칩을 누르면 열리는 주간 예보 시트
  const [isForecastOpen, setIsForecastOpen] = useState(false)
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
  /* 자연 계절 — 히어로 배경·앰비언트 연출용 (교회력 절기와 별개) */
  const naturalSeason = getNaturalSeason(today)

  /* ── 날씨 연출 ──
   * 비·눈이 오는 날은 계절 앰비언트(꽃잎·낙엽)를 덮어쓴다 — 오늘 실제 하늘이
   * 계절 무드보다 먼저 읽혀야 "지금 비 온다"가 전달된다. */
  const condition = weather?.condition
  const isRaining =
    condition === 'rain' || condition === 'drizzle' || condition === 'thunder'
  const isSnowing = condition === 'snow'
  const ambientGlyph = isRaining
    ? undefined
    : isSnowing
      ? AMBIENT_GLYPHS.winter
      : AMBIENT_GLYPHS[naturalSeason]

  const weatherLabel =
    condition && condition in WEATHER_LABEL_KEYS
      ? t(WEATHER_LABEL_KEYS[condition as keyof typeof WEATHER_LABEL_KEYS])
      : null
  const pop = weather?.precipitationProbability ?? null
  const showPop = pop !== null && pop >= POP_VISIBLE_THRESHOLD
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
        {/* 계절 × 시간대 히어로 — 배경 이미지 위에 인사말 + 헤드라인.
         * 이미지는 ::before 레이어에서 하단 마스크로 카드 배경에 녹아든다 (Apple TV/Netflix식 페이드) */}
        <div
          className="meditation-hero"
          style={{ '--hero-image': `url(${HERO_IMAGES[naturalSeason][timeOfDay]})` } as React.CSSProperties}
        >
          <div className="meditation-hero-overlay" aria-hidden />
          {/* 비 앰비언트 — 비·가랑비·뇌우일 때 계절 연출 대신 빗줄기가 흐른다 */}
          {isRaining && (
            <div className="meditation-hero-ambient" aria-hidden>
              {RAIN_DROPS.map((d, i) => (
                <span
                  key={i}
                  className="meditation-rain-drop"
                  style={{
                    left: d.left,
                    '--fall-delay': d.delay,
                    '--fall-duration': d.duration,
                    '--drop-length': d.length,
                    '--fall-opacity': d.opacity,
                  } as React.CSSProperties}
                />
              ))}
            </div>
          )}
          {/* 계절 앰비언트 — 봄 꽃잎·가을 낙엽·겨울 눈이 은은히 내린다 (여름은 없음).
           * 눈 오는 날은 계절과 무관하게 ❄️로 대체된다 */}
          {ambientGlyph && (
            <div className="meditation-hero-ambient" aria-hidden>
              {AMBIENT_PARTICLES.map((p, i) => (
                <span
                  key={i}
                  className="meditation-ambient-particle"
                  style={{
                    left: p.left,
                    fontSize: p.size,
                    '--fall-delay': p.delay,
                    '--fall-duration': p.duration,
                    '--fall-drift': p.drift,
                    '--fall-opacity': p.opacity,
                  } as React.CSSProperties}
                >
                  {ambientGlyph}
                </span>
              ))}
            </div>
          )}
          {/* 실황 날씨 칩 — 우측 상단 유리 칩(이모지+기온). 맑으면 시간대 이모지,
           * 비·눈이면 한 단어 라벨, 강수확률 40% 이상이면 확률까지 붙는다.
           * API 실패 시엔 칩을 숨기고 인사말 끝 이모지로 폴백한다. */}
          {/* 로딩 동안은 칩 크기의 스켈레톤으로 자리를 잡아둔다 — 칩이 뒤늦게
            * 나타나며 히어로 우측이 흔들리는 것을 막는다 */}
          {isWeatherLoading && (
            <span className="meditation-weather-chip is-skeleton" aria-hidden />
          )}
          {weather && (
            <button
              type="button"
              className="meditation-weather-chip"
              data-wet={isRaining || isSnowing ? '' : undefined}
              aria-haspopup="dialog"
              aria-expanded={isForecastOpen}
              onClick={() => setIsForecastOpen(true)}
              aria-label={[
                `${t('homeWeatherAria')}${weatherLabel ? ` ${weatherLabel}` : ''}`,
                `${weather.temperature}°C`,
                showPop ? t('homeWeatherPopAria').replace('{n}', String(pop)) : null,
              ]
                .filter(Boolean)
                .join(', ')}
            >
              <span aria-hidden>{weather.emoji ?? HERO_EMOJI[timeOfDay]}</span>
              {weatherLabel && (
                <span className="meditation-weather-label">{weatherLabel}</span>
              )}
              <span className="meditation-weather-temp">{weather.temperature}°</span>
              {showPop && (
                <span className="meditation-weather-pop" aria-hidden>
                  {t('homeWeatherPop').replace('{n}', String(pop))}
                </span>
              )}
              {/* 누르면 주간 예보가 열린다는 힌트 */}
              <span className="material-icons-round meditation-weather-caret" aria-hidden>
                expand_more
              </span>
            </button>
          )}
          <div className="meditation-hero-text">
            <p className="meditation-hero-greeting">
              {buildGreeting(t(GREETING_KEYS[timeOfDay]), fullName, language)}
              {/* 날씨 조회가 끝났는데도 값이 없을 때(실패)만 폴백 이모지.
                * 타임아웃(4초) 뒤에 붙을 수 있어 살짝 페이드인시킨다 */}
              {!weather && !isWeatherLoading && (
                <span className="meditation-hero-greeting-emoji" aria-hidden>
                  {' '}
                  {HERO_EMOJI[timeOfDay]}
                </span>
              )}
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

      {/* 주간 예보 시트 — 열릴 때 청크를 받으므로 fallback 없이 잠깐 비어 있다 */}
      {isForecastOpen && (
        <Suspense fallback={null}>
          <WeatherForecastSheet
            onClose={() => setIsForecastOpen(false)}
            currentTemperature={weather?.temperature}
          />
        </Suspense>
      )}
    </section>
  )
}

export default DailyMeditationCard
