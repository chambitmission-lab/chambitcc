/**
 * 성경 공부 도구 카드 전용 아이콘 — Phosphor Icons Duotone.
 * 플랜·기도방·홈 레일과 같은 세트로 맞춰 앱 전체 아이콘 결을 통일한다.
 * 색은 currentColor라 부모(.dash-card__icon 의 흰색)를 따르고,
 * 크기는 className(.dash-card__glyph 등)의 width/height CSS가 정한다.
 *
 * - StoryIcon      : 글이 적힌 펼친 책 (처음 만나는 성경 = 첫걸음)
 * - SituationIcon  : 손 위의 마음 (상황별 성구 = 지금 마음에 맞는 말씀)
 * - PhotoVerseIcon : 사진 프레임 (말씀 사진 카드)
 * - ListenIcon     : 헤드폰 (즐겨찾기 구절 듣기)
 * - BibleBookIcon  : 책갈피 꽂힌 책 (이어 읽기 = 읽던 자리)
 */
import type { CSSProperties } from 'react'
import {
  BookBookmark,
  BookOpenText,
  HandHeart,
  Headphones,
  ImageSquare,
  type Icon,
} from '../../../components/icons/phosphor'

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

export const StoryIcon = duotone(BookOpenText)
export const SituationIcon = duotone(HandHeart)
export const PhotoVerseIcon = duotone(ImageSquare)
export const ListenIcon = duotone(Headphones)
export const BibleBookIcon = duotone(BookBookmark)
