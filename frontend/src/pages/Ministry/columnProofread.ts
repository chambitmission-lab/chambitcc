// 맞춤법·띄어쓰기 점검 — 편집기 쪽 절반.
// 1) collectProofBlocks: 본문을 문단별 평문으로 뽑는다(인용 상자·사진 제외, 글자 → 문서 위치 표 포함)
// 2) locateIssues: 서버 제안(문단 id + 원문 조각)을 문서 위치로 옮긴다
// 3) ColumnProofread 확장: 틀린 곳에 물결 밑줄(decoration)만 그린다 — 문서·저장 형식은 건드리지 않는다.
//    글을 고치면 위치를 따라 옮기고, 그 자리 글자가 원문 조각과 달라지면(고쳤거나 지웠으면) 스스로 사라진다.

import { Extension } from '@tiptap/core'
import type { Node as PMNode } from '@tiptap/pm/model'
import { Plugin, PluginKey, type EditorState, type Transaction } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { ColumnProofreadIssue, ColumnProofreadParagraph } from '../../types/column'
import { isApiError } from '../../api/utils/request'

export interface ProofIssue {
  key: string
  from: number
  to: number
  original: string
  suggestion: string
  kind: ColumnProofreadIssue['kind']
  reason: string
}

interface ProofState {
  issues: ProofIssue[]
  active: string | null
}

type ProofMeta = { type: 'set'; issues: ProofIssue[] } | { type: 'remove'; key: string } | { type: 'active'; key: string | null }

export const proofreadKey = new PluginKey<ProofState>('columnProofread')

export const getProofState = (state: EditorState): ProofState =>
  proofreadKey.getState(state) ?? { issues: [], active: null }

// ── 1) 문단 뽑기 ────────────────────────────────────────────────────

export interface ProofBlock extends ColumnProofreadParagraph {
  /** text 의 각 글자(UTF-16 단위)가 문서의 어느 위치인지 */
  map: number[]
}

/** 한 문단의 한도 — 서버 스키마와 같다 */
const MAX_BLOCK_LEN = 5000

/** 문단(소제목·강조 상자·목록 포함)을 평문으로. 인용 상자는 성경 말씀이라 보내지 않는다 */
export const collectProofBlocks = (doc: PMNode): ProofBlock[] => {
  const blocks: ProofBlock[] = []
  doc.descendants((node, pos) => {
    if (node.type.name === 'blockquote' || node.type.name === 'columnImage') return false
    if (!node.isTextblock) return true
    let text = ''
    const map: number[] = []
    node.forEach((child, offset) => {
      const at = pos + 1 + offset
      if (child.isText && child.text) {
        for (let i = 0; i < child.text.length; i++) map.push(at + i)
        text += child.text
      } else {
        // 줄바꿈은 그대로, 그 밖의 인라인 조각은 자리만 차지하는 기호로(원문 조각에 끼면 버린다)
        text += child.type.name === 'hardBreak' ? '\n' : '￼'
        map.push(at)
      }
    })
    if (text.trim() && text.length <= MAX_BLOCK_LEN) blocks.push({ id: `b${blocks.length}`, text, map })
    return false
  })
  return blocks
}

// ── 2) 제안 → 문서 위치 ─────────────────────────────────────────────

/** 문장 안 “말씀” (출처) — 인용한 성경 본문은 옛말투라 고치지 않는다 */
const quotedRanges = (text: string): Array<[number, number]> => {
  const ranges: Array<[number, number]> = []
  for (const m of text.matchAll(/[“"「『][^”"」』]*[”"」』](\s*\([^)]*\))?/g)) ranges.push([m.index!, m.index! + m[0].length])
  return ranges
}

/**
 * sent: 서버에 보낸 문단들, now: 응답이 왔을 때의 문단들.
 * 기다리는 동안 고친 문단은 글자가 달라졌으니 그 문단의 제안은 버린다(위치가 어긋나므로).
 */
export const locateIssues = (sent: ProofBlock[], now: ProofBlock[], issues: ColumnProofreadIssue[]): ProofIssue[] => {
  const sentById = new Map(sent.map((b) => [b.id, b]))
  // 같은 글의 문단이 여러 개면 순서대로 짝짓는다
  const nowByText = new Map<string, ProofBlock[]>()
  for (const b of now) nowByText.set(b.text, [...(nowByText.get(b.text) ?? []), b])
  const current = new Map<string, ProofBlock>()
  const used = new Map<string, number>()
  for (const b of sent) {
    const list = nowByText.get(b.text)
    const n = used.get(b.text) ?? 0
    if (list?.[n]) current.set(b.id, list[n])
    used.set(b.text, n + 1)
  }

  const out: ProofIssue[] = []
  for (const issue of issues) {
    const block = sentById.has(issue.id) ? current.get(issue.id) : undefined
    if (!block || /[\n￼]/.test(issue.original)) continue
    const quotes = quotedRanges(block.text)
    // 같은 조각이 문단에 여러 번 있으면 모두 표시한다(같은 글자면 같은 오류다)
    for (let idx = block.text.indexOf(issue.original); idx !== -1; idx = block.text.indexOf(issue.original, idx + issue.original.length)) {
      const end = idx + issue.original.length
      if (quotes.some(([s, e]) => idx < e && end > s)) continue
      const from = block.map[idx]
      const to = block.map[end - 1] + 1
      // 같은 자리에 겹치는 제안은 먼저 온 것만(밑줄이 두 겹으로 그려지지 않게)
      if (out.some((o) => from < o.to && to > o.from)) continue
      out.push({ key: `${from}:${to}`, from, to, original: issue.original, suggestion: issue.suggestion, kind: issue.kind, reason: issue.reason })
    }
  }
  return out.sort((a, b) => a.from - b.from)
}

// ── 고치기 ─────────────────────────────────────────────────────────

/**
 * 조각 전체를 갈아 끼우지 않고 달라진 가운데만 바꾼다 — 띄어쓰기는 공백 한 칸만 넣고 빼므로
 * 형광펜·굵게 같은 서식이 조각 일부에만 걸려 있어도 그대로 남는다.
 */
const applyOne = (tr: Transaction, issue: ProofIssue) => {
  const a = issue.original
  const b = issue.suggestion
  let p = 0
  while (p < a.length && p < b.length && a[p] === b[p]) p++
  let s = 0
  while (s < a.length - p && s < b.length - p && a[a.length - 1 - s] === b[b.length - 1 - s]) s++
  const from = issue.from + p
  const to = issue.to - s
  const insert = b.slice(p, b.length - s)
  if (insert) tr.insertText(insert, from, to)
  else tr.delete(from, to)
}

/** 여러 곳을 한 번에(되돌리기 한 번으로 모두 원래대로) — 뒤에서부터 고쳐야 앞 위치가 안 밀린다 */
export const applyIssues = (state: EditorState, issues: ProofIssue[]): Transaction => {
  const tr = state.tr
  let limit = Infinity
  for (const issue of [...issues].sort((x, y) => y.from - x.from)) {
    if (issue.to > limit) continue // 겹치는 제안은 앞의 것만
    applyOne(tr, issue)
    limit = issue.from
  }
  return tr.scrollIntoView()
}

export const setProofMeta = (tr: Transaction, meta: ProofMeta) => tr.setMeta(proofreadKey, meta)

// ── 3) 밑줄 확장 ───────────────────────────────────────────────────

export const ColumnProofread = Extension.create({
  name: 'columnProofread',
  addProseMirrorPlugins() {
    return [
      new Plugin<ProofState>({
        key: proofreadKey,
        state: {
          init: () => ({ issues: [], active: null }),
          apply: (tr, prev, _old, next) => {
            let { issues, active } = prev
            if (tr.docChanged && issues.length) {
              issues = issues
                .map((i) => ({ ...i, from: tr.mapping.map(i.from, 1), to: tr.mapping.map(i.to, -1) }))
                .filter((i) => i.to > i.from && next.doc.textBetween(i.from, i.to) === i.original)
            }
            const meta = tr.getMeta(proofreadKey) as ProofMeta | undefined
            if (meta?.type === 'set') issues = meta.issues
            if (meta?.type === 'remove') issues = issues.filter((i) => i.key !== meta.key)
            if (meta?.type === 'active') active = meta.key
            if (active && !issues.some((i) => i.key === active)) active = null
            return issues === prev.issues && active === prev.active ? prev : { issues, active }
          },
        },
        props: {
          decorations: (state) => {
            const { issues, active } = getProofState(state)
            if (!issues.length) return null
            return DecorationSet.create(
              state.doc,
              issues.map((i) =>
                Decoration.inline(i.from, i.to, {
                  class: `ce-proof ce-proof--${i.kind}${i.key === active ? ' is-active' : ''}`,
                  'data-proof': i.key,
                }),
              ),
            )
          },
          // 밑줄을 누르면 그 자리 제안 카드를 연다(커서도 그대로 옮겨 가게 false 반환)
          handleClick: (view, pos) => {
            const { issues, active } = getProofState(view.state)
            if (!issues.length) return false
            const hit = issues.find((i) => pos >= i.from && pos <= i.to)
            const key = hit?.key ?? null
            if (key !== active) view.dispatch(setProofMeta(view.state.tr, { type: 'active', key }))
            return false
          },
        },
      }),
    ]
  },
})

// ── 점검 실패 구분 ─────────────────────────────────────────────────

/**
 * limit: 무료 한도·요청 간격 소진(서버 503·429) — 잠시 뒤 또는 내일
 * timeout: 응답이 너무 늦음 / network: 인터넷 끊김 / failed: 그 밖(AI 오류·응답을 못 읽음 502 등)
 */
export type ProofreadFailure = 'limit' | 'timeout' | 'network' | 'failed'

export const proofreadFailureOf = (error: unknown): ProofreadFailure => {
  if (isApiError(error, 503) || isApiError(error, 429)) return 'limit'
  if (error instanceof DOMException && (error.name === 'AbortError' || error.name === 'TimeoutError')) return 'timeout'
  if (error instanceof TypeError || (typeof navigator !== 'undefined' && !navigator.onLine)) return 'network'
  return 'failed'
}
