import { API_V1 } from '../config/api'
import type {
  Rabbit,
  RabbitProgress,
  RabbitCatalog,
  RabbitEventLog,
} from '../types/rabbit'
import { request } from './utils/request'

const BASE = `${API_V1}/rabbit`

export const fetchMyRabbit = async (): Promise<RabbitProgress> => {
  return request<RabbitProgress>(`${BASE}/me`, { auth: 'required', errorMessage: '토끼 정보를 불러오지 못했습니다' })
}

export const equipTreasure = async (itemCode: string): Promise<Rabbit> => {
  return request<Rabbit>(`${BASE}/equip`, {
    method: 'POST',
    auth: 'required',
    json: { item_code: itemCode },
    errorMessage: '장착 실패',
  })
}

export const unequipSlot = async (slot: string): Promise<Rabbit> => {
  return request<Rabbit>(`${BASE}/unequip`, {
    method: 'POST',
    auth: 'required',
    json: { slot },
    errorMessage: '해제 실패',
  })
}

export const setRabbitNickname = async (nickname: string): Promise<Rabbit> => {
  return request<Rabbit>(`${BASE}/nickname`, {
    method: 'POST',
    auth: 'required',
    json: { nickname },
    errorMessage: '닉네임 설정 실패',
  })
}

export const fetchRabbitCatalog = async (): Promise<RabbitCatalog> => {
  return request<RabbitCatalog>(`${BASE}/catalog`, { errorMessage: '카탈로그 조회 실패' })
}

export const fetchRabbitEvents = async (limit = 30): Promise<RabbitEventLog[]> => {
  return request<RabbitEventLog[]>(`${BASE}/events?limit=${limit}`, { auth: 'required', errorMessage: '토끼 이벤트 조회 실패' })
}
