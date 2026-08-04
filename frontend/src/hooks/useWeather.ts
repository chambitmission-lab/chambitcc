import { useQuery } from '@tanstack/react-query'

/* 교회(부천 상동) 좌표 고정 — 위치 권한 팝업 없이 교인 생활권 날씨를 보여준다.
 * Open-Meteo는 API 키 없이 CORS 허용이라 프론트에서 직접 호출한다. */
const CHURCH_LAT = 37.5
const CHURCH_LON = 126.75

/* forecast_hours=1 → 현재 시각 1개 구간만 받아 강수확률을 얻는다 (응답 크기 최소) */
const WEATHER_URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${CHURCH_LAT}&longitude=${CHURCH_LON}` +
  `&current=weather_code,is_day,temperature_2m,precipitation` +
  `&hourly=precipitation_probability&forecast_hours=1&timezone=Asia%2FSeoul`

/* Open-Meteo 실황은 15분 간격으로 갱신된다(응답의 current.interval=900).
 * 같은 주기로 맞춰 불필요한 호출 없이 최신값을 유지한다. */
const WEATHER_REFRESH_MS = 1000 * 60 * 15

/* 주간 예보 — 오늘부터 7일. 칩을 눌러 시트를 열 때만 호출한다(초기 로딩 부담 0).
 * past_days=1로 어제 하루를 함께 받아 "어제보다 N°" 비교에 쓴다(목록엔 안 나온다). */
const FORECAST_DAYS = 7

const FORECAST_URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${CHURCH_LAT}&longitude=${CHURCH_LON}` +
  `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
  `&past_days=1&forecast_days=${FORECAST_DAYS}&timezone=Asia%2FSeoul`

interface OpenMeteoResponse {
  current?: {
    weather_code?: number
    is_day?: number
    temperature_2m?: number
    precipitation?: number
  }
  hourly?: {
    precipitation_probability?: (number | null)[]
  }
  daily?: {
    time?: string[]
    weather_code?: (number | null)[]
    temperature_2m_max?: (number | null)[]
    temperature_2m_min?: (number | null)[]
    precipitation_probability_max?: (number | null)[]
  }
}

/* 화면 연출(칩 라벨·히어로 앰비언트)이 갈라지는 최소 단위로 묶은 하늘 상태 */
export type WeatherCondition =
  | 'clear'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'thunder'

export interface CurrentWeather {
  /* null이면 맑음 — 호출부가 시간대 이모지(☀️/🌤️/🌙)로 대신한다 */
  emoji: string | null
  /* 섭씨 반올림 */
  temperature: number
  condition: WeatherCondition
  /* 현재 시각 강수확률(%) — 응답에 없으면 null */
  precipitationProbability: number | null
  /* 지금 실제로 비/눈이 내리는 중인지 (mm) */
  isPrecipitating: boolean
}

/* WMO 날씨 코드 → 하늘 상태. 애매한 코드는 맑음으로 떨어뜨려
 * 잘못된 비 연출이 뜨는 쪽보다 조용한 쪽을 택한다. */
const classifyWeatherCode = (code: number): WeatherCondition => {
  if (code === 0 || code === 1) return 'clear'
  if (code === 2 || code === 3) return 'cloudy'
  if (code === 45 || code === 48) return 'fog'
  if (code >= 51 && code <= 57) return 'drizzle'
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'
  if (code === 95 || code === 96 || code === 99) return 'thunder'
  return 'clear'
}

/* 맑음은 null을 돌려 기존 시간대 이모지(☀️/🌤️/🌙)를 그대로 쓰게 한다. */
const conditionToEmoji = (
  condition: WeatherCondition,
  code: number,
  isDay: boolean,
): string | null => {
  switch (condition) {
    case 'clear':
      return null
    /* 부분 구름(2)만 낮에 ⛅ — 완전 흐림(3)과 밤은 ☁️ */
    case 'cloudy':
      return code === 2 && isDay ? '⛅' : '☁️'
    case 'fog':
      return '🌫️'
    case 'drizzle':
      return '🌦️'
    case 'rain':
      return '🌧️'
    case 'snow':
      return '❄️'
    case 'thunder':
      return '⛈️'
  }
}

const fetchCurrentWeather = async (): Promise<CurrentWeather | null> => {
  // 날씨는 장식이므로 오래 기다리지 않는다 — 4초 넘으면 포기하고 폴백
  const response = await fetch(WEATHER_URL, { signal: AbortSignal.timeout(4_000) })
  if (!response.ok) throw new Error('Failed to fetch weather')
  const data: OpenMeteoResponse = await response.json()
  const code = data.current?.weather_code
  const temperature = data.current?.temperature_2m
  if (typeof code !== 'number' || typeof temperature !== 'number') return null
  const isDay = (data.current?.is_day ?? 1) === 1
  const condition = classifyWeatherCode(code)
  const probability = data.hourly?.precipitation_probability?.[0]
  return {
    emoji: conditionToEmoji(condition, code, isDay),
    temperature: Math.round(temperature),
    condition,
    precipitationProbability: typeof probability === 'number' ? probability : null,
    isPrecipitating: (data.current?.precipitation ?? 0) > 0,
  }
}

export interface CurrentWeatherState {
  /* 아직 못 받았거나 실패하면 null */
  weather: CurrentWeather | null
  /* 첫 조회가 진행 중. 실패와 반드시 구분해야 한다 — 둘 다 null로 뭉뚱그리면
   * 호출부의 폴백 이모지가 로딩 동안 떴다가 응답 도착과 함께 사라진다. */
  isLoading: boolean
}

/* 현재 날씨(이모지+기온+강수). 호출부는 weather가 null이고 로딩도 끝났을 때만
 * 날씨 칩 대신 시간대 이모지로 폴백해 화면이 끊기지 않는다.
 *
 * 전역 기본값(refetchOnMount: false, gcTime 7일 + localStorage persist)은
 * 오프라인 PWA용 캐시 우선 전략이라 날씨엔 맞지 않는다 — 그대로 두면 며칠 전
 * 기온이 그대로 남는다. 그래서 이 쿼리만 mount·포커스·주기 리페치를 되살린다.
 * (persist 제외는 main.tsx의 shouldDehydrateQuery에서 처리) */
export const useCurrentWeather = (): CurrentWeatherState => {
  const { data, isLoading } = useQuery({
    queryKey: ['weather', 'current'],
    queryFn: fetchCurrentWeather,
    staleTime: WEATHER_REFRESH_MS,
    gcTime: 1000 * 60 * 60,
    retry: false,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: WEATHER_REFRESH_MS,
    /* 백그라운드에서는 멈춘다 — 앱 복귀 시 포커스 리페치가 대신 최신화한다 */
    refetchIntervalInBackground: false,
  })
  /* 캐시가 이미 있으면(세션 내 재진입) 백그라운드 리페치 중이어도 isLoading은
   * false다 — 이전 값이 그대로 보이므로 깜빡임이 없다. */
  return { weather: data ?? null, isLoading }
}

export interface ForecastDay {
  /* 'YYYY-MM-DD' (Asia/Seoul 기준) */
  date: string
  /* 0=일 … 6=토 — 요일 라벨용 */
  weekday: number
  condition: WeatherCondition
  /* 예보엔 낮/밤 구분이 없어 낮 기준 이모지, 맑음도 ☀️로 채운다 */
  emoji: string
  tempMax: number
  tempMin: number
  /* 그날 최대 강수확률(%) — 없으면 null */
  precipitationProbability: number | null
}

export interface WeeklyForecast {
  days: ForecastDay[]
  /* 어제 최고기온 — "어제보다 N°" 비교용. 응답에 없으면 null */
  yesterdayMax: number | null
}

const fetchWeeklyForecast = async (): Promise<WeeklyForecast> => {
  const response = await fetch(FORECAST_URL, { signal: AbortSignal.timeout(6_000) })
  if (!response.ok) throw new Error('Failed to fetch forecast')
  const data: OpenMeteoResponse = await response.json()
  const daily = data.daily
  const dates = daily?.time
  if (!dates?.length) throw new Error('Forecast payload is empty')

  /* past_days=1이므로 첫 항목이 어제다 — 비교값만 뽑고 목록에서는 뺀다 */
  let yesterdayMax: number | null = null
  const days: ForecastDay[] = []
  dates.forEach((date, i) => {
    if (i === 0) {
      const max = daily?.temperature_2m_max?.[0]
      yesterdayMax = typeof max === 'number' ? Math.round(max) : null
      return
    }
    const code = daily?.weather_code?.[i]
    const tempMax = daily?.temperature_2m_max?.[i]
    const tempMin = daily?.temperature_2m_min?.[i]
    // 하루라도 값이 비면 그 줄만 건너뛴다 — 나머지 예보는 그대로 보여준다
    if (
      typeof code !== 'number' ||
      typeof tempMax !== 'number' ||
      typeof tempMin !== 'number'
    ) {
      return
    }
    const condition = classifyWeatherCode(code)
    const pop = daily?.precipitation_probability_max?.[i]
    /* 'YYYY-MM-DD'를 로컬 자정으로 만들어 요일을 얻는다 —
     * new Date(문자열)은 UTC로 해석돼 한국에선 하루 밀린다. */
    const [year, month, day] = date.split('-').map(Number)
    days.push({
      date,
      weekday: new Date(year, month - 1, day).getDay(),
      condition,
      emoji: conditionToEmoji(condition, code, true) ?? '☀️',
      tempMax: Math.round(tempMax),
      tempMin: Math.round(tempMin),
      precipitationProbability: typeof pop === 'number' ? pop : null,
    })
  })
  if (!days.length) throw new Error('No usable forecast days')
  return { days, yesterdayMax }
}

/* 오늘부터 7일 예보. 시트가 열릴 때 마운트되는 컴포넌트에서만 호출해
 * 홈 첫 로딩에는 아무 비용도 들지 않는다. 실패하면 시트가 안내 문구를 띄운다. */
export const useWeeklyForecast = () =>
  useQuery({
    queryKey: ['weather', 'forecast'],
    queryFn: fetchWeeklyForecast,
    /* 일별 예보는 실황만큼 자주 바뀌지 않는다 */
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 3,
    retry: false,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  })
