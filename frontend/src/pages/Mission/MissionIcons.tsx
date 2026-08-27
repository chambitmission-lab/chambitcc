/**
 * /mission 전용 선화(線畫) 아이콘 — 이모지 대신 직접 그렸다.
 * /bible BibleToolIcons·/news NewsIcons 와 같은 문법(24 그리드·currentColor·둥근 캡).
 * 기도 아이콘은 앱 전역 문법을 따라 ActionIcons 의 HandHeartIcon 을 그대로 쓴다.
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

/** 핀 — 지도 위치 */
export function PinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21c3.7-4.2 5.6-7.3 5.6-9.6A5.6 5.6 0 0 0 6.4 11.4c0 2.3 1.9 5.4 5.6 9.6z" />
      <circle cx="12" cy="11.2" r="2.2" />
    </svg>
  )
}

/** 경선·위선이 지나는 지구 — 세계 지도 */
export function GlobeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M3.4 12h17.2" />
      <path d="M12 3.4c2.2 2.4 3.3 5.2 3.3 8.6s-1.1 6.2-3.3 8.6c-2.2-2.4-3.3-5.2-3.3-8.6S9.8 5.8 12 3.4z" />
    </svg>
  )
}

/** 돋보기 — 대륙으로 좁혀 보기 */
export function ZoomIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="10.8" cy="10.8" r="6.4" />
      <path d="M15.6 15.6 20.4 20.4" />
    </svg>
  )
}

/** 시계 — 현지 시간 */
export function ClockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.4V12l3 1.8" />
    </svg>
  )
}

/** 모래시계 — 시차 */
export function HourglassIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M6.6 3.4h10.8M6.6 20.6h10.8" />
      <path d="M8 3.4v3.2c0 1.4 1.3 2.6 4 5.4 2.7-2.8 4-4 4-5.4V3.4" />
      <path d="M8 20.6v-3.2c0-1.4 1.3-2.6 4-5.4 2.7 2.8 4 4 4 5.4v3.2" />
    </svg>
  )
}

/** 종이비행기 각도의 비행기 — 거리 */
export function PlaneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M10.4 13.6 3.8 11.4c-.7-.2-.8-1.2-.1-1.5l16.2-6.6c.7-.3 1.4.4 1.1 1.1l-6.6 16.2c-.3.7-1.3.6-1.5-.1z" />
      <path d="m10.4 13.6 4.2-4.2" />
    </svg>
  )
}

/** 체크 — 오늘 기도 완료 */
export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2.4} {...props}>
      <path d="m5 12.8 4.6 4.4L19 6.8" />
    </svg>
  )
}
