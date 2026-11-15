// 날씨 API — 백엔드가 교회 좌표 날씨를 대신 받아 10분 캐시한다. Open-Meteo 가 먹통이면
// 서버가 예비 제공처로 넘어가므로, 프론트가 직접 부를 때보다 장애에 강하다.
// (서버까지 닿지 않을 때의 직접 호출 폴백은 hooks/useWeather.ts 가 맡는다)
import { request } from './utils/request'

export interface WeatherSnapshot {
  /** WMO 날씨 코드 */
  weather_code: number
  is_day: boolean
  /** 섭씨 */
  temperature: number
  /** 지금 내리는 양(mm) */
  precipitation: number
  /** 현재 시각 강수확률(%) — 예비 제공처일 때는 null */
  precipitation_probability: number | null
  /** 오늘부터 7일의 최대 강수확률. date 는 한국 날짜 YYYY-MM-DD */
  daily_pop: { date: string; pop: number | null }[]
  source: string
  fetched_at: string
}

const SNAPSHOT_TIMEOUT_MS = 5_000

/* 홈에서 날씨 칩과 주일 우산 안내가 동시에 부른다 — 진행 중인 요청 하나를 나눠 쓴다 */
let inFlight: Promise<WeatherSnapshot> | null = null

export const fetchWeatherSnapshot = (): Promise<WeatherSnapshot> => {
  if (inFlight) return inFlight
  const pending = request<WeatherSnapshot>('/weather', {
    auth: false,
    signal: AbortSignal.timeout(SNAPSHOT_TIMEOUT_MS),
    errorMessage: '날씨 정보를 불러오지 못했습니다',
  }).finally(() => {
    if (inFlight === pending) inFlight = null
  })
  inFlight = pending
  return pending
}
