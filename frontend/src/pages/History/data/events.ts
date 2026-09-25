// 참빛교회 발자취 — 원문 기록.
//
// 원문은 백엔드 app/data/church_history.json 한 곳에 있다(GET /church-history) — 챗봇 참비도 같은 파일을
// 읽는다. 기록을 추가·수정할 때는 그 JSON 만 고치고 백엔드를 배포하면 된다 (프론트 배포 불필요).
//
// 이 화면의 파생 데이터(historyThemes 의 INDEXED_EVENTS·YEAR_BARS …)는 모듈 로드 시점에 한 번 계산된다.
// 그래서 라우트 로더가 loadChurchHistory() 로 기록을 먼저 채운 뒤에 화면 청크를 연다(api/churchHistory.ts).
// HISTORY_EVENTS 는 ES 모듈의 live binding 이라 채운 값이 import 한 쪽에 그대로 보인다.

import type { HistoryEvent } from './types'

export let HISTORY_EVENTS: HistoryEvent[] = []

export const setHistoryEvents = (events: HistoryEvent[]): void => {
  HISTORY_EVENTS = events
}
