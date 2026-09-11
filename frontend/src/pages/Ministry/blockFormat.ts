// 목양칼럼 본문 블록 문법 — 줄머리 마커로 편지의 구조를 표현한다.
// 본문은 지금까지처럼 그냥 문자열로 저장되므로 백엔드·검색·공유가 전부 그대로 호환된다.
//
//   ## 소제목
//   > 하나님이 세상을 이처럼 사랑하사
//   > — 요한복음 3:16          ← '—'로 시작하는 줄은 인용 출처
//   :: 이번 주 함께 기도해요    ← 연달아 쓰면 한 상자로 묶인다
//   ---                        ← 장식 구분선
//   !(https://.../photo.webp|사진 설명)
//   - 목록 항목
//   1. 번호 목록 항목
//
// 인라인 강조([[문구|색|스타일]])는 highlightMarkup 이 계속 담당한다.

import { removeHighlightTags } from './highlightMarkup'

export type ColumnBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'quote'; lines: string[]; cite?: string }
  | { kind: 'callout'; lines: string[] }
  | { kind: 'divider' }
  | { kind: 'image'; url: string; caption?: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'paragraph'; text: string }

const HEADING_RE = /^##\s*(.+)$/
const QUOTE_RE = /^>\s?(.*)$/
const CALLOUT_RE = /^::\s?(.*)$/
const DIVIDER_RE = /^\s*(?:---+|\*\*\*+)\s*$/
const IMAGE_RE = /^!\(([^)|]+)(?:\|([^)]*))?\)\s*$/
const BULLET_RE = /^[-*]\s+(.+)$/
const ORDERED_RE = /^\d+[.)]\s+(.+)$/
// 인용 안에서 출처로 볼 줄 — "— 요한복음 3:16" / "- 요한복음 3:16"
const CITE_RE = /^[—–-]\s*(.+)$/

/** 본문 문자열 → 블록 목록. 알 수 없는 줄은 문단으로 흘려보낸다(기존 글 그대로 호환). */
export const parseColumnBlocks = (content: string): ColumnBlock[] => {
  const blocks: ColumnBlock[] = []
  // 같은 종류가 연달아 나오면 한 블록으로 묶기 위한 버퍼
  let para: string[] = []
  let quote: string[] = []
  let callout: string[] = []
  let list: { ordered: boolean; items: string[] } | null = null

  const flush = () => {
    if (para.length) {
      blocks.push({ kind: 'paragraph', text: para.join('\n') })
      para = []
    }
    if (quote.length) {
      // 마지막 줄이 출처 형식이면 떼어낸다
      const last = quote[quote.length - 1]
      const cite = quote.length > 1 ? last.match(CITE_RE)?.[1] : undefined
      blocks.push({ kind: 'quote', lines: cite ? quote.slice(0, -1) : quote, cite })
      quote = []
    }
    if (callout.length) {
      blocks.push({ kind: 'callout', lines: callout })
      callout = []
    }
    if (list) {
      blocks.push({ kind: 'list', ...list })
      list = null
    }
  }

  for (const raw of content.split('\n')) {
    const line = raw.trimEnd()

    if (!line.trim()) {
      flush()
      continue
    }

    const heading = line.match(HEADING_RE)
    if (heading) {
      flush()
      blocks.push({ kind: 'heading', text: heading[1].trim() })
      continue
    }

    if (DIVIDER_RE.test(line)) {
      flush()
      blocks.push({ kind: 'divider' })
      continue
    }

    const image = line.match(IMAGE_RE)
    if (image) {
      flush()
      blocks.push({ kind: 'image', url: image[1].trim(), caption: image[2]?.trim() || undefined })
      continue
    }

    const quoteLine = line.match(QUOTE_RE)
    if (quoteLine) {
      if (para.length || callout.length || list) flush()
      quote.push(quoteLine[1].trim())
      continue
    }

    const calloutLine = line.match(CALLOUT_RE)
    if (calloutLine) {
      if (para.length || quote.length || list) flush()
      callout.push(calloutLine[1].trim())
      continue
    }

    const bullet = line.match(BULLET_RE)
    const ordered = line.match(ORDERED_RE)
    if (bullet || ordered) {
      const isOrdered = !!ordered
      // 종류가 바뀌면(글머리 ↔ 번호) 새 목록으로
      if (list && list.ordered !== isOrdered) flush()
      if (para.length || quote.length || callout.length) flush()
      if (!list) list = { ordered: isOrdered, items: [] }
      list.items.push(((ordered ?? bullet) as RegExpMatchArray)[1].trim())
      continue
    }

    if (quote.length || callout.length || list) flush()
    para.push(line)
  }
  flush()
  return blocks
}

/**
 * 블록 마커와 인라인 강조를 모두 걷어낸 순수 텍스트.
 * 목록 발췌·읽기 시간·공유 전문이 같은 기준을 쓰도록 한 곳에 둔다.
 */
export const columnPlainText = (content: string): string => {
  const out: string[] = []
  for (const raw of content.split('\n')) {
    const line = raw.trim()
    if (!line) {
      out.push('')
      continue
    }
    if (DIVIDER_RE.test(line)) continue
    const image = line.match(IMAGE_RE)
    if (image) {
      if (image[2]?.trim()) out.push(image[2].trim())
      continue
    }
    const stripped =
      line.match(HEADING_RE)?.[1] ??
      line.match(QUOTE_RE)?.[1] ??
      line.match(CALLOUT_RE)?.[1] ??
      line.match(BULLET_RE)?.[1] ??
      line.match(ORDERED_RE)?.[1] ??
      line
    out.push(stripped.trim())
  }
  return removeHighlightTags(out.join('\n')).replace(/\n{3,}/g, '\n\n').trim()
}

// ── 에디터 삽입용 ────────────────────────────────────────────────
/** 서식 바가 줄머리에 붙이는 마커 (토글: 이미 있으면 걷어낸다) */
export const LINE_PREFIX = {
  heading: '## ',
  quote: '> ',
  callout: ':: ',
  bullet: '- ',
  ordered: '1. ',
} as const

export type LinePrefixKey = keyof typeof LINE_PREFIX

const PREFIX_RE: Record<LinePrefixKey, RegExp> = {
  heading: /^##\s*/,
  quote: /^>\s?/,
  callout: /^::\s?/,
  bullet: /^[-*]\s+/,
  ordered: /^\d+[.)]\s+/,
}

/** 선택된 줄들에 마커를 붙이거나(이미 전부 붙어 있으면) 떼어낸 결과 */
export const toggleLinePrefix = (text: string, key: LinePrefixKey): string => {
  const lines = text.split('\n')
  const re = PREFIX_RE[key]
  const allOn = lines.every((l) => !l.trim() || re.test(l))
  return lines
    .map((line, i) => {
      if (!line.trim()) return line
      if (allOn) return line.replace(re, '')
      // 다른 종류의 마커가 붙어 있으면 먼저 걷어내고 바꾼다
      const bare = Object.values(PREFIX_RE).reduce((acc, r) => acc.replace(r, ''), line)
      return key === 'ordered' ? `${i + 1}. ${bare}` : `${LINE_PREFIX[key]}${bare}`
    })
    .join('\n')
}

/** 이미지 블록 마커 */
export const buildImageMarkup = (url: string, caption?: string): string =>
  caption?.trim() ? `!(${url}|${caption.trim()})` : `!(${url})`
