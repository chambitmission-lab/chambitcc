// 알림함 라인 아이콘 세트 (Lucide 스타일: 얇은 스트로크 + 둥근 캡)
//
// 알림 제목은 푸시(OS 알림 센터)에서 눈에 띄라고 백엔드가 이모지를 앞에 붙여 보낸다.
// 앱 안에서는 그 이모지가 OS 폰트마다 다르게 그려지고 톤도 제각각이라,
// 목록에서는 이모지를 떼고 같은 뜻의 라인 아이콘 타일로 바꿔 그린다.
import type { ReactNode } from 'react'
import {
  BookOpenIcon,
  CommentIcon,
  HandHeartIcon,
  SparklesIcon,
  UsersIcon,
} from './ActionIcons'
import type { Notification } from '../../types/notification'

interface IconProps {
  size?: number
  strokeWidth?: number
  className?: string
}

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

/** 확성기 — 교회 전체 공지 */
export const MegaphoneIcon = ({ size = 18, strokeWidth = 1.8, className }: IconProps) => (
  <svg width={size} height={size} strokeWidth={strokeWidth} className={className} {...base}>
    <path d="M3 11v2a1 1 0 0 0 1 1h2.5L13 18.5V5.5L6.5 10H4a1 1 0 0 0-1 1z" />
    <path d="M16.5 9.2a4 4 0 0 1 0 5.6" />
    <path d="M19.2 6.5a7.6 7.6 0 0 1 0 11" />
    <path d="M7.5 14.5 8.7 20a1 1 0 0 0 1 .8h.9a1 1 0 0 0 1-1.2l-.9-4" />
  </svg>
)

/** 종 — 분류가 잡히지 않는 개인 알림 */
export const BellIcon = ({ size = 18, strokeWidth = 1.8, className }: IconProps) => (
  <svg width={size} height={size} strokeWidth={strokeWidth} className={className} {...base}>
    <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
    <path d="M10.3 20a2 2 0 0 0 3.4 0" />
  </svg>
)

/** 달력 — 일정 */
export const CalendarIcon = ({ size = 18, strokeWidth = 1.8, className }: IconProps) => (
  <svg width={size} height={size} strokeWidth={strokeWidth} className={className} {...base}>
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
)

/** 카메라 — 사진 */
export const CameraIcon = ({ size = 18, strokeWidth = 1.8, className }: IconProps) => (
  <svg width={size} height={size} strokeWidth={strokeWidth} className={className} {...base}>
    <path d="M3 8.5a2 2 0 0 1 2-2h2l1.4-2h7.2L17 6.5h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <circle cx="12" cy="12.5" r="3.4" />
  </svg>
)

/** 막대 — 투표 */
export const PollIcon = ({ size = 18, strokeWidth = 1.8, className }: IconProps) => (
  <svg width={size} height={size} strokeWidth={strokeWidth} className={className} {...base}>
    <path d="M6 20V11M12 20V4M18 20v-6" />
  </svg>
)

/** 편지 + 시계 — 타임캡슐 */
export const CapsuleIcon = ({ size = 18, strokeWidth = 1.8, className }: IconProps) => (
  <svg width={size} height={size} strokeWidth={strokeWidth} className={className} {...base}>
    <path d="M3 7.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v5" />
    <path d="m3 8 6.4 4.4a2 2 0 0 0 2.2 0L18 8" />
    <path d="M3 7.5v9a2 2 0 0 0 2 2h6.5" />
    <circle cx="17.5" cy="17" r="4.2" />
    <path d="M17.5 15.2V17l1.3 1" />
  </svg>
)

// ── 알림 → 아이콘·톤 결정 ───────────────────────────────────
//
// 판단 순서: 제목 앞 이모지 → 이동 링크 → 공지/개인 기본값.
// 이모지가 가장 정확한 신호다 (같은 /classes 링크라도 댓글·사진·투표가 섞인다).

/** 타일 색 — brand=전체 공지(솔리드), soft=개인 알림, accent=응답·축하 */
export type NotificationTone = 'brand' | 'soft' | 'accent'

interface NotificationVisual {
  icon: ReactNode
  tone: NotificationTone
}

const ICON_SIZE = 19

const EMOJI_MAP: Record<string, NotificationVisual> = {
  '📢': { icon: <MegaphoneIcon size={ICON_SIZE} />, tone: 'brand' },
  '💬': { icon: <CommentIcon size={ICON_SIZE} />, tone: 'soft' },
  '🙏': { icon: <HandHeartIcon size={ICON_SIZE} />, tone: 'soft' },
  '🕯️': { icon: <HandHeartIcon size={ICON_SIZE} />, tone: 'soft' },
  '🎉': { icon: <SparklesIcon size={ICON_SIZE} />, tone: 'accent' },
  '✨': { icon: <SparklesIcon size={ICON_SIZE} />, tone: 'accent' },
  '💌': { icon: <CapsuleIcon size={ICON_SIZE} />, tone: 'soft' },
  '🕰️': { icon: <CapsuleIcon size={ICON_SIZE} />, tone: 'soft' },
  '📖': { icon: <BookOpenIcon size={ICON_SIZE} />, tone: 'soft' },
  '🕊️': { icon: <BookOpenIcon size={ICON_SIZE} />, tone: 'soft' },
  '📅': { icon: <CalendarIcon size={ICON_SIZE} />, tone: 'soft' },
  '📷': { icon: <CameraIcon size={ICON_SIZE} />, tone: 'soft' },
  '🗳': { icon: <PollIcon size={ICON_SIZE} />, tone: 'soft' },
  '🏫': { icon: <UsersIcon size={ICON_SIZE} />, tone: 'soft' },
  '👤': { icon: <UsersIcon size={ICON_SIZE} />, tone: 'soft' },
}

const LINK_MAP: Array<[RegExp, NotificationVisual]> = [
  [/^\/prayers\//, { icon: <HandHeartIcon size={ICON_SIZE} />, tone: 'soft' }],
  [/^\/groups\//, { icon: <HandHeartIcon size={ICON_SIZE} />, tone: 'soft' }],
  [/^\/classes\//, { icon: <UsersIcon size={ICON_SIZE} />, tone: 'soft' }],
  [/^\/rooms\//, { icon: <BookOpenIcon size={ICON_SIZE} />, tone: 'soft' }],
  [/^\/bible\//, { icon: <BookOpenIcon size={ICON_SIZE} />, tone: 'soft' }],
  [/^\/capsule\//, { icon: <CapsuleIcon size={ICON_SIZE} />, tone: 'soft' }],
]

// 이모지 + 이어 붙는 변형 선택자(VS16)·ZWJ 조합까지 한 덩어리로 떼어낸다
const LEADING_EMOJI =
  /^([\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]+)\s*/u

/** 제목 앞 이모지 (없으면 빈 문자열) */
const leadingEmoji = (title: string) => title.match(LEADING_EMOJI)?.[1]?.trim() ?? ''

/** 아이콘 타일로 대신 그리므로 제목에서는 앞 이모지를 뗀다 */
export const stripLeadingEmoji = (title: string) => title.replace(LEADING_EMOJI, '').trim() || title

export const resolveNotificationVisual = (n: Notification): NotificationVisual => {
  const emoji = leadingEmoji(n.title)
  // 🕰️처럼 변형 선택자가 붙는 이모지는 붙은 채로도, 뗀 채로도 들어올 수 있다
  const byEmoji = EMOJI_MAP[emoji] ?? EMOJI_MAP[emoji.replace(/️/g, '')]
  if (byEmoji) return byEmoji

  const link = n.link_url ?? ''
  const byLink = LINK_MAP.find(([pattern]) => pattern.test(link))?.[1]
  if (byLink) return byLink

  return n.target_user_id == null
    ? { icon: <MegaphoneIcon size={ICON_SIZE} />, tone: 'brand' }
    : { icon: <BellIcon size={ICON_SIZE} />, tone: 'soft' }
}
