import { API_V1, apiFetch } from '../config/api'
import { getAuthHeaders, requireAuth } from './utils/apiHelpers'
import type {
  GameState,
  AdvanceResult,
  AnswerResult,
  Leaderboard,
  BluemarbleStats,
  Tile,
} from '../types/bluemarble'

const BASE = `${API_V1}/bluemarble`

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

export const fetchTiles = async (): Promise<Tile[]> => {
  const res = await apiFetch(`${BASE}/tiles`)
  return handle<Tile[]>(res, '보드 정보를 불러오지 못했습니다')
}

export const startGame = async (restart = false): Promise<GameState> => {
  requireAuth()
  const res = await apiFetch(`${BASE}/start`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ restart }),
  })
  return handle<GameState>(res, '게임을 시작하지 못했습니다')
}

export const fetchState = async (): Promise<GameState> => {
  requireAuth()
  const res = await apiFetch(`${BASE}/state`, {
    headers: getAuthHeaders(),
  })
  return handle<GameState>(res, '게임 상태를 불러오지 못했습니다')
}

export const advanceStep = async (): Promise<AdvanceResult> => {
  requireAuth()
  const res = await apiFetch(`${BASE}/advance`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  return handle<AdvanceResult>(res, '발자취 전진 실패')
}

export const submitAnswer = async (
  quizId: number,
  choiceIndex: number,
  elapsedMs?: number,
): Promise<AnswerResult> => {
  requireAuth()
  const res = await apiFetch(`${BASE}/answer`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({
      quiz_id: quizId,
      choice_index: choiceIndex,
      ...(elapsedMs != null ? { elapsed_ms: elapsedMs } : {}),
    }),
  })
  return handle<AnswerResult>(res, '정답 제출 실패')
}

export const fetchLeaderboard = async (limit = 10): Promise<Leaderboard> => {
  requireAuth()
  const res = await apiFetch(`${BASE}/leaderboard?limit=${limit}`, {
    headers: getAuthHeaders(),
  })
  return handle<Leaderboard>(res, '리더보드를 불러오지 못했습니다')
}

export const fetchBluemarbleStats = async (): Promise<BluemarbleStats> => {
  requireAuth()
  const res = await apiFetch(`${BASE}/stats`, {
    headers: getAuthHeaders(),
  })
  return handle<BluemarbleStats>(res, '통계를 불러오지 못했습니다')
}

export const abandonGame = async (): Promise<void> => {
  requireAuth()
  await apiFetch(`${BASE}/abandon`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
}
