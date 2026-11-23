import type { CSSProperties } from 'react'

// 비유 그림 — src/assets/parables/{id}-{light|dark}[-sm].webp (제미나이 과슈 삽화, docs/parable-art-prompts.md)
// 있는 비유만 그림, 없는 비유는 선화(ParableArt). 작은 자리(카드·썸네일)는 720px -sm, 시트 머리는 원본.
// 테마 전환은 CSS 변수 두 벌(--art-light/--art-dark)을 parables-tone.css 가 [data-theme] 로 고른다.
const FILES = import.meta.glob<string>('../../../assets/parables/*.webp', { eager: true, import: 'default' })

const urlOf = (name: string): string | undefined => FILES[`../../../assets/parables/${name}.webp`]

/** 그림이 있으면 배경 변수, 없으면 null. 한쪽 테마만 있으면 그 그림을 양쪽에 쓴다 */
export const parableArtVars = (id: string, size: 'sm' | 'full'): CSSProperties | null => {
  const suffix = size === 'sm' ? '-sm' : ''
  const light = urlOf(`${id}-light${suffix}`) ?? urlOf(`${id}-light`)
  const dark = urlOf(`${id}-dark${suffix}`) ?? urlOf(`${id}-dark`)
  if (!light && !dark) return null
  return {
    '--art-light': `url(${light ?? dark})`,
    '--art-dark': `url(${dark ?? light})`,
  } as CSSProperties
}

/** 그림이 있는 비유인지 — 상자에 has-img 클래스를 붙일 때 */
export const hasParableImage = (id: string) => parableArtVars(id, 'sm') !== null
