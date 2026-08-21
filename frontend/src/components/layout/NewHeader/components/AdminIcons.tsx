/* 관리자 메뉴용 라인 아이콘 — NavIcons와 같은 스트로크 1.6 규격.
   OS마다 다르게 그려지던 이모지를 대체한다. */

import { Svg, type IconProps } from './NavIcons'

/* 관리자 홈 — 대시보드 타일 */
const IconDashboard = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
    <rect x="13.5" y="3" width="7.5" height="5" rx="2" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
    <rect x="13.5" y="11" width="7.5" height="10" rx="2" />
  </Svg>
)

/* 돌봄 레이더 — 스윕과 신호점 */
const IconRadar = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4.3" />
    <path d="M12 12 18.4 5.6" />
    <circle cx="15.9" cy="8.6" r="1.15" fill="currentColor" stroke="none" />
  </Svg>
)

/* 말씀 반응 통계 — 막대 그래프 */
const IconChart = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 20.5h17" />
    <path d="M7 20.5V14" />
    <path d="M12 20.5V6.5" />
    <path d="M17 20.5v-9.5" />
  </Svg>
)

/* 오늘의 말씀 — 펼친 책 */
const IconBookOpen = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 6.6C10.4 5.3 8.4 4.6 6 4.6H3v13h3c2.4 0 4.4.7 6 2 1.6-1.3 3.6-2 6-2h3v-13h-3c-2.4 0-4.4.7-6 2Z" />
    <path d="M12 6.6v13" />
  </Svg>
)

/* 주보 — 신문 */
const IconNewspaper = (p: IconProps) => (
  <Svg {...p}>
    <path d="M17 20H5a2 2 0 0 1-2-2V5h14v13a2 2 0 0 0 2 2Z" />
    <path d="M17 9h2.5A1.5 1.5 0 0 1 21 10.5V18a2 2 0 0 1-4 0" />
    <path d="M6.5 9h7M6.5 12.5h7M6.5 16h4" />
  </Svg>
)

/* 공동 기도제목 — 마음에서 올라가는 기도 */
const IconPrayerHeart = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21 7 16.6a3.1 3.1 0 0 1 2.3-5.4 3.1 3.1 0 0 1 2.7 1.7 3.1 3.1 0 0 1 2.7-1.7 3.1 3.1 0 0 1 2.3 5.4L12 21Z" />
    <path d="M12 7.6V3.5" />
    <path d="m8.2 8.3-1-2.6" />
    <path d="m15.8 8.3 1-2.6" />
  </Svg>
)

/* 새가족 앨범 — 새싹 */
const IconSprout = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21v-8.2" />
    <path d="M12 12.8c0-3.3-2.4-5.4-5.9-5.4 0 3.3 2.4 5.4 5.9 5.4Z" />
    <path d="M12 13.3c0-2.9 2.1-4.9 5.1-4.9 0 2.9-2.1 4.9-5.1 4.9Z" />
  </Svg>
)

/* 행사 앨범 — 카메라 */
const IconCamera = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 8.2A2.2 2.2 0 0 1 5.7 6h1.9l1.3-1.8h6.2L16.4 6h1.9a2.2 2.2 0 0 1 2.2 2.2v9.1a2.2 2.2 0 0 1-2.2 2.2H5.7a2.2 2.2 0 0 1-2.2-2.2V8.2Z" />
    <circle cx="12" cy="13" r="3.4" />
  </Svg>
)

/* 읽기 플랜 — 읽음 체크가 있는 성경 */
const IconBookCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19v16H7.5A2.5 2.5 0 0 0 5 20.5V4.5Z" />
    <path d="M5 20.5A2.5 2.5 0 0 1 7.5 18H19v4H7.5A2.5 2.5 0 0 1 5 20.5Z" />
    <path d="m9.4 9.7 1.8 1.8 3.5-3.9" />
  </Svg>
)

/* 성경 해석 생성 — AI가 쓰는 펜 */
const IconPenSparkle = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14.6 3.6a2.1 2.1 0 0 1 3 3L7.2 17 3.5 18l1-3.7L14.6 3.6Z" />
    <path d="m18.8 14 .75 1.9 1.9.75-1.9.75-.75 1.9-.75-1.9-1.9-.75 1.9-.75.75-1.9Z" />
  </Svg>
)

/* 상황별 성구 — 방향을 찾는 나침반 */
const IconCompass = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m15.3 8.7-1.9 4.6-4.6 1.9 1.9-4.6 4.6-1.9Z" />
  </Svg>
)

/* 공지사항 — 확성기 */
const IconMegaphone = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 11v2a1 1 0 0 0 1 1h2l9 5V5L6 10H4a1 1 0 0 0-1 1Z" />
    <path d="M18.5 8.8a4.6 4.6 0 0 1 0 6.4" />
    <path d="M7 14.5V19" />
  </Svg>
)

/* 푸시 알림 — 종 */
const IconBell = (p: IconProps) => (
  <Svg {...p}>
    <path d="M18 9.5a6 6 0 1 0-12 0c0 4.8-2 6.3-2 6.3h16s-2-1.5-2-6.3Z" />
    <path d="M10.2 19.2a2.1 2.1 0 0 0 3.6 0" />
  </Svg>
)

/* 일정 — 달력 */
const IconCalendar = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2.5" />
    <path d="M8 3v4M16 3v4M3 10h18" />
    <path d="M8 14.5h.01M12 14.5h.01M16 14.5h.01" />
  </Svg>
)

/* 문화교실 — 팔레트 */
const IconPalette = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21a9 9 0 1 1 9-9c0 1.9-1.5 3-3.1 3H16a2 2 0 0 0-1.4 3.4c.4.4.4 1.1 0 1.5-.6.7-1.5 1.1-2.6 1.1Z" />
    <circle cx="7.6" cy="12.4" r="1.05" fill="currentColor" stroke="none" />
    <circle cx="9.6" cy="8.2" r="1.05" fill="currentColor" stroke="none" />
    <circle cx="14.4" cy="7.8" r="1.05" fill="currentColor" stroke="none" />
  </Svg>
)

/* 회원 — 명부 위의 사람 */
const IconMember = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.4" />
    <path d="M3.5 20c0-3.2 2.5-5.3 5.5-5.3s5.5 2.1 5.5 5.3" />
    <path d="M17 8.5h4M17 12h4" />
  </Svg>
)

/* 그룹 — 이어진 사람들 */
const IconGroupNodes = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="5.3" r="2.6" />
    <circle cx="5.6" cy="17" r="2.6" />
    <circle cx="18.4" cy="17" r="2.6" />
    <path d="m10.2 7.3-2.8 7.3" />
    <path d="m13.8 7.3 2.8 7.3" />
    <path d="M8.2 17h7.6" />
  </Svg>
)

/* 조직도 — 하나에서 갈라지는 조직 트리 */
const IconOrgChart = (p: IconProps) => (
  <Svg {...p}>
    <rect x="9" y="3" width="6" height="4.5" rx="1.2" />
    <rect x="3" y="16.5" width="6" height="4.5" rx="1.2" />
    <rect x="15" y="16.5" width="6" height="4.5" rx="1.2" />
    <path d="M12 7.5v3.5" />
    <path d="M6 16.5V13h12v3.5" />
  </Svg>
)

/* 챗봇 — 말풍선과 반짝임 */
const IconChatBot = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H9l-4.2 3.3c-.5.4-.8.2-.8-.4V6.5Z" />
    <path d="M8.5 9.5h7" />
    <path d="M8.5 13h4.5" />
  </Svg>
)

/* 섹션 헤더 — 관리 권한 방패 */
export const IconShield = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3 5 6v5.4c0 4.3 2.9 8.1 7 9.6 4.1-1.5 7-5.3 7-9.6V6l-7-3Z" />
    <path d="m9.4 11.9 1.9 1.9 3.5-3.8" />
  </Svg>
)

/* 접기 화살표 */
export const IconChevron = (p: IconProps) => (
  <Svg {...p}>
    <path d="m6 9.5 6 6 6-6" />
  </Svg>
)

export const ADMIN_ICONS = {
  adminNavDashboard: IconDashboard,
  adminNavCare: IconRadar,
  adminNavEngagement: IconChart,
  adminNavVerse: IconBookOpen,
  adminNavBulletin: IconNewspaper,
  adminNavWeeklyPrayer: IconPrayerHeart,
  adminNavNewFamily: IconSprout,
  adminNavEventAlbum: IconCamera,
  adminNavPlan: IconBookCheck,
  adminNavCommentary: IconPenSparkle,
  adminNavSituation: IconCompass,
  adminNavNotice: IconMegaphone,
  adminNavPush: IconBell,
  adminNavChatbot: IconChatBot,
  adminNavEvent: IconCalendar,
  adminNavCulture: IconPalette,
  adminNavOrganization: IconOrgChart,
  adminNavUser: IconMember,
  adminNavGroup: IconGroupNodes,
} as const

export type AdminIconKey = keyof typeof ADMIN_ICONS
