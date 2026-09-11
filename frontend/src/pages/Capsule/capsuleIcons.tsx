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

/** 마음을 담은 편지 — 💌 대신. 봉투 날개는 하트를 피해 중간에서 끊는다. */
export const LetterHeartGlyph = () => (
  <>
    <rect x="2.5" y="5.8" width="19" height="13" rx="2.6" />
    <path d="m3.5 7 3.2 2.5M20.5 7l-3.2 2.5" />
    <path d="M15.08 14.08c.66-.64 1.32-1.41 1.32-2.42a2.42 2.42 0 0 0-2.42-2.42c-.77 0-1.32.22-1.98.88-.66-.66-1.21-.88-1.98-.88a2.42 2.42 0 0 0-2.42 2.42c0 1.01.66 1.78 1.32 2.42l3.08 3.08z" />
  </>
)

/** 알림 종 — 개봉일 아침 도착 알림 */
export const BellGlyph = () => (
  <>
    <path d="M18 9.8a6 6 0 1 0-12 0c0 4.4-1.7 5.9-1.7 5.9h15.4S18 14.2 18 9.8" />
    <path d="M10.3 19.4a2 2 0 0 0 3.4 0" />
  </>
)

/** 사슬 고리 — 초대 링크 전달 */
export const LinkGlyph = () => (
  <>
    <path d="M10.2 13.8a3.5 3.5 0 0 0 5.3.4l2.3-2.3a3.5 3.5 0 0 0-5-5l-1.3 1.3" />
    <path d="M13.8 10.2a3.5 3.5 0 0 0-5.3-.4l-2.3 2.3a3.5 3.5 0 0 0 5 5l1.3-1.3" />
  </>
)

/** 밀랍 인장에 눌린 문양 — 캡슐함 인장(capsule-mail__sigil)과 같은 십자 */
export const SigilGlyph = () => <path d="M12 3.5v17M6.6 9.2h10.8" />
