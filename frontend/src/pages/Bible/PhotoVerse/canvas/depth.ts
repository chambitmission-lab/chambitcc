// 글자 뒤로 숨기(깊이 효과) — 사진 속 사람·사물을 말씀 글자 위에 한 번 더 덮어
// 글자가 피사체 뒤로 지나가는 것처럼 보이게 한다. (벤치마크: iOS 잠금화면 깊이 효과)
//
// 마스크는 원본 사진 좌표계(축소본일 수 있음)의 알파 캔버스다. 그릴 때마다
// 사진 층(크롭+필터 적용본)을 마스크로 오려 글 위에 얹는다.

import type { VerseCardStyle } from './cardStyle'
import { cropRect, getBaseLayer } from './baseLayer'

interface PhotoArea {
  px: number
  py: number
  pw: number
  ph: number
}

// 드래그·슬라이더 중 매 프레임 같은 조각을 다시 오리지 않게 마지막 결과 하나만 기억한다
let last: { key: string; mask: HTMLCanvasElement; base: HTMLCanvasElement; out: HTMLCanvasElement } | null = null

const subjectLayer = (
  img: HTMLImageElement,
  mask: HTMLCanvasElement,
  style: VerseCardStyle,
  pw: number,
  ph: number,
): HTMLCanvasElement | null => {
  const base = getBaseLayer(img, style.filter, style.ratio, pw, ph, style.focus)
  const crop = cropRect(img, style.ratio, style.focus)
  const key = `${pw}x${ph}|${crop.sx.toFixed(1)},${crop.sy.toFixed(1)},${crop.sw.toFixed(1)},${crop.sh.toFixed(1)}`
  if (last && last.key === key && last.mask === mask && last.base === base) return last.out

  const out = document.createElement('canvas')
  out.width = pw
  out.height = ph
  const ctx = out.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(base, 0, 0)
  // 마스크는 사진보다 작게 만들어 두었을 수 있다 — 크롭 사각형을 마스크 비율로 옮겨 오린다
  const s = mask.width / img.naturalWidth
  ctx.globalCompositeOperation = 'destination-in'
  ctx.drawImage(mask, crop.sx * s, crop.sy * s, crop.sw * s, crop.sh * s, 0, 0, pw, ph)
  ctx.globalCompositeOperation = 'source-over'
  last = { key, mask, base, out }
  return out
}

/** 글 위에 피사체를 다시 얹는다 — 글자가 피사체 뒤로 숨는다 */
export const drawSubjectOver = (
  ctx: CanvasRenderingContext2D,
  l: PhotoArea,
  img: HTMLImageElement,
  mask: HTMLCanvasElement,
  style: VerseCardStyle,
) => {
  const pw = Math.max(1, Math.round(l.pw))
  const ph = Math.max(1, Math.round(l.ph))
  const layer = subjectLayer(img, mask, style, pw, ph)
  if (layer) ctx.drawImage(layer, l.px, l.py, l.pw, l.ph)
}
