// 스플릿 플랩 숫자판 — 기차역 도착 안내판처럼 위 반쪽이 접혀 내려가고 아래 반쪽이 떨어진다.
// 한 칸(FlipDigit)은 '지금 보이는 숫자(shown)'와 '방금까지 보이던 숫자(prev)'만 안다.
//   · 고정 윗판 = shown, 고정 아랫판 = prev
//   · 접히는 윗판(prev)이 -90°로 넘어가고, 이어서 떨어지는 아랫판(shown)이 0°로 내려와 덮는다
// 넘길 때마다 n 을 올려 접힘 조각을 새로 마운트한다 — CSS 애니메이션을 처음부터 다시 돌리는 가장 싼 방법.
import { Fragment, useEffect, useRef, useState } from 'react'

const ROLL_STEP_MS = 95

const reducedMotion = () =>
  typeof window !== 'undefined' &&
  !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

interface FlipState {
  shown: string
  prev: string
  n: number
}

/** 처음 나타날 때 target 앞의 숫자들을 거쳐 오도록 — 0~9 로만 돈다 */
const rollPath = (target: string, spin: number): string[] => {
  const t = Number(target)
  if (Number.isNaN(t) || spin <= 0) return []
  return Array.from({ length: spin + 1 }, (_, i) => String((t - spin + i + 100) % 10))
}

export const FlipDigit = ({ value, spin = 0 }: { value: string; spin?: number }) => {
  const [path] = useState(() => (reducedMotion() ? [] : rollPath(value, spin)))
  const [st, setSt] = useState<FlipState>(() => {
    const first = path[0] ?? value
    return { shown: first, prev: first, n: 0 }
  })
  const rolling = useRef(path.length > 1)
  const latest = useRef(value)
  latest.current = value

  const flipTo = (next: string) =>
    setSt((s) => (s.shown === next ? s : { shown: next, prev: s.shown, n: s.n + 1 }))

  // 등장 롤 — 끝나는 순간의 최신 값으로 마무리한다(롤 도중 초가 바뀌었을 수 있다)
  useEffect(() => {
    if (path.length < 2) return
    let i = 1
    const id = window.setInterval(() => {
      if (i < path.length) {
        flipTo(path[i++])
        return
      }
      window.clearInterval(id)
      rolling.current = false
      flipTo(latest.current)
    }, ROLL_STEP_MS)
    return () => window.clearInterval(id)
  }, [path])

  useEffect(() => {
    if (!rolling.current) flipTo(value)
  }, [value])

  return (
    <span className="capsule-flap" aria-hidden>
      <span className="capsule-flap__half capsule-flap__half--top">
        <b>{st.shown}</b>
      </span>
      <span className="capsule-flap__half capsule-flap__half--bottom">
        <b>{st.prev}</b>
      </span>
      {st.n > 0 && (
        <Fragment key={st.n}>
          <span className="capsule-flap__half capsule-flap__half--top capsule-flap__fold">
            <b>{st.prev}</b>
          </span>
          <span className="capsule-flap__half capsule-flap__half--bottom capsule-flap__drop">
            <b>{st.shown}</b>
          </span>
        </Fragment>
      )}
    </span>
  )
}

/**
 * 여러 자리 숫자. 자릿수가 줄어도(100일 → 99일) 남은 칸이 제자리에 있도록
 * 오른쪽 끝에서부터 키를 매긴다. 오른쪽 칸일수록 오래 돌아 왼쪽부터 차례로 멈춘다.
 */
export const FlapNumber = ({ value, pad = 2, spin = 0 }: { value: number; pad?: number; spin?: number }) => {
  const digits = String(Math.max(0, value)).padStart(pad, '0').split('')
  return (
    <span className="capsule-flap-row">
      {digits.map((d, i) => (
        <FlipDigit key={digits.length - i} value={d} spin={spin ? spin + i * 3 : 0} />
      ))}
    </span>
  )
}
