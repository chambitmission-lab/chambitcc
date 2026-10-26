// 손글씨 필사대회 API 클라이언트
import { API_V1 } from '../config/api'
import type {
  ContestDetail,
  ContestEntry,
  ContestSummary,
  ContestWrite,
  EntryPage,
  EntrySort,
  EntrySubmit,
} from '../types/handwritingContest'
import { request, requestRaw } from './utils/request'

const BASE = `${API_V1}/handwriting-contests`

export const getContests = (): Promise<{ items: ContestSummary[] }> =>
  request(BASE, { errorMessage: '필사대회를 불러오지 못했어요' })

export const getContest = (id: number): Promise<ContestDetail> =>
  request<ContestDetail>(`${BASE}/${id}`, { errorMessage: '필사대회를 불러오지 못했어요' })

export const getContestEntries = (
  id: number,
  sort: EntrySort,
  offset: number,
  limit = 24,
): Promise<EntryPage> =>
  request<EntryPage>(`${BASE}/${id}/entries`, {
    query: { sort, offset, limit },
    errorMessage: '작품을 불러오지 못했어요',
  })

export const getContestEntry = (id: number, entryId: number): Promise<ContestEntry> =>
  request<ContestEntry>(`${BASE}/${id}/entries/${entryId}`, { errorMessage: '작품을 불러오지 못했어요' })

/** 획 JSON 원문 — 서버가 R2 에서 대신 받아 준다(버킷 CORS 와 무관하게 캔버스에 그린다).
    모양 검증(parseInkPageFile)은 그리는 쪽이 한다 */
export const getContestEntryInk = (id: number, entryId: number): Promise<unknown> =>
  request<unknown>(`${BASE}/${id}/entries/${entryId}/ink`, { errorMessage: '글씨를 불러오지 못했어요' })

export const submitContestEntry = (id: number, payload: EntrySubmit): Promise<ContestEntry> => {
  const form = new FormData()
  form.append('verse_ref', payload.verse_ref)
  form.append('verse_text', payload.verse_text)
  if (payload.comment.trim()) form.append('comment', payload.comment.trim())
  form.append('card_consent', payload.card_consent ? 'true' : 'false')
  form.append('width', String(payload.width))
  form.append('height', String(payload.height))
  form.append('image', payload.png, 'handwriting.png')
  form.append('ink', payload.ink, 'handwriting.json')
  return request<ContestEntry>(`${BASE}/${id}/entries`, {
    method: 'POST',
    body: form,
    auth: 'required',
    errorMessage: '작품을 내지 못했어요',
  })
}

export const withdrawContestEntry = async (id: number): Promise<void> => {
  await requestRaw(`${BASE}/${id}/entries/mine`, { method: 'DELETE', errorMessage: '출품을 거두지 못했어요' })
}

export const updateContestConsent = (id: number, cardConsent: boolean): Promise<ContestEntry> =>
  request<ContestEntry>(`${BASE}/${id}/entries/mine/consent`, {
    method: 'PUT',
    json: { card_consent: cardConsent },
    errorMessage: '동의 설정을 바꾸지 못했어요',
  })

export const voteContestEntry = (id: number, entryId: number, on: boolean): Promise<ContestDetail> =>
  request<ContestDetail>(`${BASE}/${id}/entries/${entryId}/vote`, {
    method: on ? 'POST' : 'DELETE',
    auth: 'required',
    errorMessage: on ? '투표하지 못했어요' : '표를 거두지 못했어요',
  })

// ── 관리자 ──
export const getAdminContests = (): Promise<{ items: ContestSummary[] }> =>
  request(`${BASE}/admin/all`, { errorMessage: '필사대회를 불러오지 못했어요' })

export const createContest = (payload: ContestWrite): Promise<ContestSummary> =>
  request<ContestSummary>(BASE, { method: 'POST', json: payload, errorMessage: '대회를 만들지 못했어요' })

export const updateContest = (id: number, payload: ContestWrite): Promise<ContestSummary> =>
  request<ContestSummary>(`${BASE}/${id}`, { method: 'PUT', json: payload, errorMessage: '대회를 고치지 못했어요' })

export const deleteContest = async (id: number): Promise<void> => {
  await requestRaw(`${BASE}/${id}`, { method: 'DELETE', errorMessage: '대회를 지우지 못했어요' })
}

export const publishContest = (id: number, on: boolean): Promise<ContestDetail> =>
  request<ContestDetail>(`${BASE}/${id}/publish`, {
    method: on ? 'POST' : 'DELETE',
    errorMessage: on ? '결과를 발표하지 못했어요' : '발표를 취소하지 못했어요',
  })

export const hideContestEntry = (entryId: number, hidden: boolean): Promise<ContestEntry> =>
  request<ContestEntry>(`${BASE}/entries/${entryId}/hidden`, {
    method: 'PUT',
    json: { hidden },
    errorMessage: '처리하지 못했어요',
  })
