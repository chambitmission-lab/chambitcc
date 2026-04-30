// 디지털 주보 API
import { API_V1, apiFetch } from '../config/api'
import type { BulletinData, DigitalBulletinResponse } from '../types/digitalBulletin'

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
    const response = await apiFetch(`${API_V1}/digital-bulletin`)
    if (!response.ok) {
      return EMPTY_RESPONSE
    }
    return response.json()
  } catch (error) {
    console.warn('digital-bulletin API not available, using defaults:', error)
    return EMPTY_RESPONSE
  }
}

export const replaceDigitalBulletin = async (
  data: BulletinData
): Promise<DigitalBulletinResponse> => {
  const token = localStorage.getItem('access_token')
  const response = await apiFetch(`${API_V1}/digital-bulletin`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ data }),
  })

  if (!response.ok) {
    throw new Error('Failed to update digital bulletin')
  }

  return response.json()
}
