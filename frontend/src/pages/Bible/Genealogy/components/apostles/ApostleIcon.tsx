import type { ReactNode } from 'react'
import type { ApostleIconKey } from '../../apostles'

// 제자마다 성경 장면에서 고른 사물 하나 — 46 격자 라인 아이콘(stroke 2, 둥근 끝).
// 어떤 사물인지는 apostles.ts ApostleIconKey 주석 참고. 전승 상징(열쇠·X자 십자가 등)은 쓰지 않는다.

const PATHS: Record<ApostleIconKey, ReactNode> = {
  rock: (
    <>
      <path d="M6 34 L12 18 L20 12 L30 14 L38 24 L40 34 Z" />
      <path d="M14 24 L22 20 M26 22 L32 26" />
    </>
  ),
  fish: (
    <>
      <path d="M6 23 C14 12 28 12 36 23 C28 34 14 34 6 23 Z" />
      <path d="M36 23 L43 16 L43 30 Z" />
      <circle cx="14" cy="21" r="1.6" />
    </>
  ),
  bolt: <path d="M26 6 L12 26 L22 26 L18 42 L34 20 L24 20 Z" />,
  heart: (
    <path d="M23 38 C10 29 6 22 6 16 C6 11 10 8 14.5 8 C18 8 21 10 23 14 C25 10 28 8 31.5 8 C36 8 40 11 40 16 C40 22 36 29 23 38 Z" />
  ),
  door: (
    <>
      <path d="M12 40 V8 H32 V40" />
      <path d="M6 40 H40" />
      <circle cx="27" cy="25" r="1.6" />
      <path d="M32 12 L38 9 V40" />
    </>
  ),
  leaf: (
    <>
      <path d="M23 40 V22" />
      <path d="M23 24 C10 24 7 14 9 8 C17 8 23 13 23 24 Z" />
      <path d="M23 28 C34 28 38 20 37 14 C29 14 23 19 23 28 Z" />
    </>
  ),
  hand: (
    <>
      <path d="M16 40 V20 C16 18 19 18 19 20 V14 C19 12 22 12 22 14 V12 C22 10 25 10 25 12 V14 C25 12 28 12 28 14 V26 L31 22 C33 20 36 22 34 25 L28 36 C26 39 23 40 20 40 Z" />
      <circle cx="22.5" cy="30" r="2" />
    </>
  ),
  coin: (
    <>
      <ellipse cx="23" cy="16" rx="13" ry="5" />
      <path d="M10 16 V30 C10 33 16 35 23 35 C30 35 36 33 36 30 V16" />
      <path d="M10 23 C10 26 16 28 23 28 C30 28 36 26 36 23" />
    </>
  ),
  house: (
    <>
      <path d="M7 22 L23 9 L39 22" />
      <path d="M11 19 V38 H35 V19" />
      <path d="M19 38 V28 H27 V38" />
      <path d="M17 23 H20 M26 23 H29" />
    </>
  ),
  ask: (
    <>
      <path d="M8 10 H38 V30 H20 L12 37 V30 H8 Z" />
      <path d="M19 17 C19 14 27 14 27 18 C27 21 23 21 23 24" />
      <circle cx="23" cy="27" r="0.6" />
    </>
  ),
  flame: (
    <path d="M23 41 C14 41 10 34 12 27 C14 21 19 19 18 10 C25 13 30 20 29 27 C31 25 32 23 32 20 C36 25 37 31 34 36 C32 39 28 41 23 41 Z" />
  ),
  coins: (
    <>
      <circle cx="16" cy="18" r="7" />
      <circle cx="30" cy="22" r="7" />
      <circle cx="20" cy="32" r="7" />
    </>
  ),
  lot: (
    <>
      <rect x="9" y="14" width="18" height="18" rx="4" />
      <rect x="21" y="20" width="16" height="16" rx="4" />
      <circle cx="18" cy="23" r="1.6" />
      <circle cx="29" cy="28" r="1.6" />
    </>
  ),
}

export const ApostleIcon = ({ icon, size = 44, className }: { icon: ApostleIconKey; size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 46 46"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    className={className}
  >
    {PATHS[icon]}
  </svg>
)
