// 말씀 리그(부서 대항 60초 스피드 라운드) 타입 — 백엔드 app/schemas/bible_league.py 와 짝

export interface LeagueTeamOption {
  key: string
  name: string
  color: string
}

export interface LeagueTeamStanding extends LeagueTeamOption {
  /** 1인당 평균 점수 — 부서 순위 기준 */
  score: number
  total: number
  members: number
  participants: number
  rank: number
}

export interface LeagueMe {
  team_key: string | null
  can_change_team: boolean
  weekly_score: number
  rank: number | null
  players: number
  rounds_today: number
  rounds_limit: number
  best_today: number
}

export interface LeagueLadderEntry {
  rank: number
  user_id: number
  name: string
  team_key: string | null
  score: number
  is_me: boolean
}

export interface LeagueMission {
  key: string
  title: string
  goal: number
  progress: number
  done: boolean
}

export interface LeagueOverview {
  week_start: string
  week_ends_at: string
  team_options: LeagueTeamOption[]
  teams: LeagueTeamStanding[]
  me: LeagueMe
  ladder: LeagueLadderEntry[]
  missions: LeagueMission[]
  round_seconds: number
}

export interface LeagueQuestion {
  id: number
  question: string
  choices: string[]
  category: string
}

export interface LeagueRoundStart {
  round_id: number
  duration_sec: number
  ends_at: string
  questions: LeagueQuestion[]
}

export interface LeagueRoundAnswer {
  is_correct: boolean
  correct_index: number
  points: number
  combo: number
  multiplier: number
  score: number
}

export interface LeagueMissed {
  quiz_id: number
  question: string
  answer: string
  explanation: string | null
  related_book: number | null
  related_chapter: number | null
  related_verse: number | null
  verse_text: string | null
}

export interface LeagueRoundResult {
  round_id: number
  score: number
  correct_count: number
  wrong_count: number
  max_combo: number
  team_key: string
  weekly_score: number
  rank_before: number | null
  rank_after: number | null
  missed: LeagueMissed[]
}
