// 주보 쪽 그림 미리 받기 — 뷰어를 열거나 넘길 때 옆 쪽이 빈 채로 떴다가 '툭' 끼어들지 않게.
// 처음 여는 주보는 현재 쪽·옆 쪽 원본 WebP 세 장이 한꺼번에 내려오느라 옆 쪽이 가장 늦게 도착했다 —
// 열려는 기미(호버·누름·상세 요청 대기)가 보이는 순간부터 받아 두면 뷰어가 뜰 때쯤 대부분 와 있다.
import type { BulletinPage } from '../../../types/bulletin'
import { pageSrc } from './bulletinIssue'

const warmed = new Set<string>()
// 받는 중인 Image 를 붙들어 둔다 — 참조가 끊기면 브라우저가 내려받기를 중단할 수 있다
const pending = new Map<string, HTMLImageElement>()

/** 이 세션에서 미리 받기로 도착이 확인된 그림인가 — 옆 쪽이 썸네일 단계를 건너뛸지 정할 때 쓴다 */
export const isWarm = (src: string) => warmed.has(src)

/** 그림 한 장 미리 받기 — 같은 주소는 한 번만 요청한다 */
export const warmImage = (src: string | null | undefined) => {
  if (!src || warmed.has(src) || pending.has(src)) return
  const img = new Image()
  img.decoding = 'async'
  img.onload = () => {
    warmed.add(src)
    pending.delete(src)
  }
  img.onerror = () => pending.delete(src)
  pending.set(src, img)
  img.src = src
}

/** page 와 앞뒤 radius 쪽의 읽기용 그림을 미리 받는다 */
export const warmPagesAround = (pages: BulletinPage[] | undefined, page: number, radius = 1) => {
  if (!pages?.length) return
  const sorted = [...pages].sort((a, b) => a.page_number - b.page_number)
  for (let i = Math.max(page - radius, 0); i <= page + radius; i++) {
    const p = sorted[i]
    if (p) warmImage(pageSrc(p))
  }
}
