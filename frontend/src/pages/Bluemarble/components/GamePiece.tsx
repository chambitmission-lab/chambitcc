import { useEffect, useRef } from 'react'
import { POSITION_TO_GRID } from '../boardLayout'

interface Props {
  position: number
  /** ms per step during animation */
  stepDuration?: number
  /** path animation 진행중 여부 (외부 표시용) */
  onArrive?: () => void
}

/**
 * 캐릭터 말 - 양(Lamb) 미니 SVG
 * grid 좌표로 부드럽게 이동
 */
export default function GamePiece({ position, stepDuration = 350, onArrive }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)
  const lastPos = useRef(position)
  const animatingRef = useRef(false)

  useEffect(() => {
    if (lastPos.current === position) return
    const el = ref.current
    if (!el) {
      lastPos.current = position
      return
    }

    // 한 칸씩 이동 애니메이션
    const start = lastPos.current
    const path: number[] = []
    let p = start
    let safety = 0
    while (p !== position && safety < 50) {
      p = (p + 1) % 24
      path.push(p)
      safety++
    }

    animatingRef.current = true
    let i = 0
    const stepNext = () => {
      if (i >= path.length) {
        animatingRef.current = false
        lastPos.current = position
        onArrive?.()
        return
      }
      const next = path[i]
      const grid = POSITION_TO_GRID[next]
      el.style.gridRow = String(grid.row)
      el.style.gridColumn = String(grid.col)
      // 점프 효과
      el.classList.remove('bm-piece-hop')
      // force reflow
      void el.offsetWidth
      el.classList.add('bm-piece-hop')
      i++
      setTimeout(stepNext, stepDuration)
    }

    // 첫 번째 step 시작
    stepNext()
  }, [position, stepDuration, onArrive])

  // 첫 렌더 시 위치 설정
  const initialGrid = POSITION_TO_GRID[lastPos.current]

  return (
    <div
      ref={ref}
      className="bm-piece"
      style={{
        gridRow: initialGrid.row,
        gridColumn: initialGrid.col,
      }}
    >
      <svg viewBox="0 0 100 100" width="44" height="44" aria-label="플레이어 말">
        <defs>
          <radialGradient id="pieceGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>
        {/* 발자국 그림자 */}
        <ellipse cx="50" cy="88" rx="22" ry="5" fill="rgba(0,0,0,0.18)" />
        {/* 양 몸 */}
        <ellipse cx="50" cy="60" rx="32" ry="26" fill="#fafafa" />
        <circle cx="32" cy="48" r="14" fill="#fafafa" />
        <circle cx="50" cy="40" r="15" fill="#fafafa" />
        <circle cx="68" cy="48" r="14" fill="#fafafa" />
        <circle cx="28" cy="62" r="12" fill="#fafafa" />
        <circle cx="72" cy="62" r="12" fill="#fafafa" />
        <circle cx="38" cy="78" r="11" fill="#fafafa" />
        <circle cx="62" cy="78" r="11" fill="#fafafa" />
        {/* 얼굴 */}
        <ellipse cx="50" cy="58" rx="16" ry="14" fill="#fde4cf" />
        {/* 눈 */}
        <ellipse cx="44" cy="58" rx="2.8" ry="3.6" fill="#1f2937" />
        <ellipse cx="56" cy="58" rx="2.8" ry="3.6" fill="#1f2937" />
        <circle cx="44.8" cy="56.5" r="1.1" fill="#fff" />
        <circle cx="56.8" cy="56.5" r="1.1" fill="#fff" />
        {/* 코·입 */}
        <path d="M 47 64 L 53 64 L 50 67 Z" fill="#1f2937" />
        <path d="M 46 70 Q 50 73 54 70" stroke="#1f2937" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        {/* 볼터치 */}
        <ellipse cx="40" cy="66" rx="2.2" ry="1.4" fill="#fda4af" opacity="0.7" />
        <ellipse cx="60" cy="66" rx="2.2" ry="1.4" fill="#fda4af" opacity="0.7" />
        {/* 발 */}
        <ellipse cx="40" cy="86" rx="4" ry="2.4" fill="#1f2937" />
        <ellipse cx="60" cy="86" rx="4" ry="2.4" fill="#1f2937" />
        {/* 하이라이트 */}
        <ellipse cx="40" cy="46" rx="14" ry="9" fill="url(#pieceGlow)" pointerEvents="none" />
      </svg>
    </div>
  )
}
