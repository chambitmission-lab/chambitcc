// 참빛교회 발자취 — 1994년 개척부터 현재까지의 연혁 데이터.
// 역사 정리 위원회 기록을 원문 그대로 옮겼다 (2023.01.08 위원회 조직).
// icon/title이 있는 항목은 "주요 순간" 모드에 노출되는 마일스톤이다.
//
// 실제 데이터는 data/ 아래에 연대별로 나뉘어 있다. 이 파일은 단일 진입점으로만 남는다.
//   data/types.ts       HistoryEvent · DecadeMeta
//   data/decades.ts     DECADES · decadeOf
//   data/events*.ts     연대별 원문 기록

export type { HistoryEvent, DecadeMeta } from './data/types'
export { DECADES, decadeOf } from './data/decades'
export { HISTORY_EVENTS } from './data/events'
