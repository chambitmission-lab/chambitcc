/**
 * 공동 묵상방(/rooms) 전용 선화(線畫) 아이콘.
 * 공통 문법: 24 그리드 · fill:none · stroke=currentColor · strokeWidth 1.8 · 둥근 캡
 *
 * 방 표식(rooms.emoji)은 DB 값이라 데이터는 그대로 두고
 * <RoomGlyph emoji="🕊️" /> 가 렌더 시점에 선화로 바꾼다 (PlanGlyph와 같은 방식).
 * 비둘기·새싹·불꽃·폭죽·열쇠·구름끊김은 읽기 플랜에서 이미 그린 것을 재사용한다.
 */
import type { CSSProperties, ReactElement, SVGProps } from 'react'
import {
  CloudOffIcon,
  DoveIcon,
  FlameIcon,
  KeyIcon,
  PartyIcon,
  SproutIcon,
} from '../Bible/Plans/PlanIcons'
import { BookOpenIcon, HandHeartIcon, UsersIcon } from '../../components/icons/ActionIcons'

// 재사용 아이콘은 여기서 다시 내보내 /rooms 화면들이 한 곳만 import 하게 한다
export { CloudOffIcon, DoveIcon, FlameIcon, KeyIcon, PartyIcon, SproutIcon }

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

/** 초승달 — 밤 묵상 */
export const MoonIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M20 14.4A8.4 8.4 0 0 1 9.6 4 8.4 8.4 0 1 0 20 14.4z" />
  </Svg>
)

/** 물결 — 잔잔함·깊이 */
export const WaveIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M3 8.6c1.8-1.8 3.6-1.8 5.4 0s3.6 1.8 5.4 0 3.6-1.8 5.4 0" />
    <path d="M3 13c1.8-1.8 3.6-1.8 5.4 0s3.6 1.8 5.4 0 3.6-1.8 5.4 0" />
    <path d="M3 17.4c1.8-1.8 3.6-1.8 5.4 0s3.6 1.8 5.4 0 3.6-1.8 5.4 0" />
  </Svg>
)

/** 별 — 이정표 */
export const StarIcon = (p: Props) => (
  <Svg {...p}>
    <path d="m12 3.8 2.5 5.2 5.7.8-4.1 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4.1-4 5.7-.8z" />
  </Svg>
)

/** 자물쇠 — 비공개·접근 불가 */
export const LockIcon = (p: Props) => (
  <Svg {...p}>
    <rect x="4.6" y="10.4" width="14.8" height="9.4" rx="2.2" />
    <path d="M8.2 10.4V7.8a3.8 3.8 0 0 1 7.6 0v2.6" />
    <path d="M12 14.2v2" />
  </Svg>
)

/** 눈 — 이 본문을 읽은 사람 수 */
export const EyeIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M2.6 12S6 6.6 12 6.6 21.4 12 21.4 12 18 17.4 12 17.4 2.6 12 2.6 12z" />
    <circle cx="12" cy="12" r="2.8" />
  </Svg>
)

/** 체크 — 읽음 표시 (텍스트 앞의 ✓ 대체) */
export const CheckIcon = ({ size = 12, ...rest }: Props) => (
  <Svg size={size} strokeWidth={3} {...rest}>
    <path d="m4.5 12.5 5 5 10-11" />
  </Svg>
)

const GLYPHS: Record<string, (p: Props) => ReactElement> = {
  '🕊': DoveIcon,
  '🌱': SproutIcon,
  '🔥': FlameIcon,
  '🌙': MoonIcon,
  '🌊': WaveIcon,
  '⭐': StarIcon,
  '🎉': PartyIcon,
  '🔑': KeyIcon,
  '😢': CloudOffIcon,
  '🔒': LockIcon,
  '👀': EyeIcon,
  '📖': (p) => <BookOpenIcon size={p.size} className={p.className} />,
  '🙏': (p) => <HandHeartIcon size={p.size} className={p.className} />,
  '👥': (p) => <UsersIcon size={p.size} className={p.className} />,
}

const normalize = (e: string) => e.replace(/️/g, '').trim()

/** 매핑된 선화가 있으면 SVG로, 없으면 원래 이모지를 그대로 보여준다 */
export const RoomGlyph = ({
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
  const Glyph = GLYPHS[normalize(emoji || '🕊️')]
  if (!Glyph) {
    return (
      <span className={className} style={{ fontSize: size, lineHeight: 1, ...style }}>
        {emoji}
      </span>
    )
  }
  return <Glyph size={size} className={className} style={style} />
}
