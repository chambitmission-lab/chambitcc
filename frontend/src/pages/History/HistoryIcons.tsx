/**
 * /history 발자취 아이콘 — 기록 데이터(historyData·historyThemes)의 이모지를 선화로 바꿔 그린다.
 * /bible BibleToolIcons·/news NewsIcons 와 같은 문법(24 그리드·currentColor·둥근 캡).
 * 데이터에는 이모지를 그대로 두고(집필이 쉬운 형태) 렌더 시점에 매핑한다.
 * 매핑에 없는 이모지는 원래 이모지를 그대로 보여준다.
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

const S = (d: ReactElement) => d

/** 두 손이 받쳐 든 하트 — 기도·헌신 */
export const PrayIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M12 18.4c-2.9-2-5.5-3.9-5.5-6.4a3 3 0 0 1 5.5-1.7 3 3 0 0 1 5.5 1.7c0 2.5-2.6 4.4-5.5 6.4z" />
    <path d="M3.2 21c1.1-2 2.7-3.2 4.7-3.5M20.8 21c-1.1-2-2.7-3.2-4.7-3.5" />
  </svg>
)

/** 새싹 — 시작·개척 */
export const SproutIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M12 20.2v-6.4" />
    <path d="M12 13.8c0-2.8-1.9-4.6-4.9-4.6 0 2.8 1.9 4.6 4.9 4.6z" />
    <path d="M12 13.8c0-3.2 2.1-5.2 5.4-5.2 0 3.2-2.1 5.2-5.4 5.2z" />
    <path d="M7.4 20.2h9.2" />
  </svg>
)

/** 잎 든 가지 — 평화·성령 */
export const DoveIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M20.4 4.6c-1.8 4.6-4 7.8-6.6 9.6-2.6 1.8-5 2.4-7.2 1.8l-2.6 3.4" />
    <path d="M13.8 8.2c1.4-.7 2.5-.6 3.4.3-1 1-2.2 1.1-3.4-.3zM10.6 11.6c1.5-.5 2.6-.2 3.4.9-1.2.8-2.4.6-3.4-.9z" />
  </svg>
)

/** 맞잡은 두 손 — 협력·연합 */
export const HandshakeIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M2.8 12.2 6.4 8.6h3.4l2.2 2 2.2-2h3.4l3.6 3.6" />
    <path d="M12.2 10.6 9.6 13.2c-.7.7-.7 1.8 0 2.5s1.8.7 2.5 0l.5-.5.9.9c.7.7 1.8.7 2.5 0 .6-.6.7-1.5.2-2.2" />
    <path d="M4.6 14.4 7 16.8M17 16.8l2.4-2.4" />
  </svg>
)

/** 십자가 얹은 예배당 — 예배당·교회 */
export const ChurchIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M12 2.6v3.8M10.3 4.2h3.4" />
    <path d="M4.8 20.4v-7.6L12 8.4l7.2 4.4v7.6z" />
    <path d="M10 20.4v-3.8a2 2 0 0 1 4 0v3.8" />
  </svg>
)

/** 케이크 — 창립·기념 */
export const CakeIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M4.2 20.4v-5a2 2 0 0 1 2-2h11.6a2 2 0 0 1 2 2v5z" />
    <path d="M3.4 20.4h17.2" />
    <path d="M8 13.4V9.6M12 13.4V9.6M16 13.4V9.6" />
    <path d="M8 7.4a1.2 1.2 0 1 1-1.2-1.6c.6.4 1.2.9 1.2 1.6zM12 7.4a1.2 1.2 0 1 1-1.2-1.6c.6.4 1.2.9 1.2 1.6zM16 7.4a1.2 1.2 0 1 1-1.2-1.6c.6.4 1.2.9 1.2 1.6z" />
  </svg>
)

/** 반짝임 — 특별한 순간 */
export const SparkleIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M11.2 3.6c.9 3.6 1.9 4.6 5.4 5.5-3.5.9-4.5 1.9-5.4 5.5-.9-3.6-1.9-4.6-5.4-5.5 3.5-.9 4.5-1.9 5.4-5.5z" />
    <path d="M17.4 14.4c.4 1.7.9 2.2 2.6 2.6-1.7.4-2.2.9-2.6 2.6-.4-1.7-.9-2.2-2.6-2.6 1.7-.4 2.2-.9 2.6-2.6z" />
  </svg>
)

/** 집 — 가정·처소 */
export const HouseIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M3.8 10.6 12 4.2l8.2 6.4v8.4a1.6 1.6 0 0 1-1.6 1.6H5.4a1.6 1.6 0 0 1-1.6-1.6z" />
    <path d="M9.6 20.6v-5.4a2.4 2.4 0 0 1 4.8 0v5.4" />
  </svg>
)

/** 두루마리 — 문서·정관 */
export const ScrollIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M6.4 3.6h11a1.8 1.8 0 0 1 1.8 1.8v13a2 2 0 0 0 2 2H7.2a2 2 0 0 1-2-2V5.4a1.8 1.8 0 0 1 1.2-1.8z" />
    <path d="M9 8h6.6M9 11.6h6.6M9 15.2h4" />
  </svg>
)

/** 건물 — 도시·성전 */
export const CityIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M3.4 20.6V9.4l6-3.2v14.4M9.4 20.6V11l7.4-3.6v13.2M16.8 20.6V13l3.8 1.6v6z" />
    <path d="M2.6 20.6h18.8" />
    <path d="M6 12.4h.01M6 15.6h.01M12.6 13.4h.01M12.6 16.6h.01" strokeWidth={2.2} />
  </svg>
)

/** 망치 — 공사·건축 */
export const HammerIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="m13.6 7.2-7.8 7.8a2.4 2.4 0 0 0 3.4 3.4l7.8-7.8" />
    <path d="m11.6 5.2 5.6 5.6 3.2-3.2-2-2 1-1-2.6-2.6-1 1-2-2z" />
  </svg>
)

/** 크레인 — 건축 공사 */
export const CraneIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M4.6 20.6V6.4l7-2.8v17" />
    <path d="M11.6 6.4h8v3.2h-8" />
    <path d="M17.6 9.6v4.2a1.8 1.8 0 0 1-1.8 1.8h-1.4" />
    <path d="M2.8 20.6h18.4" />
  </svg>
)

/** 곡괭이 — 기공·터파기 */
export const PickaxeIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M4.4 5.2c4.2-1.4 10.4.4 15.2 3.6" />
    <path d="M3.6 12.4c3.6-3.2 9-4.6 14.6-3.4" />
    <path d="m10.6 9.4-6 10.6" />
  </svg>
)

/** 음표 — 찬양·성가대 */
export const MusicIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M9.4 17.6V5.8l9.2-2v11.6" />
    <circle cx="7.2" cy="17.6" r="2.4" />
    <circle cx="16.4" cy="15.4" r="2.2" />
  </svg>
)

/** 노트북 — 전산·홈페이지 */
export const LaptopIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <rect x="4.4" y="5.4" width="15.2" height="10" rx="1.8" />
    <path d="M2.6 18.6h18.8" />
  </svg>
)

/** 지구 — 선교·열방 */
export const GlobeIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M3.4 12h17.2" />
    <path d="M12 3.4c2.2 2.4 3.3 5.2 3.3 8.6s-1.1 6.2-3.3 8.6c-2.2-2.4-3.3-5.2-3.3-8.6S9.8 5.8 12 3.4z" />
  </svg>
)

/** 폭죽 — 축하·잔치 */
export const PartyIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="m3.4 20.6 4.2-10.4 6.2 6.2z" />
    <path d="M13.4 4.6c.9.9.9 2.3 0 3.2M17 3c2 2 2 5.2 0 7.2M15.8 12.4c1 0 1.8.8 1.8 1.8M19.6 12.6c1.2 0 2.2 1 2.2 2.2" />
  </svg>
)

/** 비행기 — 파송·해외 */
export const PlaneIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M10.4 13.6 3.8 11.4c-.7-.2-.8-1.2-.1-1.5l16.2-6.6c.7-.3 1.4.4 1.1 1.1l-6.6 16.2c-.3.7-1.3.6-1.5-.1z" />
    <path d="m10.4 13.6 4.2-4.2" />
  </svg>
)

/** 지평선 위로 뜨는 해 — 새벽·시작 */
export const DawnIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M2.8 18.6h18.4" />
    <path d="M7.4 18.6a4.6 4.6 0 0 1 9.2 0" />
    <path d="M12 5.4v2.2M5.6 8.2l1.6 1.6M18.4 8.2l-1.6 1.6M2.8 14.4h2.2M19 14.4h2.2" />
  </svg>
)

/** 잎사귀 — 성장·결실 */
export const LeafIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M20 4.6c-7 0-13 2.8-13 8.4 0 1.6.6 3.1 1.6 4.2C11.4 14 15 10.8 18 9.4c-2.4 1.8-5.8 5-7.6 8.6 1 .5 2.1.8 3.2.8 4.2 0 6.4-4.8 6.4-14.2z" />
    <path d="M8.6 17.2 4.6 21" />
  </svg>
)

/** 촛불 — 기념·추모 */
export const CandleIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <rect x="9" y="10.6" width="6" height="9.8" rx="1.4" />
    <path d="M12 10.6V9" />
    <path d="M12 4c1.7 1.4 2.4 2.5 2.4 3.5a2.4 2.4 0 0 1-4.8 0C9.6 6.5 10.3 5.4 12 4z" />
  </svg>
)

/** 사람 — 임직·부임 */
export const PersonIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M5 20.6v-1.4a5.4 5.4 0 0 1 5.4-5.4h3.2a5.4 5.4 0 0 1 5.4 5.4v1.4" />
  </svg>
)

/** 송신탑 — 방송·중계 */
export const BroadcastIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="10" r="2.2" />
    <path d="M8.2 6.2a5.4 5.4 0 0 0 0 7.6M15.8 6.2a5.4 5.4 0 0 1 0 7.6" />
    <path d="M5.4 3.4a9.4 9.4 0 0 0 0 13.2M18.6 3.4a9.4 9.4 0 0 1 0 13.2" />
    <path d="M12 12.2v8.4" />
  </svg>
)

/** 투표함 — 공동의회·선출 */
export const BallotIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M3.6 12.6h16.8v6.2a1.6 1.6 0 0 1-1.6 1.6H5.2a1.6 1.6 0 0 1-1.6-1.6z" />
    <path d="M8 12.6V5.2a1.4 1.4 0 0 1 1.4-1.4h5.2A1.4 1.4 0 0 1 16 5.2v7.4" />
    <path d="M10.4 8h3.2M10.4 10.6h3.2" />
  </svg>
)

/** 펼친 두 손 — 봉헌·나눔 */
export const OpenHandsIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M11.4 20.4 5.6 15.6a2 2 0 0 1-.7-1.5V7.4c0-1.4 1.9-1.7 2.4-.4l1.5 4" />
    <path d="M12.6 20.4l5.8-4.8a2 2 0 0 0 .7-1.5V7.4c0-1.4-1.9-1.7-2.4-.4l-1.5 4" />
    <path d="M12 3.4v8" />
  </svg>
)

/** 휴대폰 — 앱·모바일 */
export const PhoneAppIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <rect x="7" y="2.8" width="10" height="18.4" rx="2.4" />
    <path d="M10.6 5.6h2.8M12 18h.01" strokeWidth={2.2} />
  </svg>
)

/** 확성기 — 전도·선포 */
export const MegaphoneIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M5 9.4h2.3L17 5v14l-9.7-4.4H5A1.6 1.6 0 0 1 3.4 13v-2a1.6 1.6 0 0 1 1.6-1.6z" />
    <path d="M7.3 14.6v3.1a1.7 1.7 0 0 0 3.4 0v-1.6" />
    <path d="M19.9 9.7a3.9 3.9 0 0 1 0 4.6" />
  </svg>
)

type IconFn = (props: SVGProps<SVGSVGElement>) => ReactElement

const EMOJI_ICONS: Record<string, IconFn> = {
  '🙏': PrayIcon,
  '🤲': OpenHandsIcon,
  '🌱': SproutIcon,
  '🌿': LeafIcon,
  '🕊': DoveIcon,
  '🤝': HandshakeIcon,
  '⛪': ChurchIcon,
  '🎂': CakeIcon,
  '✨': SparkleIcon,
  '🏠': HouseIcon,
  '🏡': HouseIcon,
  '📜': ScrollIcon,
  '🏙': CityIcon,
  '🔨': HammerIcon,
  '🏗': CraneIcon,
  '⛏': PickaxeIcon,
  '🎶': MusicIcon,
  '🎵': MusicIcon,
  '💻': LaptopIcon,
  '🌍': GlobeIcon,
  '🌏': GlobeIcon,
  '🌎': GlobeIcon,
  '🎉': PartyIcon,
  '🎊': PartyIcon,
  '✈': PlaneIcon,
  '🌅': DawnIcon,
  '🌄': DawnIcon,
  '🕯': CandleIcon,
  '👤': PersonIcon,
  '👥': PersonIcon,
  '📡': BroadcastIcon,
  '🗳': BallotIcon,
  '📱': PhoneAppIcon,
  '📣': MegaphoneIcon,
  '📢': MegaphoneIcon,
}

/** 변이 선택자(FE0F)를 걷어낸 대표 글자 */
const normalize = (emoji: string) => emoji.replace(/[︎️]/g, '').trim()

interface HistoryGlyphProps {
  emoji?: string | null
  size?: number
  className?: string
}

/** 기록 이모지를 선화로 바꿔 그린다. 매핑에 없으면 원래 이모지를 그대로. */
export const HistoryGlyph = ({
  emoji,
  size = 16,
  className,
}: HistoryGlyphProps): ReactElement | null => {
  if (!emoji) return null
  const Icon = EMOJI_ICONS[normalize(emoji)]
  if (!Icon) {
    return (
      <span aria-hidden="true" className={className} style={{ fontSize: size, lineHeight: 1 }}>
        {emoji}
      </span>
    )
  }
  return S(<Icon width={size} height={size} className={className} />)
}
