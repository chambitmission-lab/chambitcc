/**
 * /news 전용 선화(線畫) 아이콘 — 이모지 대신 직접 그린 SVG.
 * /bible 의 BibleToolIcons 와 같은 문법(24 그리드·currentColor·둥근 캡)이라
 * 인장 마커 위(흰색)든 카드 위(브랜드색)든 부모 색을 그대로 따른다.
 *
 * - MegaphoneIcon : 확성기 + 소리 결 (소식)
 * - BulletinIcon  : 십자가 머리글이 얹힌 주간 인쇄물 (주보)
 * - SproutIcon    : 흙에서 갓 올라온 두 잎 새싹 (새가족)
 * - AlbumIcon     : 셔터를 든 카메라 (행사 앨범)
 * - ImagePageIcon : 사진 한 장 (이미지 주보)
 * - ScreenPageIcon: 글이 흐르는 화면 (디지털 주보)
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

/** 확성기 — 손잡이를 쥔 각도로 살짝 기울여 '알린다'는 동작을 남긴다 */
export function MegaphoneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M5 9.4h2.3L17 5v14l-9.7-4.4H5A1.6 1.6 0 0 1 3.4 13v-2a1.6 1.6 0 0 1 1.6-1.6z" />
      <path d="M7.3 14.6v3.1a1.7 1.7 0 0 0 3.4 0v-1.6" />
      <path d="M19.9 9.7a3.9 3.9 0 0 1 0 4.6" />
    </svg>
  )
}

/** 주간 인쇄물 — 머리글 자리에 작은 십자가, 아래로 본문 두 줄 */
export function BulletinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="4.6" y="3.6" width="14.8" height="16.8" rx="2.2" />
      <path d="M12 6.3v3.4M10.3 8h3.4" />
      <path d="M8.2 13.2h7.6M8.2 16.6h4.8" />
    </svg>
  )
}

/** 새싹 — 잎 둘이 서로 다른 높이라 갓 돋은 느낌이 산다 */
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

/** 카메라 — 행사 앨범 */
export function AlbumIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M3.6 9.6A1.6 1.6 0 0 1 5.2 8h2.2l1.5-2.2h6.2L16.6 8h2.2A1.6 1.6 0 0 1 20.4 9.6v7.8a1.6 1.6 0 0 1-1.6 1.6H5.2a1.6 1.6 0 0 1-1.6-1.6z" />
      <circle cx="12" cy="13.4" r="3.3" />
    </svg>
  )
}

/** 사진 한 장 — 이미지 주보 */
export function ImagePageIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="3.8" y="5" width="16.4" height="14" rx="2.2" />
      <path d="M3.8 15.4l3.9-3.8 3.2 3.2 2.2-2.1 6.3 4.8" />
      <circle cx="8.6" cy="9.3" r="1.2" />
    </svg>
  )
}

/** 화면 위를 흐르는 글 — 디지털 주보 */
export function ScreenPageIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="7.2" y="3.4" width="9.6" height="17.2" rx="2.4" />
      <path d="M10 8h4M10 11.4h4M10 14.8h2.4" />
    </svg>
  )
}

/** 사람 둘 — 구역·모임 */
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

/** 달력 — 일정 */
export function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="3.6" y="5.4" width="16.8" height="15" rx="2.4" />
      <path d="M3.6 10h16.8" />
      <path d="M8.4 3.4v3.6M15.6 3.4v3.6" />
      <path d="M8.2 14h.01M12 14h.01M15.8 14h.01" strokeWidth={2.2} />
    </svg>
  )
}

/** 시계 — 시간 */
export function ClockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.4V12l3 1.8" />
    </svg>
  )
}

/** 핀 — 장소 */
export function PinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21c3.7-4.2 5.6-7.3 5.6-9.6A5.6 5.6 0 0 0 6.4 11.4c0 2.3 1.9 5.4 5.6 9.6z" />
      <circle cx="12" cy="11.2" r="2.2" />
    </svg>
  )
}

/** 반짝임 — 설교·강조 */
export function SparkleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M11.2 3.6c.9 3.6 1.9 4.6 5.4 5.5-3.5.9-4.5 1.9-5.4 5.5-.9-3.6-1.9-4.6-5.4-5.5 3.5-.9 4.5-1.9 5.4-5.5z" />
      <path d="M17.4 14.4c.4 1.7.9 2.2 2.6 2.6-1.7.4-2.2.9-2.6 2.6-.4-1.7-.9-2.2-2.6-2.6 1.7-.4 2.2-.9 2.6-2.6z" />
    </svg>
  )
}

/** 서랍 달린 보관함 — 지난 주보 아카이브 */
export function ArchiveIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="3.4" y="4.6" width="17.2" height="4.4" rx="1.6" />
      <path d="M5.2 9v9a1.8 1.8 0 0 0 1.8 1.8h10a1.8 1.8 0 0 0 1.8-1.8V9" />
      <path d="M10 13h4" />
    </svg>
  )
}

/* ── 행사 태그 아이콘 ─────────────────────────────
   앨범 태그 칩에 곁들이는 선화. 이모지 자리를 그대로 대체한다. */

/** 튤립 — 부활절 */
export function TulipIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 20.8v-8" />
      <path d="M7.8 6.6c1.3.9 2.3 1.7 4.2 1.7s2.9-.8 4.2-1.7v4.2A4.2 4.2 0 0 1 12 15a4.2 4.2 0 0 1-4.2-4.2z" />
      <path d="M12 8.3V15" />
      <path d="M12 18.4c-1.7.2-3-.6-3.6-2.3 1.8-.4 3.1.3 3.6 2.3z" />
    </svg>
  )
}

/** 전나무 — 성탄 */
export function TreeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.4 8.2 9.2h2.2L7 14h3l-3 4.2h10L14 14h3l-3.4-4.8h2.2z" />
      <path d="M10.7 18.2v2.4h2.6v-2.4" />
    </svg>
  )
}

/** 밀 이삭 — 추수감사 */
export function WheatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21V7.6" />
      <path d="M12 8.4c-2.3 0-3.5-1.3-3.5-3.6 2.3 0 3.5 1.3 3.5 3.6zM12 8.4c2.3 0 3.5-1.3 3.5-3.6-2.3 0-3.5 1.3-3.5 3.6z" />
      <path d="M12 13.4c-2.3 0-3.5-1.3-3.5-3.6 2.3 0 3.5 1.3 3.5 3.6zM12 13.4c2.3 0 3.5-1.3 3.5-3.6-2.3 0-3.5 1.3-3.5 3.6z" />
    </svg>
  )
}

/** 텐트 — 수련회 */
export function TentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4.6 3.4 19.4h17.2z" />
      <path d="M12 10.6 8.7 19.4h6.6z" />
    </svg>
  )
}

/** 손잡이 바구니 — 야유회 */
export function BasketIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4.2 10.6h15.6l-1.3 8.1a1.7 1.7 0 0 1-1.7 1.4H7.2a1.7 1.7 0 0 1-1.7-1.4z" />
      <path d="M8.5 10.6a3.5 3.5 0 0 1 7 0" />
      <path d="M9.7 13.8l.5 3.6M14.3 13.8l-.5 3.6" />
    </svg>
  )
}

/** 십자가 얹은 예배당 — 예배 */
export function ChurchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2.6v3.8M10.3 4.2h3.4" />
      <path d="M4.8 20.4v-7.6L12 8.4l7.2 4.4v7.6z" />
      <path d="M10 20.4v-3.8a2 2 0 0 1 4 0v3.8" />
    </svg>
  )
}

/** 촛불 — 절기 */
export function CandleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="9" y="10.6" width="6" height="9.8" rx="1.4" />
      <path d="M12 10.6V9" />
      <path d="M12 4c1.7 1.4 2.4 2.5 2.4 3.5a2.4 2.4 0 0 1-4.8 0C9.6 6.5 10.3 5.4 12 4z" />
    </svg>
  )
}

/** 점 셋 — 기타 */
export function MoreDotsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" strokeWidth={2.4} />
    </svg>
  )
}

const TAG_ICONS: Record<string, (props: SVGProps<SVGSVGElement>) => ReactElement> = {
  부활절: TulipIcon,
  성탄: TreeIcon,
  추수감사: WheatIcon,
  수련회: TentIcon,
  야유회: BasketIcon,
  예배: ChurchIcon,
  절기: CandleIcon,
  기타: MoreDotsIcon,
}

/** 행사 태그 이름으로 아이콘을 고른다. 모르는 태그는 카메라. */
export function EventTagIcon({ tag, ...props }: SVGProps<SVGSVGElement> & { tag: string }) {
  const Icon = TAG_ICONS[tag] ?? AlbumIcon
  return <Icon {...props} />
}
