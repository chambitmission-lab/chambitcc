/**
 * 묵상 감정 태그 아이콘 — Phosphor Icons Duotone.
 * 감정 키(weary·anxious …)는 API 파라미터로 그대로 나가므로 데이터는 건드리지 않고
 * 렌더 시점에만 이모지를 선화 아이콘으로 바꾼다. (같은 방식: EmotionGlyph · PlanGlyph)
 * 겹치는 키(anxious·lonely·grateful)는 홈 EmotionIcons 와 같은 아이콘을 쓴다.
 *
 * 색은 currentColor 를 따르므로 칩의 활성/비활성 색이 그대로 먹는다.
 */
import type { CSSProperties } from 'react'
import {
  BatteryLow,
  CloudLightning,
  Flame,
  HandsPraying,
  Leaf,
  NotePencil,
  PauseCircle,
  Plant,
  Question,
  Sun,
  UserMinus,
  Waves,
  type Icon,
} from '@phosphor-icons/react'
import type { EmotionTag } from '../../../types/meditation'

const GLYPHS: Record<EmotionTag, Icon> = {
  weary: BatteryLow, // 지침 — 바닥난 배터리
  anxious: CloudLightning, // 불안 — 번개 구름
  lonely: UserMinus, // 외로움 — 혼자 남은 사람
  grateful: HandsPraying, // 감사 — 모은 손
  joyful: Sun, // 기쁨 — 해
  peaceful: Waves, // 평안 — 잔잔한 물결
}

type Props = {
  emotion: EmotionTag
  size?: number
  className?: string
  style?: CSSProperties
}

export const MeditationEmotionGlyph = ({ emotion, size = 16, className, style }: Props) => {
  const Glyph = GLYPHS[emotion]
  if (!Glyph) return null
  return (
    <Glyph
      size={size}
      weight="duotone"
      color="currentColor"
      className={className}
      style={style}
      aria-hidden="true"
    />
  )
}

/* ── 단계 라벨·헤더용 아이콘 (이모지 대체) ── */
const step =
  (Base: Icon) =>
  ({ size = 15, className, style }: Omit<Props, 'emotion'>) => (
    <Base
      size={size}
      weight="duotone"
      color="currentColor"
      className={className}
      style={style}
      aria-hidden="true"
    />
  )

export const QuestionIcon = step(Question) // 오늘의 질문 (💭)
export const PauseIcon = step(PauseCircle) // 잠시 멈춤 (🕯️)
export const LeafIcon = step(Leaf) // 침묵 완료 문구 (🌿)
export const PrayIcon = step(HandsPraying) // 오늘의 기도 (🙏)
export const JournalIcon = step(NotePencil) // 묵상 기록 남기기 (✏️)
export const SproutIcon = step(Plant) // 나의 최근 묵상 (🌱)
export const StreakIcon = step(Flame) // 연속 묵상 일수 (🔥)
