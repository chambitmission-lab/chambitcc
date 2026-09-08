// 말씀 카드 스타일 프리셋 — 레이아웃·필터·서체·질감·프레임을 디자이너가 미리 조합한 '완성된 룩'.
// 컨트롤 7개를 조합하지 않아도 한 탭에 공유할 만한 카드가 나오게 하는 것이 목적이다
// (Unfold·Canva 템플릿 스트립의 문법). 각 프리셋은 내 사진으로 실사 썸네일을 그려 보여준다.
//
// ratio·lang·fontScale·pos 는 프리셋이 건드리지 않는다 — 사용자가 정한 공유처·위치는 룩과 무관하다.
// color 는 형광펜처럼 룩이 요구할 때만 지정하고, 나머지는 사진/배경에 맞춘 기본 글자색을 따른다.

import type { VerseCardStyle } from './photoVerseCanvas'

export type PresetStyle = Partial<
  Pick<VerseCardStyle, 'layout' | 'filter' | 'fontFamily' | 'textBg' | 'frame' | 'textures' | 'align' | 'color' | 'signature'>
>

export interface CardPreset {
  id: string
  nameKo: string
  nameEn: string
  style: PresetStyle
}

export const CARD_PRESETS: CardPreset[] = [
  {
    id: 'classic',
    nameKo: '클래식',
    nameEn: 'Classic',
    style: { layout: 'classic', filter: 'none', fontFamily: 'serif', textBg: 'soft', frame: 'none', textures: [], align: 'center' },
  },
  {
    id: 'film',
    nameKo: '필름',
    nameEn: 'Film',
    style: { layout: 'classic', filter: 'film', fontFamily: 'serif', textBg: 'soft', frame: 'none', textures: ['grain', 'leak'], align: 'center' },
  },
  {
    id: 'dawn',
    nameKo: '새벽 인용',
    nameEn: 'Dawn Quote',
    style: { layout: 'quote', filter: 'dawn', fontFamily: 'serif', textBg: 'soft', frame: 'none', textures: ['vignette'] },
  },
  {
    id: 'postcard',
    nameKo: '엽서',
    nameEn: 'Postcard',
    style: { layout: 'poster', filter: 'warm', fontFamily: 'serif', textBg: 'soft', frame: 'none', textures: [] },
  },
  {
    id: 'magazine',
    nameKo: '매거진',
    nameEn: 'Magazine',
    style: { layout: 'gallery', filter: 'fade', fontFamily: 'sans', textBg: 'soft', frame: 'none', textures: [] },
  },
  {
    id: 'golden',
    nameKo: '한 단어',
    nameEn: 'One Word',
    style: { layout: 'focus', filter: 'golden', fontFamily: 'serif', textBg: 'soft', frame: 'none', textures: ['vignette'] },
  },
  {
    id: 'polaroid',
    nameKo: '폴라로이드',
    nameEn: 'Polaroid',
    style: { layout: 'classic', filter: 'clear', fontFamily: 'serif', textBg: 'soft', frame: 'polaroid', textures: ['grain'], align: 'center' },
  },
  {
    id: 'mono',
    nameKo: '흑백',
    nameEn: 'Mono',
    style: { layout: 'classic', filter: 'mono', fontFamily: 'serif', textBg: 'soft', frame: 'none', textures: ['grain', 'vignette'], align: 'center' },
  },
  {
    id: 'brush',
    nameKo: '붓글씨',
    nameEn: 'Brush',
    style: { layout: 'vertical', filter: 'sepia', fontFamily: 'brush', textBg: 'soft', frame: 'none', textures: ['grain'] },
  },
  {
    id: 'marker',
    nameKo: '형광펜',
    nameEn: 'Marker',
    style: { layout: 'classic', filter: 'clear', fontFamily: 'sans', textBg: 'marker', frame: 'none', textures: [], align: 'left', color: '#111111' },
  },
  {
    id: 'season',
    nameKo: '절기 에디션',
    nameEn: 'Season',
    style: { layout: 'quote', filter: 'none', fontFamily: 'serif', textBg: 'soft', frame: 'season', textures: [] },
  },
]

/** 인트로에서 보여주는 예시 카드 — 감성 배경 + 프리셋 조합. 탭하면 그 조합으로 바로 시작한다 */
export const INTRO_SAMPLES: { bgId: string; presetId: string }[] = [
  { bgId: 'dawn', presetId: 'classic' },
  { bgId: 'midnight', presetId: 'dawn' },
  { bgId: 'cream', presetId: 'postcard' },
  { bgId: 'bokeh', presetId: 'golden' },
  { bgId: 'hanji', presetId: 'brush' },
]
