/**
 * 읽기 플랜 아이콘 — Phosphor Icons Duotone.
 * 플랜 화면(목록·상세·참여·나만의 플랜·기도방)은 모두 이 파일을 거쳐
 * 같은 세트(Phosphor duotone)로 렌더해 일관성을 지킨다.
 *
 * ★플랜 이모지는 DB(bible_plans.emoji)와 나만의 플랜 선택값에 그대로 저장돼 있어
 *  데이터는 건드리지 않고 <PlanGlyph emoji="🌱" /> 가 렌더 시점에 아이콘으로 바꾼다.
 *  매핑에 없는 이모지는 원래 글자를 그대로 출력해 깨지지 않는다.
 *  (같은 방식: EduGlyph · HistoryGlyph)
 *
 * 색은 currentColor 를 따르므로 기존 text-* 클래스가 그대로 먹는다.
 */
import type { CSSProperties, ReactElement } from 'react'
import {
  Bird,
  CaretRight,
  Flag,
  BookOpen,
  Books,
  ChatCircle,
  CloudSlash,
  Confetti,
  Cross,
  Flame,
  GlobeHemisphereEast,
  Handshake,
  HandsPraying,
  Heart,
  Key,
  MapTrifold,
  Mountains,
  MusicNote,
  PencilLine,
  Plant,
  Scroll,
  Sparkle,
  SunHorizon,
  Tray,
  Users,
  type Icon,
} from '@phosphor-icons/react'

export type PlanIconProps = {
  size?: number
  className?: string
  style?: CSSProperties
}

const duotone =
  (Base: Icon) =>
  ({ size = 20, className, style }: PlanIconProps) => (
    <Base
      size={size}
      weight="duotone"
      color="currentColor"
      className={className}
      style={style}
      aria-hidden="true"
    />
  )

/** 새싹 — 시작·입문 플랜 */
export const SproutIcon = duotone(Plant)
/** 십자가 — 복음서·신약 플랜 */
export const CrossIcon = duotone(Cross)
/** 접힌 지도 — 성경 전체의 큰 그림(개관) */
export const MapIcon = duotone(MapTrifold)
/** 비둘기 — 평화·성령 */
export const DoveIcon = duotone(Bird)
/** 불꽃 — 연속 기록(스트릭) */
export const FlameIcon = duotone(Flame)
/** 지평선 위로 오르는 해 — 새벽·아침 묵상 */
export const SunriseIcon = duotone(SunHorizon)
/** 두루마리 — 옛 기록·복음서 */
export const ScrollIcon = duotone(Scroll)
/** 음표 — 시편·찬양 */
export const NoteIcon = duotone(MusicNote)
/** 산봉우리 — 모세오경·긴 여정 */
export const MountainIcon = duotone(Mountains)
/** 지구 — 성경 전체 통독 */
export const GlobeIcon = duotone(GlobeHemisphereEast)
/** 열쇠 — 초대 코드 */
export const KeyIcon = duotone(Key)
/** 폭죽 — 완주 축하 */
export const PartyIcon = duotone(Confetti)
/** 빈 서랍 — 목록이 비었을 때 */
export const EmptyTrayIcon = duotone(Tray)
/** 구름에 그은 선 — 불러오기 실패 */
export const CloudOffIcon = duotone(CloudSlash)
/** 맞잡은 손 — 함께 읽기 */
export const HandshakeIcon = duotone(Handshake)
export const BookIcon = duotone(BookOpen)
export const BooksIcon = duotone(Books)
export const SparkleIcon = duotone(Sparkle)
export const ChatIcon = duotone(ChatCircle)
export const PrayIcon = duotone(HandsPraying)
export const HeartIcon = duotone(Heart)
export const PeopleIcon = duotone(Users)
export const PenIcon = duotone(PencilLine)
export const FlagIcon = duotone(Flag)
export const ChevronRightIcon = duotone(CaretRight)

/** 이모지 → 아이콘 매핑. 변이 선택자(FE0F)는 떼고 맞춘다. */
const GLYPHS: Record<string, (p: PlanIconProps) => ReactElement> = {
  '📖': BookIcon,
  '📚': BooksIcon,
  '🌱': SproutIcon,
  '✝': CrossIcon,
  '🗺': MapIcon,
  '🕊': DoveIcon,
  '🔥': FlameIcon,
  '🌅': SunriseIcon,
  '📜': ScrollIcon,
  '🎵': NoteIcon,
  '⛰': MountainIcon,
  '🌍': GlobeIcon,
  '🔑': KeyIcon,
  '🎉': PartyIcon,
  '📭': EmptyTrayIcon,
  '😢': CloudOffIcon,
  '🤝': HandshakeIcon,
  '✨': SparkleIcon,
  '💬': ChatIcon,
  '🙏': PrayIcon,
  '💙': HeartIcon,
  '👥': PeopleIcon,
  '📝': PenIcon,
}

const normalize = (e: string) => e.replace(/️/g, '').trim()

/** 매핑된 아이콘이 있으면 SVG로, 없으면 원래 이모지를 그대로 보여준다 */
export const PlanGlyph = ({
  emoji,
  size = 20,
  className,
  style,
}: PlanIconProps & { emoji?: string | null }) => {
  const key = normalize(emoji || '📖')
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
