// Phosphor 아이콘 로컬 서브셋의 공통 베이스.
// @phosphor-icons/react 의 IconBase 와 같은 props(size·color·weight·mirrored·alt)를 받되,
// 패스 데이터는 scripts/gen-phosphor-icons.mjs 가 실제 쓰는 굵기만 뽑아 generated/ 에 둔다.
// (원본 패키지는 아이콘마다 6굵기를 전부 실어 엔트리 번들의 25% 를 차지했다)
import { forwardRef, type ForwardRefExoticComponent, type ReactNode, type RefAttributes, type SVGProps } from 'react'

export type IconWeight = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'

export interface IconProps extends SVGProps<SVGSVGElement> {
  alt?: string
  color?: string
  size?: string | number
  weight?: IconWeight
  mirrored?: boolean
}

export type Icon = ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>

type WeightRenderers = Partial<Record<IconWeight, () => ReactNode>>

// 요청한 굵기가 서브셋에 없으면 있는 것 중 하나로 대신 그린다(빈 아이콘 방지).
// 새 굵기를 쓰기 시작했다면 생성기를 다시 돌려야 한다 — 개발 모드에서 경고로 알린다.
const FALLBACK_ORDER: IconWeight[] = ['duotone', 'regular', 'bold', 'light', 'fill', 'thin']

const warned = new Set<string>()

const pickRenderer = (name: string, renderers: WeightRenderers, weight: IconWeight) => {
  const exact = renderers[weight]
  if (exact) return exact
  if (import.meta.env.DEV && !warned.has(`${name}/${weight}`)) {
    warned.add(`${name}/${weight}`)
    console.warn(`[phosphor subset] ${name}: '${weight}' 굵기가 서브셋에 없습니다. scripts/gen-phosphor-icons.mjs 를 다시 실행하세요.`)
  }
  for (const w of FALLBACK_ORDER) {
    const r = renderers[w]
    if (r) return r
  }
  return () => null
}

export const createIcon = (name: string, renderers: WeightRenderers): Icon => {
  const Component = forwardRef<SVGSVGElement, IconProps>(
    ({ alt, color = 'currentColor', size, weight = 'regular', mirrored = false, children, ...rest }, ref) => {
      const render = pickRenderer(name, renderers, weight)
      return (
        <svg
          ref={ref}
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          fill={color}
          viewBox="0 0 256 256"
          transform={mirrored ? 'scale(-1, 1)' : undefined}
          {...rest}
        >
          {alt ? <title>{alt}</title> : null}
          {children}
          {render()}
        </svg>
      )
    },
  )
  Component.displayName = `${name}Icon`
  return Component
}
