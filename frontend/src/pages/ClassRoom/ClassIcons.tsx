/**
 * 우리반 알림장 아이콘 — 컬러 이모지(📢 📅 📌 …)를 걷어낸 자리.
 * /education EduIcons 와 같은 문법(24 그리드·currentColor·둥근 캡·strokeWidth 1.8).
 * 부서·그룹처럼 DB 이모지를 매핑하는 화면이 아니므로 이모지→아이콘 맵은 없다.
 */
import type { ReactElement, SVGProps } from 'react'

export type IconFn = (props: SVGProps<SVGSVGElement>) => ReactElement

const base: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

/** 확성기 — 공지 */
export function MegaphoneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4.2 10.2v3.6a1.4 1.4 0 0 0 1.4 1.4h2l6.6 3.9a.8.8 0 0 0 1.2-.7V5.6a.8.8 0 0 0-1.2-.7L7.6 8.8h-2a1.4 1.4 0 0 0-1.4 1.4z" />
      <path d="M18.2 9.4a4.6 4.6 0 0 1 0 5.2" />
    </svg>
  )
}

/** 달력 — 일정 */
export function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="3.8" y="5.6" width="16.4" height="14.6" rx="2.2" />
      <path d="M3.8 10h16.4M8.2 3.2v4M15.8 3.2v4" />
    </svg>
  )
}

/** 카메라 — 사진·앨범 */
export function CameraIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M3.6 8.6a2 2 0 0 1 2-2h1.9l1.5-2.2h6l1.5 2.2h1.9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5.6a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="13" r="3.4" />
    </svg>
  )
}

/** 투표함에 들어가는 체크 용지 — 투표 */
export function BallotIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4.2 13.2h15.6v5.4a1.8 1.8 0 0 1-1.8 1.8H6a1.8 1.8 0 0 1-1.8-1.8z" />
      <path d="M9.2 13.2h5.6" />
      <path d="M8.4 9.6V4.4a1 1 0 0 1 1-1h5.2a1 1 0 0 1 1 1v5.2" />
      <path d="m10.4 6.2 1.3 1.3 2.3-2.5" />
    </svg>
  )
}

/** 막대 차트 — 리포트 */
export function ChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4.4 3.8v14a1.8 1.8 0 0 0 1.8 1.8h13.4" />
      <path d="M8.8 15v-4.4M12.8 15V7.4M16.8 15v-4.6" />
    </svg>
  )
}

/** 클립보드 — 출석부·템플릿 */
export function ClipboardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="5.2" y="4.6" width="13.6" height="15.6" rx="2" />
      <rect x="9.2" y="2.8" width="5.6" height="3.4" rx="1" />
      <path d="M9 12h6M9 15.6h4" />
    </svg>
  )
}

/** 압정 — 상단 고정 */
export function PinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 17.4v4" />
      <path d="M9.2 10.9a2 2 0 0 1-1.1 1.8l-1.5.7a2 2 0 0 0-1.1 1.8v.6a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-.6a2 2 0 0 0-1.1-1.8l-1.5-.7a2 2 0 0 1-1.1-1.8V6h.6a1.8 1.8 0 0 0 0-3.6H8.6a1.8 1.8 0 0 0 0 3.6h.6z" />
    </svg>
  )
}

/** 시계 — 예약·마감 */
export function ClockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.8" />
      <path d="M12 7.2V12l3.2 2" />
    </svg>
  )
}

/** 우체통 — 빈 피드 */
export function MailboxIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M3.8 16.6h16.4v-4.8a4.8 4.8 0 0 0-4.8-4.8H8.6a4.8 4.8 0 0 0-4.8 4.8z" />
      <path d="M12 16.6v4M8.2 20.6h7.6" />
      <path d="M16.6 7V3.6h2.8" />
    </svg>
  )
}

/** 깃발 꽂힌 교사(校舍) — 우리 반 */
export function SchoolIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M5 20.6V10l7-5 7 5v10.6" />
      <path d="M3.4 20.6h17.2" />
      <path d="M10 20.6v-4a2 2 0 0 1 4 0v4" />
      <path d="M12 5V2.4h2.6v1.8H12" />
    </svg>
  )
}

/** 봉투 — 초대 */
export function EnvelopeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="3.6" y="5.4" width="16.8" height="13.2" rx="2" />
      <path d="m4.6 6.8 7.4 5.8 7.4-5.8" />
    </svg>
  )
}

/** 과녁 — 가리고 외우기 */
export function TargetIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.6" />
      <circle cx="12" cy="12" r="4.8" />
      <circle cx="12" cy="12" r="1.2" />
    </svg>
  )
}

/** 열쇠 — 로그인 안내 */
export function KeyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="7.8" cy="16.2" r="3.9" />
      <path d="M10.7 13.3 20 4" />
      <path d="m16.6 7.4 2.6 2.6" />
    </svg>
  )
}

/** 시무룩한 얼굴 — 초대장 없음 */
export function SadFaceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.8" />
      <path d="M8.8 9.6h.4M14.8 9.6h.4" />
      <path d="M8.5 15.9c1-1.3 2.2-1.9 3.5-1.9s2.5.6 3.5 1.9" />
    </svg>
  )
}

/** 눈 — 조회수 */
export function EyeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M3 12c2.2-3.9 5.2-5.9 9-5.9s6.8 2 9 5.9c-2.2 3.9-5.2 5.9-9 5.9S5.2 15.9 3 12z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  )
}

/** 그림 — 말씀카드 */
export function ImageIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="3.8" y="4.6" width="16.4" height="14.8" rx="2.2" />
      <circle cx="9" cy="9.6" r="1.6" />
      <path d="m4.6 17.4 4.4-4.6 3.2 3.2 2.8-3 4.4 4.4" />
    </svg>
  )
}

/** 위치 핀 — 장소 */
export function MapPinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21.2s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  )
}

/** 체크 동그라미 — 확인 완료 */
export function CheckCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.8" />
      <path d="m8.4 12.4 2.5 2.5 4.7-5.3" />
    </svg>
  )
}

/** 사람 한 명 — 자녀·멤버 */
export function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8.4" r="3.6" />
      <path d="M5.4 20.2c.7-3.5 3.3-5.5 6.6-5.5s5.9 2 6.6 5.5" />
    </svg>
  )
}

// 다른 화면과 같은 모양을 쓰는 아이콘은 EduIcons 원본을 그대로 재수출한다
export { BellIcon, HeartIcon, OpenBookIcon, PeopleIcon, SproutIcon, StarIcon } from '../Education/EduIcons'
