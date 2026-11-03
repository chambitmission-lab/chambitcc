// 디지털 주보 API
import type {
  BulletinData,
  DigitalBulletinDraftResponse,
  DigitalBulletinResponse,
} from '../types/digitalBulletin'
import { request } from './utils/request'

const EMPTY_RESPONSE: DigitalBulletinResponse = {
  data: {
    date: '',
    title: '',
    subtitle: '',
    worship: {
      schedule: [],
      offering: '',
      prayer: '',
      sermon: { title: '', subtitle: '' },
    },
    announcements: [],
    extras: [],
    groups: [],
    weeklySchedule: [],
  },
}

export const getDigitalBulletin = async (): Promise<DigitalBulletinResponse> => {
  try {
    return await request<DigitalBulletinResponse>('/digital-bulletin')
  } catch (error) {
    console.warn('digital-bulletin API not available, using defaults:', error)
    return EMPTY_RESPONSE
  }
}

/** 공개본 교체. discardDraft 는 AI 초안을 검토해 적용한 저장 — 서버가 초안을 함께 지운다 */
export const replaceDigitalBulletin = async (
  data: BulletinData,
  discardDraft = false
): Promise<DigitalBulletinResponse> => {
  return request<DigitalBulletinResponse>('/digital-bulletin', {
    method: 'PUT',
    json: { data, discard_draft: discardDraft },
    errorMessage: 'Failed to update digital bulletin',
  })
}

/** AI 초안 조회(관리자). 없으면 data: null */
export const getDigitalBulletinDraft = (): Promise<DigitalBulletinDraftResponse> =>
  request<DigitalBulletinDraftResponse>('/digital-bulletin/draft', { auth: 'required' })

/** AI 초안 버리기(관리자) */
export const discardDigitalBulletinDraft = (): Promise<void> =>
  request<void>('/digital-bulletin/draft', {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '초안을 버리지 못했어요',
  })
