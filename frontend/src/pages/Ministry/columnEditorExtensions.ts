// 편지 편집기(Tiptap) 스키마 — 저장 형식(블록 마커 문법)으로 되돌릴 수 있는 것만 허용한다.
// 링크·코드·표처럼 마커로 표현할 수 없는 서식은 아예 끈다(저장하면 조용히 사라지므로).
// 굵게·기울임·밑줄·취소선·가운데 정렬은 highlightMarkup / blockFormat 에 기호가 있어 켠다.

import { Extension, Mark, Node, mergeAttributes, wrappingInputRule } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extensions'
import TextAlign from '@tiptap/extension-text-align'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { CSSProperties } from 'react'
import { DEFAULT_HIGHLIGHT, highlightStyle, type HighlightOptions } from './highlightMarkup'
import ColumnImageView from './ColumnImageView'
import { VerseSuggestion, type VerseSuggestBridge } from './verseSuggestion'
import { ColumnProofread } from './columnProofread'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      toggleCallout: () => ReturnType
    }
    columnImage: {
      insertColumnImage: (attrs: { src: string; caption?: string }) => ReturnType
    }
  }
}

/** React 스타일 객체 → style 속성 문자열 */
const toCssText = (style: CSSProperties): string =>
  Object.entries(style)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}:${v}`)
    .join(';')

/** [[문구|색|스타일|bold]] — 읽기 화면과 같은 highlightStyle 로 그린다 */
export const ColumnHighlight = Mark.create({
  name: 'columnHighlight',
  inclusive: false,

  addAttributes() {
    return {
      color: { default: DEFAULT_HIGHLIGHT.color },
      style: { default: DEFAULT_HIGHLIGHT.style },
      bold: { default: DEFAULT_HIGHLIGHT.bold },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-col-hl]',
        getAttrs: (el) => ({
          color: el.getAttribute('data-color') || DEFAULT_HIGHLIGHT.color,
          style: el.getAttribute('data-style') || DEFAULT_HIGHLIGHT.style,
          bold: el.getAttribute('data-bold') === 'true',
        }),
      },
    ]
  },

  renderHTML({ mark }) {
    const opt = mark.attrs as HighlightOptions
    return [
      'span',
      {
        'data-col-hl': '',
        'data-color': opt.color,
        'data-style': opt.style,
        'data-bold': String(opt.bold),
        class: 'ce-hl',
        style: toCssText(highlightStyle(opt)),
      },
      0,
    ]
  },
})

/** :: 강조 상자 — 문단 여러 줄을 한 상자로 */
export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'paragraph+',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-callout]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-callout': '', class: 'ce-callout' }), 0]
  },

  addCommands() {
    return {
      toggleCallout:
        () =>
        ({ commands }) =>
          commands.toggleWrap(this.name),
    }
  },

  // 줄머리에 ":: " 를 치면 바로 상자로
  addInputRules() {
    return [wrappingInputRule({ find: /^::\s$/, type: this.type })]
  },
})

/** !(url|캡션) 사진 — 캡션은 사진 아래 입력칸에서 바로 고친다 */
export const ColumnImage = Node.create({
  name: 'columnImage',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: '' },
      caption: { default: '' },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-col-img]',
        getAttrs: (el) => ({
          src: el.querySelector('img')?.getAttribute('src') || '',
          caption: el.querySelector('figcaption')?.textContent || '',
        }),
      },
    ]
  },

  renderHTML({ node }) {
    return [
      'figure',
      { 'data-col-img': '' },
      ['img', { src: node.attrs.src, alt: node.attrs.caption }],
      ['figcaption', {}, node.attrs.caption],
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ColumnImageView)
  },

  addCommands() {
    return {
      insertColumnImage:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { caption: '', ...attrs } }),
    }
  },
})

/**
 * 인용의 마지막 줄이 "— 시편 23:1" 이면 읽기 화면은 출처로 작게 그린다.
 * 편집기에서도 같은 모습이 보이도록 그 문단에 is-cite 클래스를 붙인다.
 */
const CiteDecoration = Extension.create({
  name: 'columnCiteDecoration',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('columnCiteDecoration'),
        props: {
          decorations: (state) => {
            const decos: Decoration[] = []
            state.doc.descendants((node, pos) => {
              if (node.type.name !== 'blockquote') return !node.isTextblock
              const last = node.lastChild
              if (node.childCount > 1 && last && /^[—–-]\s*\S/.test(last.textContent)) {
                let offset = pos + 1
                for (let i = 0; i < node.childCount - 1; i++) offset += node.child(i).nodeSize
                decos.push(Decoration.node(offset, offset + last.nodeSize, { class: 'is-cite' }))
              }
              return false
            })
            return DecorationSet.create(state.doc, decos)
          },
        },
      }),
    ]
  },
})

/**
 * 엔터 = 한 줄 아래로(문단 안 줄바꿈), 엔터 두 번 = 새 문단(문단 사이 간격).
 * 예전 입력칸·저장 형식(빈 줄 = 문단 나눔)과 같은 감각 — 기본 동작(엔터마다 새 문단)은
 * 칠 때마다 한 줄씩 건너뛰는 것처럼 보인다. 본문 최상위 문단에서만 바꾸고,
 * 소제목·목록·인용·강조 상자 안에서는 원래 동작을 그대로 둔다.
 */
const EnterAsLineBreak = Extension.create({
  name: 'columnEnterAsLineBreak',
  priority: 1000,
  addKeyboardShortcuts() {
    const isTopParagraph = () => {
      const { $from, empty } = this.editor.state.selection
      return empty && $from.depth === 1 && $from.parent.type.name === 'paragraph'
    }
    return {
      Enter: () => {
        if (!isTopParagraph()) return false
        const { $from } = this.editor.state.selection
        // 빈 줄·줄 맨 앞에서는 기본 동작(문단 나눔)
        if ($from.parentOffset === 0) return false
        const before = $from.nodeBefore
        if (before?.type.name === 'hardBreak') {
          // 두 번째 엔터 — 방금 넣은 줄바꿈을 걷어내고 문단을 나눈다
          const pos = $from.pos
          return this.editor
            .chain()
            .command(({ tr }) => {
              tr.delete(pos - before.nodeSize, pos)
              return true
            })
            .splitBlock()
            .scrollIntoView()
            .run()
        }
        return this.editor.chain().setHardBreak().scrollIntoView().run()
      },
      // 바로 새 문단을 만들고 싶을 때
      'Shift-Enter': () => (isTopParagraph() ? this.editor.chain().splitBlock().scrollIntoView().run() : false),
      // ⌘Enter 는 저장 단축키 — 줄바꿈이 끼어들지 않게 삼킨다(저장은 모달이 처리)
      'Mod-Enter': () => true,
    }
  },
})

export const buildColumnExtensions = (
  placeholder: string,
  verseBridge: { current: VerseSuggestBridge | null } = { current: null },
) => [
  StarterKit.configure({
    heading: { levels: [2] },
    code: false,
    codeBlock: false,
    link: false,
  }),
  Placeholder.configure({
    // 빈 편지일 때만 안내 문구를 띄운다 — 중간의 빈 줄마다 긴 문구가 뜨면 시끄럽다
    placeholder: ({ editor }) => (editor.isEmpty ? placeholder : ''),
  }),
  // 가운데 정렬은 본문 문단만 — 저장 형식(-> 줄 <-)이 문단에만 있다
  TextAlign.configure({ types: ['paragraph'], alignments: ['left', 'center'], defaultAlignment: 'left' }),
  ColumnHighlight,
  Callout,
  ColumnImage,
  CiteDecoration,
  EnterAsLineBreak,
  VerseSuggestion.configure({ bridge: verseBridge }),
  ColumnProofread,
]
