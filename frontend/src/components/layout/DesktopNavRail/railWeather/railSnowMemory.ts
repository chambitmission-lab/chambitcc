/* 쌓인 눈 기억 — 레일이 잠깐 내려갔다 다시 떠도(삽화 없는 화면 → 돌아옴) 이어서 보이게,
 * 그리고 눈이 그친 뒤 남은 눈을 천천히 녹이는 연출(thaw)이 이어받게 적어 둔다.
 * 엔진(railWeatherScene)은 궂은 날에만 받는 지연 청크라, 맑은 날에도 "남은 눈이 있나"를
 * 물어볼 수 있도록 이 작은 파일로 떼어 두었다. 메모리에만 둔다(새로고침하면 사라진다). */

export interface SnowMemory {
  ridges: Float32Array[]
  roof: number
  mbox: number
  at: number
}

const SNOW_MEMORY_MS = 1000 * 60 * 60 * 6
/* 이보다 얇으면 그려지지 않는다 — 남은 눈이 없는 것으로 친다 */
const SNOW_LEFT_MIN = 0.1

let memory: SnowMemory | null = null

export const readSnowMemory = (): SnowMemory | null =>
  memory && Date.now() - memory.at < SNOW_MEMORY_MS ? memory : null

export const saveSnowMemory = (m: Omit<SnowMemory, 'at'>) => {
  memory = { ...m, at: Date.now() }
}

export const clearSnowMemory = () => {
  memory = null
}

export const hasSnowLeft = (): boolean => {
  const m = readSnowMemory()
  if (!m) return false
  let max = Math.max(m.roof, m.mbox)
  for (const d of m.ridges) for (let x = 0; x < d.length; x++) if (d[x] > max) max = d[x]
  return max > SNOW_LEFT_MIN
}
