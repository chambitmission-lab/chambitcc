/** 배열에서 무작위 하나. 빈 배열이면 undefined. */
export const pickRandom = <T>(items: readonly T[]): T | undefined =>
  items.length ? items[Math.floor(Math.random() * items.length)] : undefined

/** Fisher–Yates 셔플. 원본은 건드리지 않고 새 배열을 돌려준다. */
export const shuffle = <T>(items: readonly T[]): T[] => {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
