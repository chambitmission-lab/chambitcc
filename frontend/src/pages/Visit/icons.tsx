// 오시는 길 페이지용 라인 아이콘 세트 (About/icons.tsx 와 같은 Lucide 톤)
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

/** 위치 핀 — 히어로 emblem */
export const PinIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </Svg>
)

/** 지하철 */
export const SubwayIcon = (props: IconProps) => (
  <Svg {...props}>
    <rect x="5" y="3" width="14" height="13" rx="3" />
    <path d="M5 10h14" />
    <circle cx="8.5" cy="13" r="0.6" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="13" r="0.6" fill="currentColor" stroke="none" />
    <path d="m8 19-2 2.5" />
    <path d="m16 19 2 2.5" />
  </Svg>
)

/** 버스 */
export const BusIcon = (props: IconProps) => (
  <Svg {...props}>
    <rect x="4" y="3" width="16" height="14" rx="2.5" />
    <path d="M4 11h16" />
    <path d="M8 3v8" />
    <path d="M16 3v8" />
    <circle cx="8" cy="14.5" r="0.7" fill="currentColor" stroke="none" />
    <circle cx="16" cy="14.5" r="0.7" fill="currentColor" stroke="none" />
    <path d="M7 17v2.5" />
    <path d="M17 17v2.5" />
  </Svg>
)

/** 자동차 */
export const CarIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M5 17h14" />
    <path d="M4 17v-4.2a2 2 0 0 1 .2-.9l1.9-3.7A2 2 0 0 1 7.9 7h8.2a2 2 0 0 1 1.8 1.2l1.9 3.7a2 2 0 0 1 .2.9V17" />
    <circle cx="7.5" cy="17" r="1.6" />
    <circle cx="16.5" cy="17" r="1.6" />
  </Svg>
)

/** 걷는 사람 — "처음이에요" / 마지막 100m */
export const WalkIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="13" cy="4" r="1.7" />
    <path d="M11.5 21l1.2-5.4-2.4-2 .8-4.4" />
    <path d="M11.1 9.2 8 11l-1 3" />
    <path d="m12.7 15.6 2.6 2 .9 3.4" />
    <path d="m13.8 10.4 2.7 1.3 1.6-1.7" />
  </Svg>
)

/** 주차 P */
export const ParkingIcon = (props: IconProps) => (
  <Svg {...props}>
    <rect x="3" y="3" width="18" height="18" rx="4.5" />
    <path d="M10 16.5v-9h2.9a2.75 2.75 0 0 1 0 5.5H10" />
  </Svg>
)

/** 전화 */
export const PhoneIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M6.2 3.5h3l1.4 3.6-1.9 1.4a12 12 0 0 0 5.3 5.3l1.4-1.9 3.6 1.4v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.2 5.7a2 2 0 0 1 2-2.2Z" />
  </Svg>
)

/** 복사 */
export const CopyIcon = (props: IconProps) => (
  <Svg {...props}>
    <rect x="9" y="9" width="12" height="12" rx="2.5" />
    <path d="M15 9V5.5A2.5 2.5 0 0 0 12.5 3H5.5A2.5 2.5 0 0 0 3 5.5v7A2.5 2.5 0 0 0 5.5 15H9" />
  </Svg>
)

/** 나침반 — 길찾기 */
export const CompassIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="9.5" />
    <path d="m15.5 8.5-2 5.2-5.2 2 2-5.2 5.2-2Z" />
  </Svg>
)

/** 시계 */
export const ClockIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="9.5" />
    <polyline points="12 6.5 12 12 15.5 14" />
  </Svg>
)


/** 공유 */
export const ShareIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="17.5" cy="5.5" r="2.5" />
    <circle cx="6.5" cy="12" r="2.5" />
    <circle cx="17.5" cy="18.5" r="2.5" />
    <path d="m8.7 10.8 6.6-3.9M8.7 13.2l6.6 3.9" />
  </Svg>
)

/** QR 코드 */
export const QrIcon = (props: IconProps) => (
  <Svg {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <path d="M14 14h3v3h-3zM20.5 14v3M14 20.5h7" />
  </Svg>
)

/** 새싹 — 처음 오시나요 */
export const SproutIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 21v-8" />
    <path d="M12 13C12 9.7 9.5 7 6 7c0 3.3 2.5 6 6 6Z" />
    <path d="M12 13c0-2.8 2.2-5 5-5 0 2.8-2.2 5-5 5Z" />
  </Svg>
)

export const ChevronRightIcon = (props: IconProps) => (
  <Svg {...props}>
    <polyline points="9 5 16 12 9 19" />
  </Svg>
)

export const XIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
)

/** 아래 화살표 — 접이식 안내의 열림/닫힘 */
export const ChevronDownIcon = (props: IconProps) => (
  <Svg {...props}>
    <polyline points="5 9 12 16 19 9" />
  </Svg>
)

/** 지도 — 지도를 못 불러왔을 때의 자리 표시 */
export const MapIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M9 4 3 6.5v13L9 17l6 3 6-2.5v-13L15 7 9 4Z" />
    <path d="M9 4v13M15 7v13" />
  </Svg>
)

/** 네 귀퉁이 화살표 — "지도 크게 보기" */
export const ExpandIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M9 4H4v5M15 4h5v5M15 20h5v-5M9 20H4v-5" />
  </Svg>
)
