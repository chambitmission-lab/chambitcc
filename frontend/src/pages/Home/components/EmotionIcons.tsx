/**
 * 홈 피드·PC 레일이 첫 화면부터 쓰는 아이콘 — Phosphor Icons Duotone.
 * 이 파일은 엔트리 번들에 실리므로 첫 화면에 보이는 것만 둔다. 감정 태그(EmotionGlyph)는
 * ./EmotionGlyph.tsx, 기도 작성 시트 전용은 PrayerComposer/composerIcons.tsx, 우측 위젯 레일 전용은
 * rail/railIcons.tsx — 전부 lazy 청크라 그쪽에서만 아이콘을 받는다.
 * (같은 방식: PlanGlyph · GroupGlyph)
 *
 * 색은 currentColor 를 따르므로 기존 text-* 클래스가 그대로 먹는다.
 */
import { Church, HandHeart, HandsPraying, Image } from '../../../components/icons/phosphor'
import { duotone } from './duotoneIcon'

export type { EmotionIconProps } from './duotoneIcon'

/** 기도 — 피드 통계·PC 레일 메뉴 */
export const PrayIcon = duotone(HandsPraying)
/** 말씀 사진 카드 — PC 레일 메뉴·액션 벤토 */
export const ImageIcon = duotone(Image)
/** 감사 한 줄 — 손 위의 마음(감사 화면의 하트 문법을 아이콘으로) */
export const ThanksHandIcon = duotone(HandHeart)
/** 목사님과 함께 — 목회자만 읽는 목양 기도 (피드 헤더·상세) */
export const PastorIcon = duotone(Church)
