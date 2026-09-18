// 곧 열릴 시트가 쓸 (글자 크기 × 굵기) 조합을 유휴 시간에 미리 한 번 셰이핑해 둔다.
//
// 배경: Pretendard Variable 은 unicode-range 로 92조각 난 가변 폰트라, 화면에 처음 등장하는
// (크기, 굵기) 조합마다 브라우저가 "글자가 걸친 조각 수"만큼 글꼴 인스턴스를 새로 만든다.
// 말씀 해석 패널은 본문에 없던 조합을 10개 쓰는데, 실측(프로덕션 빌드·CPU 4배 감속)으로
// 첫 열기 Layout 한 번이 125ms — 조합을 하나로 줄이면 23ms, 두 번째 열기는 6ms 였다.
// 글자 수·keep-all·아이콘·line-clamp 는 무관했고 비용은 조합 수에 비례했다.
// 그 첫 비용을 탭 시점에서 유휴 시간으로 옮긴다. 조합 하나(≈10ms)씩 유휴 콜백에 나눠 돌려
// 스크롤 중에도 긴 작업이 생기지 않는다.

export type FontCombo = readonly [sizePx: number, weight: number]

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
  cancelIdleCallback?: (id: number) => void
}

/**
 * text 에 나오는 글자들을 combos 의 각 조합으로 숨겨서 한 번씩 배치해 본다.
 * 글꼴은 body 상속(Pretendard Variable). 반환값은 취소 함수.
 */
export const warmFontShaping = (text: string, combos: readonly FontCombo[]): (() => void) => {
  if (typeof document === 'undefined' || !text) return () => undefined
  // 인스턴스는 글자가 아니라 조각 단위로 생기므로 고유 글자만 있으면 된다
  const chars = [...new Set(text)].join('')
  const queue = [...combos]
  const w = window as IdleWindow
  let cancelled = false
  let idleId: number | null = null
  let timer: number | null = null

  const schedule = () => {
    if (w.requestIdleCallback) idleId = w.requestIdleCallback(step, { timeout: 3000 })
    else timer = window.setTimeout(step, 60)
  }
  const step = () => {
    if (cancelled) return
    const next = queue.shift()
    if (!next) return
    const el = document.createElement('div')
    el.setAttribute('aria-hidden', 'true')
    el.style.cssText =
      'position:fixed;left:0;top:0;width:320px;visibility:hidden;pointer-events:none;contain:layout style;' +
      `font-size:${next[0]}px;font-weight:${next[1]}`
    el.textContent = chars
    document.body.appendChild(el)
    void el.offsetHeight // 강제 배치 — 여기서 인스턴스가 만들어진다
    el.remove()
    if (queue.length > 0) schedule()
  }
  schedule()

  return () => {
    cancelled = true
    if (idleId !== null) w.cancelIdleCallback?.(idleId)
    if (timer !== null) window.clearTimeout(timer)
  }
}
