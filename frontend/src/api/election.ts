// 선거(직분자 선출 투표) API
import type {
  AssemblyBoard,
  AssemblyPayload,
  BulkResult,
  ElectionAdminDetail,
  ElectionAssembly,
  ElectionAssemblyDetail,
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

// ── 공동의회 (관리자) — 명부·선관위원을 한 번만 정해 여러 선거가 함께 쓴다 ──

export const getElectionAssemblies = async (): Promise<ElectionAssembly[]> =>
  request<ElectionAssembly[]>('/elections/assemblies', {
    auth: 'required',
    errorMessage: '공동의회를 불러오지 못했습니다',
  })

export const getElectionAssembly = async (id: number): Promise<ElectionAssemblyDetail> =>
  request<ElectionAssemblyDetail>(`/elections/assemblies/${id}`, {
    auth: 'required',
    errorMessage: '공동의회를 불러오지 못했습니다',
  })

/** 고치면 소속 선거의 명부·선관위원에 바로 반영된다 — 이미 투표한 선거인을 빼면 400 */
export const saveElectionAssembly = async (
  id: number | undefined,
  data: AssemblyPayload
): Promise<ElectionAssemblyDetail> =>
  request<ElectionAssemblyDetail>(id ? `/elections/assemblies/${id}` : '/elections/assemblies', {
    method: id ? 'PUT' : 'POST',
    auth: 'required',
    json: data,
    errorMessage: '공동의회를 저장하지 못했습니다',
  })

/** 소속 선거는 지워지지 않고 단독 선거로 남는다 */
export const deleteElectionAssembly = async (id: number): Promise<void> => {
  await requestRaw(`/elections/assemblies/${id}`, {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '공동의회를 삭제하지 못했습니다',
  })
}

// 함께 진행 — 관리자·선관위원. 같은 공동의회의 선거들에 같은 조작을 한 번에 건다

export const getAssemblyBoard = async (id: number): Promise<AssemblyBoard> =>
  request<AssemblyBoard>(`/elections/assemblies/${id}/board`, {
    auth: 'required',
    errorMessage: '공동의회 현황을 불러오지 못했습니다',
  })

const bulkPost = (path: string, errorMessage: string, json?: unknown) =>
  request<BulkResult>(path, { method: 'POST', auth: 'required', json: json ?? {}, errorMessage })

/** 아직 열지 않은 선거의 1차(연습) 투표를 한꺼번에 — 시작 알림은 한 번만 간다 */
export const openAssemblyRounds = (id: number, data: OpenRoundPayload = {}) =>
  bulkPost(`/elections/assemblies/${id}/rounds/open`, '투표를 시작하지 못했습니다', data)

export const closeAssemblyRounds = (id: number) =>
  bulkPost(`/elections/assemblies/${id}/rounds/close`, '투표를 마감하지 못했습니다')

/** 열려 있는 선거 모두에 투표용지 교부 — 앱으로 이미 투표한 선거는 건너뛴다 */
export const issueAssemblyPaper = (id: number, userId: number) =>
  bulkPost(`/elections/assemblies/${id}/paper-issues`, '투표용지를 교부하지 못했습니다', { user_id: userId })

/** 열려 있는 투표가 남은 앱 선거인에게 알림 한 통 (선거마다 따로 울리지 않게) */
export const remindAssemblyVoters = (id: number) =>
  bulkPost(`/elections/assemblies/${id}/remind`, '알림을 보내지 못했습니다')

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
export const downloadElectionCsv = (id: number, filename: string): Promise<void> =>
  downloadCsv(`/elections/${id}/export`, filename)

/** 공동의회 전체 결과 CSV — 소속 선거를 한 파일에 */
export const downloadAssemblyCsv = (id: number, filename: string): Promise<void> =>
  downloadCsv(`/elections/assemblies/${id}/export`, filename)

const downloadCsv = async (path: string, filename: string): Promise<void> => {
  const response = await requestRaw(path, {
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
