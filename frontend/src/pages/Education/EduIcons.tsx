/**
 * /education 부서 아이콘 — 관리자가 DB에 넣은 이모지를 선화(線畫)로 바꿔 그린다.
 * /bible BibleToolIcons·/news NewsIcons 와 같은 문법(24 그리드·currentColor·둥근 캡).
 * 매핑에 없는 이모지는 원래 이모지를 그대로 보여준다 — 관리자가 고른 뜻을 잃지 않게.
 */
import type { ReactElement, SVGProps } from 'react'

const base: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

/** 새싹 — 주일학교·다음세대 */
export function SproutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 20.2v-6.4" />
      <path d="M12 13.8c0-2.8-1.9-4.6-4.9-4.6 0 2.8 1.9 4.6 4.9 4.6z" />
      <path d="M12 13.8c0-3.2 2.1-5.2 5.4-5.2 0 3.2-2.1 5.2-5.4 5.2z" />
      <path d="M7.4 20.2h9.2" />
    </svg>
  )
}

/** 불꽃 — 청년부 */
export function FlameIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2.8c3.6 3.2 5.6 6 5.6 8.6 0 3.4-2.5 5.8-5.6 5.8s-5.6-2.4-5.6-5.8c0-1.3.5-2.6 1.5-3.9.4 1.2 1.1 2 2.1 2.3-.4-2.6.3-4.9 2-7z" />
      <path d="M12 21.2v-4" />
    </svg>
  )
}

/** 두 손이 받쳐 든 하트 — 새가족 양육·섬김 */
export function ServeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 18.4c-2.9-2-5.5-3.9-5.5-6.4a3 3 0 0 1 5.5-1.7 3 3 0 0 1 5.5 1.7c0 2.5-2.6 4.4-5.5 6.4z" />
      <path d="M3.2 21c1.1-2 2.7-3.2 4.7-3.5M20.8 21c-1.1-2-2.7-3.2-4.7-3.5" />
    </svg>
  )
}

/** 펼친 책 — 훈련 과정·성경공부 */
export function OpenBookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M3.6 5.6c2.6-.9 5.4-.7 8.4 1.2 3-1.9 5.8-2.1 8.4-1.2v12c-2.6-.9-5.4-.7-8.4 1.2-3-1.9-5.8-2.1-8.4-1.2z" />
      <path d="M12 6.8v12" />
    </svg>
  )
}

/** 집 — 구역·가정 */
export function HouseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M3.8 10.6 12 4.2l8.2 6.4v8.4a1.6 1.6 0 0 1-1.6 1.6H5.4a1.6 1.6 0 0 1-1.6-1.6z" />
      <path d="M9.6 20.6v-5.4a2.4 2.4 0 0 1 4.8 0v5.4" />
    </svg>
  )
}

/** 해 — QT·아침 묵상 */
export function SunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7" />
    </svg>
  )
}

/** 양 — 목자 훈련 */
export function SheepIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M8.6 8.4a2.6 2.6 0 1 1 1.8-4.5 2.6 2.6 0 0 1 4.4 1 2.6 2.6 0 0 1 1.8 4.6 2.6 2.6 0 0 1-2.4 3.5H10a2.6 2.6 0 0 1-1.4-4.6z" />
      <path d="M10 13v3.4M14.4 13v3.4" />
      <path d="M17.6 9.6c1.4 0 2.4 1 2.4 2.2s-1 2-2.2 2" />
    </svg>
  )
}

/** 십자가 — 신앙·훈련 */
export function CrossIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.2v17.6M7.4 8.4h9.2" />
    </svg>
  )
}

/** 음표 — 찬양대·워십 */
export function MusicIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M9.4 17.6V5.8l9.2-2v11.6" />
      <circle cx="7.2" cy="17.6" r="2.4" />
      <circle cx="16.4" cy="15.4" r="2.2" />
    </svg>
  )
}

/** 사람 셋 — 공동체·소그룹 */
export function PeopleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="9.6" cy="8.2" r="3.1" />
      <path d="M3.8 19.4c0-3.1 2.6-5.2 5.8-5.2s5.8 2.1 5.8 5.2" />
      <path d="M16.4 5.4a3.1 3.1 0 0 1 0 5.6" />
      <path d="M17.6 14.6c1.7.7 2.8 2.2 2.8 4.1" />
    </svg>
  )
}

/** 학사모 — 교육·수료 */
export function GraduationIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M2.8 9.4 12 5.2l9.2 4.2-9.2 4.2z" />
      <path d="M6.6 11.4v4.4c0 1.6 2.4 2.8 5.4 2.8s5.4-1.2 5.4-2.8v-4.4" />
      <path d="M20.6 9.8v5" />
    </svg>
  )
}

/** 예배당 — 교회·연합 */
export function ChurchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2.6v3.8M10.3 4.2h3.4" />
      <path d="M4.8 20.4v-7.6L12 8.4l7.2 4.4v7.6z" />
      <path d="M10 20.4v-3.8a2 2 0 0 1 4 0v3.8" />
    </svg>
  )
}

/** 별 — 특별·비전 */
export function StarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="m12 3.4 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.8-5.4 2.8 1-6-4.4-4.3 6.1-.9z" />
    </svg>
  )
}

/** 하트 — 사랑·돌봄 */
export function HeartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 20.4c-3.6-2.5-7-4.9-7-8.2A3.8 3.8 0 0 1 12 9.8a3.8 3.8 0 0 1 7 2.4c0 3.3-3.4 5.7-7 8.2z" />
    </svg>
  )
}

/** 노트와 연필 — 기록·과제 */
export function NoteIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M18.4 12.6v6.2a1.8 1.8 0 0 1-1.8 1.8H5.4a1.8 1.8 0 0 1-1.8-1.8V7.2a1.8 1.8 0 0 1 1.8-1.8h6" />
      <path d="m16.4 3.8 3.8 3.8-7 7-3.8-.1-.1-3.8z" />
    </svg>
  )
}

/** 비둘기 대신 잎 든 가지 — 평화·성령 */
export function DoveIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M20.4 4.6c-1.8 4.6-4 7.8-6.6 9.6-2.6 1.8-5 2.4-7.2 1.8l-2.6 3.4" />
      <path d="M13.8 8.2c1.4-.7 2.5-.6 3.4.3-1 1-2.2 1.1-3.4-.3zM10.6 11.6c1.5-.5 2.6-.2 3.4.9-1.2.8-2.4.6-3.4-.9z" />
    </svg>
  )
}

/** 지구 — 선교·열방 */
export function GlobeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M3.4 12h17.2" />
      <path d="M12 3.4c2.2 2.4 3.3 5.2 3.3 8.6s-1.1 6.2-3.3 8.6c-2.2-2.4-3.3-5.2-3.3-8.6S9.8 5.8 12 3.4z" />
    </svg>
  )
}

/** 연필 — 관리·편집 */
export function PencilIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="m15.6 4.2 4.2 4.2L9.4 18.8l-5 .8.8-5z" />
      <path d="m13.8 6 4.2 4.2" />
    </svg>
  )
}

type IconFn = (props: SVGProps<SVGSVGElement>) => ReactElement

/** 이모지 → 선화 매핑. 이모지는 변이 선택자(FE0F) 없이 비교한다. */
const EMOJI_ICONS: Record<string, IconFn> = {
  '🌱': SproutIcon,
  '🌿': SproutIcon,
  '🍀': SproutIcon,
  '🔥': FlameIcon,
  '🤝': ServeIcon,
  '🫂': ServeIcon,
  '📖': OpenBookIcon,
  '📕': OpenBookIcon,
  '📗': OpenBookIcon,
  '📘': OpenBookIcon,
  '📚': OpenBookIcon,
  '🏠': HouseIcon,
  '🏡': HouseIcon,
  '☀': SunIcon,
  '🌞': SunIcon,
  '🌅': SunIcon,
  '🐑': SheepIcon,
  '🐏': SheepIcon,
  '✝': CrossIcon,
  '✞': CrossIcon,
  '🎵': MusicIcon,
  '🎶': MusicIcon,
  '🎼': MusicIcon,
  '🎤': MusicIcon,
  '👥': PeopleIcon,
  '👨‍👩‍👧': PeopleIcon,
  '🧑‍🤝‍🧑': PeopleIcon,
  '🎓': GraduationIcon,
  '⛪': ChurchIcon,
  '⭐': StarIcon,
  '🌟': StarIcon,
  '✨': StarIcon,
  '❤': HeartIcon,
  '💕': HeartIcon,
  '💗': HeartIcon,
  '📝': NoteIcon,
  '✏': NoteIcon,
  '🕊': DoveIcon,
  '🌏': GlobeIcon,
  '🌍': GlobeIcon,
  '🌎': GlobeIcon,
  '🌐': GlobeIcon,
}

/** 이모지 문자열에서 변이 선택자·스킨톤을 걷어낸 대표 글자 */
const normalize = (emoji: string) => emoji.replace(/[︎️]/g, '').trim()

interface EduGlyphProps {
  emoji?: string | null
  size?: number
  className?: string
}

/**
 * 부서 이모지를 선화 아이콘으로 바꿔 그린다.
 * 매핑에 없으면 원래 이모지를, 이모지 자체가 없으면 null 을 돌려준다.
 */
export const EduGlyph = ({ emoji, size = 16, className }: EduGlyphProps): ReactElement | null => {
  if (!emoji) return null
  const key = normalize(emoji)
  const Icon = EMOJI_ICONS[key]
  if (!Icon) {
    return (
      <span aria-hidden="true" className={className} style={{ fontSize: size, lineHeight: 1 }}>
        {emoji}
      </span>
    )
  }
  return <Icon width={size} height={size} className={className} />
}
