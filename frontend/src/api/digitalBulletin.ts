// 디지털 주보 API
import type { BulletinData, DigitalBulletinResponse } from '../types/digitalBulletin'
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

export const replaceDigitalBulletin = async (
  data: BulletinData
): Promise<DigitalBulletinResponse> => {
  return request<DigitalBulletinResponse>('/digital-bulletin', {
    method: 'PUT',
    json: { data },
    errorMessage: 'Failed to update digital bulletin',
  })
}
