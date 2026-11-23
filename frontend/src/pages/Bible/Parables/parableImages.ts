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
  const vars: Record<string, string> = {
    '--art-light': `url(${light ?? dark})`,
    '--art-dark': `url(${dark ?? light})`,
  }
  // 원본 자리 밑에는 작은 그림(카드에서 이미 받은 것)을 깔아 둔다 — 원본이 오기 전에도 빈 상자가 아니게
  if (size === 'full') {
    const lightSm = urlOf(`${id}-light-sm`) ?? urlOf(`${id}-dark-sm`)
    const darkSm = urlOf(`${id}-dark-sm`) ?? urlOf(`${id}-light-sm`)
    vars['--art-light-sm'] = lightSm ? `url(${lightSm})` : 'none'
    vars['--art-dark-sm'] = darkSm ? `url(${darkSm})` : 'none'
  }
  return vars as CSSProperties
}

/** 그림 주소 하나 — 미리 받을 때(parableWarm). 고르는 규칙은 parableArtVars 와 같다 */
export const parableArtUrl = (id: string, size: 'sm' | 'full', theme: 'light' | 'dark'): string | undefined => {
  const other = theme === 'light' ? 'dark' : 'light'
  const suffix = size === 'sm' ? '-sm' : ''
  return urlOf(`${id}-${theme}${suffix}`) ?? urlOf(`${id}-${theme}`) ?? urlOf(`${id}-${other}${suffix}`) ?? urlOf(`${id}-${other}`)
}

/** 그림이 있는 비유인지 — 상자에 has-img 클래스를 붙일 때 */
export const hasParableImage = (id: string) => parableArtVars(id, 'sm') !== null
