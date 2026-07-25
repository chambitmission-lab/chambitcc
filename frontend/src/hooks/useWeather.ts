import { useQuery } from '@tanstack/react-query'

/* 교회(부천 상동) 좌표 고정 — 위치 권한 팝업 없이 교인 생활권 날씨를 보여준다.
 * Open-Meteo는 API 키 없이 CORS 허용이라 프론트에서 직접 호출한다. */
const CHURCH_LAT = 37.5
const CHURCH_LON = 126.75

const WEATHER_URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${CHURCH_LAT}&longitude=${CHURCH_LON}` +
  `&current=weather_code,is_day&timezone=Asia%2FSeoul`

interface OpenMeteoResponse {
  current?: {
    weather_code?: number
    is_day?: number
  }
}

/* WMO 날씨 코드 → 이모지. 맑음(0·1)은 null을 돌려
 * 기존 시간대 이모지(☀️/🌤️/🌙)를 그대로 쓰게 한다. */
const weatherCodeToEmoji = (code: number, isDay: boolean): string | null => {
  if (code === 0 || code === 1) return null
  if (code === 2) return isDay ? '⛅' : '☁️'
  if (code === 3) return '☁️'
  if (code === 45 || code === 48) return '🌫️'
  if (code >= 51 && code <= 57) return '🌦️'
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return '🌧️'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return '❄️'
  if (code === 95 || code === 96 || code === 99) return '⛈️'
  return null
}

const fetchWeatherEmoji = async (): Promise<string | null> => {
  // 날씨는 장식이므로 오래 기다리지 않는다 — 4초 넘으면 포기하고 폴백
  const response = await fetch(WEATHER_URL, { signal: AbortSignal.timeout(4_000) })
  if (!response.ok) throw new Error('Failed to fetch weather')
  const data: OpenMeteoResponse = await response.json()
  const code = data.current?.weather_code
  if (typeof code !== 'number') return null
  return weatherCodeToEmoji(code, (data.current?.is_day ?? 1) === 1)
}

/* 현재 날씨 이모지. 로딩 중이거나 실패하면 null — 호출부는
 * null일 때 기존 시간대 이모지로 폴백해 화면이 끊기지 않는다. */
export const useWeatherEmoji = (): string | null => {
  const { data } = useQuery({
    queryKey: ['weather', 'current-emoji'],
    queryFn: fetchWeatherEmoji,
    staleTime: 1000 * 60 * 30,
    retry: false,
    refetchOnWindowFocus: false,
  })
  return data ?? null
}
