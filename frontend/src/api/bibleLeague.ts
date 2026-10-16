import { API_V1 } from '../config/api'
import type {
  LeagueOverview,
  LeagueRoundAnswer,
  LeagueRoundResult,
  LeagueRoundStart,
} from '../types/bibleLeague'
import { request } from './utils/request'

const BASE = `${API_V1}/bluemarble/league`

export const fetchLeague = (): Promise<LeagueOverview> =>
  request<LeagueOverview>(BASE, { auth: 'required', errorMessage: '말씀 리그를 불러오지 못했습니다' })

export const chooseLeagueTeam = (teamKey: string): Promise<LeagueOverview> =>
  request<LeagueOverview>(`${BASE}/team`, {
    method: 'POST',
    auth: 'required',
    json: { team_key: teamKey },
    errorMessage: '팀을 정하지 못했습니다',
  })

export const startLeagueRound = (): Promise<LeagueRoundStart> =>
  request<LeagueRoundStart>(`${BASE}/rounds`, {
    method: 'POST',
    auth: 'required',
    errorMessage: '라운드를 시작하지 못했습니다',
  })

export const answerLeagueRound = (roundId: number, quizId: number, choiceIndex: number): Promise<LeagueRoundAnswer> =>
  request<LeagueRoundAnswer>(`${BASE}/rounds/${roundId}/answer`, {
    method: 'POST',
    auth: 'required',
    json: { quiz_id: quizId, choice_index: choiceIndex },
    errorMessage: '답을 보내지 못했습니다',
  })

export const finishLeagueRound = (roundId: number): Promise<LeagueRoundResult> =>
  request<LeagueRoundResult>(`${BASE}/rounds/${roundId}/finish`, {
    method: 'POST',
    auth: 'required',
    errorMessage: '결과를 불러오지 못했습니다',
  })
