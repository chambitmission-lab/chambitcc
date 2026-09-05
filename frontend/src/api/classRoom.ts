// 우리반 알림장 API 클라이언트
import { API_V1 } from '../config/api'
import type {
  AttendanceMonth,
  AttendanceToggleResult,
  CheckStatus,
  ClassComment,
  ClassCreateRequest,
  ClassDetail,
  ClassMember,
  ClassPost,
  ClassPostCreateRequest,
  ClassPostListResponse,
  ClassPostType,
  ClassPreview,
  ClassReport,
  ClassSummary,
  EventBlock,
  MyGrowth,
  PollBlock,
  PollDetail,
  RecitationRow,
  RemindResult,
  RemindTarget,
  RsvpDetail,
  RsvpStatus,
  StarRow,
} from '../types/classRoom'
import { request, requestRaw } from './utils/request'

const BASE = `${API_V1}/school-classes`

export const createClass = async (payload: ClassCreateRequest): Promise<ClassDetail> => {
  return request<ClassDetail>(BASE, {
    method: 'POST',
    json: payload,
    errorMessage: '반 만들기에 실패했습니다',
  })
}

export const listMyClasses = async (): Promise<ClassSummary[]> => {
  return request<ClassSummary[]>(BASE, { errorMessage: '반 목록을 불러오지 못했습니다' })
}

export const previewClass = async (inviteCode: string): Promise<ClassPreview> => {
  return request<ClassPreview>(`${BASE}/preview/${encodeURIComponent(inviteCode)}`, { errorMessage: '유효하지 않은 초대 링크입니다' })
}

export const joinClass = async (
  inviteCode: string,
  childName?: string,
): Promise<ClassDetail> => {
  return request<ClassDetail>(`${BASE}/join`, {
    method: 'POST',
    json: { invite_code: inviteCode, child_name: childName || null },
    errorMessage: '반 참여에 실패했습니다',
  })
}

export const getClass = async (classId: number): Promise<ClassDetail> => {
  return request<ClassDetail>(`${BASE}/${classId}`, { errorMessage: '반을 불러오지 못했습니다' })
}

export const updateClass = async (
  classId: number,
  payload: Partial<ClassCreateRequest>,
): Promise<ClassDetail> => {
  return request<ClassDetail>(`${BASE}/${classId}`, {
    method: 'PATCH',
    json: payload,
    errorMessage: '반 정보 수정에 실패했습니다',
  })
}

export const leaveClass = async (classId: number): Promise<void> => {
  await requestRaw(`${BASE}/${classId}/leave`, { method: 'DELETE', errorMessage: '나가기에 실패했습니다' })
}

export const updateMyChildName = async (
  classId: number,
  childName: string,
): Promise<ClassMember> => {
  return request<ClassMember>(`${BASE}/${classId}/members/me`, {
    method: 'PATCH',
    json: { child_name: childName },
    errorMessage: '자녀 이름 수정에 실패했습니다',
  })
}

// 앱 사용자를 반에 바로 추가 — 선생님 전용, 이미 멤버면 서버가 건너뛴다(멱등)
export const addClassMembers = async (
  classId: number,
  userIds: number[],
): Promise<ClassMember[]> => {
  return request<ClassMember[]>(`${BASE}/${classId}/members`, {
    method: 'POST',
    json: { user_ids: userIds },
    errorMessage: '멤버 추가에 실패했습니다',
  })
}

export const setMemberTeacher = async (
  classId: number,
  userId: number,
  isTeacher: boolean,
): Promise<ClassMember> => {
  return request<ClassMember>(`${BASE}/${classId}/members/${userId}`, {
    method: 'PATCH',
    json: { is_teacher: isTeacher },
    errorMessage: '역할 변경에 실패했습니다',
  })
}

export const listClassPosts = async (
  classId: number,
  postType?: ClassPostType,
  offset = 0,
  limit = 20,
): Promise<ClassPostListResponse> => {
  const qs = new URLSearchParams({ offset: String(offset), limit: String(limit) })
  if (postType) qs.set('post_type', postType)
  return request<ClassPostListResponse>(`${BASE}/${classId}/posts?${qs}`, { errorMessage: '알림장을 불러오지 못했습니다' })
}

export const createClassPost = async (
  classId: number,
  payload: ClassPostCreateRequest,
  files: File[] = [],
): Promise<ClassPost> => {
  const form = new FormData()
  form.append('payload', JSON.stringify(payload))
  files.forEach((f) => form.append('files', f))
  // FormData는 Content-Type을 브라우저가 boundary와 함께 넣도록 지정하지 않는다
  return request<ClassPost>(`${BASE}/${classId}/posts`, {
    method: 'POST',
    body: form,
    errorMessage: '알림 작성에 실패했습니다',
  })
}

export const updateClassPost = async (
  classId: number,
  postId: number,
  payload: { title?: string | null; content?: string; is_pinned?: boolean },
): Promise<ClassPost> => {
  return request<ClassPost>(`${BASE}/${classId}/posts/${postId}`, {
    method: 'PATCH',
    json: payload,
    errorMessage: '알림 수정에 실패했습니다',
  })
}

export const deleteClassPost = async (classId: number, postId: number): Promise<void> => {
  await requestRaw(`${BASE}/${classId}/posts/${postId}`, { method: 'DELETE', errorMessage: '삭제에 실패했습니다' })
}

export const toggleClassPostCheck = async (
  classId: number,
  postId: number,
): Promise<{ checked: boolean; check_count: number }> => {
  return request<{ checked: boolean; check_count: number }>(`${BASE}/${classId}/posts/${postId}/check`, { method: 'POST', errorMessage: '확인 처리에 실패했습니다' })
}

export const getClassPostChecks = async (
  classId: number,
  postId: number,
): Promise<CheckStatus> => {
  return request<CheckStatus>(`${BASE}/${classId}/posts/${postId}/checks`, { errorMessage: '확인 현황을 불러오지 못했습니다' })
}

export const toggleClassPostRecite = async (
  classId: number,
  postId: number,
): Promise<{ recited: boolean; recite_count: number }> => {
  return request<{ recited: boolean; recite_count: number }>(`${BASE}/${classId}/posts/${postId}/recite`, { method: 'POST', errorMessage: '암송 체크에 실패했습니다' })
}

export const listClassPostRecitations = async (
  classId: number,
  postId: number,
): Promise<RecitationRow[]> => {
  return request<RecitationRow[]>(`${BASE}/${classId}/posts/${postId}/recitations`, { errorMessage: '암송 현황을 불러오지 못했습니다' })
}

export const setClassPostRsvp = async (
  classId: number,
  postId: number,
  status: RsvpStatus,
): Promise<EventBlock> => {
  return request<EventBlock>(`${BASE}/${classId}/posts/${postId}/rsvp`, {
    method: 'PUT',
    json: { status },
    errorMessage: '참석 응답에 실패했습니다',
  })
}

export const cancelClassPostRsvp = async (
  classId: number,
  postId: number,
): Promise<EventBlock> => {
  return request<EventBlock>(`${BASE}/${classId}/posts/${postId}/rsvp`, { method: 'DELETE', errorMessage: '참석 취소에 실패했습니다' })
}

export const getClassPostRsvps = async (
  classId: number,
  postId: number,
): Promise<RsvpDetail> => {
  return request<RsvpDetail>(`${BASE}/${classId}/posts/${postId}/rsvps`, { errorMessage: '참석 현황을 불러오지 못했습니다' })
}

// ── 투표 ──
export const voteClassPoll = async (
  classId: number,
  postId: number,
  optionIds: number[],
): Promise<PollBlock> => {
  return request<PollBlock>(`${BASE}/${classId}/posts/${postId}/vote`, {
    method: 'PUT',
    json: { option_ids: optionIds },
    errorMessage: '투표에 실패했습니다',
  })
}

export const getClassPollDetail = async (
  classId: number,
  postId: number,
): Promise<PollDetail> => {
  return request<PollDetail>(`${BASE}/${classId}/posts/${postId}/votes`, { errorMessage: '투표 현황을 불러오지 못했습니다' })
}

// ── 콕 찌르기 (미응답자 리마인더) ──
export const remindClassPost = async (
  classId: number,
  postId: number,
  target: RemindTarget,
): Promise<RemindResult> => {
  return request<RemindResult>(`${BASE}/${classId}/posts/${postId}/remind`, {
    method: 'POST',
    json: { target },
    errorMessage: '리마인더 발송에 실패했습니다',
  })
}

// ── 우리반 리포트 / 별 랭킹 / 성장 카드 ──
export const getClassReport = async (
  classId: number,
  weeks = 4,
): Promise<ClassReport> => {
  return request<ClassReport>(`${BASE}/${classId}/report?weeks=${weeks}`, { errorMessage: '리포트를 불러오지 못했습니다' })
}

export const getClassStars = async (classId: number): Promise<StarRow[]> => {
  return request<StarRow[]>(`${BASE}/${classId}/stars`, { errorMessage: '별 랭킹을 불러오지 못했습니다' })
}

export const getMyClassGrowth = async (classId: number): Promise<MyGrowth> => {
  return request<MyGrowth>(`${BASE}/${classId}/growth/me`, { errorMessage: '성장 카드를 불러오지 못했습니다' })
}

// ── 출석부 ──
export const getClassAttendanceMonth = async (
  classId: number,
  month: string,
): Promise<AttendanceMonth> => {
  return request<AttendanceMonth>(`${BASE}/${classId}/attendance?month=${month}`, { errorMessage: '출석부를 불러오지 못했습니다' })
}

export const toggleClassAttendance = async (
  classId: number,
  attDate: string,
  userId: number,
): Promise<AttendanceToggleResult> => {
  return request<AttendanceToggleResult>(`${BASE}/${classId}/attendance/toggle`, {
    method: 'POST',
    json: { att_date: attDate, user_id: userId },
    errorMessage: '출석 체크에 실패했습니다',
  })
}

export const listClassPostComments = async (
  classId: number,
  postId: number,
): Promise<ClassComment[]> => {
  return request<ClassComment[]>(`${BASE}/${classId}/posts/${postId}/comments`, { errorMessage: '댓글을 불러오지 못했습니다' })
}

export const createClassPostComment = async (
  classId: number,
  postId: number,
  content: string,
): Promise<ClassComment> => {
  return request<ClassComment>(`${BASE}/${classId}/posts/${postId}/comments`, {
    method: 'POST',
    json: { content },
    errorMessage: '댓글 작성에 실패했습니다',
  })
}

export const updateClassPostComment = async (
  classId: number,
  postId: number,
  commentId: number,
  content: string,
): Promise<ClassComment> => {
  return request<ClassComment>(`${BASE}/${classId}/posts/${postId}/comments/${commentId}`, {
    method: 'PATCH',
    json: { content },
    errorMessage: '댓글 수정에 실패했습니다',
  })
}

export const deleteClassPostComment = async (
  classId: number,
  postId: number,
  commentId: number,
): Promise<void> => {
  await requestRaw(`${BASE}/${classId}/posts/${postId}/comments/${commentId}`, { method: 'DELETE', errorMessage: '댓글 삭제에 실패했습니다' })
}
