// 말씀 잇기(필사 미니게임) — 오늘의 판 · 기록 · 오늘/이번 주 순위 · 부서 대항
import { requestData } from '../utils/request'
import type { MannaVerse } from './manna'

/** 오늘의 판 다섯 절(짧은 절부터) — 교회 전체가 같은 판 */
export interface LinkSet {
  date: string
  seed: number
  verses: MannaVerse[]
}

export interface LinkRunInput {
  set_date: string
  score: number
  verses_done: number
  perfect_verses: number
  /** 맞게 누른 조각 수 */
  pieces: number
  /** 깨진 항아리 수 */
  mistakes: number
  max_combo: number
  duration_ms: number
}

export interface LinkRunResult {
  run_id: number
  /** false 면 사람이 낼 수 없는 기록(또는 어제 판)이라 순위에서 빠졌다 */
  counted: boolean
  score: number
  is_best: boolean
  best: number
  /** 이 판을 내기 전 오늘 순위(처음이면 null) — 순위표 '치고 올라가기' 연출의 출발점 */
  prev_rank: number | null
  rank: number | null
  players: number
  /** 이 판으로 앞지른 사람 이름(가까운 사람부터) */
  overtook: string[]
}

export type LinkScope = 'today' | 'week'

export interface LinkBoardEntry {
  rank: number
  user_id: number
  name: string
  avatar_url: string | null
  team_key: string | null
  score: number
  is_me: boolean
}

export interface LinkBoard {
  date: string
  scope: LinkScope
  players: number
  entries: LinkBoardEntry[]
  me: { rank: number; score: number } | null
}

export interface LinkTeamStanding {
  key: string
  name: string
  color: string
  /** 1인당 평균 점수(부서 점수) */
  score: number
  total: number
  members: number
  participants: number
  rank: number
}

export interface LinkTeams {
  week_start: string
  teams: LinkTeamStanding[]
  me: { team_key: string | null }
}

export interface LinkSummary {
  best: number
  today: { rank: number; score: number } | null
  players_today: number
}

export const getLinkSet = (): Promise<LinkSet> =>
  requestData('/bible-typing/link/set', { errorMessage: '오늘의 말씀 조각을 불러오지 못했어요' })

export const submitLinkRun = (input: LinkRunInput): Promise<LinkRunResult> =>
  requestData('/bible-typing/link/runs', {
    method: 'POST',
    auth: 'required',
    json: input,
    errorMessage: '기록을 저장하지 못했어요',
  })

export const getLinkBoard = (scope: LinkScope): Promise<LinkBoard> =>
  requestData(`/bible-typing/link/board?scope=${scope}`, { auth: 'required', errorMessage: '순위를 불러오지 못했어요' })

export const getLinkTeams = (): Promise<LinkTeams> =>
  requestData('/bible-typing/link/teams', { auth: 'required', errorMessage: '부서 대항을 불러오지 못했어요' })

export const getLinkSummary = (): Promise<LinkSummary> =>
  requestData('/bible-typing/link/summary', { auth: 'required', errorMessage: '말씀 잇기 기록을 불러오지 못했어요' })
