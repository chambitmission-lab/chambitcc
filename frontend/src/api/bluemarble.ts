import { API_V1 } from '../config/api'
import type {
  GameState,
  AdvanceResult,
  AnswerResult,
  Leaderboard,
  BluemarbleStats,
  Tile,
} from '../types/bluemarble'
import { request, requestRaw } from './utils/request'

const BASE = `${API_V1}/bluemarble`

export const fetchTiles = async (): Promise<Tile[]> => {
  return request<Tile[]>(`${BASE}/tiles`, { errorMessage: '보드 정보를 불러오지 못했습니다' })
}

export const startGame = async (restart = false): Promise<GameState> => {
  return request<GameState>(`${BASE}/start`, {
    method: 'POST',
    auth: 'required',
    json: { restart },
    errorMessage: '게임을 시작하지 못했습니다',
  })
}

export const fetchState = async (): Promise<GameState> => {
  return request<GameState>(`${BASE}/state`, { auth: 'required', errorMessage: '게임 상태를 불러오지 못했습니다' })
}

export const advanceStep = async (): Promise<AdvanceResult> => {
  return request<AdvanceResult>(`${BASE}/advance`, {
    method: 'POST',
    auth: 'required',
    errorMessage: '발자취 전진 실패',
  })
}

export const submitAnswer = async (
  quizId: number,
  choiceIndex: number,
  elapsedMs?: number,
): Promise<AnswerResult> => {
  return request<AnswerResult>(`${BASE}/answer`, {
    method: 'POST',
    auth: 'required',
    json: {
      quiz_id: quizId,
      choice_index: choiceIndex,
      ...(elapsedMs != null ? { elapsed_ms: elapsedMs } : {}),
    },
    errorMessage: '정답 제출 실패',
  })
}

export const fetchLeaderboard = async (limit = 10): Promise<Leaderboard> => {
  return request<Leaderboard>(`${BASE}/leaderboard?limit=${limit}`, { auth: 'required', errorMessage: '리더보드를 불러오지 못했습니다' })
}

export const fetchBluemarbleStats = async (): Promise<BluemarbleStats> => {
  return request<BluemarbleStats>(`${BASE}/stats`, { auth: 'required', errorMessage: '통계를 불러오지 못했습니다' })
}

export const abandonGame = async (): Promise<void> => {
  // 실패해도 조용히 넘어간다(원래도 응답 상태를 보지 않았다)
  await requestRaw(`${BASE}/abandon`, { method: 'POST', auth: 'required' }).catch(() => undefined)
}
