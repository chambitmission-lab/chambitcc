/**
 * 신앙 여정·주간 스토리 카드용 아이콘 (Phosphor Icons Duotone).
 *
 * 프로필의 세 카드(요즘 나의 걸음 · 나의 신앙 여정 · 이번 주 스토리)가 쓰던
 * 컬러 이모지(🙏 💛 🔥 🌱 …)를 걷어낸 자리. 이모지는 OS/폰트마다 생김새와
 * 채도가 달라 카드 톤이 기기별로 흔들리고, 칩·링의 색 액센트와 따로 놀았다.
 * (같은 문법: EmotionIcons · ThanksIcons)
 *
 * 색은 currentColor를 따르므로 부모의 text-* 클래스가 그대로 먹는다.
 */
import type { CSSProperties, ReactElement } from 'react'
import {
  BookOpenText,
  Flame,
  GameController,
  HandHeart,
  HandsPraying,
  NotePencil,
  Plant,
  Sparkle,
  UsersThree,
  type Icon,
} from '@phosphor-icons/react'
import type { TimelineDomain } from '../../types/growth'

export type GrowthIconProps = {
  size?: number
  className?: string
  style?: CSSProperties
}

const duotone =
  (Base: Icon) =>
  ({ size = 16, className, style }: GrowthIconProps) => (
    <Base
      size={size}
      weight="duotone"
      color="currentColor"
      className={className}
      style={style}
      aria-hidden="true"
    />
  )

/** 요즘 나의 걸음 칩 */
export const AnsweredIcon = duotone(Sparkle) // 응답된 기도
export const IntercessionIcon = duotone(HandsPraying) // 함께한 기도
export const ThanksRecordIcon = duotone(HandHeart) // 감사 기록

/** 신앙 여정 카드 */
export const StreakFlameIcon = duotone(Flame) // 연속 기록
export const SproutIcon = duotone(Plant) // 성장 링 가운데 새싹

/** 하루의 대표 활동 → 아이콘 (주간 스토리 트레이). 백엔드 icon 이모지 대체 */
const DOMAIN_ICONS: Record<TimelineDomain, (p: GrowthIconProps) => ReactElement> = {
  prayer: duotone(HandsPraying),
  bible: duotone(BookOpenText),
  devotional: duotone(NotePencil),
  thanks: duotone(HandHeart),
  community: duotone(UsersThree),
  game: duotone(GameController),
}

/** 도메인이 비면(집계 전 등) null — 호출부가 점(·) 등으로 대체한다 */
export const DomainGlyph = ({
  domain,
  size = 16,
  className,
  style,
}: GrowthIconProps & { domain: TimelineDomain | undefined }) => {
  if (!domain) return null
  const Glyph = DOMAIN_ICONS[domain]
  if (!Glyph) return null
  return <Glyph size={size} className={className} style={style} />
}
