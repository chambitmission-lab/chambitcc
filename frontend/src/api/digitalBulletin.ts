// 디지털 주보 API
import type {
  BulletinData,
  BulletinNotifySettings,
  BulletinReminder,
  DigitalBulletinDraftResponse,
  DigitalBulletinIssueResponse,
  DigitalBulletinIssueSummary,
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

/**
 * 공개본 교체. discardDraft 는 AI 초안을 검토해 적용한 저장 — 서버가 초안을 함께 지우고
 * 새 주보면 도착 알림을 예약한다(announce = 알림 본문, 없으면 서버가 소식 제목으로 만든다)
 */
export const replaceDigitalBulletin = async (
  data: BulletinData,
  discardDraft = false,
  announce?: string
): Promise<DigitalBulletinResponse> => {
  return request<DigitalBulletinResponse>('/digital-bulletin', {
    method: 'PUT',
    json: { data, discard_draft: discardDraft, ...(announce ? { announce } : {}) },
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

/** 지난 주보 목록(최근 것부터) */
export const getDigitalBulletinIssues = (): Promise<DigitalBulletinIssueSummary[]> =>
  request<DigitalBulletinIssueSummary[]>('/digital-bulletin/issues')

export const getDigitalBulletinIssue = (bulletinId: number): Promise<DigitalBulletinIssueResponse> =>
  request<DigitalBulletinIssueResponse>(`/digital-bulletin/issues/${bulletinId}`)

/** 내 주보 알림 설정(로그인) */
export const getBulletinNotify = (): Promise<BulletinNotifySettings> =>
  request<BulletinNotifySettings>('/digital-bulletin/notify', { auth: 'required' })

export const updateBulletinNotify = (patch: Partial<BulletinNotifySettings>): Promise<BulletinNotifySettings> =>
  request<BulletinNotifySettings>('/digital-bulletin/notify', {
    method: 'PUT',
    auth: 'required',
    json: patch,
    errorMessage: '알림 설정을 저장하지 못했어요',
  })

/** 아직 안 보낸 내 챙길 일 알림 */
export const getBulletinReminders = (): Promise<BulletinReminder[]> =>
  request<BulletinReminder[]>('/digital-bulletin/reminders', { auth: 'required' })

/** 내 챙길 일 알림 통째 교체 */
export const replaceBulletinReminders = (items: BulletinReminder[]): Promise<BulletinReminder[]> =>
  request<BulletinReminder[]>('/digital-bulletin/reminders', {
    method: 'PUT',
    auth: 'required',
    json: { items },
    errorMessage: '알림을 예약하지 못했어요',
  })
