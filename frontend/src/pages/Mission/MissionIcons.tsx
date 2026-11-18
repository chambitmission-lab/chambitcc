/**
 * /mission 아이콘 — Phosphor Icons Duotone (플랜·기도방과 같은 세트).
 * 기존 소비처가 width/height 를 넘기던 관행을 그대로 받아 size 로 흡수한다.
 */
import type { CSSProperties } from 'react'
import { Buildings, Church, HandHeart, type Icon } from '../../components/icons/phosphor'

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

/** 손 위의 하트 — 기도·중보 */
export const HandHeartIcon = duotone(HandHeart)
/** 예배당 — 국내 미자립 교회 */
export const ChurchIcon = duotone(Church)
/** 건물 — 국내 협력 기관 */
export const BuildingsIcon = duotone(Buildings)
