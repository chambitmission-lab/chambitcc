/**
 * 랜딩(비로그인) 전용 선화(線畫) 아이콘 — 이모지 대신 직접 그렸다.
 * /bible BibleToolIcons·/news NewsIcons 와 같은 문법(24 그리드·currentColor·둥근 캡).
 */
import type { SVGProps } from 'react'

const base: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

/** 마이크 — 설교 */
export function MicIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="9" y="2.8" width="6" height="11.4" rx="3" />
      <path d="M5.8 11.4a6.2 6.2 0 0 0 12.4 0" />
      <path d="M12 17.6v3.6M8.6 21.2h6.8" />
    </svg>
  )
}

/** 펼친 책 — 성경공부 */
export function OpenBookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M3.6 5.6c2.6-.9 5.4-.7 8.4 1.2 3-1.9 5.8-2.1 8.4-1.2v12c-2.6-.9-5.4-.7-8.4 1.2-3-1.9-5.8-2.1-8.4-1.2z" />
      <path d="M12 6.8v12" />
    </svg>
  )
}

/** 반짝임 둘 — 스마트 */
export function SparkleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M11.2 3.6c.9 3.6 1.9 4.6 5.4 5.5-3.5.9-4.5 1.9-5.4 5.5-.9-3.6-1.9-4.6-5.4-5.5 3.5-.9 4.5-1.9 5.4-5.5z" />
      <path d="M17.4 14.4c.4 1.7.9 2.2 2.6 2.6-1.7.4-2.2.9-2.6 2.6-.4-1.7-.9-2.2-2.6-2.6 1.7-.4 2.2-.9 2.6-2.6z" />
    </svg>
  )
}

/** 운동화 — 복장 걱정 */
export function SneakerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M2.8 17.6v-5.2c0-.7.6-1.2 1.3-1.2h2.4l2.6-3.4 3.6 3.2 4.9 1.9c2 .8 3.2 1.9 3.6 3.4l.2 1.3H4.4a1.6 1.6 0 0 1-1.6-1.6z" />
      <path d="M9.1 11 7.4 13M12.4 12.3l-1.7 2M15.7 13.6 14 15.6" />
    </svg>
  )
}

/** 지폐 — 헌금 부담 */
export function MoneyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="2.8" y="6.4" width="18.4" height="11.2" rx="2" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M6.2 9.6h.01M17.8 14.4h.01" strokeWidth={2.3} />
    </svg>
  )
}

/** 초승달과 Zzz — 졸음 */
export function SleepIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M20.4 14.6A8.2 8.2 0 0 1 9.4 3.6a8.6 8.6 0 1 0 11 11z" />
      <path d="M14.6 3.2h3.6l-3.6 4h3.6" />
    </svg>
  )
}

/** 텐트 — 레위기 생존자 */
export function TentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4.6 3.4 19.4h17.2z" />
      <path d="M12 10.6 8.7 19.4h6.6z" />
    </svg>
  )
}

/** 나침반 — 탐험가 */
export function CompassIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="m15.4 8.6-2 4.8-4.8 2 2-4.8z" />
    </svg>
  )
}

/** 촛불 — 골방 기도자 */
export function CandleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="9" y="10.6" width="6" height="9.8" rx="1.4" />
      <path d="M12 10.6V9" />
      <path d="M12 4c1.7 1.4 2.4 2.5 2.4 3.5a2.4 2.4 0 0 1-4.8 0C9.6 6.5 10.3 5.4 12 4z" />
    </svg>
  )
}

/** 전구 — 한 줄 힌트 */
export function BulbIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M9.4 17.4a6 6 0 1 1 5.2 0" />
      <path d="M9.6 17.4h4.8M10.4 20.4h3.2" />
    </svg>
  )
}
