// 타임캡슐 공용 아이콘 — 캡슐함/개봉/초대장이 같은 글리프를 쓴다.
// 이모지는 3D 그라데이션 재질이라 플랫 UI 위에서 따로 논다. 전부 hairline stroke.
import type { ReactNode } from 'react'

export const Icon = ({ size = 14, children }: { size?: number; children: ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {children}
  </svg>
)

export const LockShackle = ({ open = false }: { open?: boolean }) => (
  <>
    <rect x="5" y="10.5" width="14" height="10.5" rx="2.4" />
    {open ? <path d="M8 10.5V7a4 4 0 0 1 7.7-1.4" /> : <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />}
  </>
)

export const CalendarGlyph = () => (
  <>
    <rect x="3" y="5" width="18" height="16" rx="2.6" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </>
)

export const PhotoGlyph = () => (
  <>
    <rect x="3" y="4.5" width="18" height="15" rx="2.6" />
    <circle cx="8.8" cy="10" r="1.5" />
    <path d="m4 17.5 4.6-4.6 3.6 3.6 2.8-2.8L21 18" />
  </>
)

export const MicGlyph = () => (
  <>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
  </>
)

export const EnvelopeGlyph = () => (
  <>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m3.5 6.5 8.5 6 8.5-6" />
  </>
)

/** 밀랍 인장에 눌린 문양 — 캡슐함 인장(capsule-mail__sigil)과 같은 십자 */
export const SigilGlyph = () => <path d="M12 3.5v17M6.6 9.2h10.8" />
