/* 전체 메뉴용 라인 아이콘 — 스트로크 1.6의 Lucide 계열 톤.
   아이콘 폰트(material-icons)를 쓰지 않아 메뉴를 열 때 글리프가 늦게 뜨는 일이 없다. */

type IconProps = { className?: string }

const Svg = ({ children, className }: IconProps & { children: React.ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className ?? 'w-[22px] h-[22px]'}
    aria-hidden="true"
  >
    {children}
  </svg>
)

/* 소개 — 십자가를 얹은 교회 */
const IconChurch = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 2v4" />
    <path d="M10 4h4" />
    <path d="M12 6 5 11v10h14V11l-7-5Z" />
    <path d="M10 21v-5h4v5" />
  </Svg>
)

/* 발자취 — 이어지는 길 */
const IconTrail = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="6" cy="6.5" r="2.5" />
    <circle cx="18" cy="17.5" r="2.5" />
    <path d="M8.5 6.5H14a3 3 0 0 1 0 6h-4a3 3 0 0 0 0 6h5.5" />
  </Svg>
)

/* 예배 — 십자가 아래 모인 사람들 */
const IconWorship = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 2v8" />
    <path d="M9 4.5h6" />
    <path d="M4 21a8 8 0 0 1 16 0" />
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

/* 문화교실 — 학사모 */
const IconCap = (p: IconProps) => (
  <Svg {...p}>
    <path d="m22 9-10-5L2 9l10 5 10-5Z" />
    <path d="M6 11.5V16c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4.5" />
  </Svg>
)

/* 설교 — 마이크 */
const IconMic = (p: IconProps) => (
  <Svg {...p}>
    <rect x="9" y="2" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0" />
    <path d="M12 18v3" />
    <path d="M9 21h6" />
  </Svg>
)

/* 성경 — 십자가가 새겨진 책 */
const IconBible = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v16H6.5A2.5 2.5 0 0 0 4 20.5V4.5Z" />
    <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v4H6.5A2.5 2.5 0 0 1 4 20.5Z" />
    <path d="M12 6v5" />
    <path d="M9.8 8h4.4" />
  </Svg>
)

/* 칼럼 — 편지를 쓰는 펜 */
const IconPen = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 20h9" />
    <path d="M16.4 3.6a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.4 3.6Z" />
  </Svg>
)

/* 내 그룹 — 사람들 */
const IconUsers = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="3.5" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.3a4 4 0 0 1 0 7.4" />
  </Svg>
)

/* 선교 현황 — 지구 */
const IconGlobe = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" />
  </Svg>
)

/* 소식 — 확성기 */
const IconMegaphone = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 11v2a1 1 0 0 0 1 1h2l9 5V5L6 10H4a1 1 0 0 0-1 1Z" />
    <path d="M18.5 8.8a4.6 4.6 0 0 1 0 6.4" />
    <path d="M7 14.5V19" />
  </Svg>
)

/* 내 정보 — 사람 */
export const IconPerson = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
  </Svg>
)

export const NAV_ICONS = {
  about: IconChurch,
  history: IconTrail,
  worship: IconWorship,
  events: IconCalendar,
  culture: IconCap,
  sermon: IconMic,
  bible: IconBible,
  ministry: IconPen,
  myGroups: IconUsers,
  missionStatus: IconGlobe,
  news: IconMegaphone,
} as const

export type NavIconKey = keyof typeof NAV_ICONS
