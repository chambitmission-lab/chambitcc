// 성경 보드게임 타입 정의

import type { RabbitEvent } from './rabbit'

export type TileType =
  | 'start'
  | 'quiz'
  | 'bonus'
  | 'mission'
  | 'rest'
  | 'warp'
  | 'finish'
  | 'milestone'
  | 'boss'

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
  narrative: string | null
  bible_book: number | null
  bible_chapter: number | null
  bible_verse_start: number | null
  bible_verse_end: number | null
  phase: string | null
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

export type AdvanceEventType =
  | 'quiz'
  | 'milestone'
  | 'rest'
  | 'finish'
  | 'lap_finish'
  | 'start'
  | 'bonus'
  | 'boss'

export interface BossState {
  in_boss: boolean
  boss_total: number
  boss_index: number
  boss_correct: number
  boss_complete: boolean
  boss_clear_bonus: number
  is_perfect: boolean
}

export interface LapEvent {
  lap_count: number
  lap_bonus: number
  title: string
  scripture_ref: string
  scripture_text: string
}

export interface AdvanceResult {
  from_position: number
  to_position: number
  next_tile: Tile
  pending_quiz: QuizPublic | null
  event_type: AdvanceEventType
  score_delta: number
  total_score: number
  is_finish: boolean
  message: string
  verse_text: string | null
  lap_event?: LapEvent | null
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
  new_position: number | null
  arrived_tile: Tile | null
  streak: number
  is_finish: boolean
  rabbit_event?: RabbitEvent | null
  lap_event?: LapEvent | null
  // 점수 디테일 (콤보/타임어택 시각화용)
  base_points: number
  streak_multiplier: number
  time_bonus_ratio: number
  time_bonus: number
  streak_flat_bonus: number
  // 보스 진행 상태
  boss_state?: BossState | null
  next_boss_quiz?: QuizPublic | null
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
