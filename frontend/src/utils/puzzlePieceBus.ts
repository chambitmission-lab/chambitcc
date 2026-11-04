// 말씀 퍼즐 조각 쪽지 버스 — /titles/evaluate 응답의 puzzle_pieces_new 를 받아
// 화면 아래 조용한 쪽지(PuzzlePieceNoteHost)로 흘려보낸다. 읽는 흐름을 끊지 않으려고 팝업은 쓰지 않는다.
import type { PuzzlePieceNews } from '../api/puzzles'

type Listener = (news: PuzzlePieceNews[]) => void

const listeners = new Set<Listener>()

export const subscribePuzzlePieces = (listener: Listener): (() => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const emitPuzzlePieces = (news: PuzzlePieceNews[] | undefined) => {
  if (!news?.length) return
  listeners.forEach((l) => l(news))
}
