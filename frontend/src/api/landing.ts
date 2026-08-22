import { API_V1, apiFetch } from '../config/api'
import type { LandingStats } from '../types/landing'

/** 랜딩 히어로 숫자 티커용 익명 집계 (인증 불필요) */
export const getLandingStats = async (): Promise<LandingStats> => {
  const res = await apiFetch(`${API_V1}/landing/stats`)
  if (!res.ok) throw new Error('랜딩 통계를 불러오지 못했습니다')
  return res.json()
}
