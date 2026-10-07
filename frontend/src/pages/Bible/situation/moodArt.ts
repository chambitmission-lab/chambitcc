import type { CSSProperties } from 'react'
import type { MoodArt } from './situationMoods'
import { currentTheme, warmImage } from '../../../utils/themeAssets'

// 감정 타일 배경 그림 — src/assets/situation-moods/{key}-{light|dark}[-sm].webp
// 타일은 720px(-sm), 몰입 화면은 원본(1376px). public/ 이 아니라 assets 라 교체해도 SW 캐시에 안 걸린다.
const FILES = import.meta.glob<string>('../../../assets/situation-moods/*.webp', {
  eager: true,
  import: 'default',
})

const urlOf = (name: string) => FILES[`../../../assets/situation-moods/${name}.webp`]

/** 타일: --art-light/--art-dark (720px), 몰입 화면: 거기에 원본 --art-light-full/--art-dark-full 을 덧씌운다 —
 *  원본이 아직 안 받아졌으면 아래 겹의 작은 그림이 먼저 보여 빈 화면이 없다 */
export const moodArtVars = (art: MoodArt, size: 'sm' | 'full') => {
  const vars: Record<string, string> = {
    '--art-light': `url(${urlOf(`${art.key}-light-sm`)})`,
    '--art-dark': `url(${urlOf(`${art.key}-dark-sm`)})`,
  }
  if (size === 'full') {
    vars['--art-light-full'] = `url(${urlOf(`${art.key}-light`)})`
    vars['--art-dark-full'] = `url(${urlOf(`${art.key}-dark`)})`
  }
  return vars
}

/** 몰입 화면 원본(현재 테마)을 미리 받는다 — 타일 hover·focus·누름에서 호출해 열릴 때 바로 선명하게 */
export const warmMoodArtFull = (art: MoodArt): void => {
  const src = urlOf(`${art.key}-${currentTheme()}`)
  if (src) void warmImage(src, 'high')
}

/** 원본 그림 비율 (1376×768) */
const RATIO = 1376 / 768
/** 타일 안에서 초점이 놓이는 자리 — 라벨(왼쪽 위)·말씀 수(왼쪽 아래)를 비켜 오른쪽 가운데 */
const TILE_ANCHOR_X = 0.62
const TILE_ANCHOR_Y = 0.55
/** 몰입 화면에서 초점이 놓이는 자리 — 말씀 글자가 위쪽에 앉도록 조금 아래 */
const FULL_ANCHOR_Y = 0.62

const clamp = (min: number, v: number, max: number) => Math.min(max, Math.max(min, v))

export interface ArtBox {
  left: number
  top: number
  width: number
  height: number
}

/** 타일(w×h) 안에서 그림이 놓이는 상자 — 타일 CSS(tileArtStyle)와 같은 계산 */
export const tileArtBox = (w: number, h: number, art: MoodArt): ArtBox => {
  const height = art.zoom * h
  const width = height * RATIO
  return {
    left: clamp(w - width, TILE_ANCHOR_X * w - art.fx * width, 0),
    top: clamp(h - height, TILE_ANCHOR_Y * h - art.fy * height, 0),
    width,
    height,
  }
}

/** 타일 높이는 고정(96px)이고 폭만 열 수에 따라 변한다 — 가로는 CSS clamp 로 폭을 따라가게 */
export const TILE_H = 96
export const tileArtStyle = (art: MoodArt): CSSProperties => {
  const height = art.zoom * TILE_H
  const width = height * RATIO
  return {
    width,
    height,
    top: clamp(TILE_H - height, TILE_ANCHOR_Y * TILE_H - art.fy * height, 0),
    left: `clamp(calc(100% - ${width}px), calc(${TILE_ANCHOR_X * 100}% - ${art.fx * width}px), 0px)`,
  }
}

/** 화면(vw×vh)을 덮는 상자 — 초점이 가운데 아래쪽에 오도록 */
export const coverArtBox = (vw: number, vh: number, art: MoodArt): ArtBox => {
  const height = Math.max(vh, vw / RATIO)
  const width = height * RATIO
  return {
    left: clamp(vw - width, vw / 2 - art.fx * width, 0),
    top: clamp(vh - height, FULL_ANCHOR_Y * vh - art.fy * height, 0),
    width,
    height,
  }
}
