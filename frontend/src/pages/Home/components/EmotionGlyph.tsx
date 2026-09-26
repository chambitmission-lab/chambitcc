/**
 * 기도 감정 태그 아이콘 — Phosphor Icons Duotone.
 * 감정 키(anxious·hopeful …)는 DB(prayers.emotion)와 PrayerComposer 선택값에
 * 그대로 저장돼 있어 데이터는 건드리지 않고 <EmotionGlyph emotion="hopeful" /> 가
 * 렌더 시점에 아이콘으로 바꾼다. 매핑에 없는 키는 fallback 이모지를 그대로 출력한다.
 *
 * 쓰는 곳이 전부 lazy 청크(작성 시트·우측 레일·신앙 여정)라 EmotionIcons.tsx(엔트리)와 떼어 둔다.
 */
import type { ReactElement } from 'react'
import {
  CloudLightning,
  CloudRain,
  Compass,
  Flame,
  HandsPraying,
  MoonStars,
  Plant,
  UserMinus,
} from '../../../components/icons/phosphor'
import { duotone, type EmotionIconProps } from './duotoneIcon'

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
