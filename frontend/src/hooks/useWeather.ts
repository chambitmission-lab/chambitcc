import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { weatherKeys } from './queryKeys'
import { useTickingNow } from './useTickingNow'
import { safeStorage } from '../utils/safeStorage'
import { fetchWeatherSnapshot } from '../api/weather'

/* 교회(부천 상동) 좌표 고정 — 위치 권한 팝업 없이 교인 생활권 날씨를 보여준다.
 * (백엔드 app/services/weather_service.py 의 CHURCH_LAT/LON 과 같아야 한다)
 *
 * 날씨는 두 길로 받는다.
 *  1) 백엔드 /weather — 서버가 10분 캐시하고, Open-Meteo 가 먹통이면 예비 제공처로 넘어간다.
 *  2) Open-Meteo 직접 호출(API 키 없이 CORS 허용) — 백엔드에 닿지 않을 때의 폴백. */
export const CHURCH_LAT = 37.5
export const CHURCH_LON = 126.75

/* forecast_hours=1 → 현재 시각 1개 구간만 받아 강수확률을 얻는다 (응답 크기 최소).
 * 시간별 날씨 코드·강수량도 같이 받는다 — 아래 confirmDry 가 쓴다. */
const WEATHER_URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${CHURCH_LAT}&longitude=${CHURCH_LON}` +
  `&current=weather_code,is_day,temperature_2m,precipitation` +
  `&hourly=precipitation_probability,weather_code,precipitation&forecast_hours=1&timezone=Asia%2FSeoul`

/* '안 온다'는 실황을 시간별 값으로 다시 확인하는 강수확률 문턱(%).
 * (백엔드 weather_service.py 의 SECOND_OPINION_MIN_POP 과 같아야 한다) */
const SECOND_OPINION_MIN_POP = 50

/* Open-Meteo 실황은 15분 간격으로 갱신된다(응답의 current.interval=900).
 * 같은 주기로 맞춰 불필요한 호출 없이 최신값을 유지한다. */
const WEATHER_REFRESH_MS = 1000 * 60 * 15

/* 값이 낡았는지 벽시계로 확인하는 간격 (useCurrentWeather 참고) */
const WEATHER_AGE_CHECK_MS = 1000 * 60

interface OpenMeteoResponse {
  current?: {
    weather_code?: number
    is_day?: number
    temperature_2m?: number
    precipitation?: number
  }
  hourly?: {
    precipitation_probability?: (number | null)[]
    weather_code?: (number | null)[]
    precipitation?: (number | null)[]
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

/* 칩 라인 아이콘 키 — 그림은 Home/components/WeatherIcons.tsx 가 그린다 */
export type WeatherIconKey =
  | 'sun'
  | 'moon'
  | 'cloudSun'
  | 'cloudMoon'
  | 'cloud'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'thunder'

export interface CurrentWeather {
  icon: WeatherIconKey
  /* 섭씨 반올림 */
  temperature: number
  condition: WeatherCondition
  /* 현재 시각 강수확률(%) — 응답에 없으면 null */
  precipitationProbability: number | null
  /* 지금 실제로 비/눈이 내리는 중인지 (mm) */
  isPrecipitating: boolean
  /* 많은 눈(WMO 75 함박눈·86 강한 눈 소나기) — 레일 삽화가 눈보라 연출로 갈라진다 */
  isHeavySnow: boolean
  /* 장대비(WMO 65 강한 비·82 세찬 소나기) — 레일 삽화의 비 장면에서 먼 번쩍임이 보통 비보다 잦아진다.
   * 뇌우 코드(95~)가 아니라 번개 줄기는 없다. 옛 저장분에는 이 값이 없다(= 아님) */
  isHeavyRain?: boolean
  /* 약한 비(WMO 61 약한 비·80 약한 소나기) — 레일 삽화의 비 장면에서 먼 번쩍임이 없다. 옛 저장분에는 없다(= 아님) */
  isLightRain?: boolean
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

/* 맑음은 해/달, 부분 구름(2)만 해·달이 걸친 구름 — 완전 흐림(3)은 구름만 */
const conditionToIcon = (
  condition: WeatherCondition,
  code: number,
  isDay: boolean,
): WeatherIconKey => {
  switch (condition) {
    case 'clear':
      return isDay ? 'sun' : 'moon'
    case 'cloudy':
      if (code !== 2) return 'cloud'
      return isDay ? 'cloudSun' : 'cloudMoon'
    default:
      return condition
  }
}

/* Open-Meteo 직접 호출 1회의 제한 시간. 평소 응답은 0.4초지만 첫 연결이 가끔 수십 초씩
 * 걸리고(2026-11-14 실측 59초) 서버가 통째로 먹통인 날도 있다(2026-11-15). 길게 기다려도
 * 소용없는 경우가 대부분이라 짧게 끊고, 나머지는 뒤에서 도는 재시도에 맡긴다. */
const WEATHER_TIMEOUT_MS = 5_000

/* 백엔드가 이 시간 안에 답하지 않으면 Open-Meteo 직접 호출을 나란히 띄운다.
 * 차례로 기다리면 한쪽이 느린 날 스켈레톤이 두 제한 시간의 합만큼 길어진다. */
const DIRECT_HEDGE_MS = 1_500

/* ── 마지막 성공값 저장 ──
 * 쿼리 캐시는 persist에서 빠져 있어(며칠 전 기온이 얼어붙는 문제) 새로고침마다 빈손이었다.
 * 대신 성공값을 따로 적어두고 1시간 안쪽 것만 첫 화면에 쓴다 — 칩이 바로 뜨고
 * 뒤에서 최신값으로 바뀐다. 1시간을 넘긴 값은 버려 낡은 기온이 남지 않게 한다. */
/* v2 — 낡은 스냅샷이 '방금 받은 값'으로 적혀 있던 옛 저장분을 버린다(2026-11-15) */
/* v3 — 비가 오는데 '구름 조금'으로 적힌 저장분을 버린다(2026-11-17, confirmDry 참고) */
const LAST_WEATHER_KEY = 'chambit.weather.last.v3'
const LAST_WEATHER_MAX_AGE_MS = 1000 * 60 * 60

interface SavedWeather {
  savedAt: number
  weather: CurrentWeather
}

const readSavedWeather = (): SavedWeather | undefined => {
  const raw = safeStorage.getJson(LAST_WEATHER_KEY) as Partial<SavedWeather> | undefined
  if (!raw || typeof raw.savedAt !== 'number' || !raw.weather) return undefined
  const w = raw.weather
  if (typeof w.temperature !== 'number' || typeof w.icon !== 'string' || typeof w.condition !== 'string') {
    return undefined
  }
  if (Date.now() - raw.savedAt > LAST_WEATHER_MAX_AGE_MS) return undefined
  return { savedAt: raw.savedAt, weather: w as CurrentWeather }
}

const fetchCurrentWeather = async (): Promise<CurrentWeather | null> => {
  const weather = await requestCurrentWeather()
  if (weather) safeStorage.setJson(LAST_WEATHER_KEY, { savedAt: Date.now(), weather })
  return weather
}

/* 어느 길로 받았든 같은 모양으로 맞춘 원자료 */
interface RawWeather {
  code: number
  isDay: boolean
  temperature: number
  precipitation: number
  probability: number | null
}

const toCurrentWeather = (raw: RawWeather): CurrentWeather => {
  const condition = classifyWeatherCode(raw.code)
  return {
    icon: conditionToIcon(condition, raw.code, raw.isDay),
    temperature: Math.round(raw.temperature),
    condition,
    precipitationProbability: raw.probability,
    isPrecipitating: raw.precipitation > 0,
    isHeavySnow: raw.code === 75 || raw.code === 86,
    isHeavyRain: raw.code === 65 || raw.code === 82,
    isLightRain: raw.code === 61 || raw.code === 80,
  }
}

/* 서버가 실제로 받아 온 시각이 이보다 오래됐으면 버린다. 응답이 성공이어도 내용은 낡았을 수
 * 있다 — 서비스워커는 서버에 닿지 않으면 하루 전 응답까지 꺼내 주고(sw.js Network First),
 * 그걸 그대로 믿으면 오전 기온이 '방금 받은 값'으로 저장된다. 버리면 직접 호출이 대신한다. */
const SNAPSHOT_MAX_AGE_MS = 1000 * 60 * 20

const requestViaBackend = async (): Promise<CurrentWeather> => {
  const snapshot = await fetchWeatherSnapshot()
  const fetchedAt = Date.parse(snapshot.fetched_at)
  if (Number.isFinite(fetchedAt) && Date.now() - fetchedAt > SNAPSHOT_MAX_AGE_MS) {
    throw new Error('Stale weather snapshot')
  }
  return toCurrentWeather({
    code: snapshot.weather_code,
    isDay: snapshot.is_day,
    temperature: snapshot.temperature,
    precipitation: snapshot.precipitation,
    probability: snapshot.precipitation_probability,
  })
}

const isWetCondition = (condition: WeatherCondition): boolean =>
  condition === 'drizzle' || condition === 'rain' || condition === 'snow' || condition === 'thunder'

/* Open-Meteo 의 current 는 관측이 아니라 15분 단위 모델 값이라 약한 비를 '구름 조금·0mm'로
 * 내보내는 일이 있다(2026-11-17: 비가 오는데 current 는 코드 2, 같은 응답의 시간별 값은 이슬비 51).
 * 실황이 말랐는데 그 시각 강수확률이 높고 시간별 코드가 젖었으면 시간별 값을 따른다.
 * 백엔드는 같은 경우를 예비 제공처에 다시 물어 고친다 — 이 길(직접 호출)만 빠져 있어서,
 * 백엔드가 늦거나 스냅샷이 낡은 순간마다 비가 그친 것처럼 보였다. */
const confirmDry = (raw: RawWeather, hourly: OpenMeteoResponse['hourly']): RawWeather => {
  if (isWetCondition(classifyWeatherCode(raw.code)) || raw.precipitation > 0) return raw
  if (raw.probability === null || raw.probability < SECOND_OPINION_MIN_POP) return raw
  const hourlyCode = hourly?.weather_code?.[0]
  if (typeof hourlyCode !== 'number' || !isWetCondition(classifyWeatherCode(hourlyCode))) return raw
  return { ...raw, code: hourlyCode, precipitation: hourly?.precipitation?.[0] ?? 0 }
}

const requestViaOpenMeteo = async (): Promise<CurrentWeather | null> => {
  const response = await fetch(WEATHER_URL, { signal: AbortSignal.timeout(WEATHER_TIMEOUT_MS) })
  if (!response.ok) throw new Error('Failed to fetch weather')
  const data: OpenMeteoResponse = await response.json()
  const code = data.current?.weather_code
  const temperature = data.current?.temperature_2m
  if (typeof code !== 'number' || typeof temperature !== 'number') return null
  const probability = data.hourly?.precipitation_probability?.[0]
  return toCurrentWeather(
    confirmDry(
      {
        code,
        isDay: (data.current?.is_day ?? 1) === 1,
        temperature,
        precipitation: data.current?.precipitation ?? 0,
        probability: typeof probability === 'number' ? probability : null,
      },
      data.hourly,
    ),
  )
}

/* 백엔드를 먼저 부르고, 실패하면 즉시·늦으면 DIRECT_HEDGE_MS 뒤에 Open-Meteo 직접 호출을
 * 띄워 먼저 성공한 쪽을 쓴다. 백엔드가 제때 답하면 직접 호출은 나가지 않는다.
 * 둘 다 실패해야 실패다(React Query 가 재시도한다). */
const requestCurrentWeather = (): Promise<CurrentWeather | null> => {
  const viaBackend = requestViaBackend()
  const viaDirect = new Promise<CurrentWeather | null>((resolve, reject) => {
    let started = false
    const start = () => {
      if (started) return
      started = true
      clearTimeout(timer)
      requestViaOpenMeteo().then(resolve, reject)
    }
    const timer = setTimeout(start, DIRECT_HEDGE_MS)
    /* 성공하면 직접 호출을 취소한다 — 이 약속은 끝나지 않은 채 버려진다 */
    viaBackend.then(() => clearTimeout(timer), start)
  })
  return Promise.any([viaBackend, viaDirect])
}

export interface CurrentWeatherState {
  /* 아직 못 받았거나 실패하면 null */
  weather: CurrentWeather | null
  /* 첫 조회의 첫 시도가 진행 중. 실패와 반드시 구분해야 한다 — 둘 다 null로 뭉뚱그리면
   * 호출부의 폴백 아이콘이 로딩 동안 떴다가 응답 도착과 함께 사라진다.
   * 첫 시도가 실패하면 재시도가 남아 있어도 false 다(아래 useCurrentWeather 참고). */
  isLoading: boolean
}

/* 현재 날씨(아이콘+기온+강수). 호출부는 weather가 null이고 로딩도 끝났을 때만
 * 날씨 칩 대신 시간대 아이콘으로 폴백해 화면이 끊기지 않는다.
 *
 * 전역 기본값(refetchOnMount: false, gcTime 7일 + localStorage persist)은
 * 오프라인 PWA용 캐시 우선 전략이라 날씨엔 맞지 않는다 — 그대로 두면 며칠 전
 * 기온이 그대로 남는다. 그래서 이 쿼리만 mount·포커스·주기 리페치를 되살린다.
 * (persist 제외는 main.tsx의 shouldDehydrateQuery에서 처리) */
export const useCurrentWeather = (): CurrentWeatherState => {
  const queryClient = useQueryClient()
  /* 아래 '낡은 값 숨기기' 판정용 — 5분에 한 번이면 충분하다 */
  const now = useTickingNow(1000 * 60 * 5)
  /* 잠들었다 깨어난 기기 챙기기. refetchInterval 타이머는 기기가 자는 동안 멈춰서, 오전에 덮은
   * 노트북을 저녁에 열면 오전 기온이 최대 15분 더 남는다(2026-11-15 — 해 진 뒤에 해 아이콘과
   * 오전 기온). 화면이 계속 '보이는' 상태였다면 포커스 리페치도 돌지 않는다. 그래서 벽시계로
   * 값의 나이를 직접 잰다 — 1분마다, 그리고 창을 다시 잡을 때. */
  useEffect(() => {
    const refreshIfOld = () => {
      if (document.visibilityState !== 'visible') return
      const state = queryClient.getQueryState(weatherKeys.current())
      if (!state || state.fetchStatus !== 'idle') return
      /* 실패한 직후에도 다시 두드리지 않게 마지막 시도 시각(성공·실패 중 늦은 쪽)으로 잰다 */
      const lastTriedAt = Math.max(state.dataUpdatedAt, state.errorUpdatedAt)
      if (Date.now() - lastTriedAt < WEATHER_REFRESH_MS) return
      void queryClient.refetchQueries({ queryKey: weatherKeys.current(), type: 'active' })
    }
    const timer = setInterval(refreshIfOld, WEATHER_AGE_CHECK_MS)
    window.addEventListener('focus', refreshIfOld)
    window.addEventListener('pageshow', refreshIfOld)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', refreshIfOld)
      window.removeEventListener('pageshow', refreshIfOld)
    }
  }, [queryClient])

  const { data, isLoading, failureCount, dataUpdatedAt } = useQuery({
    queryKey: weatherKeys.current(),
    queryFn: fetchCurrentWeather,
    /* 1시간 안쪽 마지막 성공값으로 시작한다. 저장 시각을 함께 넘겨 15분이 지났으면
     * 마운트 즉시 새로 받는다. 새 조회가 실패해도 이 값은 그대로 남는다. */
    initialData: () => readSavedWeather()?.weather,
    initialDataUpdatedAt: () => readSavedWeather()?.savedAt,
    staleTime: WEATHER_REFRESH_MS,
    gcTime: 1000 * 60 * 60,
    /* 첫 연결만 느린 경우가 대부분이라 다시 시도하면 바로 받아진다.
     * 재시도는 화면 뒤에서 돈다 — 스켈레톤은 첫 시도까지만 보인다(아래). */
    retry: 2,
    retryDelay: (attempt) => 1000 * (attempt + 1),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: WEATHER_REFRESH_MS,
    /* 백그라운드에서는 멈춘다 — 앱 복귀 시 포커스 리페치가 대신 최신화한다 */
    refetchIntervalInBackground: false,
  })
  /* 캐시가 이미 있으면(세션 내 재진입) 백그라운드 리페치 중이어도 isLoading은
   * false다 — 이전 값이 그대로 보이므로 깜빡임이 없다. */
  /* 스켈레톤은 첫 시도 동안만 — 재시도까지 다 기다리면 장애 날 빈 칩이 20초 넘게 남는다
   * (2026-11-15). 첫 시도가 실패하면 폴백 아이콘으로 넘어가고, 뒤에서 도는 재시도가
   * 성공하면 그때 칩이 나타난다. */
  /* 1시간 넘게 못 바꾼 값은 '지금 날씨'로 내보이지 않는다 — 새로 받는 데 실패하는 동안
   * 몇 시간 전 기온이 남는 것보다 시간대 아이콘으로 물러나는 쪽이 정직하다. */
  const isExpired = !!data && now - dataUpdatedAt > LAST_WEATHER_MAX_AGE_MS
  return { weather: data && !isExpired ? data : null, isLoading: isLoading && failureCount === 0 }
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

/* 로컬 날짜 YYYY-MM-DD — toISOString 은 UTC 라 한국 오전에는 하루 전 날짜가 나온다 */
const localDateKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/* 백엔드 스냅샷의 일별 강수확률에서 주일 칸을 찾는다. 서버 날짜는 한국 기준이라 날짜로
 * 먼저 맞추고, 기기 시간대가 달라 못 찾으면 순서(오늘=0)로 고른다. */
const fetchSundayPopViaBackend = async (remaining: number): Promise<number | null> => {
  const { daily_pop } = await fetchWeatherSnapshot()
  const sunday = new Date()
  sunday.setDate(sunday.getDate() + remaining)
  const key = localDateKey(sunday)
  const entry = daily_pop.find((d) => d.date === key) ?? daily_pop[remaining]
  return entry?.pop ?? null
}

const fetchSundayPop = async (remaining: number): Promise<number | null> => {
  try {
    return await fetchSundayPopViaBackend(remaining)
  } catch {
    /* 백엔드에 닿지 않으면 Open-Meteo 직접 호출로 */
  }
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
    queryKey: weatherKeys.sunday(remaining),
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
