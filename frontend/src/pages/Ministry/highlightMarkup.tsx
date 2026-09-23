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

/**
 * 본문 인라인 서식 — 형광펜 토큰과 함께 글자 서식도 같은 문자열 안에 적는다.
 *
 *   **굵게**   _기울임_   ++밑줄++   ~~취소선~~   [[형광펜|색|스타일]]
 *
 * 서로 겹쳐 쓸 수 있다(**_굵은 기울임_**). 여는 기호 바로 뒤·닫는 기호 바로 앞은 공백이 아니어야 하고,
 * 기울임 _ 는 영문·숫자에 붙은 자리(snake_case·URL)에서는 서식으로 보지 않는다.
 */
export interface InlineMarks {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strike?: boolean
}
export interface InlineSegment {
  text: string
  marks: InlineMarks
  highlight: HighlightOptions | null
}

const INLINE_RE =
  /\[\[([\s\S]*?)\]\]|\*\*(?=\S)([\s\S]*?\S)\*\*|\+\+(?=\S)([\s\S]*?\S)\+\+|~~(?=\S)([\s\S]*?\S)~~|(?<![A-Za-z0-9_])_(?=[^\s_])([^_\n]*?[^\s_])_(?![A-Za-z0-9_])/g

/** 문자열 → 서식 조각들 (겹친 서식은 재귀로 푼다) */
export const parseInline = (
  text: string,
  marks: InlineMarks = {},
  highlight: HighlightOptions | null = null,
): InlineSegment[] => {
  const out: InlineSegment[] = []
  let last = 0
  for (const m of text.matchAll(INLINE_RE)) {
    const at = m.index ?? 0
    if (at > last) out.push({ text: text.slice(last, at), marks, highlight })
    if (m[1] !== undefined) {
      const { text: inner, options } = parseHighlightToken(m[1])
      out.push(...parseInline(inner, marks, options))
    } else if (m[2] !== undefined) out.push(...parseInline(m[2], { ...marks, bold: true }, highlight))
    else if (m[3] !== undefined) out.push(...parseInline(m[3], { ...marks, underline: true }, highlight))
    else if (m[4] !== undefined) out.push(...parseInline(m[4], { ...marks, strike: true }, highlight))
    else if (m[5] !== undefined) out.push(...parseInline(m[5], { ...marks, italic: true }, highlight))
    last = at + m[0].length
  }
  if (last < text.length) out.push({ text: text.slice(last), marks, highlight })
  return out
}

/** 조각 서식 → 마커 문자열. 공백은 기호 바깥으로 빼야 다시 읽을 때 서식으로 인식된다 */
export const wrapInlineMarks = (text: string, marks: InlineMarks): string => {
  const open = `${marks.bold ? '**' : ''}${marks.italic ? '_' : ''}${marks.underline ? '++' : ''}${marks.strike ? '~~' : ''}`
  if (!open) return text
  const m = text.match(/^(\s*)([\s\S]*?)(\s*)$/)
  if (!m || !m[2]) return text
  // 기호가 전부 같은 글자 반복이라 글자 단위로 뒤집으면 곧 닫는 순서다(**_ → _**)
  const close = open.split('').reverse().join('')
  return `${m[1]}${open}${m[2]}${close}${m[3]}`
}

/* 본문은 어절 단위로만 줄을 바꾸므로(keep-all) "(마 7:12)"가 "(마 / 7:12)"로 쪼개진다.
   책 이름과 장:절 사이 공백을 줄바꿈 없는 공백으로 바꿔 성구 표기를 한 덩어리로 묶는다. */
const SCRIPTURE_REF_SPACE_RE = /([가-힣A-Za-z]+\.?) (?=\d{1,3}:\d)/g
export const glueScriptureRefs = (text: string): string => text.replace(SCRIPTURE_REF_SPACE_RE, '$1\u00a0')

/** 상세 화면: 서식·형광펜을 태그로. 서식 없는 조각은 문자열 그대로 둔다(문단 줄바꿈 처리가 문자열만 쪼갠다) */
export const renderHighlightedText = (text: string): ReactNode[] =>
  parseInline(text).map((seg, i) => {
    const { marks, highlight } = seg
    let node: ReactNode = glueScriptureRefs(seg.text)
    if (!highlight && !marks.bold && !marks.italic && !marks.underline && !marks.strike) return node
    if (marks.strike) node = <s className="decoration-[1.5px]">{node}</s>
    if (marks.underline) node = <u className="underline-offset-[4px] decoration-[1.5px]">{node}</u>
    if (marks.italic) node = <em>{node}</em>
    if (marks.bold) node = <strong className="font-semibold text-ink-strong">{node}</strong>
    if (highlight) {
      node = (
        <span className="text-ink-strong" style={highlightStyle(highlight)}>
          {node}
        </span>
      )
    }
    return <span key={i}>{node}</span>
  })

/** 목록·복사용: 형광펜·글자 서식 기호를 모두 걷어내고 문구만 */
export const removeHighlightTags = (text: string): string =>
  parseInline(text)
    .map((seg) => seg.text)
    .join('')
