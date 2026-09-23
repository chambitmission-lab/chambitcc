// 편지 편집기 서식 바 — 아이콘 아래에 이름을 함께 적고, PC 에서는 크게 키운다(돋보기 없이 읽히도록).
// 아이콘은 인라인 SVG(스트로크 1.8) — 아이콘 서브셋을 다시 만들지 않아도 되고,
// 앱의 선화 아이콘 문법(ActionIcons)과 톤이 맞는다.

import type { ReactNode } from 'react'
import { useEditorState, type Editor } from '@tiptap/react'
import { modKey, redoKey } from './editorKeys'

interface ColumnToolbarProps {
  language: string
  editor: Editor
  onImage: () => void
  onHighlight: () => void
  /** 업로드 중이면 사진 버튼을 잠근다 */
  uploading?: boolean
  /** 하이라이트 팝오버 — 버튼 기준으로 위치를 잡아야 해서 부모가 넘긴다 */
  highlightSlot?: ReactNode
  /** 오른쪽 끝(글자 크기 조절 등) */
  trailing?: ReactNode
}

const svgProps = {
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

const ICONS: Record<string, ReactNode> = {
  undo: <path d="M7.5 5L4 8.5 7.5 12M4.5 8.5h7a4.5 4.5 0 010 9H9" />,
  redo: <path d="M12.5 5L16 8.5 12.5 12M15.5 8.5h-7a4.5 4.5 0 000 9H11" />,
  heading: <path d="M5 4.5v11M13 4.5v11M5 10h8" />,
  quote: (
    <>
      <path d="M8 6H4.5v4H8v.6c0 1.9-1.1 3-3 3.4" />
      <path d="M15.5 6H12v4h3.5v.6c0 1.9-1.1 3-3 3.4" />
    </>
  ),
  callout: <path d="M10 3.2l1.9 4.3 4.4.5-3.3 3 .9 4.4-3.9-2.2-3.9 2.2.9-4.4-3.3-3 4.4-.5z" />,
  bullet: (
    <>
      <path d="M4.2 5.5h.01M4.2 10h.01M4.2 14.5h.01" />
      <path d="M8 5.5h8M8 10h8M8 14.5h8" />
    </>
  ),
  ordered: (
    <>
      <path d="M8 5.5h8M8 10h8M8 14.5h8" />
      <path d="M3.6 4.4l1-.5v3.2M3.2 12.2c0-1.3 2-1.1 2 0 0 .9-2 1.4-2 3h2.2" />
    </>
  ),
  divider: (
    <>
      <path d="M3.5 10h13" />
      <path d="M6.5 5.5h7M6.5 14.5h7" opacity="0.4" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4.2" width="14" height="11.6" rx="2.2" />
      <circle cx="7.6" cy="8.4" r="1.1" />
      <path d="M3.4 13.6l3.7-3.2 3.1 2.6 2.3-1.8 4.1 3.4" />
    </>
  ),
  highlight: (
    <>
      <path d="M4.5 13.2l1-3.2 5.6-5.6 2.5 2.5-5.6 5.6z" />
      <path d="M3 17h14" />
    </>
  ),
}

const Glyph = ({ name }: { name: string }) => (
  <svg {...svgProps} aria-hidden="true" className="w-[18px] h-[18px] lg:w-[22px] lg:h-[22px]">
    {ICONS[name]}
  </svg>
)

const Sep = () => <span className="w-px h-8 lg:h-10 bg-border-light dark:bg-white/[0.1] mx-1 lg:mx-2 flex-shrink-0"></span>

const ColumnToolbar = ({ language, editor, onImage, onHighlight, uploading, highlightSlot, trailing }: ColumnToolbarProps) => {
  const ko = language === 'ko'

  // 커서가 어느 블록에 있는지 — 해당 버튼을 눌린 상태로 보여 준다
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      heading: e.isActive('heading'),
      quote: e.isActive('blockquote'),
      callout: e.isActive('callout'),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      highlight: e.isActive('columnHighlight'),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  })

  const chain = () => editor.chain().focus()

  const button = (
    name: string,
    label: string,
    onClick: () => void,
    { active = false, disabled = false, title = label }: { active?: boolean; disabled?: boolean; title?: string } = {},
  ) => (
    <button
      key={name}
      type="button"
      // 클릭 순간 본문의 선택 영역을 잃지 않도록
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`flex-shrink-0 min-w-[46px] lg:min-w-[62px] px-1.5 lg:px-2 py-1 lg:py-1.5 flex flex-col items-center justify-center gap-0.5 lg:gap-1 rounded-xl transition-colors disabled:opacity-35 disabled:hover:bg-transparent ${
        active
          ? 'bg-[var(--brand-soft-strong)] text-[var(--brand)]'
          : 'text-gray-600 dark:text-gray-300 hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]'
      }`}
    >
      <Glyph name={name} />
      <span className="text-[10px] lg:text-[13px] font-semibold leading-none tracking-[-0.02em] whitespace-nowrap">{label}</span>
    </button>
  )

  return (
    <div className="flex items-center gap-0.5 lg:gap-1 overflow-x-auto lg:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="hidden lg:contents">
        {button('undo', ko ? '되돌리기' : 'Undo', () => chain().undo().run(), {
          disabled: !state.canUndo,
          title: ko ? `되돌리기 (${modKey('Z')})` : `Undo (${modKey('Z')})`,
        })}
        {button('redo', ko ? '다시' : 'Redo', () => chain().redo().run(), {
          disabled: !state.canRedo,
          title: ko ? `다시 하기 (${redoKey})` : `Redo (${redoKey})`,
        })}
        <Sep />
      </div>

      {button('heading', ko ? '소제목' : 'Heading', () => chain().toggleHeading({ level: 2 }).run(), {
        active: state.heading,
        title: ko ? '소제목 — 줄 앞에 "## " 를 쳐도 됩니다' : 'Heading — or type "## "',
      })}
      {button('quote', ko ? '인용·성구' : 'Quote', () => chain().toggleBlockquote().run(), {
        active: state.quote,
        title: ko ? '인용·성구 — 마지막 줄을 "— 시편 23:1" 처럼 쓰면 출처가 됩니다' : 'Quote — end with "— Psalm 23:1" for a citation',
      })}
      {button('callout', ko ? '강조상자' : 'Callout', () => chain().toggleCallout().run(), {
        active: state.callout,
        title: ko ? '강조 상자 — 줄 앞에 ":: " 를 쳐도 됩니다' : 'Callout — or type ":: "',
      })}

      <Sep />

      {button('bullet', ko ? '목록' : 'List', () => chain().toggleBulletList().run(), {
        active: state.bullet,
        title: ko ? '목록 — 줄 앞에 "- " 를 쳐도 됩니다' : 'Bullet list — or type "- "',
      })}
      {button('ordered', ko ? '번호목록' : 'Numbers', () => chain().toggleOrderedList().run(), {
        active: state.ordered,
        title: ko ? '번호 목록 — 줄 앞에 "1. " 을 쳐도 됩니다' : 'Numbered list — or type "1. "',
      })}
      {button('divider', ko ? '구분선' : 'Divider', () => chain().setHorizontalRule().run(), {
        title: ko ? '구분선 — "---" 를 쳐도 됩니다' : 'Divider — or type "---"',
      })}

      <Sep />

      {button('image', ko ? '사진' : 'Photo', onImage, {
        disabled: uploading,
        title: ko ? '사진 넣기 — 사진 파일을 본문에 끌어다 놓거나 붙여 넣어도 됩니다' : 'Insert photo — or drop / paste an image',
      })}

      {/* 하이라이트 팝오버 기준점 — 모바일은 가로 스크롤 서식 바라 부모(툴바 줄 전체)를 기준으로 삼는다 */}
      <div className="lg:relative flex-shrink-0">
        {button('highlight', ko ? '형광펜' : 'Highlight', onHighlight, {
          active: state.highlight,
          title: ko ? `형광펜 (${modKey('H')}) — 문구를 드래그한 뒤 누르세요` : `Highlight (${modKey('H')}) — select text first`,
        })}
        {highlightSlot}
      </div>

      {trailing && <div className="hidden lg:flex ml-auto items-center pl-3">{trailing}</div>}
    </div>
  )
}

export default ColumnToolbar
