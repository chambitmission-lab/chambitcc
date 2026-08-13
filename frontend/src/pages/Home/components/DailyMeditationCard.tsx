import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDailyMeditation, deriveTimeOfDay } from '../../../hooks/useDailyMeditation'
import { useAuth } from '../../../hooks/useAuth'
import { useChapterReadStatus } from '../../../hooks/useBibleReading'
import {
  useCurrentWeather,
  useSundayRain,
  type WeatherCondition,
} from '../../../hooks/useWeather'
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

/* 주일 비 힌트 — 지금 비가 안 와도 주일 예보가 젖어 있으면, 진짜 비보다
 * 훨씬 성기고 느리고 옅은 가랑비 몇 가닥으로 "예보를 풍경으로" 보여준다. */
const HINT_RAIN_DROPS = [
  { left: '12%', delay: '0s', duration: '2.4s', length: '11px', opacity: 0.2 },
  { left: '32%', delay: '1.1s', duration: '2.8s', length: '9px', opacity: 0.15 },
  { left: '55%', delay: '0.5s', duration: '2.2s', length: '12px', opacity: 0.22 },
  { left: '74%', delay: '1.6s', duration: '2.6s', length: '10px', opacity: 0.16 },
  { left: '91%', delay: '0.8s', duration: '2.4s', length: '11px', opacity: 0.18 },
] as const

/* 주일 우산 속삭임 — 안내문이 아니라 챙겨주는 한마디로 읽히도록 며칠마다
 * 다른 문장을 보여준다. 날짜 기반이라 하루 안에서는 바뀌지 않는다. */
const SUNDAY_RAIN_WHISPER_KEYS = [
  'homeWeatherSundayRain1',
  'homeWeatherSundayRain2',
  'homeWeatherSundayRain3',
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
  const { data, error } = useDailyMeditation()
  /* 스켈레톤을 거쳐 데이터가 채워진 경우에만 본문을 페이드인한다 —
   * 캐시로 즉시 그려질 때(재방문)는 애니메이션 없이 바로 완성형으로.
   * lazy initializer라 마운트 첫 렌더의 상태가 그대로 고정된다. */
  const [enteredFromSkeleton] = useState(() => !data)
  /* 실황 날씨(이모지+기온) — 못 불러오면 null: 칩을 숨기고 인사말 이모지로 폴백.
   * 로딩 중(isWeatherLoading)에는 폴백을 띄우지 않는다 — 띄우면 응답이 도착하는
   * 순간 사라져 새로고침마다 이모지가 깜빡인다. 대신 칩 자리에 스켈레톤을 둔다. */
  const { weather, isLoading: isWeatherLoading } = useCurrentWeather()
  /* 다가오는 주일의 강수확률 — 주일이 3일 안으로 들어왔을 때만 조회된다 */
  const sundayPop = useSundayRain()
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

  /* ── 첫 진입 최적화: 쉘 먼저, 데이터만 스켈레톤 ──
   * 히어로 사진·인사말·헤드라인·절기 태그·여정 리본은 API 없이 전부
   * 클라이언트에서 계산되므로 로딩 중에도 완성형 그대로 그린다.
   * API에 기대는 본문(구절·핵심 절·질문·CTA) 자리만 실제 높이의
   * 스켈레톤으로 예약해, 데이터가 와도 카드 상단은 1px도 안 움직인다. */
  const today = new Date()
  const timeOfDay: TimeOfDay =
    data?.context.time_of_day ?? deriveTimeOfDay(today.getHours())

  /* ── 교회력 절기 리본 ──
   * 백엔드 plan_day.season은 시드 플레이스홀더(전부 epiphany)라
   * 절기 태그·리본 모두 프론트 계산값(churchCalendar)을 쓴다. */
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
  /* 우산 안내도 칩과 같은 판단선을 쓴다 — 낮은 확률까지 알리면 양치기 소년이 된다 */
  const showSundayRain = sundayPop !== null && sundayPop >= POP_VISIBLE_THRESHOLD
  /* 지금 이미 비·눈 연출이 흐르고 있으면 힌트 가랑비는 겹치지 않는다 */
  const showRainHint = showSundayRain && !isRaining && !isSnowing
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

  /* 여정 일수 — 로딩 중엔 서버 값과 같게 수렴하는 클라이언트 계산치(연중 일차)를
   * 먼저 보여준다. 응답이 와도 값이 같아 화면은 바뀌지 않는다. */
  const journeyDay = data?.day_number ?? todayDoy
  const journeyTotal =
    data?.total_days ?? dayOfYear(new Date(today.getFullYear(), 11, 31))

  /* ── 본문 읽기 CTA 상태 (안 읽음 / 읽는 중 / 완료) ──
   * 오늘 본문 범위(verse_start~verse_end)의 읽음 상태로 레이블·딥링크가 바뀐다.
   * 읽는 중이면 첫 안 읽은 절로 이어가고, 완료면 처음부터 다시 읽기. */
  const verseStart = data?.passage.verse_start ?? 0
  const verseEnd = data?.passage.verse_end ?? 0
  const rangeStatuses = readStatus?.verses.filter(
    (v) => v.verse >= verseStart && v.verse <= verseEnd,
  )
  const readCount = rangeStatuses?.filter((v) => v.is_read).length ?? 0
  const firstUnreadVerse =
    rangeStatuses?.find((v) => !v.is_read)?.verse ?? verseStart
  const totalVerses = rangeStatuses?.length ?? verseEnd - verseStart + 1
  const isDone = readCount > 0 && readCount >= totalVerses
  const inProgress = !isDone && readCount > 0
  const remainingMinutes = estimateMinutes(totalVerses - (isDone ? 0 : readCount))

  const handleContinueReading = () => {
    if (!data) return
    const resumeVerse = inProgress ? firstUnreadVerse : verseStart
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
        aria-busy={!data}
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
          {/* 주일 비 힌트 — 오늘은 맑아도 주일 예보가 젖어 있으면 아주 옅은
           * 가랑비 몇 가닥을 미리 흘려보낸다 (속삭임 문구와 한 세트) */}
          {showRainHint && (
            <div className="meditation-hero-ambient" aria-hidden>
              {HINT_RAIN_DROPS.map((d, i) => (
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
            <span
              className="meditation-weather-chip"
              data-wet={isRaining || isSnowing ? '' : undefined}
              role="img"
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
                  {/* 비·눈 라벨이 없으면(맑음·흐림인데 확률만 높음) 숫자가 습도로
                    * 오독되기 쉽다 — 그때만 ☔로 강수확률임을 못박는다 */}
                  {!weatherLabel && '☔ '}
                  {t('homeWeatherPop').replace('{n}', String(pop))}
                </span>
              )}
            </span>
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
            {/* 주일 우산 속삭임 — 주일이 가까우면서(3일 내) 비 확률이 높을 때만.
              * 알림 박스가 아니라 풍경 속 한 줄로, 헤드라인 아래에 나직이 얹힌다.
              * 이 카드에서 날씨가 하는 일은 예보가 아니라 예배 가는 길을 챙기는 것. */}
            {showSundayRain && (
              <p className="meditation-hero-whisper">
                <span aria-hidden>☔</span>
                {t(SUNDAY_RAIN_WHISPER_KEYS[todayDoy % SUNDAY_RAIN_WHISPER_KEYS.length])}
              </p>
            )}
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
          aria-label={`${t('homeJourneyLabel')} ${t('homeJourneyDay').replace('{n}', String(journeyDay))}, ${t(SEASON_LABEL_KEYS[season])}`}
        >
          <div className="meditation-journey-label">
            <span className="meditation-journey-day">
              <span className="material-icons-round" aria-hidden>auto_stories</span>
              {t('homeJourneyLabel')}{' '}
              <strong>{t('homeJourneyDay').replace('{n}', String(journeyDay))}</strong>
              <span className="meditation-journey-total">
                {t('homeJourneyTotal').replace('{n}', String(journeyTotal))}
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

        {data ? (
        <div className={`meditation-content${enteredFromSkeleton ? ' is-entering' : ''}`}>
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
          <span className="meditation-question-label">{t('homeTodaysQuestion')}</span>
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
        ) : (
          /* 본문 스켈레톤 — 실제 블록(구절 행·핵심 절·질문·CTA)과 같은 높이로
           * 자리를 예약해, 데이터 도착 시 레이아웃 시프트 없이 채워지기만 한다 */
          <div className="meditation-content" aria-hidden>
            <div className="meditation-skeleton passage" />
            <div className="meditation-skeleton quote" />
            <div className="meditation-skeleton question" />
            <div className="meditation-skeleton actions" />
          </div>
        )}
        </div>
      </article>
    </section>
  )
}

export default DailyMeditationCard
