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
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: WEATHER_REFRESH_MS,
    /* 백그라운드에서는 멈춘다 — 앱 복귀 시 포커스 리페치가 대신 최신화한다 */
    refetchIntervalInBackground: false,
  })
  /* 캐시가 이미 있으면(세션 내 재진입) 백그라운드 리페치 중이어도 isLoading은
   * false다 — 이전 값이 그대로 보이므로 깜빡임이 없다. */
  return { weather: data ?? null, isLoading }
}

/* ── 주일 우산 안내 ──
 * 여기서 날씨가 하는 일은 예보를 나열하는 게 아니라 예배 가는 길을 챙기는 것이다.
 * 그래서 주간 표 대신 "다가오는 주일에 비가 오는가" 하나만 본다.
 *
 * 주일이 이 일수 안으로 들어왔을 때만 조회한다 — 그보다 먼 예보는 잘 맞지도 않고,
 * 월·화·수에는 요청 자체가 나가지 않아 홈 첫 로딩이 그만큼 가볍다. */
const SUNDAY_LOOKAHEAD_DAYS = 3

/* 오늘부터 다가오는 주일까지 남은 일수. 오늘이 주일이면 0 */
const daysUntilSunday = (today: Date): number => (7 - today.getDay()) % 7

/* 필요한 건 강수확률 한 칸뿐이라 기온·날씨코드는 받지 않는다 */
const sundayForecastUrl = (remaining: number) =>
  `https://api.open-meteo.com/v1/forecast?latitude=${CHURCH_LAT}&longitude=${CHURCH_LON}` +
  `&daily=precipitation_probability_max&forecast_days=${remaining + 1}&timezone=Asia%2FSeoul`

const fetchSundayPop = async (remaining: number): Promise<number | null> => {
  const response = await fetch(sundayForecastUrl(remaining), {
    signal: AbortSignal.timeout(6_000),
  })
  if (!response.ok) throw new Error('Failed to fetch Sunday forecast')
  const data: OpenMeteoResponse = await response.json()
  /* forecast_days가 remaining+1이므로 마지막 칸이 곧 주일이다 */
  const pop = data.daily?.precipitation_probability_max?.[remaining]
  return typeof pop === 'number' ? pop : null
}

/* 다가오는 주일의 강수확률(%). 주일이 아직 멀거나 조회에 실패하면 null —
 * 호출부는 그때 안내 문구를 아예 그리지 않는다(실패해도 화면에 흔적이 없다). */
export const useSundayRain = (): number | null => {
  const remaining = daysUntilSunday(new Date())
  const isNear = remaining <= SUNDAY_LOOKAHEAD_DAYS
  const { data } = useQuery({
    /* remaining이 키에 들어가 날짜가 넘어가면 자동으로 새 예보를 받는다 —
     * 토요일에 받아둔 값이 주일 아침까지 남지 않는다. */
    queryKey: ['weather', 'sunday', remaining],
    queryFn: () => fetchSundayPop(remaining),
    enabled: isNear,
    /* 일별 예보는 실황만큼 자주 바뀌지 않는다 */
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 3,
    retry: false,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  })
  return isNear ? data ?? null : null
}
