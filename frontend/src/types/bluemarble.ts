// 성경 보드게임 타입 정의

import type { RabbitEvent, TreasureDef } from './rabbit'

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
// 학습 렌즈 — 바퀴마다 다른 시각으로 동일 발자취 묵상
// know(이해) | see(의미) | connect(연결/그리스도) | live(적용) | deep(심화) | any(전 바퀴)
export type LapFocus = 'know' | 'see' | 'connect' | 'live' | 'deep' | 'any'

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
  lap_focus: LapFocus
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

export interface LapVerse {
  book: number
  chapter: number
  verse: number
  text: string
}

export interface LapEvent {
  lap_count: number
  lap_bonus: number
  title: string
  scripture_ref: string
  scripture_text: string
  // 랩 완주 리포트 (이번 바퀴 통계 + 만난 구절 + 다음 바퀴 렌즈)
  lap_correct_count?: number
  lap_wrong_count?: number
  lap_accuracy?: number    // 0.0 ~ 1.0
  lap_score?: number       // 이번 바퀴에서 획득한 점수
  lap_turns?: number       // 이번 바퀴 턴 수
  verses?: LapVerse[]      // 이번 바퀴 만난 구절 (최대 3)
  next_focus?: LapFocus    // 다음 바퀴 학습 렌즈
  next_focus_title?: string
  next_focus_subtitle?: string
  // 한 바퀴 완주로 지급된 보물 (예: 첫 완주 시 생명의 면류관)
  treasures_gained?: TreasureDef[]
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
