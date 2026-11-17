import { memo, useLayoutEffect, useRef } from 'react'
import { prefersReducedMotion } from '../../../utils/prefersReducedMotion'

// 공항 안내판 글자판 — 글자가 바뀌면 칸마다 몇 번 넘어간 뒤 제자리에 선다.
// 칸 글자는 React 자식이 아니라 DOM 에 직접 쓴다(넘어가는 동안 textContent 를 계속 바꾸므로
// React 텍스트 노드와 어긋나지 않게). 노선이 수십 개라 타이머는 모듈 전체에 하나만 돈다.

const LATIN = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789'
const HANGUL = '가나다라마바사아자차카타파하'
const isWide = (ch: string) => /[ㄱ-힣○〇]/.test(ch)

interface Spin {
  el: HTMLElement
  final: string
  left: number
  pool: string
}

const spinning = new Set<Spin>()
let timer: ReturnType<typeof setInterval> | null = null
const tick = () => {
  for (const s of spinning) {
    if (--s.left <= 0) {
      s.el.textContent = s.final
      spinning.delete(s)
    } else {
      s.el.textContent = s.pool[Math.floor(Math.random() * s.pool.length)]
    }
  }
  if (spinning.size === 0 && timer) {
    clearInterval(timer)
    timer = null
  }
}
const startSpin = (s: Spin) => {
  spinning.add(s)
  timer ??= setInterval(tick, 50)
}
const stopSpinsIn = (root: HTMLElement) => {
  for (const s of spinning) {
    if (!root.contains(s.el)) continue
    s.el.textContent = s.final // 넘어가던 칸은 원래 글자로 세워 두고 멈춘다
    spinning.delete(s)
  }
}

const show = (ch: string) => (ch === ' ' ? '\u00a0' : ch)

/** 글자판 한 줄. `tight` 는 긴 도시 이름처럼 칸을 좁혀 한 줄에 넣을 때 */
export const SplitFlap = memo(function SplitFlap({ text, tight = false }: { text: string; tight?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  const prev = useRef<string | null>(null)
  const chars = [...text]

  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    const cells = Array.from(root.children) as HTMLElement[]
    const before = prev.current ? [...prev.current] : null
    const still = prefersReducedMotion()
    cells.forEach((el, i) => {
      const ch = chars[i] ?? ' '
      const final = show(ch)
      // 이미 같은 글자면 그대로 — 30초마다 시각이 바뀌어도 바뀐 칸만 넘어간다
      if (still || ch === ' ' || (before && before[i] === ch)) {
        el.textContent = final
        return
      }
      const pool = isWide(ch) ? HANGUL : LATIN
      el.textContent = pool[Math.floor(Math.random() * pool.length)]
      startSpin({ el, final, pool, left: 4 + Math.floor(Math.random() * 6) + (before ? 0 : i % 10) })
    })
    prev.current = text
    return () => stopSpinsIn(root)
    // chars 는 text 에서 나온다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  return (
    <span className={`sf${tight ? ' sf--tight' : ''}`}>
      <span className="sr-only">{text}</span>
      <span ref={ref} className="sf-cells" aria-hidden="true">
        {chars.map((ch, i) => (
          <span key={i} className={`sf-cell${isWide(ch) ? ' is-wide' : ''}`} />
        ))}
      </span>
    </span>
  )
})
