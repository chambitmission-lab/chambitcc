// 홈 묵상 카드 날씨 칩·주일 우산 안내용 라인 아이콘 (Lucide 스타일: 24 그리드 · 둥근 캡 · fill 없음)
// 컬러 이모지(🌤·☔)는 OS마다 생김새·색이 달라(Windows ☔=보라) 사진·브랜드 톤과 따로 놀았다.
// currentColor 한 색으로 그려 히어로 사진 위 흰 유리 칩과 한 재질로 읽히게 한다.
import type React from 'react'
import type { WeatherIconKey } from '../../../hooks/useWeather'

export type WeatherGlyphName = WeatherIconKey | 'drop' | 'umbrella'

/* 비·눈·뇌우가 공유하는 구름 윗부분 — 아래로 떨어지는 것들의 자리를 비워둔 반쪽 구름 */
const CLOUD_TOP = 'M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.24'

const PATHS: Record<WeatherGlyphName, React.ReactNode> = {
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </>
  ),
  moon: <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />,
  cloudSun: (
    <>
      <path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41M15.95 12.65A4 4 0 0 0 8.4 9.4" />
      <path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z" />
    </>
  ),
  cloudMoon: (
    <>
      <path d="M10.19 8.5A6 6 0 0 1 16 4a6 6 0 0 0 6 6 6 6 0 0 1-3 5.2" />
      <path d="M13 16a3 3 0 1 1 0 6H7a5 5 0 1 1 4.9-6Z" />
    </>
  ),
  cloud: <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />,
  fog: (
    <>
      <path d={CLOUD_TOP} />
      <path d="M16 17H7M17 21H9" />
    </>
  ),
  drizzle: (
    <>
      <path d={CLOUD_TOP} />
      <path d="M8 19v1M8 14v1M16 19v1M16 14v1M12 21v1M12 16v1" />
    </>
  ),
  rain: (
    <>
      <path d={CLOUD_TOP} />
      <path d="M16 14v6M8 14v6M12 16v6" />
    </>
  ),
  snow: (
    <>
      <path d={CLOUD_TOP} />
      <path d="M8 15h.01M8 19h.01M12 17h.01M12 21h.01M16 15h.01M16 19h.01" />
    </>
  ),
  thunder: (
    <>
      <path d="M6 16.33A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.97" />
      <path d="m13 12-3 5h4l-3 5" />
    </>
  ),
  /* 강수확률 — 숫자가 습도·기온으로 오독되지 않게 붙이는 물방울 */
  drop: (
    <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7Z" />
  ),
  umbrella: (
    <>
      <path d="M22 12a10 10 0 0 0-20 0Z" />
      <path d="M12 12v8a2 2 0 0 0 4 0M12 2v1" />
    </>
  ),
}

interface WeatherGlyphProps {
  name: WeatherGlyphName
  size?: number
  strokeWidth?: number
  className?: string
}

export const WeatherGlyph = ({
  name,
  size = 16,
  strokeWidth = 1.8,
  className,
}: WeatherGlyphProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {PATHS[name]}
  </svg>
)
