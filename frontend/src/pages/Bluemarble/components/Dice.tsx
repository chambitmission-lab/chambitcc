import { useEffect, useRef, useState } from 'react'

interface Props {
  /** 표시할 최종 주사위 값 (1~6), null이면 기본값 1 */
  value: number | null
  /** 굴리는 중 여부 */
  rolling: boolean
  /** 클릭 핸들러 */
  onRoll: () => void
  /** 비활성화 (퀴즈 대기, 게임 종료 등) */
  disabled?: boolean
  /** 굴리기 직전 라벨 */
  label?: string
}

/**
 * CSS 3D 주사위
 * - rolling=true 동안 회전
 * - rolling=false가 되면 value에 해당하는 면이 정면으로
 */
export default function Dice({ value, rolling, onRoll, disabled, label = '주사위 굴리기' }: Props) {
  const cubeRef = useRef<HTMLDivElement | null>(null)
  // rolling이 끝난 후 보여줄 수치 (안 굴리고 있을 때만 적용)
  const [displayValue, setDisplayValue] = useState<number>(value ?? 1)

  useEffect(() => {
    if (!rolling && value != null) {
      setDisplayValue(value)
    }
  }, [rolling, value])

  // 면별 회전값
  const FACE_ROTATIONS: Record<number, string> = {
    1: 'rotateX(0deg) rotateY(0deg)',
    2: 'rotateX(-90deg) rotateY(0deg)', // top
    6: 'rotateX(90deg) rotateY(0deg)',  // bottom (1과 반대)
    3: 'rotateY(-90deg)',                // right (showing right face = 3)
    4: 'rotateY(90deg)',
    5: 'rotateX(180deg)',
  }

  const targetTransform = FACE_ROTATIONS[displayValue] ?? FACE_ROTATIONS[1]

  return (
    <div className="bm-dice-wrap">
      <div className={`bm-dice-scene ${rolling ? 'bm-dice-rolling' : ''}`}>
        <div
          ref={cubeRef}
          className="bm-dice-cube"
          style={{
            transform: rolling
              ? undefined // CSS keyframe이 처리
              : targetTransform,
          }}
        >
          <Face dots={1} className="bm-face-front" />
          <Face dots={6} className="bm-face-back" />
          <Face dots={3} className="bm-face-right" />
          <Face dots={4} className="bm-face-left" />
          <Face dots={2} className="bm-face-top" />
          <Face dots={5} className="bm-face-bottom" />
        </div>
      </div>
      <button
        type="button"
        className="bm-dice-button"
        onClick={onRoll}
        disabled={disabled || rolling}
      >
        {rolling ? '굴리는 중…' : label}
      </button>
    </div>
  )
}

function Face({ dots, className }: { dots: number; className: string }) {
  // 점 위치 (3x3 그리드 인덱스 0~8)
  const DOT_MAP: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  }
  const positions = DOT_MAP[dots] ?? []
  return (
    <div className={`bm-face ${className}`}>
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className={`bm-dot-cell ${positions.includes(i) ? 'bm-dot-on' : ''}`}>
          {positions.includes(i) && <span className="bm-dot" />}
        </div>
      ))}
    </div>
  )
}
