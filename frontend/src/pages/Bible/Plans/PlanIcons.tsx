/**
 * 읽기 플랜 전용 선화(線畫) 아이콘 — 참빛이 직접 그린 것.
 * 공통 문법: 24 그리드 · fill:none · stroke=currentColor · strokeWidth 1.8 · 둥근 캡
 * (기준: src/pages/Bible/components/BibleToolIcons.tsx)
 *
 * ★플랜 이모지는 DB(bible_plans.emoji)와 나만의 플랜 선택값에 그대로 저장돼 있어
 *  데이터는 건드리지 않고 <PlanGlyph emoji="🌱" /> 가 렌더 시점에 선화로 바꾼다.
 *  매핑에 없는 이모지는 원래 글자를 그대로 출력해 깨지지 않는다.
 *  (같은 방식: EduGlyph · HistoryGlyph)
 */
import type { CSSProperties, ReactElement, SVGProps } from 'react'
import {
  BookOpenIcon,
  CommentIcon,
  HandHeartIcon,
  HeartIcon,
  PenLineIcon,
  SparklesIcon,
  UsersIcon,
} from '../../../components/icons/ActionIcons'

type Props = SVGProps<SVGSVGElement> & { size?: number }

const Svg = ({ size = 20, children, ...rest }: Props) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...rest}
  >
    {children}
  </svg>
)

/** 흙을 밀고 올라온 새싹 — 시작·입문 플랜 */
export const SproutIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M12 20v-7" />
    <path d="M12 13c-.4-2.8-2.3-4.3-5.2-4.3.4 2.8 2.3 4.3 5.2 4.3z" />
    <path d="M12 13c.4-3.2 2.6-5 6-5-.4 3.2-2.6 5-6 5z" />
    <path d="M7.5 20h9" />
  </Svg>
)

/** 십자가 — 복음서·신약 플랜 */
export const CrossIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M12 3.5v17" />
    <path d="M6.5 9h11" />
  </Svg>
)

/** 접힌 지도 — 성경 전체의 큰 그림(개관) */
export const MapIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M9 5.2 3.6 7v11.8L9 17z" />
    <path d="M9 5.2 15 7v11.8L9 17z" />
    <path d="m15 7 5.4-1.8V17L15 18.8z" />
  </Svg>
)

/** 날개를 든 비둘기 — 평화·성령.
    측면(옆모습) 안(案)은 13~25px에서 곡선이 붙어 종이비행기처럼 뭉개져 폐기했다.
    정면·좌우 대칭이라야 작은 크기에서도 '새'로 읽힌다. */
export const DoveIcon = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="6" r="1.9" />
    <path d="M12 7.9c-1.2 1.2-1.8 2.8-1.8 4.8 0 2.2.6 4.3 1.8 6.1 1.2-1.8 1.8-3.9 1.8-6.1 0-2-.6-3.6-1.8-4.8z" />
    <path d="M10.3 10.1C8.2 7.6 5.4 6.4 2 6.6c.6 3.4 2.6 5.8 6 7" />
    <path d="M13.7 10.1c2.1-2.5 4.9-3.7 8.3-3.5-.6 3.4-2.6 5.8-6 7" />
  </Svg>
)

/** 불꽃 — 연속 기록(스트릭) */
export const FlameIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M12 3.2c.4 2.4-.6 3.9-2.1 5.4C8.2 10.2 7 11.8 7 14a5 5 0 0 0 10 0c0-2.4-1.1-3.9-2.4-5.6" />
    <path d="M12 20a2.6 2.6 0 0 1-2.6-2.6c0-1.4 1-2.2 1.8-3.2.8 1 3.4 1.9 3.4 3.2A2.6 2.6 0 0 1 12 20z" />
  </Svg>
)

/** 지평선 위로 오르는 해 — 새벽·아침 묵상 */
export const SunriseIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M3.5 18.5h17" />
    <path d="M7.6 14.6a4.4 4.4 0 0 1 8.8 0" />
    <path d="M12 4v2.6M5.6 7.2l1.5 1.5M18.4 7.2l-1.5 1.5M2.8 14.6h1.8M19.4 14.6h1.8" />
  </Svg>
)

/** 두루마리 — 옛 기록·복음서 */
export const ScrollIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M6.5 4.5h9.8a1.7 1.7 0 0 1 1.7 1.7v11.6a1.7 1.7 0 0 0 1.7 1.7H8.8a1.7 1.7 0 0 1-1.7-1.7V6.2" />
    <path d="M7.1 6.2a1.7 1.7 0 1 0-3.4 0c0 .9.7 1.6 1.7 1.6h1.7" />
    <path d="M10.4 9h4.6M10.4 12.4h4.6" />
  </Svg>
)

/** 음표 — 시편·찬양 */
export const NoteIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M10 17.4V5.6l8-1.6v11.2" />
    <circle cx="7.4" cy="17.6" r="2.6" />
    <circle cx="15.4" cy="15.2" r="2.6" />
  </Svg>
)

/** 산봉우리 — 모세오경·긴 여정 */
export const MountainIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M3 19h18L14.2 7.4 10.6 13 8.4 10z" />
    <path d="m12.2 10.6 2-3.2" />
  </Svg>
)

/** 지구 — 성경 전체 통독 */
export const GlobeIcon = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.4" />
    <path d="M3.6 12h16.8" />
    <path d="M12 3.6c2.2 2.4 3.3 5.2 3.3 8.4S14.2 18 12 20.4C9.8 18 8.7 15.2 8.7 12s1.1-6 3.3-8.4z" />
  </Svg>
)

/** 열쇠 — 초대 코드 */
export const KeyIcon = (p: Props) => (
  <Svg {...p}>
    <circle cx="7.8" cy="16.2" r="3.6" />
    <path d="m10.4 13.6 8-8" />
    <path d="m15.6 8.4 2.2 2.2M17.8 6.2 20 8.4" />
  </Svg>
)

/** 폭죽 — 완주 축하 */
export const PartyIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M3.6 20.4 8 9.2l6.8 6.8z" />
    <path d="m11.2 7.6 1.5-1.5M15.4 4.2l.6-2M19.6 8.4l2-.6M18.2 12.4l1.6 1.6M14.8 9.6c1.2-1.2 3-1.2 4.2 0" />
  </Svg>
)

/** 빈 서랍 — 목록이 비었을 때 */
export const EmptyTrayIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M3.6 13.6 6.4 5.6h11.2l2.8 8v4.8a1.6 1.6 0 0 1-1.6 1.6H5.2a1.6 1.6 0 0 1-1.6-1.6z" />
    <path d="M3.6 13.6h4.2l1.2 2.2h6l1.2-2.2h4.2" />
  </Svg>
)

/** 구름에 그은 선 — 불러오기 실패 */
export const CloudOffIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M7.6 17.4h9.2a3.6 3.6 0 0 0 .6-7.1 5.2 5.2 0 0 0-8.3-3.1" />
    <path d="M6.6 10.6a3.6 3.6 0 0 0 1 6.8" />
    <path d="M4 4l16 16" />
  </Svg>
)

/** 맞잡은 손 — 함께 읽기 */
export const HandshakeIcon = (p: Props) => (
  <Svg {...p}>
    <path d="m11 8.4-2.2-2-4.4 4 4.6 5c.7.8 1.9.8 2.6 0" />
    <path d="m13 8.4 2.2-2 4.4 4-4.6 5c-.7.8-1.9.8-2.6 0l-1.6-1.7" />
    <path d="M11 8.4h2" />
  </Svg>
)

/** 이모지 → 선화 매핑. 변이 선택자(FE0F)는 떼고 맞춘다. */
const GLYPHS: Record<string, (p: Props) => ReactElement> = {
  '📖': (p) => <BookOpenIcon size={p.size} className={p.className} />,
  '📚': (p) => <BookOpenIcon size={p.size} className={p.className} />,
  '🌱': SproutIcon,
  '✝': CrossIcon,
  '🗺': MapIcon,
  '🕊': DoveIcon,
  '🔥': FlameIcon,
  '🌅': SunriseIcon,
  '📜': ScrollIcon,
  '🎵': NoteIcon,
  '⛰': MountainIcon,
  '🌍': GlobeIcon,
  '🔑': KeyIcon,
  '🎉': PartyIcon,
  '📭': EmptyTrayIcon,
  '😢': CloudOffIcon,
  '🤝': HandshakeIcon,
  '✨': (p) => <SparklesIcon size={p.size} className={p.className} />,
  '💬': (p) => <CommentIcon size={p.size} className={p.className} />,
  '🙏': (p) => <HandHeartIcon size={p.size} className={p.className} />,
  '💙': (p) => <HeartIcon size={p.size} className={p.className} />,
  '👥': (p) => <UsersIcon size={p.size} className={p.className} />,
  '📝': (p) => <PenLineIcon size={p.size} className={p.className} />,
}

const normalize = (e: string) => e.replace(/️/g, '').trim()

/** 매핑된 선화가 있으면 SVG로, 없으면 원래 이모지를 그대로 보여준다 */
export const PlanGlyph = ({
  emoji,
  size = 20,
  className,
  style,
}: {
  emoji?: string | null
  size?: number
  className?: string
  style?: CSSProperties
}) => {
  const key = normalize(emoji || '📖')
  const Glyph = GLYPHS[key]
  if (!Glyph) {
    return (
      <span className={className} style={{ fontSize: size, lineHeight: 1, ...style }}>
        {emoji}
      </span>
    )
  }
  return <Glyph size={size} className={className} style={style} />
}
