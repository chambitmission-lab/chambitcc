/**
 * Phosphor 아이콘을 앱 아이콘 결(duotone · currentColor)로 감싸는 공통 팩토리.
 * 컴포넌트 파일(EmotionIcons 등)에서 함께 export 하면 Fast Refresh 규칙에 걸려 따로 둔다 —
 * EmotionIcons · EmotionGlyph · composerIcons · railIcons 가 전부 이 하나를 쓴다.
 */
import type { CSSProperties } from 'react'
import type { Icon } from '../../../components/icons/phosphor'

export type EmotionIconProps = {
  size?: number
  className?: string
  style?: CSSProperties
}

export const duotone =
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
