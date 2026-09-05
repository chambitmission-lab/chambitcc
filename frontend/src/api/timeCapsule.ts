// 타임캡슐 API 클라이언트
import { API_V1 } from '../config/api'
import type {
  CapsuleCreateRequest,
  CapsuleDetail,
  CapsuleListResponse,
  CapsulePreview,
  CapsuleRecipient,
  CapsuleSummary,
} from '../types/timeCapsule'
import { request, requestRaw } from './utils/request'

const BASE = `${API_V1}/time-capsules`

const audioFileName = (blob: Blob): string => {
  if (blob.type.includes('mp4')) return 'capsule.m4a'
  if (blob.type.includes('wav')) return 'capsule.wav'
  return 'capsule.webm'
}

export const createCapsule = async (
  payload: CapsuleCreateRequest,
): Promise<CapsuleSummary> => {
  const formData = new FormData()
  formData.append('capsule_type', payload.capsuleType)
  formData.append('open_date', payload.openDate)
  if (payload.openLabel) formData.append('open_label', payload.openLabel)
  if (payload.message) formData.append('message', payload.message)
  if (payload.title) formData.append('title', payload.title)
  if (payload.recipientName) formData.append('recipient_name', payload.recipientName)
  if (payload.recipientUserId != null) {
    formData.append('recipient_user_id', String(payload.recipientUserId))
  }
  if (payload.prayerId != null) {
    formData.append('prayer_id', String(payload.prayerId))
  }
  if (payload.clientSnapshot) {
    formData.append('client_snapshot', JSON.stringify(payload.clientSnapshot))
  }
  if (payload.audioBlob) {
    formData.append('audio', payload.audioBlob, audioFileName(payload.audioBlob))
    if (payload.audioDuration != null) {
      formData.append('audio_duration', String(payload.audioDuration))
    }
  }
  if (payload.photos?.length) {
    payload.photos.forEach((photo, i) => {
      formData.append('photos', photo.blob, `photo_${i + 1}.jpg`)
    })
    formData.append(
      'photo_captions',
      JSON.stringify(payload.photos.map((p) => p.caption.trim())),
    )
  }
  return request<CapsuleSummary>(BASE, {
    method: 'POST',
    body: formData,
    errorMessage: '캡슐 봉인에 실패했습니다',
  })
}

// 받는 사람 검색 — 이름/아이디 부분 일치, 서버가 최대 8명만 내려준다
export const searchCapsuleRecipients = async (q: string): Promise<CapsuleRecipient[]> => {
  return request<CapsuleRecipient[]>(`${BASE}/recipients?q=${encodeURIComponent(q)}`, { errorMessage: '받는 분을 찾지 못했습니다' })
}

export const listMyCapsules = async (): Promise<CapsuleListResponse> => {
  return request<CapsuleListResponse>(BASE, { errorMessage: '캡슐함을 불러오지 못했습니다' })
}

export const getCapsule = async (capsuleId: number): Promise<CapsuleDetail> => {
  return request<CapsuleDetail>(`${BASE}/${capsuleId}`, { errorMessage: '캡슐을 불러오지 못했습니다' })
}

export const openCapsule = async (capsuleId: number): Promise<CapsuleDetail> => {
  return request<CapsuleDetail>(`${BASE}/${capsuleId}/open`, { method: 'POST', errorMessage: '아직 캡슐을 열 수 없습니다' })
}

export const previewCapsule = async (inviteCode: string): Promise<CapsulePreview> => {
  return request<CapsulePreview>(`${BASE}/preview/${encodeURIComponent(inviteCode)}`, { errorMessage: '유효하지 않은 초대 링크입니다' })
}

export const claimCapsule = async (inviteCode: string): Promise<CapsuleSummary> => {
  return request<CapsuleSummary>(`${BASE}/claim`, {
    method: 'POST',
    json: { invite_code: inviteCode },
    errorMessage: '캡슐 받기에 실패했습니다',
  })
}

export const deleteCapsule = async (capsuleId: number): Promise<void> => {
  await requestRaw(`${BASE}/${capsuleId}`, { method: 'DELETE', errorMessage: '캡슐 삭제에 실패했습니다' })
}
