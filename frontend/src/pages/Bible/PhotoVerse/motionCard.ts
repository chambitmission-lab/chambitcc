// 움직이는 말씀 카드 — 사진은 천천히 다가오고(켄 번스) 말씀은 위에서부터 스며 나오는 짧은 영상.
// 인스타 스토리·릴스·카톡에 그대로 올릴 수 있게 캔버스를 브라우저 안에서 녹화한다.
// 사진은 여전히 기기 밖으로 나가지 않는다 (MediaRecorder · captureStream, 서버 없음).

import { createCardCanvas, drawVerseCard } from './photoVerseCanvas'
import type { VerseCardStyle } from './photoVerseCanvas'

const FPS = 30
/** 영상 긴 변 — 스토리 해상도(1080×1920)면 충분하고, 더 크면 저사양 폰에서 프레임이 끊긴다 */
const MOTION_MAX_SIDE = 1920
/** 한 장면(슬라이드) 길이 — 드러나는 2.2초 + 머무는 시간 */
const SLIDE_MS = 4600
const REVEAL_START = 500
const REVEAL_MS = 2200
const FADE_MS = 450
/** 카드 전체에서 사진이 다가오는 정도 — 크면 어지럽고 작으면 정지 사진처럼 보인다 */
const ZOOM = 0.07

export interface MotionSlide {
  text: string
  refLabel: string
}

export interface MotionResult {
  file: File
  url: string
}

/** 이 브라우저가 녹화할 수 있는 형식 — mp4 우선(인스타·아이폰 사진첩이 webm 을 못 연다) */
export const pickMotionMime = (): string | null => {
  if (typeof MediaRecorder === 'undefined' || typeof HTMLCanvasElement.prototype.captureStream !== 'function') {
    return null
  }
  const candidates = [
    'video/mp4;codecs=avc1.42E01F',
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ]
  return candidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? null
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)
const easeOut = (t: number) => 1 - (1 - t) ** 3
const clamp01 = (t: number) => Math.min(1, Math.max(0, t))

/**
 * 말씀 층을 드러낸다 — 부드러운 경계의 마스크가 글 흐름 방향으로 지나간다.
 * 가로쓰기는 위→아래, 세로쓰기는 오른쪽→왼쪽(세로 족자를 읽는 순서).
 */
const drawRevealedText = (
  ctx: CanvasRenderingContext2D,
  textLayer: HTMLCanvasElement,
  scratch: HTMLCanvasElement,
  progress: number,
  vertical: boolean,
  alpha: number,
) => {
  if (progress <= 0 || alpha <= 0) return
  const { width: w, height: h } = textLayer
  const sctx = scratch.getContext('2d')
  if (!sctx) return
  sctx.globalCompositeOperation = 'source-over'
  sctx.clearRect(0, 0, w, h)
  sctx.drawImage(textLayer, 0, 0)
  if (progress < 1) {
    // 경계 폭 = 화면의 18% — 한 줄씩 잉크가 번지듯
    const feather = (vertical ? w : h) * 0.18
    const span = (vertical ? w : h) + feather
    const edge = progress * span
    const g = vertical
      ? sctx.createLinearGradient(w - edge, 0, w - edge + feather, 0)
      : sctx.createLinearGradient(0, edge - feather, 0, edge)
    if (vertical) {
      g.addColorStop(0, 'rgba(0,0,0,0)')
      g.addColorStop(1, 'rgba(0,0,0,1)')
    } else {
      g.addColorStop(0, 'rgba(0,0,0,1)')
      g.addColorStop(1, 'rgba(0,0,0,0)')
    }
    sctx.globalCompositeOperation = 'destination-in'
    sctx.fillStyle = g
    sctx.fillRect(0, 0, w, h)
  }
  ctx.save()
  ctx.globalAlpha = alpha
  // 드러나며 살짝 떠오른다 — 정적인 와이프보다 '살아 있는' 느낌
  const lift = (1 - easeOut(progress)) * h * 0.012
  ctx.drawImage(scratch, 0, lift)
  ctx.restore()
}

interface RecordOptions {
  img: HTMLImageElement
  slides: MotionSlide[]
  style: VerseCardStyle
  filenameBase: string
  /** 녹화 중인 캔버스 — 진행 화면에 그대로 비춰준다 */
  onCanvas?: (canvas: HTMLCanvasElement) => void
  onProgress?: (ratio: number) => void
  signal?: AbortSignal
}

/** 카드를 영상으로 녹화한다. 실시간 녹화라 (장 수 × 4.6초) 걸린다 */
export const recordMotionCard = async ({
  img,
  slides,
  style,
  filenameBase,
  onCanvas,
  onProgress,
  signal,
}: RecordOptions): Promise<MotionResult> => {
  const mime = pickMotionMime()
  if (!mime) throw new Error('unsupported')

  // 녹화용 캔버스 — 코덱이 짝수 크기를 요구해 내림한다
  const sized = createCardCanvas(img, MOTION_MAX_SIDE, style.frame, style.ratio)
  const w = sized.width - (sized.width % 2)
  const h = sized.height - (sized.height % 2)
  const make = () => {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    return c
  }
  const out = make()
  const base = make()
  const scratch = make()
  drawVerseCard(base, img, '', '', style, { layer: 'base' })
  const textLayers = slides.map((s) => {
    const c = make()
    drawVerseCard(c, img, s.text, s.refLabel, style, { layer: 'text', sampleFrom: base })
    return c
  })
  const ctx = out.getContext('2d')
  if (!ctx) throw new Error('canvas unavailable')
  onCanvas?.(out)

  const vertical = style.layout === 'vertical'
  const total = SLIDE_MS * slides.length + 300

  const drawFrame = (ms: number) => {
    const t = clamp01(ms / total)
    // 사진 — 카드 전체 시간 동안 한 방향으로 천천히 다가온다
    const s = 1 + ZOOM * easeInOut(t)
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, w, h)
    ctx.save()
    ctx.globalAlpha = clamp01(ms / 600) // 첫 0.6초 어둠에서 떠오름
    ctx.translate(w / 2, h / 2)
    ctx.scale(s, s)
    ctx.drawImage(base, -w / 2, -h / 2)
    ctx.restore()

    // 말씀 — 슬라이드마다 드러났다가, 다음 장으로 넘어가기 전 사라진다
    const idx = Math.min(slides.length - 1, Math.floor(ms / SLIDE_MS))
    const local = ms - idx * SLIDE_MS
    const reveal = easeInOut(clamp01((local - REVEAL_START) / REVEAL_MS))
    const isLast = idx === slides.length - 1
    const fadeOut = isLast ? 1 : clamp01((SLIDE_MS - local) / FADE_MS)
    drawRevealedText(ctx, textLayers[idx], scratch, reveal, vertical, fadeOut)
  }

  drawFrame(0)
  const stream = out.captureStream(FPS)
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 })
  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data)
  }
  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve()
  })

  recorder.start(250)
  const started = performance.now()
  await new Promise<void>((resolve, reject) => {
    const tick = () => {
      if (signal?.aborted) {
        reject(new DOMException('aborted', 'AbortError'))
        return
      }
      const ms = performance.now() - started
      drawFrame(Math.min(ms, total))
      onProgress?.(clamp01(ms / total))
      if (ms >= total) resolve()
      else requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }).finally(() => {
    if (recorder.state !== 'inactive') recorder.stop()
    stream.getTracks().forEach((tr) => tr.stop())
  })
  await stopped

  const type = mime.split(';')[0]
  const ext = type === 'video/mp4' ? 'mp4' : 'webm'
  const blob = new Blob(chunks, { type })
  if (!blob.size) throw new Error('empty recording')
  const file = new File([blob], `${filenameBase}.${ext}`, { type })
  return { file, url: URL.createObjectURL(file) }
}
