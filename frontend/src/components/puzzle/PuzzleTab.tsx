// /garden?tab=puzzle — 말씀 퍼즐 목록. 모은 조각만 선명하게 보이고, 아직 못 모은 칸엔 읽을 장이 적혀 있다.
// 9조각을 다 모으면 "퍼즐 맞추기"가 열린다. 맞추기 화면(PuzzleBoard)은 열 때만 불러온다.
import { lazy, Suspense, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { PUZZLE_IMAGES, type Puzzle, type PuzzlesPayload } from '../../api/puzzles'
import { puzzleKeys, usePuzzles } from '../../hooks/usePuzzles'
import { getRole } from '../../utils/access'
import './PuzzleTab.css'

const PuzzleBoard = lazy(() => import('./PuzzleBoard'))

const formatTime = (s: number) => `${Math.floor(s / 60)}분 ${String(s % 60).padStart(2, '0')}초`

export const PuzzleCard: React.FC<{ puzzle: Puzzle; onPlay: (preview: boolean) => void; canPreview: boolean }> = ({
  puzzle,
  onPlay,
  canPreview,
}) => {
  const navigate = useNavigate()
  const img = PUZZLE_IMAGES[puzzle.key]
  const pct = Math.round((puzzle.collected_count / puzzle.total_pieces) * 100)

  return (
    <article className={`pzt-card ${puzzle.completed ? 'is-completed' : ''}`}>
      <div className="pzt-art">
        <div className="pzt-grid" role="img" aria-label={`${puzzle.title} 그림, ${puzzle.total_pieces}조각 중 ${puzzle.collected_count}조각 모음`}>
          {puzzle.pieces.map((p) => (
            <div key={p.index} className={`pzt-cell ${p.collected || puzzle.completed ? 'is-on' : ''}`}>
              <span
                className="pzt-cell-img"
                aria-hidden
                style={{
                  backgroundImage: `url(${img})`,
                  backgroundPosition: `${(p.index % 3) * 50}% ${Math.floor(p.index / 3) * 50}%`,
                }}
              />
              {!p.collected && !puzzle.completed && (
                <span className="pzt-cell-label">
                  {p.book_name} {p.chapter}장
                </span>
              )}
            </div>
          ))}
        </div>
        {puzzle.completed && puzzle.verse.text && (
          <div className="pzt-art-verse">
            <p>{puzzle.verse.text}</p>
            <span>
              {puzzle.verse.book_name} {puzzle.verse.chapter}:{puzzle.verse.verse}
            </span>
          </div>
        )}
      </div>

      <div className="pzt-body">
        <div className="pzt-titlebar">
          <div>
            <h2 className="pzt-title">{puzzle.title}</h2>
            <p className="pzt-sub">{puzzle.subtitle}</p>
          </div>
          <span className="pzt-stat">
            <b>{puzzle.collected_count}</b>/{puzzle.total_pieces}
          </span>
        </div>
        <div className="pzt-bar" aria-hidden>
          <span style={{ width: `${pct}%` }} />
        </div>

        {puzzle.completed ? (
          <p className="pzt-note">
            완성했어요{puzzle.best_seconds ? ` · 최고 기록 ${formatTime(puzzle.best_seconds)}` : ''}
          </p>
        ) : puzzle.ready ? (
          <p className="pzt-note is-brand">조각이 다 모였어요. 이제 맞춰 볼까요?</p>
        ) : (
          <p className="pzt-note">아래 장을 끝까지 읽을 때마다 조각이 하나씩 모여요.</p>
        )}

        {(puzzle.ready || puzzle.completed) && (
          <button type="button" className="pzt-play" onClick={() => onPlay(false)}>
            <span className="material-icons-round" aria-hidden>extension</span>
            {puzzle.completed ? '다시 맞추기' : '퍼즐 맞추기'}
          </button>
        )}

        <ul className="pzt-pieces">
          {puzzle.pieces.map((p) => (
            <li key={p.index}>
              <button
                type="button"
                className={`pzt-piece ${p.collected ? 'is-on' : ''}`}
                onClick={() => navigate(`/bible/${p.book}/${p.chapter}`)}
              >
                <span className="pzt-piece-mark" aria-hidden>
                  {p.collected ? (
                    <span className="material-icons-round">check</span>
                  ) : (
                    p.index + 1
                  )}
                </span>
                <span className="pzt-piece-text">
                  <span className="pzt-piece-ref">
                    {p.book_name} {p.chapter}장
                  </span>
                  <span className="pzt-piece-label">{p.label}</span>
                </span>
                <span className="pzt-piece-progress">
                  {p.collected ? '모음' : p.read_verses > 0 ? `${p.read_verses}/${p.total_verses}절` : '읽기'}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {canPreview && !puzzle.ready && !puzzle.completed && (
          <button type="button" className="pzt-preview" onClick={() => onPlay(true)}>
            관리자 · 미리 맞춰보기(기록 안 됨)
          </button>
        )}
      </div>
    </article>
  )
}

export const PuzzleTab: React.FC = () => {
  const { data, isLoading, error } = usePuzzles()
  const qc = useQueryClient()
  const [playing, setPlaying] = useState<{ key: string; preview: boolean } | null>(null)
  const canPreview = getRole() === 'admin'

  // 탭에서 본 조각은 서버가 '알림'으로 표시했으니 캐시에서도 비운다(같은 조각 쪽지 중복 방지)
  useEffect(() => {
    if (!data?.newly_collected?.length) return
    qc.setQueryData<PuzzlesPayload>(puzzleKeys.list(), (prev) => (prev ? { ...prev, newly_collected: [] } : prev))
  }, [data, qc])

  if (isLoading) {
    return (
      <div className="pzt" aria-busy="true">
        <div className="pzt-card is-skeleton">
          <div className="pzt-art" />
          <div className="pzt-body">
            <span className="pzt-skel" />
            <span className="pzt-skel is-short" />
          </div>
        </div>
      </div>
    )
  }
  if (error || !data) {
    return <p className="pzt-empty">퍼즐을 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.</p>
  }

  const current = playing ? data.puzzles.find((p) => p.key === playing.key) : null

  return (
    <div className="pzt">
      <p className="pzt-intro">
        성경 속 큰 사건을 담은 그림이 아홉 조각으로 흩어져 있어요. 그 사건과 이어진 장을 끝까지 읽으면 조각이 모이고,
        다 모으면 직접 맞춰 칭호를 받을 수 있어요.
      </p>
      {data.puzzles.map((p) => (
        <PuzzleCard
          key={p.key}
          puzzle={p}
          canPreview={canPreview}
          onPlay={(preview) => setPlaying({ key: p.key, preview })}
        />
      ))}
      <p className="pzt-more">
        {data.puzzles.filter((p) => p.completed).length}/{data.puzzles.length} 완성 · 열 개를 모두 맞추면 '구속사 퍼즐 마스터' 칭호를 받아요.
      </p>

      {current && (
        <Suspense fallback={null}>
          <PuzzleBoard puzzle={current} preview={playing!.preview} onClose={() => setPlaying(null)} />
        </Suspense>
      )}
    </div>
  )
}
