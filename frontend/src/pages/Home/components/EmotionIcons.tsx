/**
 * 기도 감정 태그 아이콘 — Phosphor Icons Duotone.
 * 감정 키(anxious·hopeful …)는 DB(prayers.emotion)와 PrayerComposer 선택값에
 * 그대로 저장돼 있어 데이터는 건드리지 않고 <EmotionGlyph emotion="hopeful" /> 가
 * 렌더 시점에 아이콘으로 바꾼다. 매핑에 없는 키는 fallback 이모지를 그대로 출력한다.
 * (같은 방식: PlanGlyph · GroupGlyph)
 *
 * 색은 currentColor 를 따르므로 기존 text-* 클래스가 그대로 먹는다.
 */
import type { CSSProperties, ReactElement } from 'react'
import {
  Alarm,
  CalendarDots,
  Image,
  CloudLightning,
  CloudRain,
  Compass,
  Flame,
  HandHeart,
  HandsPraying,
  MoonStars,
  Plant,
  Tag,
  UserMinus,
  type Icon,
} from '../../../components/icons/phosphor'

export type EmotionIconProps = {
  size?: number
  className?: string
  style?: CSSProperties
}

const duotone =
  (Base: Icon) =>
  ({ size = 16, className, style }: EmotionIconProps) => (
    <Base
      size={size}
      weight="duotone"
      color="currentColor"
      className={className}
      style={style}
      aria-hidden="true"
    />
  )

/** 우측 레일 섹션 제목용 아이콘 */
export const TagIcon = duotone(Tag)
export const CalendarIcon = duotone(CalendarDots)
export const PrayIcon = duotone(HandsPraying)
/** 우측 레일 액션 벤토 타일용 */
export const AlarmIcon = duotone(Alarm)
export const ImageIcon = duotone(Image)
/** 감사 한 줄 — 손 위의 마음(감사 화면의 하트 문법을 아이콘으로) */
export const ThanksHandIcon = duotone(HandHeart)

/** 감정 키 → 아이콘 (PrayerComposer의 MOOD 키와 동기화) */
const GLYPHS: Record<string, (p: EmotionIconProps) => ReactElement> = {
  anxious: duotone(CloudLightning), // 불안 — 번개 구름
  tired: duotone(MoonStars), // 지침 — 밤하늘
  sad: duotone(CloudRain), // 슬픔 — 비구름
  lonely: duotone(UserMinus), // 외로움 — 혼자 남은 사람
  angry: duotone(Flame), // 분노 — 불꽃
  confused: duotone(Compass), // 혼란 — 나침반
  hopeful: duotone(Plant), // 소망 — 새싹
  grateful: duotone(HandsPraying), // 감사 — 모은 손
}

/** 매핑된 아이콘이 있으면 SVG로, 없으면 fallback 이모지를 그대로 보여준다 */
export const EmotionGlyph = ({
  emotion,
  fallback,
  size = 16,
  className,
  style,
}: EmotionIconProps & { emotion: string; fallback?: string }) => {
  const Glyph = GLYPHS[emotion]
  if (!Glyph) {
    return (
      <span className={className} style={{ fontSize: size, lineHeight: 1, ...style }} aria-hidden>
        {fallback}
      </span>
    )
  }
  return <Glyph size={size} className={className} style={style} />
}
