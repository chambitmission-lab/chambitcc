/* 번개 ↔ 나무 — 날씨 엔진(railWeatherScene)이 번개를 칠 때 같은 삽화 칸의 나무(railTreeScene)에게
 * "이번 번개를 맞겠는가"를 묻는다. 나무가 받으면 날씨 엔진은 제 번개를 긋지 않고(번쩍임만 나무 쪽으로)
 * 나무 캔버스가 나무 꼭대기로 내리꽂히는 번개와 불을 그린다 — 번개가 두 줄기로 보이지 않게.
 * 칸(.rail-bottom-art 요소)마다 따로 묶는다(시연 페이지에는 칸이 여러 개다). */

export interface StrikeHit {
  /** 번쩍임 중심 x (이미지 기준) */
  x: number
}
type Hook = () => StrikeHit | null

const hooks = new WeakMap<Element, Hook>()

export const setStrikeHook = (cell: Element, hook: Hook | null) => {
  if (hook) hooks.set(cell, hook)
  else hooks.delete(cell)
}

export const claimStrike = (cell: Element | null | undefined): StrikeHit | null => {
  if (!cell) return null
  return hooks.get(cell)?.() ?? null
}

/* 시연용 — 다음 번개는 반드시 나무로 */
let armed = false
export const armTreeStrike = () => {
  armed = true
}
export const takeArmed = () => {
  const a = armed
  armed = false
  return a
}
