// 동행 마일스톤 — 함께 걸은 주·켠 등불·서로를 위한 기도가 쌓이면 우정 카드를 만들 수 있다
import type { CompanionSummary } from '../../types/companion'

export interface Milestone {
  key: string
  label: string
  /** 카드 아랫줄 — 무엇을 해냈는지 한 문장 */
  line: string
  metric: 'lit' | 'weeks' | 'cheers'
  need: number
}

export const MILESTONES: Milestone[] = [
  { key: 'lamp1', label: '첫 등불', line: '처음으로 둘이 한 주를 채웠어요', metric: 'lit', need: 1 },
  { key: 'weeks4', label: '한 달을 함께', line: '네 번의 한 주를 나란히 걸었어요', metric: 'weeks', need: 4 },
  { key: 'lamp4', label: '등불 넷', line: '함께 채운 한 주가 넷이 되었어요', metric: 'lit', need: 4 },
  { key: 'cheer10', label: '서로를 위한 기도 열 번', line: '서로의 이름을 부르며 열 번 기도했어요', metric: 'cheers', need: 10 },
  { key: 'weeks12', label: '한 계절을 함께', line: '열두 주, 한 계절을 같이 지나왔어요', metric: 'weeks', need: 12 },
  { key: 'lamp10', label: '등불 열', line: '둘이 켠 등불이 열 개가 되었어요', metric: 'lit', need: 10 },
  { key: 'weeks52', label: '일 년을 함께', line: '한 해를 꼬박 함께 걸었어요', metric: 'weeks', need: 52 },
]

export const metricValue = (c: Pick<CompanionSummary, 'lit_weeks' | 'together_weeks' | 'cheer'>, m: Milestone) =>
  m.metric === 'lit' ? c.lit_weeks : m.metric === 'weeks' ? c.together_weeks : (c.cheer?.total ?? 0)
