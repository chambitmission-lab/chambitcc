// 소개 페이지용 라인 아이콘 세트 (Lucide 스타일: 얇은 스트로크 + 둥근 캡)
// 이모지 대신 인라인 SVG를 사용해 앱 전체 아이콘 문법(ActionIcons)과 톤을 맞춘다.
import React from 'react'

interface IconProps {
  size?: number
  strokeWidth?: number
  className?: string
  style?: React.CSSProperties
}

const Svg = ({
  size = 18,
  strokeWidth = 1.8,
  className,
  style,
  children,
}: IconProps & { children: React.ReactNode }) => (
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
    style={style}
    aria-hidden="true"
  >
    {children}
  </svg>
)

/** 시계 — 예배 시간 */
export const ClockIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </Svg>
)

/** 지도 핀 — 오시는 길 */
export const MapPinIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </Svg>
)

/** 전화 */
export const PhoneIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </Svg>
)

export const ChevronRightIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="m9 18 6-6-6-6" />
  </Svg>
)

export const ChevronDownIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
)

/** 새싹 — 처음 오신 분 */
export const SproutIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M7 20h10" />
    <path d="M10 20c5.5-2.5.8-6.4 3-10" />
    <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
    <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
  </Svg>
)

/** 펼친 책 — 설교 */
export const BookOpenIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </Svg>
)

/** 재생 — 다시 듣는 설교 */
export const PlayCircleIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M10 8.5 16 12l-6 3.5z" />
  </Svg>
)

/** 깃발 — 발자취 */
export const FlagIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" x2="4" y1="22" y2="15" />
  </Svg>
)

/** 조직도 — 하나에서 갈라지는 조직 트리 */
export const OrgChartIcon = (props: IconProps) => (
  <Svg {...props}>
    <rect x="9" y="3" width="6" height="4.5" rx="1.2" />
    <rect x="3" y="16.5" width="6" height="4.5" rx="1.2" />
    <rect x="15" y="16.5" width="6" height="4.5" rx="1.2" />
    <path d="M12 7.5v3.5" />
    <path d="M6 16.5V13h12v3.5" />
  </Svg>
)

/** 하트 — 손수건 같은 만남 */
export const HeartIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </Svg>
)

/** X — 스쳐가는 만남 리스트 마커 */
export const XIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Svg>
)

/** 카메라 — 사진 등록 플레이스홀더 */
export const CameraIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </Svg>
)
