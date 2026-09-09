// 성경 함께 읽기 — 실시간 읽기 위치(presence) API
//
// 하트비트는 서버 메모리만 갱신한다(DB 없음). 응답이 곧 그 장의 현황이라
// 초기 조회를 겸한다. 이후 변화는 SSE `reading_presence` 이벤트로 온다.
import { request, requestRaw } from './utils/request'

export interface ChapterPresence {
  book_number: number
  chapter: number
  /** 지금 이 장을 읽는 중인 사람 수 (나 포함) */
  total: number
  /**
   * total 에 내가 들어있는지 — "나 말고 몇 명"을 셀 때 이 값으로 뺀다.
   * 아직 이 필드를 안 내려주는 백엔드에선 undefined (프론트가 하트비트 여부로 짐작한다).
   */
  me_included?: boolean
  /** 절 번호(문자열) → 그 절을 읽는 중인 사람 수 */
  verse_counts: Record<string, number>
  /**
   * 오늘(KST) 이 장을 읽은 성도 수 — 그 장에 머문 사람 ∪ 읽음 기록을 남긴 사람.
   * null 이면 서버가 아직 모른다는 뜻이라 클라이언트는 이전 값을 지킨다.
   */
  readers_today?: number | null
  /**
   * readers_today 에 내가 들어있는지. GET 은 DB 로 정확히 알고, 하트비트는 이번 세션에
   * 인정된 뒤부터 true, 그 전과 SSE 는 null(모름) — 클라이언트는 이전 값을 지킨다.
   */
  me_read_today?: boolean | null
}

export interface PresencePosition {
  book_number: number
  chapter: number
  verse: number
}

export const sendPresenceHeartbeat = (pos: PresencePosition): Promise<ChapterPresence> =>
  request<ChapterPresence>('/bible/presence', {
    method: 'POST',
    json: pos,
    auth: 'required',
    errorMessage: '읽기 위치를 전송하지 못했습니다',
  })

/**
 * 읽기 이탈. 탭이 닫히는 순간에도 나가야 하므로 keepalive 로 보낸다.
 * (Authorization 헤더가 필요해 sendBeacon 은 못 쓴다)
 */
export const leavePresence = (): Promise<void> =>
  requestRaw('/bible/presence', {
    method: 'DELETE',
    auth: 'required',
    keepalive: true,
    errorMessage: '읽기 이탈을 전송하지 못했습니다',
  }).then(() => undefined)

export const getChapterPresence = (bookNumber: number, chapter: number): Promise<ChapterPresence> =>
  request<ChapterPresence>(`/bible/presence/${bookNumber}/${chapter}`, {
    errorMessage: '함께 읽기 현황을 불러오지 못했습니다',
  })
