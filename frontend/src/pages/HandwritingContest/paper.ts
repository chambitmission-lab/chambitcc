// 출품작의 배경(종이) — 출품할 때 고른 감성 배경 위에 글씨를 놓는다.
// 배경은 말씀 사진 카드와 같은 장면(새벽·별밤·한지…)이고, 서버에는 그 id 만 남는다(entry.paper).
// id 가 없거나 모르는 값이면 기본 크림 종이 그대로다.
// 내 사진을 배경으로 올린 작품은 paper 가 photolight(밝은 잉크) / photodark(어두운 잉크)이고 사진은 entry.paper_url 에 있다.
import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { BACKGROUNDS, backgroundCss, createBackgroundImage } from '../Bible/PhotoVerse/canvas/backgrounds'
import type { VerseBackground } from '../Bible/PhotoVerse/canvas/backgrounds'
import { isLightColor } from '../Bible/PhotoVerse/canvas/cardStyle'
import type { InkTheme } from '../Capsule/ink/inkModel'

/** 고를 수 있는 배경 — 글씨가 잘 보이는 종이류부터 */
const PAPER_ORDER = ['hanji', 'sage', 'rose', 'sea', 'lavender', 'dawn', 'sunset', 'midnight', 'bokeh', 'ink']
export const CONTEST_PAPERS: VerseBackground[] = PAPER_ORDER.map((id) => BACKGROUNDS.find((b) => b.id === id)).filter(
  (b): b is VerseBackground => !!b,
)

export const findPaper = (id: string | null | undefined): VerseBackground | null =>
  (id && CONTEST_PAPERS.find((b) => b.id === id)) || null

export const paperSwatchCss = (bg: VerseBackground) => backgroundCss(bg)

export const PHOTO_PAPER_LIGHT = 'photolight'
export const PHOTO_PAPER_DARK = 'photodark'
export const isPhotoPaper = (id: string | null | undefined): boolean => id === PHOTO_PAPER_LIGHT || id === PHOTO_PAPER_DARK

export interface PaperPhoto {
  blob: Blob
  url: string
  /** 사진이 어두워 밝은 잉크로 써야 하는지 */
  lightInk: boolean
  /** 종이 비율(세로/가로) — 사진 모양을 따른다. 종이가 글씨 띠 모양이면 사진이 크게 잘려 확대돼 보인다 */
  ratio: number
  /** 사진 원래 비율(세로/가로) — 보일 자리를 끌어 맞출 때 넘치는 폭을 잰다 */
  naturalRatio: number
}

/** 사진에서 보일 자리(0~100 %, CSS background-position). 종이 모양마다 잘리는 곳이 달라 출품할 때 고른다 */
export interface PaperFocus {
  x: number
  y: number
}
export const CENTER_FOCUS: PaperFocus = { x: 50, y: 50 }

export const entryFocus = (entry: { paper_focus_x?: number | null; paper_focus_y?: number | null }): PaperFocus | null =>
  entry.paper_focus_x == null && entry.paper_focus_y == null
    ? null
    : { x: entry.paper_focus_x ?? 50, y: entry.paper_focus_y ?? 50 }

/** 대회 첫 화면 히어로의 종이 비율(세로/가로) — 가로로 긴 띠 */
export const HERO_PAPER_RATIO = 0.56

// PC 히어로처럼 넓게 걸리는 자리에서도 뭉개지지 않게 넉넉히 남긴다
const PHOTO_MAX_SIDE = 1920
/** 서버가 받는 배경 사진 크기(3MB)보다 여유 있게 */
const PHOTO_MAX_BYTES = 2.5 * 1024 * 1024
/** 사진 종이의 비율 범위 — 갤러리 칸(최대 1.25)과 맞춘다 */
export const PHOTO_RATIO_MIN = 0.6
export const PHOTO_RATIO_MAX = 1.25

const toJpeg = (canvas: HTMLCanvasElement, quality: number): Promise<Blob> =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('사진을 준비하지 못했어요'))), 'image/jpeg', quality),
  )

/** 고른 사진을 올리기 좋게 줄이고(긴 변 1920px JPEG), 밝기를 재서 잉크 밝기를 정한다 */
export const preparePaperPhoto = async (file: File): Promise<PaperPhoto> => {
  const src = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = src
    await img.decode()
    const scale = Math.min(1, PHOTO_MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas unavailable')
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    // 평균 밝기 — 작게 줄여 잰다
    const probe = document.createElement('canvas')
    probe.width = 24
    probe.height = 24
    const pctx = probe.getContext('2d')
    let lum = 0.5
    if (pctx) {
      pctx.drawImage(canvas, 0, 0, 24, 24)
      const d = pctx.getImageData(0, 0, 24, 24).data
      let sum = 0
      for (let i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]
      lum = sum / (d.length / 4) / 255
    }
    let blob = await toJpeg(canvas, 0.9)
    if (blob.size > PHOTO_MAX_BYTES) blob = await toJpeg(canvas, 0.78)
    const naturalRatio = canvas.height / canvas.width
    const ratio = Math.min(PHOTO_RATIO_MAX, Math.max(PHOTO_RATIO_MIN, naturalRatio))
    return { blob, url: URL.createObjectURL(blob), lightInk: lum < 0.62, ratio, naturalRatio }
  } finally {
    URL.revokeObjectURL(src)
  }
}

// 장면 그림은 배경마다 한 번만 그려 blob URL 로 돌려쓴다 — 갤러리 칸마다 dataURL 을 인라인으로 싣지 않게
const sceneUrls = new Map<string, string>()
const sceneJobs = new Map<string, Promise<string>>()
const loadScene = (bg: VerseBackground): Promise<string> => {
  let job = sceneJobs.get(bg.id)
  if (!job) {
    job = createBackgroundImage(bg)
      .then((img) => fetch(img.src))
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob)
        sceneUrls.set(bg.id, url)
        return url
      })
    // 실패하면 다음에 다시 시도한다 — 그동안은 그라데이션이 대신한다
    job.catch(() => sceneJobs.delete(bg.id))
    sceneJobs.set(bg.id, job)
  }
  return job
}

export interface PaperSurface {
  /** .hw-paper 에 얹을 배경 — 기본 종이면 undefined(스타일시트 그대로) */
  style: CSSProperties | undefined
  /** 밝은 잉크로 써야 하는 어두운 배경인지 */
  lightInk: boolean
  /** 획을 다시 칠할 때의 잉크 테마 */
  theme: InkTheme
}

const DEFAULT_SURFACE: PaperSurface = { style: undefined, lightInk: false, theme: 'light' }

/** 배경 id → 종이 면. 장면 그림이 준비되기 전에는 같은 색의 그라데이션을 먼저 보여 준다 */
export const usePaperSurface = (
  paperId: string | null | undefined,
  photoUrl?: string | null,
  focus?: PaperFocus | null,
): PaperSurface => {
  const bg = findPaper(paperId)
  const [, bump] = useState(0)
  useEffect(() => {
    if (!bg || sceneUrls.has(bg.id)) return
    let alive = true
    loadScene(bg)
      .then(() => alive && bump((n) => n + 1))
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [bg])
  // 내 사진 배경 — 글씨가 묻히지 않게 사진 위에 옅은 막을 한 겹 깐다
  if (isPhotoPaper(paperId) && photoUrl) {
    const lightInk = paperId === PHOTO_PAPER_LIGHT
    const veil = lightInk ? 'rgba(0, 0, 0, 0.26)' : 'rgba(255, 255, 255, 0.3)'
    return {
      style: {
        background: `linear-gradient(${veil}, ${veil}), url("${photoUrl}") ${focus ? `${focus.x}% ${focus.y}%` : 'center'} / cover no-repeat`,
      },
      lightInk,
      theme: lightInk ? 'dark' : 'light',
    }
  }
  if (!bg) return DEFAULT_SURFACE
  const scene = sceneUrls.get(bg.id)
  const lightInk = isLightColor(bg.textColor)
  return {
    style: { background: scene ? `url(${scene}) center / cover no-repeat, ${backgroundCss(bg)}` : backgroundCss(bg) },
    lightInk,
    theme: lightInk ? 'dark' : 'light',
  }
}

/** 어두운 배경 위의 출품 PNG(먹색 잉크)를 밝은 잉크로 뒤집는다 */
export const LIGHT_INK_IMG_FILTER = 'brightness(0) invert(1)'
