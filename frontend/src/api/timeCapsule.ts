// 타임캡슐 API 클라이언트
import { API_V1, apiFetch } from '../config/api'
import { getAuthHeaders } from './utils/apiHelpers'
import type {
  CapsuleCreateRequest,
  CapsuleDetail,
  CapsuleListResponse,
  CapsulePreview,
  CapsuleSummary,
} from '../types/timeCapsule'

const BASE = `${API_V1}/time-capsules`

const parseError = async (response: Response, fallback: string): Promise<never> => {
  const error = await response.json().catch(() => ({}))
  throw new Error(error.detail || fallback)
}

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
  if (payload.clientSnapshot) {
    formData.append('client_snapshot', JSON.stringify(payload.clientSnapshot))
  }
  if (payload.audioBlob) {
    formData.append('audio', payload.audioBlob, audioFileName(payload.audioBlob))
    if (payload.audioDuration != null) {
      formData.append('audio_duration', String(payload.audioDuration))
    }
  }
  const response = await apiFetch(BASE, {
    method: 'POST',
    // Content-Type은 브라우저가 multipart boundary와 함께 설정한다
    headers: getAuthHeaders(),
    body: formData,
  })
  if (!response.ok) return parseError(response, '캡슐 봉인에 실패했습니다')
  return response.json()
}

export const listMyCapsules = async (): Promise<CapsuleListResponse> => {
  const response = await apiFetch(BASE, { headers: getAuthHeaders() })
  if (!response.ok) return parseError(response, '캡슐함을 불러오지 못했습니다')
  return response.json()
}

export const getCapsule = async (capsuleId: number): Promise<CapsuleDetail> => {
  const response = await apiFetch(`${BASE}/${capsuleId}`, { headers: getAuthHeaders() })
  if (!response.ok) return parseError(response, '캡슐을 불러오지 못했습니다')
  return response.json()
}

export const openCapsule = async (capsuleId: number): Promise<CapsuleDetail> => {
  const response = await apiFetch(`${BASE}/${capsuleId}/open`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  if (!response.ok) return parseError(response, '아직 캡슐을 열 수 없습니다')
  return response.json()
}

export const previewCapsule = async (inviteCode: string): Promise<CapsulePreview> => {
  const response = await apiFetch(`${BASE}/preview/${encodeURIComponent(inviteCode)}`, {
    headers: getAuthHeaders(),
  })
  if (!response.ok) return parseError(response, '유효하지 않은 초대 링크입니다')
  return response.json()
}

export const claimCapsule = async (inviteCode: string): Promise<CapsuleSummary> => {
  const response = await apiFetch(`${BASE}/claim`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ invite_code: inviteCode }),
  })
  if (!response.ok) return parseError(response, '캡슐 받기에 실패했습니다')
  return response.json()
}

export const deleteCapsule = async (capsuleId: number): Promise<void> => {
  const response = await apiFetch(`${BASE}/${capsuleId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!response.ok && response.status !== 204) {
    return parseError(response, '캡슐 삭제에 실패했습니다')
  }
}
