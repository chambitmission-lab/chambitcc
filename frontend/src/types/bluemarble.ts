// 성경 보드게임 타입 정의

export type TileType =
  | 'start'
  | 'quiz'
  | 'bonus'
  | 'mission'
  | 'rest'
  | 'warp'
  | 'finish'

export type QuizCategory = 'OLD' | 'NEW' | 'GENERAL'
export type SessionStatus = 'active' | 'completed' | 'abandoned'

export interface Tile {
  id: number
  position: number
  tile_type: TileType
  title: string
  description: string | null
  theme_book: number | null
  theme_color: string
  icon: string | null
  quiz_category: QuizCategory | null
  quiz_difficulty: number | null
  bonus_points: number
  warp_target: number | null
}

export interface QuizPublic {
  id: number
  question: string
  choices: string[]
  hint: string | null
  category: QuizCategory
  difficulty: number
  related_book: number | null
  related_chapter: number | null
  related_verse: number | null
  points: number
}

export interface GameSession {
  id: number
  user_id: number
  status: SessionStatus
  current_position: number
  last_dice: number | null
  pending_tile_id: number | null
  pending_quiz_id: number | null
  skip_next_turn: boolean
  extra_roll: boolean
  total_score: number
  correct_count: number
  wrong_count: number
  dice_count: number
  lap_count: number
  started_at: string
  completed_at: string | null
}

export interface GameState {
  session: GameSession
  tiles: Tile[]
  current_tile: Tile | null
  pending_quiz: QuizPublic | null
}

export type RollEventType =
  | 'quiz'
  | 'bonus'
  | 'rest'
  | 'warp'
  | 'finish'
  | 'start'
  | 'mission'
  | 'skip'

export interface RollResult {
  dice: number
  from_position: number
  to_position: number
  passed_start: boolean
  lap_bonus: number
  landed_tile: Tile
  pending_quiz: QuizPublic | null
  event_type: RollEventType
  extra_roll: boolean
  skip_next_turn: boolean
  score_delta: number
  total_score: number
  message: string
  warp_to: number | null
}

export interface AnswerResult {
  is_correct: boolean
  correct_index: number
  explanation: string | null
  score_delta: number
  total_score: number
  correct_count: number
  wrong_count: number
  related_verse_text: string | null
}

export interface LeaderboardEntry {
  rank: number
  user_id: number
  username: string
  full_name: string | null
  total_score: number
  correct_count: number
  wrong_count: number
  laps: number
  completed_at: string | null
}

export interface Leaderboard {
  items: LeaderboardEntry[]
  my_rank: number | null
  my_best_score: number
}

export interface BluemarbleStats {
  total_games: number
  completed_games: number
  best_score: number
  total_correct: number
  total_wrong: number
  accuracy: number
}
