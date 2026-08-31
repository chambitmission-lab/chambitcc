/**
 * 내 정보(/account) 아이콘 — Phosphor Icons.
 * 손으로 그리던 인라인 SVG 세트를 걷어내고 최근 화면들(플랜·기도방·교육·소식)이
 * 쓰는 것과 같은 세트로 맞춘다.
 *
 *  - duotone: 행 앞 아이콘 타일처럼 "면"으로 읽히는 자리 (사람·편지·달력·방패)
 *  - line   : 캐럿·체크·눈처럼 작게 쓰이는 조작 아이콘 — duotone은 14px에서 뭉갠다
 *
 * 색은 currentColor 를 따르므로 기존 text-* 클래스가 그대로 먹는다.
 */
import type { CSSProperties } from 'react'
import {
  ArrowsClockwise,
  CalendarBlank,
  Camera,
  CaretDown,
  CaretLeft,
  Check,
  EnvelopeSimple,
  Eye,
  EyeSlash,
  HandsPraying,
  Leaf,
  LockSimple,
  PencilSimple,
  ShieldCheck,
  SignOut,
  User,
  type Icon,
} from '@phosphor-icons/react'

export type AccountIconProps = { size?: number; className?: string; style?: CSSProperties }

const duotone =
  (Base: Icon) =>
  ({ size = 20, className, style }: AccountIconProps) => (
    <Base size={size} weight="duotone" color="currentColor" className={className} style={style} aria-hidden="true" />
  )

const line =
  (Base: Icon) =>
  ({ size = 18, className, style }: AccountIconProps) => (
    <Base size={size} weight="bold" color="currentColor" className={className} style={style} aria-hidden="true" />
  )

/* 행 아이콘 타일 */
export const PersonIcon = duotone(User)
export const MailIcon = duotone(EnvelopeSimple)
export const CalendarIcon = duotone(CalendarBlank)
export const ShieldIcon = duotone(ShieldCheck)
export const PrayIcon = duotone(HandsPraying)
/** 히어로 카드 배경의 잎사귀 워터마크 */
export const LeafIcon = duotone(Leaf)

/* 조작 아이콘 */
export const BackIcon = line(CaretLeft)
export const ChevronIcon = line(CaretDown)
export const PencilIcon = line(PencilSimple)
export const LockIcon = line(LockSimple)
export const CheckIcon = line(Check)
export const EyeIcon = line(Eye)
export const EyeOffIcon = line(EyeSlash)
export const LogoutIcon = line(SignOut)
export const RefreshIcon = line(ArrowsClockwise)
export const CameraIcon = line(Camera)
