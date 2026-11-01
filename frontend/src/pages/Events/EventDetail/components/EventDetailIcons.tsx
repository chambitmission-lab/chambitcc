/**
 * 일정 상세 아이콘 — 이모지(🙋🤔🙏⛪✨🔒) 대신 Phosphor Duotone 선화.
 * 색은 currentColor 를 따라서 응답 버튼의 초록/앰버/로즈 선택 색이 그대로 먹는다.
 */
import type { CSSProperties } from 'react'
import { Camera, Church, HandsPraying, HandWaving, Lock, SealQuestion, Sparkle, type Icon } from '../../../../components/icons/phosphor'
import type { AttendanceStatus } from '../../../../types/event'

type GlyphProps = { size?: number; className?: string; style?: CSSProperties }

const make =
  (Base: Icon) =>
  ({ size = 18, className, style }: GlyphProps) => (
    <Base size={size} weight="duotone" color="currentColor" className={className} style={style} aria-hidden="true" />
  )

const RSVP_GLYPHS: Record<AttendanceStatus, Icon> = {
  attending: HandWaving, // 갈게요 — 손 흔들기
  maybe: SealQuestion, // 고민 중 — 물음표
  not_attending: HandsPraying, // 못 가요 — 모은 손(마음으로 함께)
}

export const RsvpGlyph = ({ status, size = 18, className, style }: GlyphProps & { status: AttendanceStatus }) => {
  const Base = RSVP_GLYPHS[status]
  return <Base size={size} weight="duotone" color="currentColor" className={className} style={style} aria-hidden="true" />
}

export const ChurchGlyph = make(Church)
export const SparkleGlyph = make(Sparkle)
export const LockGlyph = make(Lock)
export const CameraGlyph = make(Camera)
