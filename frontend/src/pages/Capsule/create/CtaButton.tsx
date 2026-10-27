// /capsule/new 아래 줄의 큰 버튼 — 둥근 알약 + 앞의 상황 아이콘 + 뒤의 화살표 + 양옆 반짝 선.
// 2026-10-27 "눌리는 입체(바닥 그림자)" 버튼에서 교체. 타일은 그대로 입체, 큰 버튼만 가볍게.
import type { ReactNode } from 'react'

export type CtaIcon = 'mail' | 'calendar' | 'pen' | 'box' | 'link' | 'home'

const ICONS: Record<CtaIcon, ReactNode> = {
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m3 8 9 6 9-6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  pen: (
    <>
      <path d="m4 20 4-1 11-11-3-3L5 16z" />
      <path d="m13 7 3 3" />
    </>
  ),
  box: (
    <>
      <path d="M3 8l9-4 9 4v9l-9 4-9-4z" />
      <path d="M3 8l9 4 9-4M12 12v9" />
    </>
  ),
  link: (
    <>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </>
  ),
  home: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
}

const CtaButton = ({
  label,
  icon,
  ghost = false,
  amber = false,
  disabled = false,
  onClick,
}: {
  label: string
  /** 앞의 아이콘 — 비활성·ghost 면 숨긴다(아이콘은 "지금 할 수 있는 일"의 표시) */
  icon?: CtaIcon
  ghost?: boolean
  amber?: boolean
  disabled?: boolean
  onClick: () => void
}) => {
  const lively = !disabled && !ghost
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`cw-btn ${ghost ? 'cw-btn--ghost' : ''} ${amber ? 'cw-btn--amber' : ''} ${lively ? 'cw-btn--lively' : ''}`}
    >
      {lively && icon && (
        <svg
          className="cw-btn__ico"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          {ICONS[icon]}
        </svg>
      )}
      <span className="cw-btn__label">{label}</span>
      {lively && (
        <svg
          className="cw-btn__go"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M5 12h13M13 6l6 6-6 6" />
        </svg>
      )}
    </button>
  )
}

export default CtaButton
