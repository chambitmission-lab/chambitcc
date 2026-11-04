// dev — 말씀 퍼즐 미리보기(/#/dev/puzzle). 백엔드·로그인 없이 목록 카드·맞추기 화면·조각 쪽지를 본다.
// ?state=progress(기본) | ready | done
import { lazy, Suspense, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Puzzle } from '../../api/puzzles'
import { PuzzleCard } from '../../components/puzzle/PuzzleTab'
import { emitPuzzlePieces } from '../../utils/puzzlePieceBus'
import '../../pages/Garden/Garden.css'

const PuzzleBoard = lazy(() => import('../../components/puzzle/PuzzleBoard'))

const PIECES: Array<[number, string, number, string, number]> = [
  [2, '출애굽기', 2, '갈대 상자의 아기 모세', 25],
  [2, '출애굽기', 3, '불붙은 떨기나무', 22],
  [2, '출애굽기', 12, '첫 유월절 밤', 51],
  [2, '출애굽기', 13, '구름 기둥과 불 기둥', 22],
  [2, '출애굽기', 14, '바다가 갈라지다', 31],
  [2, '출애굽기', 15, '모세와 미리암의 노래', 27],
  [19, '시편', 136, '그 인자하심이 영원함이로다', 26],
  [46, '고린도전서', 10, '바다 가운데로 지나며', 33],
  [58, '히브리서', 11, '믿음으로 홍해를 건너다', 40],
]

const makePuzzle = (state: string): Puzzle => {
  const collectedSet = state === 'progress' ? new Set([0, 1, 4, 5]) : new Set(PIECES.map((_, i) => i))
  const pieces = PIECES.map(([book, book_name, chapter, label, total], index) => {
    const collected = collectedSet.has(index)
    return {
      index, book, book_name, chapter, label,
      total_verses: total,
      read_verses: collected ? total : index === 2 ? 18 : 0,
      collected,
    }
  })
  const count = pieces.filter((p) => p.collected).length
  return {
    key: 'red_sea',
    title: '홍해를 건너다',
    subtitle: '바다 가운데 마른 땅으로 이끄신 하나님',
    title_key: 'puzzle_red_sea',
    verse: {
      book: 2, chapter: 14, verse: 22, book_name: '출애굽기',
      text: '이스라엘 자손이 바다 가운데를 육지로 걸어가고 물은 그들의 좌우에 벽이 되니',
    },
    pieces,
    collected_count: count,
    total_pieces: 9,
    ready: count === 9,
    completed: state === 'done',
    completed_at: state === 'done' ? new Date().toISOString() : null,
    best_seconds: state === 'done' ? 74 : null,
  }
}

const PuzzlePreview: React.FC = () => {
  const [params, setParams] = useSearchParams()
  const state = params.get('state') ?? 'progress'
  const puzzle = makePuzzle(state)
  const [playing, setPlaying] = useState(false)

  const note = (ready: boolean) => {
    const p = makePuzzle(ready ? 'ready' : 'progress')
    emitPuzzlePieces([{
      puzzle_key: p.key,
      puzzle_title: p.title,
      piece: p.pieces[ready ? 8 : 4],
      collected_count: ready ? 9 : 4,
      total_pieces: 9,
      ready,
    }])
  }

  return (
    <div className="garden-page" style={{ padding: 16, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {['progress', 'ready', 'done'].map((s) => (
          <button key={s} type="button" className="garden-tab" style={{ flex: 'none', background: s === state ? 'var(--brand-soft-strong)' : undefined }} onClick={() => setParams({ state: s })}>
            {s}
          </button>
        ))}
        <button type="button" className="garden-tab" style={{ flex: 'none' }} onClick={() => note(false)}>쪽지(조각)</button>
        <button type="button" className="garden-tab" style={{ flex: 'none' }} onClick={() => note(true)}>쪽지(다 모음)</button>
        <button type="button" className="garden-tab" style={{ flex: 'none' }} onClick={() => setPlaying(true)}>맞추기 열기</button>
      </div>
      <PuzzleCard puzzle={puzzle} canPreview={false} onPlay={() => setPlaying(true)} />
      {playing && (
        <Suspense fallback={null}>
          <PuzzleBoard puzzle={makePuzzle('ready')} preview onClose={() => setPlaying(false)} />
        </Suspense>
      )}
    </div>
  )
}

export default PuzzlePreview
