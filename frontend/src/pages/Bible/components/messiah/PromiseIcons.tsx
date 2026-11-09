// 약속과 성취 전용 선화 아이콘 — Material 서브셋(gen:material-icons)을 늘리지 않으려고 인라인 SVG.
// 전부 currentColor 스트로크라 놓인 자리의 글자색(금빛·푸른빛)을 그대로 따른다.
interface IconProps {
  size?: number
  className?: string
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

/** 왕관 — 구약의 메시아 약속 */
export const CrownIcon = ({ size = 16, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M3.5 8.5 7.5 12 12 5.5 16.5 12l4-3.5-1.8 9.5H5.3L3.5 8.5Z" fill="currentColor" fillOpacity="0.18" />
    <path d="M5.5 20.5h13" />
  </svg>
)

/** 십자가 — 신약의 성취 */
export const CrossIcon = ({ size = 16, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3v18M6.5 8.5h11" />
  </svg>
)

/** 반짝임 — 시트 머리 */
export const SparkleIcon = ({ size = 28, className }: IconProps) => (
  <svg {...base(size)} className={className} strokeWidth={1.5}>
    <path
      d="M12 2.8c.6 4.6 2.6 6.6 7.2 7.2-4.6.6-6.6 2.6-7.2 7.2-.6-4.6-2.6-6.6-7.2-7.2 4.6-.6 6.6-2.6 7.2-7.2Z"
      fill="currentColor"
      fillOpacity="0.85"
    />
    <path d="M19 16.5c.25 1.6.9 2.25 2.5 2.5-1.6.25-2.25.9-2.5 2.5-.25-1.6-.9-2.25-2.5-2.5 1.6-.25 2.25-.9 2.5-2.5Z" fill="currentColor" />
  </svg>
)

/** 아래 화살표 — 약속에서 성취로 */
export const ArrowDownIcon = ({ size = 16, className }: IconProps) => (
  <svg {...base(size)} className={className} strokeWidth={2.2}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </svg>
)

/** 전구 — 핵심 포인트 */
export const BulbIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 0 0-3.6 10.8c.7.55 1.1 1.3 1.1 2.2h5c0-.9.4-1.65 1.1-2.2A6 6 0 0 0 12 3Z" fill="currentColor" fillOpacity="0.16" />
  </svg>
)

/** 이어진 길 — 약속 지도 */
export const PathIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <circle cx="5.5" cy="18.5" r="2" />
    <circle cx="18.5" cy="5.5" r="2" />
    <path d="M7.5 18.5h6a3.5 3.5 0 0 0 0-7h-3a3.5 3.5 0 0 1 0-7h6" strokeDasharray="0.5 3" />
  </svg>
)
