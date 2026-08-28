/**
 * /mission 아이콘 — Phosphor Icons Duotone (플랜·기도방과 같은 세트).
 * 기존 소비처가 width/height 를 넘기던 관행을 그대로 받아 size 로 흡수한다.
 */
import type { CSSProperties } from 'react'
import {
  AirplaneTilt,
  Check,
  Clock,
  GlobeSimple,
  HandHeart,
  Handshake,
  Hourglass,
  MagnifyingGlass,
  MapPin,
  MapTrifold,
  User,
  type Icon,
} from '@phosphor-icons/react'

export type MissionIconProps = {
  size?: number
  width?: number | string
  height?: number | string
  className?: string
  style?: CSSProperties
}

const duotone =
  (Base: Icon) =>
  ({ size, width, height, className, style }: MissionIconProps) => (
    <Base
      size={size ?? width ?? height ?? 20}
      weight="duotone"
      color="currentColor"
      className={className}
      style={style}
      aria-hidden="true"
    />
  )

/** 핀 — 지도 위치 */
export const PinIcon = duotone(MapPin)
/** 지구 — 세계 지도 */
export const GlobeIcon = duotone(GlobeSimple)
/** 돋보기 — 대륙으로 좁혀 보기 */
export const ZoomIcon = duotone(MagnifyingGlass)
/** 시계 — 현지 시간 */
export const ClockIcon = duotone(Clock)
/** 모래시계 — 시차 */
export const HourglassIcon = duotone(Hourglass)
/** 비행기 — 파송 */
export const PlaneIcon = duotone(AirplaneTilt)
/** 체크 */
export const CheckIcon = duotone(Check)
/** 손 위의 하트 — 기도·중보 */
export const HandHeartIcon = duotone(HandHeart)
/** 통계 카드 */
export const PersonIcon = duotone(User)
export const MapIcon = duotone(MapTrifold)
export const HandshakeIcon = duotone(Handshake)
