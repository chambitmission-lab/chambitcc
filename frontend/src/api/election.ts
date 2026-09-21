// 선거(직분자 선출 투표) API
import type {
  ElectionAdminDetail,
  ElectionDetail,
  ElectionPayload,
  ElectionRules,
  ElectionSummary,
  OpenRoundPayload,
} from '../types/election'
import { request, requestRaw, type UntypedJson } from './utils/request'

// ── 성도 ──────────────────────────────────────────────────────────────

/** 내가 선거인 명부에 있는 선거만 내려온다 */
export const getElections = async (): Promise<ElectionSummary[]> =>
  request<ElectionSummary[]>('/elections', {
    auth: 'required',
    errorMessage: '선거를 불러오지 못했습니다',
  })

export const getElection = async (id: number): Promise<ElectionDetail> =>
  request<ElectionDetail>(`/elections/${id}`, {
    auth: 'required',
    errorMessage: '선거를 불러오지 못했습니다',
  })

/** 제출하면 고칠 수 없다 — 무기명이라 서버도 어느 표가 내 표인지 모른다 */
export const castVote = async (id: number, candidateIds: number[]): Promise<ElectionDetail> =>
  request<ElectionDetail>(`/elections/${id}/vote`, {
    method: 'POST',
    auth: 'required',
    json: { candidate_ids: candidateIds },
    errorMessage: '투표하지 못했습니다',
  })

// ── 관리자 ────────────────────────────────────────────────────────────

export const getAllElections = async (): Promise<ElectionSummary[]> =>
  request<ElectionSummary[]>('/elections/admin/all', {
    auth: 'required',
    errorMessage: '선거를 불러오지 못했습니다',
  })

export const getElectionAdmin = async (id: number): Promise<ElectionAdminDetail> =>
  request<ElectionAdminDetail>(`/elections/${id}/admin`, {
    auth: 'required',
    errorMessage: '현황을 불러오지 못했습니다',
  })

/** 새 선거 폼의 출발값 — 기본 기준은 서버(election_rules.DEFAULT_RULES) 한 곳에만 있다 */
export const getDefaultElectionRules = async (): Promise<ElectionRules> =>
  request<ElectionRules>('/elections/admin/default-rules', {
    auth: 'required',
    errorMessage: '기본 기준을 불러오지 못했습니다',
  })

export const createElection = async (data: ElectionPayload): Promise<ElectionAdminDetail> =>
  request<ElectionAdminDetail>('/elections', {
    method: 'POST',
    auth: 'required',
    json: data,
    errorMessage: '선거를 만들지 못했습니다',
  })

export const updateElection = async (
  id: number,
  data: Partial<ElectionPayload>
): Promise<ElectionAdminDetail> =>
  request<ElectionAdminDetail>(`/elections/${id}`, {
    method: 'PUT',
    auth: 'required',
    json: data,
    errorMessage: '선거를 저장하지 못했습니다',
  })

export const deleteElection = async (id: number): Promise<void> => {
  await requestRaw(`/elections/${id}`, {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '선거를 삭제하지 못했습니다',
  })
}

/** 회차·종이 표 조작 — 모두 최신 현황(ElectionAdminDetail)을 돌려준다 */
const adminPost = (path: string, errorMessage: string, json?: unknown) =>
  request<ElectionAdminDetail>(path, { method: 'POST', auth: 'required', json: json ?? {}, errorMessage })

export const openElectionRound = (id: number, data: OpenRoundPayload = {}) =>
  adminPost(`/elections/${id}/rounds/open`, '투표를 시작하지 못했습니다', data)

export const closeElectionRound = (id: number) =>
  adminPost(`/elections/${id}/rounds/close`, '투표를 마감하지 못했습니다')

export const reopenElectionRound = (id: number) =>
  adminPost(`/elections/${id}/rounds/reopen`, '마감을 되돌리지 못했습니다')

export const finishElection = (id: number) =>
  adminPost(`/elections/${id}/finish`, '선거를 종료하지 못했습니다')

export const addPaperBallots = (id: number, candidateIds: number[], count = 1) =>
  adminPost(`/elections/${id}/paper-ballots`, '종이 표를 넣지 못했습니다', {
    candidate_ids: candidateIds,
    count,
  })

export const deletePaperBallot = async (id: number, ballotId: number): Promise<ElectionAdminDetail> =>
  request<ElectionAdminDetail>(`/elections/${id}/paper-ballots/${ballotId}`, {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '종이 표를 지우지 못했습니다',
  })

/** 후보 사진 업로드 (R2). URL 저장은 선거 등록/수정 요청이 담당한다 */
export const uploadCandidatePhoto = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)
  const body = await request<UntypedJson>('/elections/upload-photo', {
    method: 'POST',
    auth: 'required',
    body: formData,
    errorMessage: '사진 업로드에 실패했습니다',
  })
  return body.url
}

/** 회차별 결과 CSV — 인증 헤더가 필요해 blob 으로 받아 저장한다 */
export const downloadElectionCsv = async (id: number, filename: string): Promise<void> => {
  const response = await requestRaw(`/elections/${id}/export`, {
    auth: 'required',
    errorMessage: 'CSV 내려받기에 실패했습니다',
  })
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
