// 선거(직분자 선출 투표) API
import type {
  ElectionAdminDetail,
  ElectionAuditLog,
  ElectionDetail,
  ElectionPayload,
  ElectionRules,
  ElectionSummary,
  OpenRoundPayload,
  RosterPoolMember,
} from '../types/election'
import { request, requestRaw } from './utils/request'

// ── 성도 ──────────────────────────────────────────────────────────────

/** 내가 선거인 명부에 있거나 선관위원인 선거만 내려온다 */
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

/** 제출하면 고칠 수 없다 — 무기명이라 서버도 어느 표가 내 표인지 모른다. abstain=기권 */
export const castVote = async (id: number, candidateIds: number[], abstain = false): Promise<ElectionDetail> =>
  request<ElectionDetail>(`/elections/${id}/vote`, {
    method: 'POST',
    auth: 'required',
    json: { candidate_ids: candidateIds, abstain },
    errorMessage: '투표하지 못했습니다',
  })

// ── 관리자 ────────────────────────────────────────────────────────────

export const getAllElections = async (): Promise<ElectionSummary[]> =>
  request<ElectionSummary[]>('/elections/admin/all', {
    auth: 'required',
    errorMessage: '선거를 불러오지 못했습니다',
  })

/** 현황판 — 관리자·그 선거의 선거관리위원 */
export const getElectionAdmin = async (id: number): Promise<ElectionAdminDetail> =>
  request<ElectionAdminDetail>(`/elections/${id}/admin`, {
    auth: 'required',
    errorMessage: '현황을 불러오지 못했습니다',
  })

/** 운영 기록 — 최근 것부터 */
export const getElectionAudit = async (id: number): Promise<ElectionAuditLog[]> =>
  request<ElectionAuditLog[]>(`/elections/${id}/audit`, {
    auth: 'required',
    errorMessage: '운영 기록을 불러오지 못했습니다',
  })

/** 명부·선관위원 고르기용 회원 목록 (직분·구역·출생 연도·전화 끝자리) */
export const getElectionRosterPool = async (): Promise<RosterPoolMember[]> =>
  request<RosterPoolMember[]>('/elections/admin/roster-pool', {
    auth: 'required',
    errorMessage: '회원 목록을 불러오지 못했습니다',
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

const adminDelete = (path: string, errorMessage: string) =>
  request<ElectionAdminDetail>(path, { method: 'DELETE', auth: 'required', errorMessage })

export const openElectionRound = (id: number, data: OpenRoundPayload = {}) =>
  adminPost(`/elections/${id}/rounds/open`, '투표를 시작하지 못했습니다', data)

export const closeElectionRound = (id: number) =>
  adminPost(`/elections/${id}/rounds/close`, '투표를 마감하지 못했습니다')

/** 사유는 운영 기록에 남는다 */
export const reopenElectionRound = (id: number, reason: string) =>
  adminPost(`/elections/${id}/rounds/reopen`, '마감을 되돌리지 못했습니다', { reason })

export const finishElection = (id: number) =>
  adminPost(`/elections/${id}/finish`, '선거를 종료하지 못했습니다')

/** 예약 마감 바꾸기 — null 이면 풀기 */
export const setElectionSchedule = async (id: number, closesAt: string | null): Promise<ElectionAdminDetail> =>
  request<ElectionAdminDetail>(`/elections/${id}/rounds/schedule`, {
    method: 'PUT',
    auth: 'required',
    json: { closes_at: closesAt },
    errorMessage: '예약 마감을 바꾸지 못했습니다',
  })

export const resetElectionPractice = (id: number) =>
  adminPost(`/elections/${id}/practice/reset`, '연습 투표를 정리하지 못했습니다')

export const remindElectionVoters = (id: number) =>
  adminPost(`/elections/${id}/remind`, '알림을 보내지 못했습니다')

export const announceElection = (id: number, audience: 'roster' | 'all') =>
  adminPost(`/elections/${id}/announce`, '발표 알림을 보내지 못했습니다', { audience })

/** 빈 목록은 무효표(기본) 또는 기권표 */
export const addPaperBallots = (
  id: number,
  candidateIds: number[],
  count = 1,
  blankKind: 'invalid' | 'abstain' = 'invalid'
) =>
  adminPost(`/elections/${id}/paper-ballots`, '종이 표를 넣지 못했습니다', {
    candidate_ids: candidateIds,
    count,
    blank_kind: blankKind,
  })

export const deletePaperBallot = (id: number, ballotId: number) =>
  adminDelete(`/elections/${id}/paper-ballots/${ballotId}`, '종이 표를 지우지 못했습니다')

/** 투표용지 교부 — 이미 앱으로 투표한 분이면 409 */
export const issuePaperBallot = (id: number, userId: number) =>
  adminPost(`/elections/${id}/paper-issues`, '투표용지를 교부하지 못했습니다', { user_id: userId })

export const cancelPaperIssue = (id: number, userId: number) =>
  adminDelete(`/elections/${id}/paper-issues/${userId}`, '교부를 되돌리지 못했습니다')

/** 후보 사진 업로드 (R2). URL 저장은 선거 등록/수정 요청이 담당한다 */
export const uploadCandidatePhoto = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)
  const body = await request<{ url: string }>('/elections/upload-photo', {
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
