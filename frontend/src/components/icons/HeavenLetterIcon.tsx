import type { SVGProps } from 'react'

/* 하늘에 보내는 편지 — 나누기 FAB 공용 글리프 (★확정).
   종이비행기(보내는 편지) → 우상단 별(하늘, 받으시는 분) → 좌하단 점선 궤적(가는 중).
   "기도·감사·말씀카드를 하늘에 부친다"는 이야기를 세 요소로 한 장면에 담는다.
   24 뷰박스, currentColor. 별에 starClassName으로 윙크(잘 받았다)를 걸 수 있다.
   (촛불·신호·사다리·핫라인·날개봉투·봉인편지·기도하는 손 안은 검토 후 폐기 — 재제안 금지) */

/** Material send 비행기를 0.62 축소 후 -45° 회전, 좌하단에 배치(별 자리를 비움) */
export const PLANE_PATH =
  'M10.06 21.83 L15.32 8.68 L2.17 13.94 L5.24 17.01 L12.69 11.31 L6.99 18.76 Z'

/** 하늘의 별 — 우상단 4각 별 */
export const STAR_PATH =
  'M19.5 2.2 C19.79 3.75 20.75 4.71 22.3 5 C20.75 5.29 19.79 6.25 19.5 7.8 C19.21 6.25 18.25 5.29 16.7 5 C18.25 4.71 19.21 3.75 19.5 2.2 Z'

/** 비행 궤적 — 꼬리 뒤 점 2개(멀수록 작게) */
export const TRAIL_DOTS = [
  { cx: 3.9, cy: 20.3, r: 1.0 },
  { cx: 2.1, cy: 22.1, r: 0.75 },
] as const

interface Props extends SVGProps<SVGSVGElement> {
  starClassName?: string
}

export function HeavenLetterIcon({ starClassName, ...props }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <HeavenLetterGlyph starClassName={starClassName} />
    </svg>
  )
}

/** 이미 <svg> 안에 있을 때(여러 얼굴을 겹치는 FAB) 쓰는 내부 글리프 */
export function HeavenLetterGlyph({ starClassName }: { starClassName?: string }) {
  return (
    <>
      <path d={PLANE_PATH} />
      {TRAIL_DOTS.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={d.r} opacity={0.75 - i * 0.25} />
      ))}
      <path className={starClassName} d={STAR_PATH} />
    </>
  )
}
