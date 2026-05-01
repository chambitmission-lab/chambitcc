import { API_V1, apiFetch } from '../config/api'
import { getAuthHeaders, requireAuth } from './utils/apiHelpers'
import type {
  Rabbit,
  RabbitProgress,
  RabbitCatalog,
  RabbitEventLog,
} from '../types/rabbit'

const BASE = `${API_V1}/rabbit`

const handle = async <T,>(res: Response, msg: string): Promise<T> => {
  if (!res.ok) {
    let detail = msg
    try {
      const e = await res.json()
      if (e?.detail) detail = e.detail
    } catch {
      /* noop */
    }
    throw new Error(detail)
  }
  return res.json() as Promise<T>
}

export const fetchMyRabbit = async (): Promise<RabbitProgress> => {
  requireAuth()
  const res = await apiFetch(`${BASE}/me`, { headers: getAuthHeaders() })
  return handle<RabbitProgress>(res, '토끼 정보를 불러오지 못했습니다')
}

export const equipTreasure = async (itemCode: string): Promise<Rabbit> => {
  requireAuth()
  const res = await apiFetch(`${BASE}/equip`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ item_code: itemCode }),
  })
  return handle<Rabbit>(res, '장착 실패')
}

export const unequipSlot = async (slot: string): Promise<Rabbit> => {
  requireAuth()
  const res = await apiFetch(`${BASE}/unequip`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ slot }),
  })
  return handle<Rabbit>(res, '해제 실패')
}

export const setRabbitNickname = async (nickname: string): Promise<Rabbit> => {
  requireAuth()
  const res = await apiFetch(`${BASE}/nickname`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ nickname }),
  })
  return handle<Rabbit>(res, '닉네임 설정 실패')
}

export const fetchRabbitCatalog = async (): Promise<RabbitCatalog> => {
  const res = await apiFetch(`${BASE}/catalog`)
  return handle<RabbitCatalog>(res, '카탈로그 조회 실패')
}

export const fetchRabbitEvents = async (limit = 30): Promise<RabbitEventLog[]> => {
  requireAuth()
  const res = await apiFetch(`${BASE}/events?limit=${limit}`, {
    headers: getAuthHeaders(),
  })
  return handle<RabbitEventLog[]>(res, '토끼 이벤트 조회 실패')
}
