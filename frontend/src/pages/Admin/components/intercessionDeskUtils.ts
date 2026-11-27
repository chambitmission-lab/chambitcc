// 누군가의 기도 관리 데스크 규칙 — 실제 화면과 dev 미리보기가 같이 쓴다
import type { IntercessionAdminOverview } from '../../../api/intercession'

/** 데스크 선택 — 'overview'(운영 현황) 또는 신고된 편지 id */
export type IntercessionSel = 'overview' | number

/** 상세의 숫자 두 줄 — 사람 / 이번 주기 */
export const PEOPLE_STATS = (d: IntercessionAdminOverview) =>
  [
    ['함께하는 성도', d.active_participants],
    ['쉬는 중', d.paused_participants],
    ['짝이 정해진 성도', d.linked_givers],
    ['짝을 기다리는 성도', d.unlinked_active],
  ] as const

export const CYCLE_STATS = (d: IntercessionAdminOverview) =>
  [
    ['이번 주기 기도', d.cycle_prayers],
    ['오늘 기도한 성도', d.today_givers],
    ['이번 주기 편지', d.cycle_letters],
    ['누적 기도', d.total_prayers],
  ] as const

/** 운영 현황 한 줄 요약 — 목록 맨 위 고정 줄에 쓴다 */
export const overviewLine = (d: IntercessionAdminOverview | undefined) => {
  if (!d) return '현황을 모으는 중…'
  if (!d.open) return '닫혀 있어요 — 메뉴·홈 카드가 숨겨져 있어요'
  if (d.cycle) return `${d.cycle.current_week + 1}/${d.cycle.week_count}주차 · 함께하는 성도 ${d.active_participants}명`
  return `다음 주기를 기다려요 · 함께하는 성도 ${d.active_participants}명`
}
