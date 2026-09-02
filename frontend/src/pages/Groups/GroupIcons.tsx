/**
 * 기도방(/groups) 아이콘 — Phosphor Icons Duotone.
 * 그룹 아이콘은 DB(prayer_groups.icon)에 이모지로 저장돼 있어 데이터는 그대로 두고
 * <GroupGlyph emoji={group.icon} /> 가 렌더 시점에 아이콘으로 바꾼다. (같은 방식: PlanGlyph)
 * 매핑에 없는 이모지는 원래 글자를 그대로 출력한다.
 */
import type { CSSProperties, ReactElement } from 'react'
import {
  ArrowsClockwise,
  CalendarBlank,
  Check,
  DotsThree,
  Feather,
  FlowerTulip,
  BookOpen,
  Church,
  Cross,
  HandsPraying,
  Heart,
  House,
  MusicNote,
  Plant,
  ShareNetwork,
  Sparkle,
  Star,
  Ticket,
  User,
  Users,
  type Icon,
} from '@phosphor-icons/react'

export type GroupIconProps = { size?: number; className?: string; style?: CSSProperties }

const duotone =
  (Base: Icon) =>
  ({ size = 20, className, style }: GroupIconProps) => (
    <Base size={size} weight="duotone" color="currentColor" className={className} style={style} aria-hidden="true" />
  )

export const PrayIcon = duotone(HandsPraying)
export const ChurchIcon = duotone(Church)
export const CrossIcon = duotone(Cross)
export const NoteIcon = duotone(MusicNote)
export const BookIcon = duotone(BookOpen)
export const PeopleIcon = duotone(Users)
export const PersonIcon = duotone(User)
export const DoveIcon = duotone(Feather)
export const StarIcon = duotone(Star)
export const HeartIcon = duotone(Heart)
export const SproutIcon = duotone(Plant)
export const TicketIcon = duotone(Ticket)
export const TulipIcon = duotone(FlowerTulip)

// 방 홈 UI용 (탭·상단 액션·레일) — 데이터 이모지 매핑과 무관
export const HomeIcon = duotone(House)
export const CalendarIcon = duotone(CalendarBlank)
export const ShareIcon = duotone(ShareNetwork)
export const MoreIcon = duotone(DotsThree)
export const CheckIcon = duotone(Check)
export const SparkleIcon = duotone(Sparkle)
export const RelayIcon = duotone(ArrowsClockwise)

const GLYPHS: Record<string, (p: GroupIconProps) => ReactElement> = {
  '🙏': PrayIcon,
  '⛪': ChurchIcon,
  '💒': ChurchIcon,
  '✝': CrossIcon,
  '🎵': NoteIcon,
  '📖': BookIcon,
  '👥': PeopleIcon,
  '👤': PersonIcon,
  '🕊': DoveIcon,
  '🌟': StarIcon,
  '⭐': StarIcon,
  '❤': HeartIcon,
  '💙': HeartIcon,
  '🌱': SproutIcon,
  '🎟': TicketIcon,
  '🌷': TulipIcon,
}

const normalize = (e: string) => e.replace(/️/g, '').trim()

export const GroupGlyph = ({
  emoji,
  size = 20,
  className,
  style,
}: GroupIconProps & { emoji?: string | null }) => {
  const key = normalize(emoji || '👥')
  const Glyph = GLYPHS[key]
  if (!Glyph) {
    return (
      <span className={className} style={{ fontSize: size, lineHeight: 1, ...style }}>
        {emoji}
      </span>
    )
  }
  return <Glyph size={size} className={className} style={style} />
}
