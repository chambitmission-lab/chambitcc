// 디지털 주보 라인 아이콘 — 24 격자, currentColor 선 하나. 이모지 대신(라인 아이콘 세트 방침).
const PATHS = {
  left: 'M14.5 6l-6 6 6 6',
  right: 'M9.5 6l6 6-6 6',
  chev: 'M9.5 6l6 6-6 6',
  book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5',
  clock: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM12 7.5V12l3 2',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  paper: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6',
  cal: 'M6.5 5h11a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-11a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3zM3.5 10h17M8 3v4M16 3v4',
  mega: 'M4 10v4h3l7 4V6L7 10zM17.5 9a4 4 0 0 1 0 6',
  gavel: 'M14 4l6 6M11 7l6 6M12.5 5.5l-6 6 3 3 6-6M8 13l-5 5 2 2 5-5',
  card: 'M5.5 6h13A2.5 2.5 0 0 1 21 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5v-8A2.5 2.5 0 0 1 5.5 6zM3 10.5h18M7 15h4',
  people: 'M9 4.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4zM3 20a6 6 0 0 1 12 0M16 4.5a3 3 0 0 1 0 6M21 20a5 5 0 0 0-4-4.9',
  walk: 'M13 2.7a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6zM10 21l2-6-2.5-2.5L11 8l3 2.5 3 1M9.5 12.5L7 14',
  list: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
  phone: 'M5 4h3.5l1.5 4-2 1.5a11 11 0 0 0 6.5 6.5l1.5-2 4 1.5V19a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
} as const

export type WeeklyIconName = keyof typeof PATHS

export const WIcon = ({ name, className = '' }: { name: WeeklyIconName; className?: string }) => (
  <svg className={`bw-ico ${className}`} viewBox="0 0 24 24" aria-hidden="true">
    <path d={PATHS[name]} />
  </svg>
)
