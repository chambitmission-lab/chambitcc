// 편지 본문 문자열(블록 마커 문법) ↔ Tiptap 문서 변환.
// 편집기는 WYSIWYG 이지만 저장 형식은 지금까지와 같은 plain text 라서
// 백엔드·읽기 화면(ColumnLetter)·발췌·공유가 하나도 바뀌지 않는다.
//
//   heading(2)      ↔ ## 소제목
//   blockquote      ↔ > 줄 (마지막 줄 "— 출처")
//   callout         ↔ :: 줄
//   horizontalRule  ↔ ---
//   columnImage     ↔ !(url|캡션)
//   bullet/ordered  ↔ - 항목 / 1. 항목
//   paragraph       ↔ 빈 줄로 나뉜 문단, 문단 안 줄바꿈(Shift+Enter) = hardBreak
//   centered para   ↔ -> 줄 <-
//   bold/italic/underline/strike ↔ **굵게** _기울임_ ++밑줄++ ~~취소선~~
//   columnHighlight ↔ [[문구|색|스타일|bold]]

import type { JSONContent } from '@tiptap/core'
import type { Node as PMNode } from '@tiptap/pm/model'
import { parseColumnBlocks } from './blockFormat'
import {
  buildHighlightMarkup,
  parseInline,
  wrapInlineMarks,
  type HighlightOptions,
  type InlineMarks,
} from './highlightMarkup'

const FORMAT_MARKS = ['bold', 'italic', 'underline', 'strike'] as const

// ── 문자열 → 문서 ─────────────────────────────────────────────────
const textNodes = (text: string, marks?: JSONContent['marks']): JSONContent[] => {
  const out: JSONContent[] = []
  text.split('\n').forEach((part, i) => {
    if (i > 0) out.push({ type: 'hardBreak' })
    if (part) out.push(marks ? { type: 'text', text: part, marks } : { type: 'text', text: part })
  })
  return out
}

const inline = (text: string): JSONContent[] =>
  parseInline(text).flatMap(({ text: t, marks, highlight }) => {
    const pm: NonNullable<JSONContent['marks']> = FORMAT_MARKS.filter((k) => marks[k]).map((type) => ({ type }))
    if (highlight) pm.push({ type: 'columnHighlight', attrs: { ...highlight } })
    return textNodes(t, pm.length ? pm : undefined)
  })

const paragraph = (text: string, attrs?: Record<string, unknown>): JSONContent => {
  const content = inline(text)
  return { type: 'paragraph', ...(attrs ? { attrs } : {}), ...(content.length ? { content } : {}) }
}

export const markupToDoc = (content: string): JSONContent => {
  const blocks: JSONContent[] = parseColumnBlocks(content || '').map((block) => {
    switch (block.kind) {
      case 'heading':
        return { type: 'heading', attrs: { level: 2 }, content: inline(block.text) }
      case 'paragraph':
        return paragraph(block.text)
      case 'center':
        return paragraph(block.text, { textAlign: 'center' })
      case 'quote':
        return {
          type: 'blockquote',
          content: [...block.lines.map((l) => paragraph(l)), ...(block.cite ? [paragraph(`— ${block.cite}`)] : [])],
        }
      case 'callout':
        return { type: 'callout', content: block.lines.map((l) => paragraph(l)) }
      case 'divider':
        return { type: 'horizontalRule' }
      case 'image':
        return { type: 'columnImage', attrs: { src: block.url, caption: block.caption ?? '' } }
      case 'list':
        return {
          type: block.ordered ? 'orderedList' : 'bulletList',
          content: block.items.map((item) => ({ type: 'listItem', content: [paragraph(item)] })),
        }
    }
  })
  return { type: 'doc', content: blocks.length ? blocks : [{ type: 'paragraph' }] }
}

// ── 문서 → 문자열 ─────────────────────────────────────────────────
/**
 * 텍스트 블록 하나의 인라인 내용 → 마커 문자열.
 * 같은 형광펜이 이어진 조각은 한 토큰으로 묶고, 그 안에서 같은 글자 서식이 이어진 조각을 다시 묶는다.
 */
const inlineMarkup = (node: PMNode): string => {
  type Piece = { text: string; marks: InlineMarks; key: string }
  const runs: { pieces: Piece[]; opt: HighlightOptions | null; key: string }[] = []
  node.forEach((child) => {
    // 서식·강조는 줄바꿈에서 끊는다 — 읽기 화면은 서식 태그 안의 개행을 살리지 못한다
    const isBreak = child.type.name === 'hardBreak'
    const text = child.isText ? child.text ?? '' : isBreak ? '\n' : ''
    if (!text) return
    const has = (name: string) => !isBreak && child.marks.some((m) => m.type.name === name)
    const hl = isBreak ? undefined : child.marks.find((m) => m.type.name === 'columnHighlight')
    const opt = hl ? (hl.attrs as HighlightOptions) : null
    const hlKey = opt ? `${opt.color}|${opt.style}|${opt.bold}` : ''
    const marks: InlineMarks = {}
    FORMAT_MARKS.forEach((k) => {
      if (has(k)) marks[k] = true
    })
    const markKey = FORMAT_MARKS.filter((k) => marks[k]).join(',')

    let run = runs[runs.length - 1]
    if (!run || run.key !== hlKey) {
      run = { pieces: [], opt, key: hlKey }
      runs.push(run)
    }
    const last = run.pieces[run.pieces.length - 1]
    if (last && last.key === markKey) last.text += text
    else run.pieces.push({ text, marks, key: markKey })
  })
  return runs
    .map((r) => {
      const inner = r.pieces.map((p) => wrapInlineMarks(p.text, p.marks)).join('')
      return r.opt && inner.trim() ? buildHighlightMarkup(inner, r.opt) : inner
    })
    .join('')
}

/** 블록 안의 모든 텍스트 블록을 줄 단위로 (인용·강조 상자·목록용) */
const collectLines = (node: PMNode): string[] => {
  const lines: string[] = []
  node.descendants((child) => {
    if (!child.isTextblock) return true
    inlineMarkup(child)
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((l) => lines.push(l))
    return false
  })
  return lines
}

const blockMarkup = (node: PMNode): string | null => {
  switch (node.type.name) {
    case 'paragraph': {
      const text = inlineMarkup(node).replace(/\s+$/, '')
      if (!text.trim()) return null
      if (node.attrs.textAlign === 'center') {
        return text
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
          .map((l) => `-> ${l} <-`)
          .join('\n')
      }
      return text
    }
    case 'heading': {
      const text = inlineMarkup(node).replace(/\n/g, ' ').trim()
      return text ? `## ${text}` : null
    }
    case 'blockquote': {
      const lines = collectLines(node)
      return lines.length ? lines.map((l) => `> ${l}`).join('\n') : null
    }
    case 'callout': {
      const lines = collectLines(node)
      return lines.length ? lines.map((l) => `:: ${l}`).join('\n') : null
    }
    case 'bulletList':
    case 'orderedList': {
      const ordered = node.type.name === 'orderedList'
      // 목록 항목은 한 줄 — 항목 안 줄바꿈·중첩 목록은 같은 목록의 다음 항목으로 편다
      const items: string[] = []
      node.descendants((child) => {
        if (!child.isTextblock) return true
        const text = inlineMarkup(child).replace(/\n/g, ' ').trim()
        if (text) items.push(text)
        return false
      })
      return items.length ? items.map((t, i) => (ordered ? `${i + 1}. ${t}` : `- ${t}`)).join('\n') : null
    }
    case 'horizontalRule':
      return '---'
    case 'columnImage': {
      const src = String(node.attrs.src || '')
      if (!src) return null
      // 캡션 속 ')'·'|'는 마커를 끊으므로 비슷한 전각 문자로 바꾼다
      const caption = String(node.attrs.caption || '').replace(/\)/g, '）').replace(/\|/g, '｜').trim()
      return caption ? `!(${src}|${caption})` : `!(${src})`
    }
    default:
      return null
  }
}

export const docToMarkup = (doc: PMNode): string => {
  const out: string[] = []
  doc.forEach((node) => {
    const md = blockMarkup(node)
    if (md) out.push(md)
  })
  return out.join('\n\n')
}
