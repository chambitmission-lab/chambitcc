// 글을 쓰다 "빌 4:7" 처럼 성구를 치면 그 자리에서 말씀을 넣자고 제안한다.
// 커서 바로 앞 글자가 성구 표기일 때만 켜지고, 계속 쓰면(뒤에 글자가 붙으면) 저절로 사라진다.
// 목록·말씀을 그리는 건 React(VerseSuggestCard) 몫 — 여기서는 범위를 찾아 다리(bridge)로 넘기기만 한다.

import { Extension, type Range } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import { PluginKey } from '@tiptap/pm/state'
import { parseBibleReference } from '../Sermon/utils/sermonMeta'

export interface VerseSuggestState {
  /** 바꿔 넣을 범위 — 성구 표기(앞 여는 괄호 포함) */
  range: Range
  /** 입력된 성구 표기 그대로 ("빌 4:7") */
  query: string
  /** 범위 앞에 여는 괄호가 딸려 있는지 */
  withParen: boolean
  clientRect: (() => DOMRect | null) | null | undefined
}

export interface VerseSuggestBridge {
  update: (state: VerseSuggestState | null) => void
  /** Tab — 말씀이 준비됐으면 넣고 true */
  accept: () => boolean
}

/* 커서 바로 앞이 "책 장:절" 로 끝나는지. 장만 적은 "3장"·"23편" 류는 제안하지 않는다(절이 있어야 말씀을 고를 수 있다).
 * 앞은 줄 머리·공백·여는 괄호·따옴표여야 한다 — "말씀은빌 4:7" 처럼 붙은 말은 책 이름으로 보지 않는다. */
const REF_TAIL_RE =
  /(^|[\s(（“"'‘])([가-힣]{1,8}[123]?[가-힣]{0,2}\s?\d{1,3}\s?(?::|[장편]\s?)\s?\d{1,3}(?:\s?[-~–]\s?\d{1,3})?절?)$/

export const verseSuggestionKey = new PluginKey('columnVerseSuggestion')

export const VerseSuggestion = Extension.create<{ bridge: { current: VerseSuggestBridge | null } }>({
  name: 'columnVerseSuggestion',

  addOptions() {
    return { bridge: { current: null } }
  },

  addProseMirrorPlugins() {
    const bridge = this.options.bridge
    return [
      Suggestion({
        editor: this.editor,
        pluginKey: verseSuggestionKey,
        char: '',
        decorationClass: 'ce-verse-ref',
        findSuggestionMatch: ({ $position }) => {
          const parent = $position.parent
          if (!parent.isTextblock) return null
          const offset = $position.parentOffset
          // 줄바꿈 같은 비문자 노드도 한 칸으로 세어야 위치 계산이 맞는다
          const before = parent.textBetween(Math.max(0, offset - 40), offset, undefined, '￼')
          const m = before.match(REF_TAIL_RE)
          if (!m) return null
          // 시편은 "23편 1절" 로도 쓴다 — 참조 해석기는 '장'·':' 만 알아본다
          const ref = parseBibleReference(m[2].replace(/(\d)\s?편/, '$1장'))
          if (!ref?.bookNumber || ref.verse == null) return null
          const withParen = m[1] === '(' || m[1] === '（'
          const len = m[2].length + (withParen ? 1 : 0)
          return { range: { from: $position.pos - len, to: $position.pos }, query: m[2], text: m[2] }
        },
        // 인용 상자 안(출처 줄 "— 빌 4:7" 등)에서는 제안하지 않는다
        allow: ({ state, range }) => {
          const $from = state.doc.resolve(range.from)
          for (let d = $from.depth; d > 0; d--) if ($from.node(d).type.name === 'blockquote') return false
          return true
        },
        items: () => [],
        render: () => {
          const push = (p: { range: Range; query: string; clientRect?: (() => DOMRect | null) | null }) => {
            const doc = this.editor.state.doc
            const withParen = /^[(（]/.test(doc.textBetween(p.range.from, Math.min(p.range.to, p.range.from + 1)))
            bridge.current?.update({ range: p.range, query: p.query, withParen, clientRect: p.clientRect })
          }
          return {
            onStart: push,
            onUpdate: push,
            onExit: () => bridge.current?.update(null),
            // Tab 은 제안이 떠 있는 동안 늘 가로챈다 — 말씀을 불러오는 중에 눌러도 커서가 편집기 밖으로 나가지 않게
            onKeyDown: ({ event }) => {
              if (event.key !== 'Tab') return false
              bridge.current?.accept()
              return true
            },
          }
        },
      }),
    ]
  },
})
