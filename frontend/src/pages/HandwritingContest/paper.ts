// 출품작의 배경(종이) — 출품할 때 고른 감성 배경 위에 글씨를 놓는다.
// 배경은 말씀 사진 카드와 같은 장면(새벽·별밤·한지…)이고, 서버에는 그 id 만 남는다(entry.paper).
// id 가 없거나 모르는 값이면 기본 크림 종이 그대로다.
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
export const usePaperSurface = (paperId: string | null | undefined): PaperSurface => {
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
