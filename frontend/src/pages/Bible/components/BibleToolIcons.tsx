/**
 * 성경 허브 카드 아이콘 — Phosphor Icons Duotone.
 * 색은 currentColor라 부모(.dash-card__icon 의 흰색)를 따르고,
 * 크기는 className(.dash-card__glyph 등)의 width/height CSS가 정한다.
 * (도구 일곱 개의 아이콘은 2026-11-27 무대+썸네일 개편으로 내용 미리보기가 대신한다 — components/HubTools.tsx)
 *
 * - BibleBookIcon : 책갈피 꽂힌 책 (이어 읽기 = 읽던 자리)
 */
import type { CSSProperties } from 'react'
import { BookBookmark, type Icon } from '../../../components/icons/phosphor'

export type BibleToolIconProps = {
  className?: string
  style?: CSSProperties
  size?: number | string
}

const duotone =
  (Base: Icon) =>
  ({ className, style, size }: BibleToolIconProps) => (
    <Base
      // size 미지정 시 CSS(width/height)가 결정하도록 1em 기본값
      size={size ?? '1em'}
      weight="duotone"
      color="currentColor"
      className={className}
      style={style}
      aria-hidden="true"
    />
  )

export const BibleBookIcon = duotone(BookBookmark)
