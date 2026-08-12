import { countryCode, countryFallbackEmoji } from './missionData'

/**
 * 국기 표시. 윈도우는 국기 이모지를 지원하지 않아 알파벳 두 글자로 깨지므로
 * flagcdn 이미지로 그리고, 국기가 없는 지역만 일반 이모지로 폴백한다.
 * 크기는 기존 이모지 자리의 font-size를 em 단위로 그대로 따른다(Mission.css).
 */
export default function CountryFlag({ country, className }: { country: string; className?: string }) {
  const code = countryCode[country]
  if (!code) {
    return <span className={className}>{countryFallbackEmoji[country] ?? '🌐'}</span>
  }
  return (
    <img
      className={className}
      src={`https://flagcdn.com/w40/${code}.png`}
      srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      alt={country}
      loading="lazy"
      draggable={false}
    />
  )
}
