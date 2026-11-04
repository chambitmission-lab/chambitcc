// 말씀 퍼즐 조각 쪽지 — 읽는 중 조각을 모으면 화면 아래에 작은 쪽지가 잠깐 떴다 사라진다.
// 읽는 흐름을 끊지 않는 게 원칙: 소리·꽃가루·화면 이동 없음, 본문 흐름 밖(fixed)에 띄운다.
// 마지막 조각을 모은 날만 "맞추러 가기" 링크가 붙고, 누르지 않으면 그냥 사라진다.
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { subscribePuzzlePieces } from '../../utils/puzzlePieceBus'
import { PUZZLE_IMAGES, type PuzzlePieceNews } from '../../api/puzzles'
import { puzzleKeys } from '../../hooks/usePuzzles'
import './PuzzlePieceNote.css'

const SHOW_MS = 3600
const SHOW_READY_MS = 7000

export const PuzzlePieceNoteHost: React.FC = () => {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [note, setNote] = useState<PuzzlePieceNews[] | null>(null)
  const [visible, setVisible] = useState(false)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    const unsub = subscribePuzzlePieces((news) => {
      void qc.invalidateQueries({ queryKey: puzzleKeys.all })
      setNote(news)
      setVisible(true)
      if (timer.current) window.clearTimeout(timer.current)
      const ready = news.some((n) => n.ready)
      timer.current = window.setTimeout(() => setVisible(false), ready ? SHOW_READY_MS : SHOW_MS)
    })
    return () => {
      unsub()
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [qc])

  if (!note) return null
  const last = note[note.length - 1]
  const ready = note.some((n) => n.ready)
  const { piece } = last
  const col = piece.index % 3
  const row = Math.floor(piece.index / 3)
  const img = PUZZLE_IMAGES[last.puzzle_key]

  return (
    <div
      className={`ppn ${visible ? 'is-visible' : ''}`}
      role="status"
      aria-live="polite"
      onTransitionEnd={() => { if (!visible) setNote(null) }}
    >
      <button type="button" className="ppn-body" onClick={() => setVisible(false)} aria-label="쪽지 닫기">
        {img && (
          <span
            className="ppn-thumb"
            aria-hidden
            style={{ backgroundImage: `url(${img})`, backgroundPosition: `${col * 50}% ${row * 50}%` }}
          />
        )}
        <span className="ppn-text">
          <span className="ppn-title">
            {note.length > 1
              ? `${last.puzzle_title} 조각 ${note.length}개를 모았어요`
              : `${last.puzzle_title} 조각 하나를 모았어요`}
            <span className="ppn-count">{last.collected_count}/{last.total_pieces}</span>
          </span>
          <span className="ppn-sub">
            {ready ? '모든 조각이 모였어요' : `${piece.book_name} ${piece.chapter}장 · ${piece.label}`}
          </span>
        </span>
      </button>
      {ready && (
        <button
          type="button"
          className="ppn-go"
          onClick={() => {
            setVisible(false)
            navigate('/garden?tab=puzzle')
          }}
        >
          맞추러 가기
        </button>
      )}
    </div>
  )
}
