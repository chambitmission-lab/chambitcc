// 혼자 쓸 때도 함께 — 지금 이 장을 쓰는 사람(익명 key)과 응원
import { requestData, requestRaw } from '../utils/request'
import type { TypingCheerKind } from './relay'

/** 같은 장을 지금 쓰는 사람. 익명이면 user_id·name·avatar_url 이 null — key 로만 가리킨다 */
export interface TypingChapterPerson {
  key: string
  user_id: number | null
  name: string | null
  avatar_url: string | null
  verse: number
}

export interface TypingTogetherSnapshot {
  /** 내 key — 명단에서 나를 빼는 데 쓴다 */
  me_key: string
  people: TypingChapterPerson[]
  /** 오늘 이 장을 (통과로) 쓴 성도 수 */
  today_writers: number
}

export const sendTypingTogetherPresence = (input: {
  book_number: number
  chapter: number
  verse: number
  anon: boolean
}): Promise<TypingTogetherSnapshot> =>
  requestData('/bible-typing/together/presence', {
    method: 'POST',
    auth: 'required',
    json: input,
    errorMessage: '접속 표시를 보내지 못했어요',
  })

export const leaveTypingTogether = async (): Promise<void> => {
  await requestRaw('/bible-typing/together/presence', {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '접속 표시를 지우지 못했어요',
  })
}

export const sendTypingTogetherCheer = async (input: {
  book_number: number
  chapter: number
  to_key: string
  kind: TypingCheerKind
}): Promise<void> => {
  await requestRaw('/bible-typing/together/cheer', {
    method: 'POST',
    auth: 'required',
    json: input,
    errorMessage: '응원을 보내지 못했어요',
  })
}
