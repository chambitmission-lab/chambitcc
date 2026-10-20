// 동행 목표 종류 — 단위·허용 범위는 backend companion_service.GOALS 와 같은 값
import type { CompanionGoalType } from '../../types/companion'

export interface GoalSpec {
  type: CompanionGoalType
  label: string
  unit: string
  /** 무엇이 쌓이는지 — 따로 기록할 필요가 없다는 걸 알려준다 */
  hint: string
  presets: number[]
  defaultAmount: number
  min: number
  max: number
  /** 채우러 가는 곳 */
  to: string
  cta: string
}

export const GOAL_SPECS: Record<CompanionGoalType, GoalSpec> = {
  reading: {
    type: 'reading',
    label: '성경 읽기',
    unit: '장',
    hint: '성경에서 읽은 장이 저절로 쌓여요',
    presets: [7, 14, 21, 30],
    defaultAmount: 14,
    min: 1,
    max: 300,
    to: '/bible',
    cta: '성경 읽으러 가기',
  },
  typing: {
    type: 'typing',
    label: '필사',
    unit: '절',
    hint: '필사한 절이 저절로 쌓여요',
    presets: [20, 50, 100, 200],
    defaultAmount: 50,
    min: 1,
    max: 2000,
    to: '/bible/typing',
    cta: '필사하러 가기',
  },
  prayer: {
    type: 'prayer',
    label: '기도',
    unit: '분',
    hint: '기도 집중 시간이 저절로 쌓여요',
    presets: [30, 60, 120, 180],
    defaultAmount: 60,
    min: 5,
    max: 3000,
    to: '/prayer-focus',
    cta: '기도하러 가기',
  },
}

export const GOAL_ORDER: CompanionGoalType[] = ['reading', 'typing', 'prayer']

export const goalText = (type: CompanionGoalType, amount: number) =>
  `${GOAL_SPECS[type].label} ${amount}${GOAL_SPECS[type].unit}`
