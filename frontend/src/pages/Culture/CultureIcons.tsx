/**
 * /culture 전용 선화(線畫) 아이콘 — 이모지 대신 직접 그렸다.
 * /bible BibleToolIcons·/news NewsIcons 와 같은 문법(24 그리드·currentColor·둥근 캡).
 * 강좌 액센트 아이콘은 부모의 액센트 컬러(currentColor)를 그대로 따른다.
 */
import type { SVGProps } from 'react'

const base: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

/* ── 강좌 액센트 ───────────────────────────── */

/** 팔레트 — 미술·그림 */
export function PaletteIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.4a8.6 8.6 0 0 0 0 17.2c1.2 0 1.9-.8 1.9-1.7 0-.5-.2-.8-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.8-1.7h1.6a4.3 4.3 0 0 0 4.3-4.3c0-3.9-3.9-7.1-8.6-7.1z" />
      <path d="M7.4 12.4h.01M9.2 8.6h.01M13.4 7.8h.01M16.6 10.4h.01" strokeWidth={2.3} />
    </svg>
  )
}

/** 붓 — 캘리그라피·서예 */
export function BrushIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M17.6 3.6 20.4 6.4 11.6 15.2 8.8 12.4z" />
      <path d="M8.8 12.4 6.6 14.6c-1 1-1.1 2.6-.4 3.8-1 .4-1.9.6-3 .6 1.3-2.4 0-3.4 1-4.8" />
    </svg>
  )
}

/** 빵 — 요리·베이킹 */
export function BreadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4.4 10.6c0-2.6 3.4-4.4 7.6-4.4s7.6 1.8 7.6 4.4c0 1.4-1.1 2.2-2.2 2.2v4.4a1.8 1.8 0 0 1-1.8 1.8H8.4a1.8 1.8 0 0 1-1.8-1.8v-4.4c-1.1 0-2.2-.8-2.2-2.2z" />
      <path d="M9.4 12.8v6M14.6 12.8v6" />
    </svg>
  )
}

/** 커피잔 — 커피·차 */
export function CoffeeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4.2 10.2h11.2v4.4a4.4 4.4 0 0 1-4.4 4.4H8.6a4.4 4.4 0 0 1-4.4-4.4z" />
      <path d="M15.4 11.4h1.8a2.4 2.4 0 0 1 0 4.8h-1.8" />
      <path d="M8 6.8c-.5-.8-.5-1.5 0-2.2M11.6 6.8c-.5-.8-.5-1.5 0-2.2" />
      <path d="M3.4 21h13" />
    </svg>
  )
}

/** 음표 둘 — 음악·찬양 */
export function MusicIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M9.4 17.6V5.8l9.2-2v11.6" />
      <circle cx="7.2" cy="17.6" r="2.4" />
      <circle cx="16.4" cy="15.4" r="2.2" />
    </svg>
  )
}

/** 앉아 명상하는 사람 — 요가·운동 */
export function YogaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="5.4" r="2.4" />
      <path d="M12 9v4.6" />
      <path d="M12 13.6c-1.6 0-3 .9-3.8 2.3L7 18.4h10l-1.2-2.5c-.8-1.4-2.2-2.3-3.8-2.3z" />
      <path d="M12 11.2 8 13.2M12 11.2l4 2" />
    </svg>
  )
}

/** 실뭉치 — 공예·뜨개 */
export function YarnIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="11.4" cy="12.4" r="7.2" />
      <path d="M6.2 7.4c3.4 1 6.6 3.4 8.6 6.6M8.2 5.6c2.8 1.6 5 4 6.2 7M5 11c2.6.4 5 1.8 6.6 3.9" />
      <path d="M17.6 16.8c1.4.9 2.2 2 2.4 3.4" />
    </svg>
  )
}

/** 꽃 한 송이 — 꽃꽂이·원예 */
export function FlowerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8.6" r="2.2" />
      <path d="M12 6.4a2.4 2.4 0 1 0-2.1-3.5M12 6.4a2.4 2.4 0 1 1 2.1-3.5" />
      <path d="M10.1 9.8a2.4 2.4 0 1 1-3.9 1.7M13.9 9.8a2.4 2.4 0 1 0 3.9 1.7" />
      <path d="M12 11v9.4" />
      <path d="M12 16.4c-1.7-.2-3-1.3-3.4-3 1.8-.3 3.1.7 3.4 3z" />
    </svg>
  )
}

/** 쌓인 책 — 어학·독서 */
export function BooksIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="3.6" y="14" width="16.8" height="5.6" rx="1.4" />
      <rect x="5.4" y="8.4" width="13.2" height="5.6" rx="1.4" />
      <path d="M8.4 8.4V5.2a1 1 0 0 1 1-1h5.2a1 1 0 0 1 1 1v3.2" />
    </svg>
  )
}

/** 카메라 — 사진·미디어 */
export function CameraIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M3.6 9.6A1.6 1.6 0 0 1 5.2 8h2.2l1.5-2.2h6.2L16.6 8h2.2A1.6 1.6 0 0 1 20.4 9.6v7.8a1.6 1.6 0 0 1-1.6 1.6H5.2a1.6 1.6 0 0 1-1.6-1.6z" />
      <circle cx="12" cy="13.4" r="3.3" />
    </svg>
  )
}

/** 튤립 — 기본 액센트 */
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

/* ── 분기(계절) ───────────────────────────── */

/** 눈 결정 — 1분기 */
export function SnowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2.8v18.4M4 7.4l16 9.2M20 7.4 4 16.6" />
      <path d="M9.4 4.6 12 6.4l2.6-1.8M9.4 19.4 12 17.6l2.6 1.8" />
    </svg>
  )
}

/** 벚꽃 — 2분기 */
export function BlossomIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="2.2" />
      <path d="M12 9.8c0-2.6.8-4.4 2.4-5.4-1.4 0-2.4.6-2.4 1.4 0-.8-1-1.4-2.4-1.4 1.6 1 2.4 2.8 2.4 5.4z" />
      <path d="M14.1 13.1c2.2 1.3 3.3 2.9 3.3 4.8.7-1.2.7-2.4 0-2.8.7.4 1.7 0 2.4-1.2-1.9 0-3.6-.5-5.7-1.8z" />
      <path d="M9.9 13.1c-2.2 1.3-3.3 2.9-3.3 4.8-.7-1.2-.7-2.4 0-2.8-.7.4-1.7 0-2.4-1.2 1.9 0 3.6-.5 5.7-1.8z" />
    </svg>
  )
}

/** 해바라기 — 3분기 */
export function SunflowerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="9.4" r="3" />
      <path d="M12 3.2v2.6M12 13v2.4M5.8 9.4h2.6M15.6 9.4h2.6M7.6 5 9.4 6.8M16.4 5l-1.8 1.8M7.6 13.8l1.8-1.8M16.4 13.8l-1.8-1.8" />
      <path d="M12 15.4v5.4" />
    </svg>
  )
}

/** 낙엽 — 4분기 */
export function LeafIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M20 4.6c-7 0-13 2.8-13 8.4 0 1.6.6 3.1 1.6 4.2C11.4 14 15 10.8 18 9.4c-2.4 1.8-5.8 5-7.6 8.6 1 .5 2.1.8 3.2.8 4.2 0 6.4-4.8 6.4-14.2z" />
      <path d="M8.6 17.2 4.6 21" />
    </svg>
  )
}

/* ── 탭·빈 상태 ───────────────────────────── */

/** 체크된 서류 — 신청 내역 */
export function ClipboardCheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M9 4.6H7.2a1.8 1.8 0 0 0-1.8 1.8v12.2a1.8 1.8 0 0 0 1.8 1.8h9.6a1.8 1.8 0 0 0 1.8-1.8V6.4a1.8 1.8 0 0 0-1.8-1.8H15" />
      <rect x="9" y="2.8" width="6" height="3.6" rx="1.2" />
      <path d="m9.2 13.4 2 2 3.6-3.8" />
    </svg>
  )
}

/** 확성기 — 공지사항 */
export function MegaphoneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M5 9.4h2.3L17 5v14l-9.7-4.4H5A1.6 1.6 0 0 1 3.4 13v-2a1.6 1.6 0 0 1 1.6-1.6z" />
      <path d="M7.3 14.6v3.1a1.7 1.7 0 0 0 3.4 0v-1.6" />
      <path d="M19.9 9.7a3.9 3.9 0 0 1 0 4.6" />
    </svg>
  )
}

/** 헤드셋 — 문의 */
export function SupportIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4.6 15.4v-3.2a7.4 7.4 0 0 1 14.8 0v3.2" />
      <path d="M4.6 13.4h1.6a1.4 1.4 0 0 1 1.4 1.4v2.4a1.4 1.4 0 0 1-1.4 1.4H6a1.4 1.4 0 0 1-1.4-1.4zM19.4 13.4h-1.6a1.4 1.4 0 0 0-1.4 1.4v2.4a1.4 1.4 0 0 0 1.4 1.4h.2a1.4 1.4 0 0 0 1.4-1.4z" />
      <path d="M19.4 18.6c0 1.3-1.6 2.3-3.6 2.3" />
    </svg>
  )
}

/** 새싹 — 개설된 강좌 없음 */
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

/** 돋보기 — 조회 결과 없음 */
export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="10.8" cy="10.8" r="6.4" />
      <path d="M15.6 15.6 20.4 20.4" />
    </svg>
  )
}

/** 빈 우편함 — 공지 없음 */
export function EmptyMailIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M3.6 11.2 12 5.2l8.4 6v7.2a1.6 1.6 0 0 1-1.6 1.6H5.2a1.6 1.6 0 0 1-1.6-1.6z" />
      <path d="m3.6 11.2 8.4 5.6 8.4-5.6" />
    </svg>
  )
}
