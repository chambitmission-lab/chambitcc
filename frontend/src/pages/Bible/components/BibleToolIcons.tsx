/**
 * 성경 공부 도구 카드 전용 아이콘 — 참빛이 직접 그린 선화(線畫).
 * Material 글리프 대신 사용. stroke는 currentColor라 부모 색을 따른다.
 *
 * - StoryIcon      : 펼친 책에서 돋는 새싹 (처음 만나는 성경 = 첫걸음)
 * - SituationIcon  : 빛살을 받은 마음 (상황별 성구)
 * - PhotoVerseIcon : 사진 위에 얹힌 말씀 한 줄 (말씀 사진 카드)
 * - ListenIcon     : 책갈피 리본에서 퍼지는 소리 (즐겨찾기 구절 듣기)
 * - BibleBookIcon  : 닫힌 성경 + 십자가 + 가름끈 (이어 읽기 카드)
 */
import type { SVGProps } from 'react'

const base: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export function StoryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7c2.4-.9 5-.9 8 .7 3-1.6 5.6-1.6 8-.7v11c-2.4-.9-5-.9-8 .7-3-1.6-5.6-1.6-8-.7z" />
      <path d="M12 11V7.7" />
      <path d="M12 7.7c-.3-1.6-1.3-2.4-2.8-2.3.3 1.6 1.3 2.4 2.8 2.3zM12 7.7c.3-1.6 1.3-2.4 2.8-2.3-.3 1.6-1.3 2.4-2.8 2.3z" />
    </svg>
  )
}

export function SituationIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 20s-6-3.8-6-8.2A3.4 3.4 0 0 1 12 9.7a3.4 3.4 0 0 1 6 2.1C18 16.2 12 20 12 20z" />
      <path d="M12 3.5v2M7.5 5.3l1.1 1.5M16.5 5.3l-1.1 1.5" />
    </svg>
  )
}

export function PhotoVerseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="5" width="16" height="14" rx="2.5" />
      <path d="M4 15.5l4-4 3.3 3.3 2.2-2.2 6.5 5" />
      <path d="M8 8.5h4" />
    </svg>
  )
}

export function ListenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M6.5 4h8v15l-4-3-4 3z" />
      <path d="M17.5 9c1.1 1.2 1.1 3 0 4.2M19.8 6.8c2.2 2.4 2.2 6.2 0 8.6" />
    </svg>
  )
}

/** 닫힌 성경 + 십자가 + 아래로 늘어진 가름끈 (이어 읽기 = 읽던 자리) */
export function BibleBookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={1.8} {...props}>
      <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3H18v16H7.5A1.5 1.5 0 0 1 6 17.5z" />
      <path d="M6 17.5A1.5 1.5 0 0 1 7.5 16H18" />
      <path d="M12 6.5v4M10.2 8h3.6" />
      <path d="M14.2 16h2v5l-1-.9-1 .9z" fill="currentColor" stroke="none" />
    </svg>
  )
}
