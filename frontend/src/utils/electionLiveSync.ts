// 선거 SSE(election_update) → react-query 캐시 동기화
//
// 표 한 장마다 선거인 전원이 상세를 다시 받으면 요청이 (선거인 수)² 로 불어난다 —
// 200명이 몇 분 안에 투표하면 수만 건. 그래서 이벤트에 실려 오는 값으로 나눠 처리한다.
//   - kind 'ballot' (표가 들어옴/빠짐): 성도 화면에서 바뀌는 건 투표율뿐이라 캐시의
//     voted_count·voters_total 만 고친다(요청 0). 득표가 보이는 화면(실시간 공개·관리자
//     현황판)만 다시 받되, 몰아서 받도록 스로틀한다.
//   - 그 밖(회차 열림·마감·선거 수정): 드문 일이라 그대로 전부 다시 받는다.
//   - kind 가 없는 옛 서버: 예전처럼 다시 받되 스로틀만 건다.
//
// 키는 hooks/useElections.ts 의 electionKeys 와 같은 리터럴이다 — 그쪽이
// notificationStream 을 import 하므로 여기서 되가져오면 순환한다.
import type { QueryClient, QueryKey } from '@tanstack/react-query'
import type { ElectionDetail, ElectionRoundStatus, ElectionSummary } from '../types/election'

const ALL: QueryKey = ['elections']
const LIST_KEYS: QueryKey[] = [
  ['elections', 'list'],
  ['elections', 'admin'],
]
const detailKey = (id: number): QueryKey => ['elections', 'detail', id]
const adminDetailKey = (id: number): QueryKey => ['elections', 'admin-detail', id]

/** 득표를 다시 받는 최소 간격 — 표가 몰려도 화면당 이 주기로 한 번만 조회한다 */
const REFETCH_THROTTLE_MS = 2500

interface ElectionUpdateEvent {
  election_id: number
  kind?: 'ballot' | 'state'
  round_no: number | null
  round_status: ElectionRoundStatus | null
  voted_count: number
  voters_total: number
}

const lastFired = new Map<string, number>()
const pending = new Map<string, ReturnType<typeof setTimeout>>()

/** 첫 신호는 바로, 이어지는 신호는 주기 끝에 한 번으로 모은다(leading + trailing) */
const invalidateThrottled = (qc: QueryClient, queryKey: QueryKey): void => {
  const k = JSON.stringify(queryKey)
  if (pending.has(k)) return
  const fire = () => {
    pending.delete(k)
    lastFired.set(k, Date.now())
    void qc.invalidateQueries({ queryKey })
  }
  const wait = (lastFired.get(k) ?? 0) + REFETCH_THROTTLE_MS - Date.now()
  if (wait <= 0) fire()
  else pending.set(k, setTimeout(fire, wait))
}

const parse = (raw: string): ElectionUpdateEvent | null => {
  try {
    const ev = JSON.parse(raw) as ElectionUpdateEvent
    return typeof ev?.election_id === 'number' ? ev : null
  } catch {
    return null
  }
}

/** 이미 무효화된 캐시는 건드리지 않는다 — setQueryData 가 무효 표시를 지워 버린다 */
const patchable = (qc: QueryClient, queryKey: QueryKey): boolean => {
  const state = qc.getQueryState(queryKey)
  return !!state?.data && !state.isInvalidated
}

const patchList = (qc: QueryClient, queryKey: QueryKey, ev: ElectionUpdateEvent): void => {
  if (!patchable(qc, queryKey)) return
  const list = qc.getQueryData<ElectionSummary[]>(queryKey)
  const row = list?.find((e) => e.id === ev.election_id)
  if (!row) return
  if (row.current_round_no !== ev.round_no || row.current_round_status !== ev.round_status) {
    // 캐시가 다른 회차를 보고 있다 — 신호를 놓친 것이니 통째로 다시 받는다
    void qc.invalidateQueries({ queryKey })
    return
  }
  if (row.voted_count === ev.voted_count && row.voters_total === ev.voters_total) return
  qc.setQueryData<ElectionSummary[]>(queryKey, (old) =>
    old?.map((e) =>
      e.id === ev.election_id
        ? { ...e, voted_count: ev.voted_count, voters_total: ev.voters_total }
        : e,
    ),
  )
}

const patchDetail = (qc: QueryClient, ev: ElectionUpdateEvent): void => {
  const queryKey = detailKey(ev.election_id)
  if (!patchable(qc, queryKey)) return
  const detail = qc.getQueryData<ElectionDetail>(queryKey)
  const last = detail?.rounds[detail.rounds.length - 1]
  if (!detail || !last || last.round_no !== ev.round_no || last.status !== ev.round_status) {
    void qc.invalidateQueries({ queryKey })
    return
  }
  if (last.result) {
    // 진행 중인데 득표가 보인다 = 실시간 공개 선거. 득표는 이벤트에 없으니 다시 받는다
    invalidateThrottled(qc, queryKey)
    return
  }
  if (last.voted_count === ev.voted_count && last.voters_total === ev.voters_total) return
  qc.setQueryData<ElectionDetail>(queryKey, (old) =>
    old && {
      ...old,
      voted_count: ev.voted_count,
      voters_total: ev.voters_total,
      rounds: old.rounds.map((r) =>
        r.id === last.id ? { ...r, voted_count: ev.voted_count, voters_total: ev.voters_total } : r,
      ),
    },
  )
}

export const applyElectionUpdate = (qc: QueryClient, raw: string): void => {
  const ev = parse(raw)
  if (!ev || !ev.kind) {
    invalidateThrottled(qc, ALL)
    return
  }
  if (ev.kind !== 'ballot') {
    void qc.invalidateQueries({ queryKey: ALL })
    return
  }
  for (const key of LIST_KEYS) patchList(qc, key, ev)
  patchDetail(qc, ev)
  // 현황판은 득표·선거인별 투표 여부·종이 표까지 바뀐다 — 다시 받되 몰아서.
  // 표 수가 이미 같으면 내가 방금 넣은 종이 표의 되울림이다(응답으로 캐시를 맞춰 둔 상태).
  const board = qc.getQueryData<ElectionDetail>(adminDetailKey(ev.election_id))
  const boardRound = board?.rounds[board.rounds.length - 1]
  const echoed =
    boardRound?.round_no === ev.round_no &&
    boardRound?.status === ev.round_status &&
    boardRound?.voted_count === ev.voted_count
  if (!echoed) invalidateThrottled(qc, adminDetailKey(ev.election_id))
}
