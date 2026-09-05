import type { LandingStats } from '../types/landing'
import { request } from './utils/request'

/** 랜딩 히어로 숫자 티커용 익명 집계 (인증 불필요) */
export const getLandingStats = async (): Promise<LandingStats> => {
  return request<LandingStats>('/landing/stats', { errorMessage: '랜딩 통계를 불러오지 못했습니다' })
}
