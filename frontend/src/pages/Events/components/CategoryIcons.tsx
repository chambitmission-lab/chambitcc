/**
 * 일정 카테고리 아이콘 — 이모지 대신 직접 그린 선화(線畫).
 * /bible BibleToolIcons·/news NewsIcons 와 같은 문법(24 그리드·currentColor·둥근 캡).
 * 칩이 활성이면 흰색, 아니면 회색 — 부모 글자색을 그대로 따른다.
 */
import type { ReactElement, SVGProps } from 'react'
import type { EventCategory } from '../../../types/event'

const base: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

/** 십자가 얹은 예배당 — 예배 */
export function WorshipIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2.6v3.8M10.3 4.2h3.4" />
      <path d="M4.8 20.4v-7.6L12 8.4l7.2 4.4v7.6z" />
      <path d="M10 20.4v-3.8a2 2 0 0 1 4 0v3.8" />
    </svg>
  )
}

/** 김 오르는 커피잔 — 모임 */
export function MeetingIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4.2 10.2h11.2v4.4a4.4 4.4 0 0 1-4.4 4.4H8.6a4.4 4.4 0 0 1-4.4-4.4z" />
      <path d="M15.4 11.4h1.8a2.4 2.4 0 0 1 0 4.8h-1.8" />
      <path d="M8 6.8c-.5-.8-.5-1.5 0-2.2M11.6 6.8c-.5-.8-.5-1.5 0-2.2" />
      <path d="M3.4 21h13" />
    </svg>
  )
}

/** 두 손이 받쳐 든 하트 — 봉사 */
export function ServiceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 18.4c-2.9-2-5.5-3.9-5.5-6.4a3 3 0 0 1 5.5-1.7 3 3 0 0 1 5.5 1.7c0 2.5-2.6 4.4-5.5 6.4z" />
      <path d="M3.2 21c1.1-2 2.7-3.2 4.7-3.5M20.8 21c-1.1-2-2.7-3.2-4.7-3.5" />
    </svg>
  )
}

/** 반짝임 둘 — 특별행사 */
export function SpecialIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M11.2 3.6c.9 3.6 1.9 4.6 5.4 5.5-3.5.9-4.5 1.9-5.4 5.5-.9-3.6-1.9-4.6-5.4-5.5 3.5-.9 4.5-1.9 5.4-5.5z" />
      <path d="M17.4 14.4c.4 1.7.9 2.2 2.6 2.6-1.7.4-2.2.9-2.6 2.6-.4-1.7-.9-2.2-2.6-2.6 1.7-.4 2.2-.9 2.6-2.6z" />
    </svg>
  )
}

/** 펼친 책 — 교육 */
export function EducationIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M3.6 5.6c2.6-.9 5.4-.7 8.4 1.2 3-1.9 5.8-2.1 8.4-1.2v12c-2.6-.9-5.4-.7-8.4 1.2-3-1.9-5.8-2.1-8.4-1.2z" />
      <path d="M12 6.8v12" />
    </svg>
  )
}

/** 압정 — 기타 */
export function OtherIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M9.4 3.4h5.2l-.8 5.6 3.6 3.4H6.6l3.6-3.4z" />
      <path d="M12 12.4v8.2" />
    </svg>
  )
}

const CATEGORY_ICONS: Record<
  EventCategory,
  (props: SVGProps<SVGSVGElement>) => ReactElement
> = {
  worship: WorshipIcon,
  meeting: MeetingIcon,
  service: ServiceIcon,
  special: SpecialIcon,
  education: EducationIcon,
  other: OtherIcon,
}

/** 카테고리 키로 아이콘을 고른다. 모르는 값이면 압정. */
export function CategoryIcon({
  category,
  ...props
}: SVGProps<SVGSVGElement> & { category: EventCategory }) {
  const Icon = CATEGORY_ICONS[category] ?? OtherIcon
  return <Icon {...props} />
}
