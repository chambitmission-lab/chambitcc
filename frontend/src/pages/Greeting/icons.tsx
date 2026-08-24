// 인사말 페이지용 라인 아이콘 세트 (Lucide 스타일: 얇은 스트로크 + 둥근 캡)
// /about 의 icons.tsx 와 같은 규격 — 이 페이지에서 실제로 쓰는 것만 둔다.
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

/** 큰따옴표 — 편지의 시작을 여는 장식 */
export const QuoteIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M9 11H5a1 1 0 0 1-1-1V7a3 3 0 0 1 3-3" />
    <path d="M9 11v3a5 5 0 0 1-5 5" />
    <path d="M20 11h-4a1 1 0 0 1-1-1V7a3 3 0 0 1 3-3" />
    <path d="M20 11v3a5 5 0 0 1-5 5" />
  </Svg>
)

/** 사람들 — 역대 담임목사 / 교회 소개 */
export const UsersIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Svg>
)

/** 지도 핀 — 오시는 길 */
export const MapPinIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </Svg>
)

/** 오른쪽 화살표 */
export const ChevronRightIcon = (props: IconProps) => (
  <Svg {...props} strokeWidth={props.strokeWidth ?? 2.2}>
    <polyline points="9 18 15 12 9 6" />
  </Svg>
)

/** 카메라 — 사진 미등록 자리 (관리자에게만 보임) */
export const CameraIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </Svg>
)

/** 닫기 — 하단 시트 */
export const XIcon = (props: IconProps) => (
  <Svg {...props} strokeWidth={props.strokeWidth ?? 2.2}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
)

/** 공유 — 인사말 링크 나누기 */
export const ShareIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </Svg>
)

/** 새싹 — 환영 배너 (처음 오신 분) */
export const SproutIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 20v-7" />
    <path d="M12 13c0-3.3 2.6-5.8 6.5-5.8 0 3.3-2.6 5.8-6.5 5.8z" />
    <path d="M12 15c0-2.6-2-4.4-5-4.4 0 2.6 2 4.4 5 4.4z" />
  </Svg>
)
