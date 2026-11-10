import type { CurrentWeather } from '../../../../hooks/useWeather'
import type { RailWeatherMode } from './railWeatherScene'

/* 하늘 상태 → 레일 연출. 비·이슬비 = 빗속의 등불, 뇌우 = 폭풍(번개), 눈 = 첫눈, 많은 눈 = 눈보라.
 * 맑음·흐림·안개는 null — 아무것도 그리지 않는다 */
export const weatherToRailMode = (w: CurrentWeather | null): RailWeatherMode | null => {
  if (!w) return null
  switch (w.condition) {
    case 'rain':
    case 'drizzle':
      return 'rain'
    case 'thunder':
      return 'storm'
    case 'snow':
      return w.isHeavySnow ? 'blizzard' : 'snow'
    default:
      return null
  }
}
