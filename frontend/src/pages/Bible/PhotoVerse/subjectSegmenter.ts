// 글자 뒤로 숨기 — 사용자가 누른 자리의 사람·사물을 브라우저 안에서 오려낸다.
// MediaPipe 인터랙티브 분할(magic touch)을 쓰며, 사진은 기기 밖으로 나가지 않는다.
// 모델(약 6MB)과 런타임(wasm)은 처음 쓸 때 한 번만 받고, 그 뒤엔 브라우저 캐시를 탄다.

import type { InteractiveSegmenterLegacy } from '@mediapipe/tasks-vision'

// wasm 런타임은 설치한 패키지와 같은 버전을 CDN에서 — 버전이 어긋나면 로더가 깨진다
const TASKS_VISION_VERSION = '1.2.2'
const WASM_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/interactive_segmenter/magic_touch/float32/1/magic_touch.tflite'

/** 분할에 넣는 사진의 긴 변 — 더 크면 느려지기만 하고 가장자리는 어차피 부드럽게 푼다 */
const INPUT_MAX_SIDE = 1024
/** 이보다 작게 잡히면 '못 찾음' — 점 하나 같은 오검출로 효과가 켜진 척하지 않게 */
const MIN_COVERAGE = 0.004

let segmenterPromise: Promise<InteractiveSegmenterLegacy> | null = null

const loadSegmenter = () => {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      const { FilesetResolver, InteractiveSegmenterLegacy } = await import('@mediapipe/tasks-vision')
      const fileset = await FilesetResolver.forVisionTasks(WASM_BASE)
      return InteractiveSegmenterLegacy.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' },
        outputConfidenceMasks: true,
        outputCategoryMask: false,
      })
    })()
    // 네트워크 실패면 다음 시도에서 다시 받는다
    segmenterPromise.catch(() => {
      segmenterPromise = null
    })
  }
  return segmenterPromise
}

/** 편집 화면에 들어오면 미리 받아 둘 수 있게 — 실패는 조용히 */
export const preloadSegmenter = () => {
  loadSegmenter().catch(() => undefined)
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/**
 * 사진 위 (u, v)(0~1, 원본 사진 기준)를 누른 대상의 알파 마스크.
 * 마스크 캔버스는 사진을 긴 변 INPUT_MAX_SIDE 로 줄인 크기다. 못 찾으면 null.
 */
export const segmentSubjectAt = async (
  img: HTMLImageElement,
  u: number,
  v: number,
): Promise<HTMLCanvasElement | null> => {
  const segmenter = await loadSegmenter()

  const scale = Math.min(1, INPUT_MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.max(1, Math.round(img.naturalWidth * scale))
  const h = Math.max(1, Math.round(img.naturalHeight * scale))
  const input = document.createElement('canvas')
  input.width = w
  input.height = h
  const ictx = input.getContext('2d')
  if (!ictx) return null
  ictx.drawImage(img, 0, 0, w, h)

  const result = segmenter.segment(input, { keypoint: { x: u, y: v } })
  const masks = result.confidenceMasks ?? []
  try {
    // 모델에 따라 [배경, 대상] 두 장 또는 [대상] 한 장 — 마지막 장을 대상 쪽으로 본다
    const m = masks[masks.length - 1]
    if (!m) return null
    const data = m.getAsFloat32Array()
    const mw = m.width
    const mh = m.height
    // 누른 자리가 낮게 나오면 뒤집힌 마스크다
    const tx = Math.min(mw - 1, Math.max(0, Math.round(u * (mw - 1))))
    const ty = Math.min(mh - 1, Math.max(0, Math.round(v * (mh - 1))))
    const invert = data[ty * mw + tx] < 0.5

    const out = document.createElement('canvas')
    out.width = mw
    out.height = mh
    const octx = out.getContext('2d')
    if (!octx) return null
    const image = octx.createImageData(mw, mh)
    const px = image.data
    let covered = 0
    for (let i = 0; i < data.length; i++) {
      const c = invert ? 1 - data[i] : data[i]
      // 가장자리는 깃털처럼 — 너무 딱딱하면 오려 붙인 티가 나고, 너무 무르면 글자가 비친다
      const a = smoothstep(0.35, 0.65, c)
      if (a > 0.5) covered++
      const o = i * 4
      px[o] = 0
      px[o + 1] = 0
      px[o + 2] = 0
      px[o + 3] = Math.round(a * 255)
    }
    if (covered / data.length < MIN_COVERAGE) return null
    octx.putImageData(image, 0, 0)
    return out
  } finally {
    masks.forEach((mask) => mask.close())
    result.close?.()
  }
}
