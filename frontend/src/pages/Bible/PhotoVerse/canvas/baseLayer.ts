// 사진 베이스 레이어 — 비율 크롭 · 필터 적용본 캐시 · 밝기 측정.

import type { CardFilterId, CardRatioId } from './cardStyle'
import { applyFilter } from './filters'
// ── 비율 크롭 — 사진 중앙을 목표 비율로 잘라낸다 ──
const RATIO_VALUES: Record<Exclude<CardRatioId, 'original'>, number> = {
  '1:1': 1,
  '4:5': 4 / 5,
  '9:16': 9 / 16,
}

interface CropRect {
  sx: number
  sy: number
  sw: number
  sh: number
}

const cropRect = (img: HTMLImageElement, ratio: CardRatioId): CropRect => {
  const iw = img.naturalWidth
  const ih = img.naturalHeight
  if (ratio === 'original') return { sx: 0, sy: 0, sw: iw, sh: ih }
  const target = RATIO_VALUES[ratio]
  const current = iw / ih
  if (current > target) {
    const sw = ih * target
    return { sx: (iw - sw) / 2, sy: 0, sw, sh: ih }
  }
  const sh = iw / target
  return { sx: 0, sy: (ih - sh) / 2, sw: iw, sh }
}

// ── 사진 베이스 레이어 캐시 — 크롭+필터 결과를 재사용해 드래그·슬라이더 중 LUT 루프를 반복하지 않는다 ──
let imgSeq = 0
const imgIds = new WeakMap<HTMLImageElement, number>()
const imgId = (img: HTMLImageElement) => {
  let id = imgIds.get(img)
  if (id === undefined) {
    id = ++imgSeq
    imgIds.set(img, id)
  }
  return id
}

const BASE_CACHE_MAX = 14
const baseCache = new Map<string, HTMLCanvasElement>()

const getBaseLayer = (
  img: HTMLImageElement,
  filter: CardFilterId,
  ratio: CardRatioId,
  w: number,
  h: number,
): HTMLCanvasElement => {
  const key = `${imgId(img)}|${filter}|${ratio}|${w}x${h}`
  const hit = baseCache.get(key)
  if (hit) {
    // LRU — 최근 사용을 뒤로
    baseCache.delete(key)
    baseCache.set(key, hit)
    return hit
  }
  const crop = cropRect(img, ratio)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, w, h)
    applyFilter(ctx, filter, 0, 0, w, h)
  }
  baseCache.set(key, canvas)
  if (baseCache.size > BASE_CACHE_MAX) {
    const oldest = baseCache.keys().next().value
    if (oldest) baseCache.delete(oldest)
  }
  return canvas
}

// ── 밝기 측정 — 텍스트가 놓일 자리의 사진 밝기를 재서 스크림 세기를 정한다 ──
let probe: HTMLCanvasElement | null = null
const PROBE = 12
const sampleLuminance = (source: HTMLCanvasElement, x: number, y: number, w: number, h: number): number => {
  if (w <= 0 || h <= 0) return 0.5
  if (!probe) {
    probe = document.createElement('canvas')
    probe.width = PROBE
    probe.height = PROBE
  }
  const pctx = probe.getContext('2d', { willReadFrequently: true })
  if (!pctx) return 0.5
  try {
    pctx.clearRect(0, 0, PROBE, PROBE)
    pctx.drawImage(source, x, y, w, h, 0, 0, PROBE, PROBE)
    const d = pctx.getImageData(0, 0, PROBE, PROBE).data
    let sum = 0
    for (let i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]
    return sum / (255 * PROBE * PROBE)
  } catch {
    return 0.5
  }
}


// ── photoVerseCanvas 내부 공유 ──
export { RATIO_VALUES, cropRect, imgIds, imgId, BASE_CACHE_MAX, baseCache, getBaseLayer, PROBE, sampleLuminance }
export type { CropRect }
