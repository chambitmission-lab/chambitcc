// 소개·랜딩 페이지용 아이콘 세트 — Phosphor Icons Duotone.
// 플랜·기도방·홈 레일·성경 도구와 같은 세트로 맞춰 앱 전체 아이콘 결을 통일한다.
// (예전 자체 인라인 선화 SVG 와 export 이름·props 를 그대로 유지해 호출부 무변경)
// 화살표 셰브런만 안내 기호라 duotone 대신 bold 로 또렷하게.
import type { CSSProperties } from 'react'
import {
  BookOpen,
  Briefcase,
  Camera,
  CaretDown,
  CaretRight,
  Clock,
  Flag,
  GraduationCap,
  Heart,
  MapPin,
  Medal,
  MoonStars,
  Phone,
  Plant,
  PlayCircle,
  Sun,
  SunDim,
  SunHorizon,
  TreeStructure,
  X,
  type Icon,
  type IconWeight,
} from '@phosphor-icons/react'

interface IconProps {
  size?: number
  /** 예전 선화 API 호환용 — Phosphor 에선 무시 */
  strokeWidth?: number
  className?: string
  style?: CSSProperties
}

const make =
  (Base: Icon, weight: IconWeight = 'duotone') =>
  ({ size = 18, className, style }: IconProps) => (
    <Base
      size={size}
      weight={weight}
      color="currentColor"
      className={className}
      style={style}
      aria-hidden="true"
    />
  )

/** 시계 — 예배 시간 */
export const ClockIcon = make(Clock)
/** 핀 — 오시는 길 */
export const MapPinIcon = make(MapPin)
/** 전화 */
export const PhoneIcon = make(Phone)
/** 오른쪽 셰브런 — 이동 */
export const ChevronRightIcon = make(CaretRight, 'bold')
/** 아래 셰브런 — 펼치기 */
export const ChevronDownIcon = make(CaretDown, 'bold')
/** 새싹 — 처음 오셨나요 */
export const SproutIcon = make(Plant)
/** 펼친 책 — 설교·말씀 */
export const BookOpenIcon = make(BookOpen)
/** 재생 — 설교 영상 */
export const PlayCircleIcon = make(PlayCircle)
/** 깃발 — 발자취 */
export const FlagIcon = make(Flag)
/** 조직도 */
export const OrgChartIcon = make(TreeStructure)
/** 하트 — 손수건 만남 */
export const HeartIcon = make(Heart)
/** X — 스쳐가는 만남 */
export const XIcon = make(X, 'bold')
/** 카메라 — 사진 등록 */
export const CameraIcon = make(Camera)
/** 학사모 — 학력 */
export const GraduationCapIcon = make(GraduationCap)
/** 서류가방 — 경력 */
export const BriefcaseIcon = make(Briefcase)
/** 메달 — 수상 */
export const MedalIcon = make(Medal)

/* ── 시간대 무드 (/worship) ── 예배 시각의 '빛'을 나타낸다.
   컬러 이모지(🌅 ☀️ 🌇 🌙)는 12px 문장 안에서 작은 색 사각형처럼 뭉개져 교체했다 */
/** 여명 — 새벽 예배 */
export const DawnIcon = make(SunHorizon)
/** 한낮 — 주일 낮 예배 */
export const DayIcon = make(Sun)
/** 노을 — 저녁 예배 */
export const DuskIcon = make(SunDim)
/** 밤 — 심야 기도회 */
export const NightIcon = make(MoonStars)
