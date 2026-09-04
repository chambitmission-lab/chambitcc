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
export { CloudOffIcon, DoveIcon, FlameIcon, KeyIcon, PartyIcon, SproutIcon, HandHeartIcon }

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

/** 반짝임 — 은혜 */
export const SparklesIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M12 4.6c.5 3.6 2 5.1 5.6 5.6-3.6.5-5.1 2-5.6 5.6-.5-3.6-2-5.1-5.6-5.6 3.6-.5 5.1-2 5.6-5.6z" />
    <path d="M5.4 15.8c.2 1.5.9 2.2 2.4 2.4-1.5.2-2.2.9-2.4 2.4-.2-1.5-.9-2.2-2.4-2.4 1.5-.2 2.2-.9 2.4-2.4z" />
  </Svg>
)

/** 물음표 — 질문 */
export const QuestionIcon = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M9.4 9.6a2.6 2.6 0 1 1 3.7 2.4c-.8.4-1.1.9-1.1 1.8" />
    <path d="M12 16.6h.01" />
  </Svg>
)

/** 해 — 감사 */
export const SunIcon = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3.6" />
    <path d="M12 3.4v2M12 18.6v2M3.4 12h2M18.6 12h2M6 6l1.4 1.4M16.6 16.6 18 18M6 18l1.4-1.4M16.6 7.4 18 6" />
  </Svg>
)

/** 손가락 — 콕 찌르기 */
export const PokeIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M9.2 12.6V5.4a1.7 1.7 0 0 1 3.4 0v5.2" />
    <path d="M12.6 10.6a1.6 1.6 0 0 1 3.2 0v1.6a1.6 1.6 0 0 1 3.2 0v3.4c0 3-2.3 5.4-5.4 5.4h-1.2c-1.6 0-3-.7-4-1.9l-3.3-4.1a1.5 1.5 0 0 1 2.2-2l1.9 1.9" />
  </Svg>
)

/** 종 — 아침 알림 */
export const BellIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M6.4 16.2V11a5.6 5.6 0 0 1 11.2 0v5.2l1.4 1.6H5z" />
    <path d="M10 20.2a2.2 2.2 0 0 0 4 0" />
  </Svg>
)

/** 종이비행기 — 초대 보내기 */
export const SendIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M20.4 3.6 3.8 10.2l7 2.6 2.6 7z" />
    <path d="M20.4 3.6 10.8 12.8" />
  </Svg>
)

/** 사람 추가 — 초대 */
export const UserPlusIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M15.4 20v-1.6a3.6 3.6 0 0 0-3.6-3.6H6.2a3.6 3.6 0 0 0-3.6 3.6V20" />
    <circle cx="9" cy="7.4" r="3.4" />
    <path d="M19 8v6M22 11h-6" />
  </Svg>
)

/** 점 세 개 — 더보기 */
export const MoreIcon = (p: Props) => (
  <Svg {...p}>
    <circle cx="6" cy="12" r="1.2" fill="currentColor" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    <circle cx="18" cy="12" r="1.2" fill="currentColor" />
  </Svg>
)

/** 나가기 */
export const LogoutIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M10 4.6H6.4A1.8 1.8 0 0 0 4.6 6.4v11.2a1.8 1.8 0 0 0 1.8 1.8H10" />
    <path d="M15.4 8.4 19 12l-3.6 3.6M9.6 12H19" />
  </Svg>
)

/** 구절 표시(마음이 머문 절) — 작은 하트 */
export const SmallHeartIcon = ({ size = 11, filled, ...rest }: Props & { filled?: boolean }) => (
  <Svg size={size} fill={filled ? 'currentColor' : 'none'} strokeWidth={2} {...rest}>
    <path d="M12 20.2S3.4 14.8 3.4 8.9a4.4 4.4 0 0 1 8.6-1.4 4.4 4.4 0 0 1 8.6 1.4c0 5.9-8.6 11.3-8.6 11.3z" />
  </Svg>
)

/** 화면 밖으로 — 성경 화면에서 읽기 */
export const ExternalIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M14 4.6h5.4V10M19.4 4.6 11 13" />
    <path d="M17.6 13.6v4.2a1.6 1.6 0 0 1-1.6 1.6H6.2a1.6 1.6 0 0 1-1.6-1.6V8a1.6 1.6 0 0 1 1.6-1.6h4.2" />
  </Svg>
)

/** 반응 키 → 선화 (roomCourses.REACTIONS 와 같은 키) */
export const ReactionGlyph = ({ reaction, size = 14, className }: { reaction: string; size?: number; className?: string }) => {
  switch (reaction) {
    case 'grace':
      return <SparklesIcon size={size} className={className} />
    case 'comfort':
      return <HandHeartIcon size={size} className={className} />
    case 'challenge':
      return <FlameIcon size={size} className={className} />
    case 'question':
      return <QuestionIcon size={size} className={className} />
    case 'thanks':
      return <SunIcon size={size} className={className} />
    default:
      return <SparklesIcon size={size} className={className} />
  }
}

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
