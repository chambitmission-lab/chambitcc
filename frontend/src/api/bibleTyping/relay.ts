// 릴레이 필사 방 — 만들기·참여·현황·접속 표시·응원·바통
import { requestData, requestRaw } from '../utils/request'

export interface TypingRelaySummary {
  id: number
  title: string
  book_number: number
  book_name: string
  chapter: number
  done: number
  total: number
  members: number
  my_verses: number
  completed: boolean
}

export interface TypingRelayPreview extends TypingRelaySummary {
  owner_name: string | null
  is_member: boolean
}

export interface TypingRelayLive {
  user_id: number
  verse: number
}

export interface TypingRelayDetail {
  id: number
  title: string
  book_number: number
  book_name: string
  chapter: number
  invite_code: string
  is_owner: boolean
  completed: boolean
  done: number
  total: number
  members: {
    user_id: number
    name: string
    avatar_url: string | null
    verses: number
    is_me: boolean
    is_owner: boolean
  }[]
  verses: {
    id: number
    verse: number
    label: string
    by: { user_id: number; name: string } | null
    /** 이 칸을 쓰고 남긴 한마디(가장 최근 것) */
    note: { user_id: number; name: string; message: string } | null
  }[]
  /** 아직 아무도 안 쓴 첫 절 — 다 채웠으면 null */
  next_verse: number | null
  /** 지금 이 방에서 쓰고 있는 다른 멤버와 그 절 */
  live: TypingRelayLive[]
  /** 지금 누구 차례인지 — 마지막 바통을 받은 사람이 아직 이어받지 않았으면 그 사람과 가리키는 빈칸 */
  turn: {
    user_id: number
    name: string
    from_user_id: number
    from_name: string
    message: string | null
    verse: number
    label: string
  } | null
  /** 내게 넘어온 바통(turn 이 나일 때) — 이어받으면(이 장을 한 절 쓰면) 사라진다 */
  baton: { from_user_id: number; name: string; message: string | null; verse: number | null; label: string | null } | null
  /** '알아두면 좋은 말' 풀이를 열어 본 멤버 — 표제어 → user_id(서버 메모리, 옛 백엔드면 없음) */
  gloss_views?: Record<string, number[]>
}

export type TypingCheerKind = 'pray' | 'cheer' | 'amen'

export const getTypingRelays = (): Promise<TypingRelaySummary[]> =>
  requestData('/bible-typing/relays', { auth: 'required', errorMessage: '릴레이 필사를 불러오지 못했어요' })

export const createTypingRelay = (input: {
  book_number: number
  chapter: number
  title?: string
}): Promise<{ id: number; invite_code: string }> =>
  requestData('/bible-typing/relays', {
    method: 'POST',
    auth: 'required',
    json: input,
    errorMessage: '릴레이를 만들지 못했어요',
  })

export const getTypingRelay = (id: number): Promise<TypingRelayDetail> =>
  requestData(`/bible-typing/relays/${id}`, { auth: 'required', errorMessage: '릴레이를 불러오지 못했어요' })

export const previewTypingRelay = (code: string): Promise<TypingRelayPreview> =>
  requestData(`/bible-typing/relays/invite/${encodeURIComponent(code)}`, {
    auth: 'required',
    errorMessage: '초대 링크를 확인하지 못했어요',
  })

export const joinTypingRelay = async (code: string): Promise<number> => {
  const data = await requestData<{ id: number }>(`/bible-typing/relays/join/${encodeURIComponent(code)}`, {
    method: 'POST',
    auth: 'required',
    errorMessage: '릴레이에 참여하지 못했어요',
  })
  return data.id
}

/** 앱 사용자를 초대 링크 없이 바로 넣기 — 들어온 사람에겐 알림이 간다. 이미 함께하는 사람은 건너뛴다 */
export const addTypingRelayMembers = async (id: number, userIds: number[]): Promise<number> => {
  const data = await requestData<{ added_count: number }>(`/bible-typing/relays/${id}/members`, {
    method: 'POST',
    auth: 'required',
    json: { user_ids: userIds },
    errorMessage: '초대하지 못했어요',
  })
  return data.added_count
}

export const leaveTypingRelay = async (id: number): Promise<void> => {
  await requestRaw(`/bible-typing/relays/${id}/members/me`, {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '릴레이에서 나가지 못했어요',
  })
}

/** 지금 쓰는 절 하트비트(null = 화면을 떠남) — 나를 뺀 지금 접속한 멤버를 돌려준다 */
export const sendTypingRelayPresence = async (id: number, verse: number | null): Promise<TypingRelayLive[]> => {
  const data = await requestData<{ live: TypingRelayLive[] }>(`/bible-typing/relays/${id}/presence`, {
    method: 'POST',
    auth: 'required',
    json: { verse },
    errorMessage: '접속 표시를 보내지 못했어요',
  })
  return data.live
}

export const sendTypingRelayCheer = async (input: { id: number; to_user_id: number; kind: TypingCheerKind }): Promise<void> => {
  await requestRaw(`/bible-typing/relays/${input.id}/cheer`, {
    method: 'POST',
    auth: 'required',
    json: { to_user_id: input.to_user_id, kind: input.kind },
    errorMessage: '응원을 보내지 못했어요',
  })
}

export const passTypingRelayBaton = async (input: {
  id: number
  verse_id: number
  to_user_id: number | null
  message: string | null
}): Promise<void> => {
  await requestRaw(`/bible-typing/relays/${input.id}/baton`, {
    method: 'POST',
    auth: 'required',
    json: { verse_id: input.verse_id, to_user_id: input.to_user_id, message: input.message },
    errorMessage: '바통을 넘기지 못했어요',
  })
}

/** 릴레이 방 — 알아두면 좋은 말 풀이를 열어 봤다(처음이면 같은 방 사람들에게 알림) */
export const sendTypingRelayGlossView = async (input: { id: number; term: string }): Promise<void> => {
  await requestRaw(`/bible-typing/relays/${input.id}/gloss`, {
    method: 'POST',
    auth: 'required',
    json: { term: input.term },
    errorMessage: '풀이 열람을 알리지 못했어요',
  })
}
