// 참빛교회 발자취 — 연대별 원문 기록을 하나로 잇는다.
// 기록을 추가할 때는 해당 연대 파일에만 넣으면 된다 (날짜 오름차순 유지).

import type { HistoryEvent } from './types'
import { EVENTS_1990S } from './events1990s'
import { EVENTS_2000S } from './events2000s'
import { EVENTS_2010S } from './events2010s'
import { EVENTS_2020S } from './events2020s'

export const HISTORY_EVENTS: HistoryEvent[] = [
  ...EVENTS_1990S,
  ...EVENTS_2000S,
  ...EVENTS_2010S,
  ...EVENTS_2020S,
]
