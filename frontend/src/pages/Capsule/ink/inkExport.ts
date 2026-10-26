// 봉인 직전 — 손글씨 장들을 업로드 파일(투명 PNG + 획 JSON)로 바꾼다.
// PNG 는 폴백·공유용, JSON 은 개봉 때 글씨가 다시 써지는 재생용.
import type { CapsuleDraftHandwritingPage } from '../../../types/timeCapsule'
import { INK_PAGE_H, INK_PAGE_W, filledInkPages, toInkPageFile, type InkPage } from './inkModel'
import { exportInkPagePng } from './inkRender'

export const buildHandwritingUpload = async (pages: InkPage[]): Promise<CapsuleDraftHandwritingPage[]> => {
  const out: CapsuleDraftHandwritingPage[] = []
  for (const page of filledInkPages(pages)) {
    const png = await exportInkPagePng(page)
    const ink = new Blob([JSON.stringify(toInkPageFile(page))], { type: 'application/json' })
    out.push({ png, ink, width: INK_PAGE_W, height: INK_PAGE_H })
  }
  return out
}
