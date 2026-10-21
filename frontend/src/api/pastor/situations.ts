// 지금 겪는 일 (돌봄 상태)
// 명부와 같은 권한 — 교역자끼리 함께 보고 고친다. 시작일로 목회 비서가 안부 여쭐 때를 짚는다
import { pastorDelete, pastorSend } from './_http'

export type SituationKind = 'illness' | 'bereavement' | 'birth' | 'move' | 'job' | 'family' | 'other'

export interface MemberSituation {
  id: number
  kind: SituationKind
  started_on: string
  note: string | null
  /** null 이면 지금 겪는 중 */
  ended_on: string | null
  created_by_name: string | null
}

export interface SituationInput {
  kind?: SituationKind
  started_on?: string
  note?: string
  /** true: 지나갔어요(오늘로 마침) · false: 다시 겪는 중 */
  ended?: boolean
}

export const createSituation = (
  memberId: number,
  data: { kind: SituationKind; started_on: string; note?: string },
): Promise<MemberSituation> =>
  pastorSend(`/pastor/members/${memberId}/situations`, 'POST', data, '저장하지 못했습니다')

export const updateSituation = (id: number, data: SituationInput): Promise<MemberSituation> =>
  pastorSend(`/pastor/situations/${id}`, 'PATCH', data, '저장하지 못했습니다')

export const deleteSituation = (id: number): Promise<void> =>
  pastorDelete(`/pastor/situations/${id}`, '지우지 못했습니다')
