import type { CSSProperties, ReactNode } from 'react'

/**
 * 목양컬럼 하이라이트 마크업
 *
 *   [[문구]]                 → 기본(브랜드 형광펜)  — 기존 데이터 호환
 *   [[문구|yellow]]          → 색상만
 *   [[문구|blue|underline]]  → 색상 + 스타일
 *   [[문구|red|wavy|bold]]   → 색상 + 스타일 + 굵게
 *
 * 본문은 그냥 문자열로 저장되므로 백엔드 변경 없음.
 */

export type HighlightColor = 'brand' | 'yellow' | 'green' | 'pink' | 'orange' | 'purple'
export type HighlightStyle = 'marker' | 'underline' | 'wavy' | 'dotted' | 'text'

export interface HighlightOptions {
  color: HighlightColor
  style: HighlightStyle
  bold: boolean
}

export const DEFAULT_HIGHLIGHT: HighlightOptions = { color: 'brand', style: 'marker', bold: true }

export const HIGHLIGHT_COLORS: HighlightColor[] = ['brand', 'yellow', 'green', 'pink', 'orange', 'purple']
export const HIGHLIGHT_STYLES: HighlightStyle[] = ['marker', 'underline', 'wavy', 'dotted', 'text']

// 라이트/다크 모두에서 읽히도록 채도·투명도를 각각 맞춘 프리셋.
// marker(배경)는 투명도가 있는 색, line(밑줄·글자색)은 불투명한 색.
interface Palette { marker: string; line: string; swatch: string }
const LIGHT: Record<HighlightColor, Palette> = {
  brand:  { marker: 'var(--marker)',           line: 'var(--brand)', swatch: 'var(--brand)' },
  yellow: { marker: 'rgba(250, 204, 21, 0.45)', line: '#ca8a04',     swatch: '#facc15' },
  green:  { marker: 'rgba(74, 222, 128, 0.40)', line: '#16a34a',     swatch: '#4ade80' },
  pink:   { marker: 'rgba(244, 114, 182, 0.35)', line: '#db2777',    swatch: '#f472b6' },
  orange: { marker: 'rgba(251, 146, 60, 0.40)', line: '#ea580c',     swatch: '#fb923c' },
  purple: { marker: 'rgba(167, 139, 250, 0.40)', line: '#7c3aed',    swatch: '#a78bfa' },
}
const DARK: Record<HighlightColor, Palette> = {
  brand:  { marker: 'var(--marker)',           line: 'var(--brand)', swatch: 'var(--brand)' },
  yellow: { marker: 'rgba(250, 204, 21, 0.38)', line: '#fde047',     swatch: '#facc15' },
  green:  { marker: 'rgba(74, 222, 128, 0.35)', line: '#86efac',     swatch: '#4ade80' },
  pink:   { marker: 'rgba(244, 114, 182, 0.38)', line: '#f9a8d4',    swatch: '#f472b6' },
  orange: { marker: 'rgba(251, 146, 60, 0.38)', line: '#fdba74',     swatch: '#fb923c' },
  purple: { marker: 'rgba(167, 139, 250, 0.38)', line: '#c4b5fd',    swatch: '#a78bfa' },
}

export const swatchColor = (c: HighlightColor) => LIGHT[c].swatch

const isDark = () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

/** 옵션 → 인라인 스타일. 편집 팝오버 미리보기와 상세 렌더 둘 다 사용 */
export const highlightStyle = (opt: HighlightOptions): CSSProperties => {
  const p = (isDark() ? DARK : LIGHT)[opt.color]
  const base: CSSProperties = { fontWeight: opt.bold ? 600 : undefined }
  switch (opt.style) {
    case 'marker':
      return { ...base, background: `linear-gradient(transparent 55%, ${p.marker} 55%)` }
    case 'underline':
      return { ...base, textDecoration: 'underline', textDecorationColor: p.line, textDecorationThickness: '2px', textUnderlineOffset: '3px' }
    case 'wavy':
      return { ...base, textDecoration: 'underline wavy', textDecorationColor: p.line, textUnderlineOffset: '3px' }
    case 'dotted':
      return { ...base, textDecoration: 'underline dotted', textDecorationColor: p.line, textDecorationThickness: '2px', textUnderlineOffset: '3px' }
    case 'text':
      return { ...base, color: p.line }
  }
}

const isColor = (s: string): s is HighlightColor => (HIGHLIGHT_COLORS as string[]).includes(s)
const isStyle = (s: string): s is HighlightStyle => (HIGHLIGHT_STYLES as string[]).includes(s)

/** "문구|yellow|wavy|bold" → { text, options }. 알 수 없는 토큰은 무시 */
export const parseHighlightToken = (inner: string): { text: string; options: HighlightOptions } => {
  const [text, ...flags] = inner.split('|')
  const options: HighlightOptions = { ...DEFAULT_HIGHLIGHT, bold: false }
  let boldSeen = false
  for (const f of flags) {
    const t = f.trim()
    if (isColor(t)) options.color = t
    else if (isStyle(t)) options.style = t
    else if (t === 'bold') boldSeen = true
  }
  // 플래그가 하나도 없으면 기존 [[문구]] — 이전 기본값(굵게) 유지
  options.bold = flags.length === 0 ? true : boldSeen
  return { text, options }
}

/** 옵션 → 마커 문자열. 기본 옵션이면 짧은 [[문구]] 형태 */
export const buildHighlightMarkup = (text: string, opt: HighlightOptions): string => {
  const isDefault = opt.color === DEFAULT_HIGHLIGHT.color && opt.style === DEFAULT_HIGHLIGHT.style && opt.bold === DEFAULT_HIGHLIGHT.bold
  if (isDefault) return `[[${text}]]`
  const flags = [opt.color, opt.style, opt.bold ? 'bold' : ''].filter(Boolean)
  return `[[${text}|${flags.join('|')}]]`
}

const TOKEN_RE = /(\[\[[\s\S]*?\]\])/g

/** 상세 화면: 마커를 스타일 span으로 */
/* 본문은 어절 단위로만 줄을 바꾸므로(keep-all) "(마 7:12)"가 "(마 / 7:12)"로 쪼개진다.
   책 이름과 장:절 사이 공백을 줄바꿈 없는 공백으로 바꿔 성구 표기를 한 덩어리로 묶는다. */
const SCRIPTURE_REF_SPACE_RE = /([가-힣A-Za-z]+\.?) (?=\d{1,3}:\d)/g
export const glueScriptureRefs = (text: string): string => text.replace(SCRIPTURE_REF_SPACE_RE, '$1 ')

export const renderHighlightedText = (text: string): ReactNode[] =>
  text.split(TOKEN_RE).map((part, i) => {
    if (part.startsWith('[[') && part.endsWith(']]')) {
      const { text: inner, options } = parseHighlightToken(part.slice(2, -2))
      return (
        <span key={i} className="text-ink-strong" style={highlightStyle(options)}>
          {glueScriptureRefs(inner)}
        </span>
      )
    }
    return glueScriptureRefs(part)
  })

/** 목록·복사용: 마커 제거하고 문구만 */
export const removeHighlightTags = (text: string): string =>
  text.replace(/\[\[([\s\S]*?)\]\]/g, (_, inner: string) => inner.split('|')[0])
