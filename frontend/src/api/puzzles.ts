// 말씀 퍼즐 API — 성경 사건 삽화 조각 모으기·맞추기
// 조각은 서버가 읽기 기록에서 도출한다(장을 끝까지 읽으면 1조각). 프론트는 보여주고 맞추기만 한다.
import { request, type UntypedJson } from './utils/request'
import type { TitleStatus } from './titles'

export interface PuzzlePiece {
  index: number
  book: number
  book_name: string
  chapter: number
  label: string
  read_verses: number
  total_verses: number
  collected: boolean
}

export interface PuzzleVerse {
  book: number
  chapter: number
  verse: number
  book_name: string
  text: string | null
}

export interface Puzzle {
  key: string
  title: string
  subtitle: string
  title_key: string
  verse: PuzzleVerse
  pieces: PuzzlePiece[]
  collected_count: number
  total_pieces: number
  ready: boolean
  completed: boolean
  completed_at: string | null
  best_seconds: number | null
}

/** 새로 모은 조각 한 개 — 읽는 중 조용한 쪽지 한 장 */
export interface PuzzlePieceNews {
  puzzle_key: string
  puzzle_title: string
  piece: PuzzlePiece
  collected_count: number
  total_pieces: number
  ready: boolean
}

export interface PuzzlesPayload {
  puzzles: Puzzle[]
  newly_collected: PuzzlePieceNews[]
}

export const getPuzzles = async (): Promise<PuzzlesPayload> => {
  const result = await request<UntypedJson>('/puzzles', { auth: 'required', errorMessage: '퍼즐을 불러오지 못했어요' })
  return (result.data ?? { puzzles: [], newly_collected: [] }) as PuzzlesPayload
}

export const completePuzzle = async (
  key: string,
  seconds: number,
): Promise<{ puzzle: Puzzle; newly_earned: TitleStatus[] }> => {
  const result = await request<UntypedJson>(`/puzzles/${encodeURIComponent(key)}/complete`, {
    method: 'POST',
    auth: 'required',
    json: { seconds },
    errorMessage: '퍼즐 완성을 기록하지 못했어요',
  })
  return result.data as { puzzle: Puzzle; newly_earned: TitleStatus[] }
}

/** 퍼즐 그림 — 교체할 땐 덮어쓰지 말고 -v2 로 (SW 캐시가 옛 그림을 잡고 있다) */
export const PUZZLE_IMAGES: Record<string, string> = {
  creation: '/images/puzzle/puzzle-creation-v1.webp',
  noah: '/images/puzzle/puzzle-noah-v1.webp',
  abraham: '/images/puzzle/puzzle-abraham-v1.webp',
  red_sea: '/images/puzzle/puzzle-red-sea-v1.webp',
  david: '/images/puzzle/puzzle-david-v1.webp',
  daniel: '/images/puzzle/puzzle-daniel-v1.webp',
  nativity: '/images/puzzle/puzzle-nativity-v1.webp',
  five_loaves: '/images/puzzle/puzzle-five-loaves-v1.webp',
  cross: '/images/puzzle/puzzle-cross-v1.webp',
  resurrection: '/images/puzzle/puzzle-resurrection-v1.webp',
}
