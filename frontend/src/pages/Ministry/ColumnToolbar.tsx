// 본문 서식 바 — 줄머리 마커를 손으로 외우지 않아도 되게 한다.
// 아이콘은 인라인 SVG(스트로크 1.8) — 아이콘 서브셋을 다시 만들지 않아도 되고,
// 앱의 선화 아이콘 문법(ActionIcons)과 톤이 맞는다.

import type { ReactNode } from 'react'
import type { LinePrefixKey } from './blockFormat'

interface ColumnToolbarProps {
  language: string
  onPrefix: (key: LinePrefixKey) => void
  onDivider: () => void
  onImage: () => void
  onHighlight: () => void
  /** 업로드 중이면 사진 버튼을 잠근다 */
  uploading?: boolean
  /** 하이라이트 팝오버 — 버튼 기준으로 위치를 잡아야 해서 부모가 넘긴다 */
  highlightSlot?: ReactNode
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
  <svg width="18" height="18" {...svgProps} aria-hidden="true">
    {ICONS[name]}
  </svg>
)

const ColumnToolbar = ({
  language,
  onPrefix,
  onDivider,
  onImage,
  onHighlight,
  uploading,
  highlightSlot,
}: ColumnToolbarProps) => {
  const ko = language === 'ko'

  /* 아이콘만으로는 무슨 서식인지 알기 어려워 아래에 이름을 함께 적는다.
     label 은 짧은 표시용, title 은 단축키까지 담은 툴팁. */
  const button = (
    name: string,
    label: string,
    onClick: () => void,
    disabled = false,
    title = label,
  ) => (
    <button
      key={name}
      type="button"
      // 클릭 순간 textarea 의 선택 영역을 잃지 않도록
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className="min-w-[46px] px-1.5 py-1 flex flex-col items-center justify-center gap-0.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-[var(--brand-soft)] hover:text-[var(--brand)] disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
    >
      <Glyph name={name} />
      <span className="text-[10px] font-semibold leading-none tracking-[-0.02em]">{label}</span>
    </button>
  )

  return (
    <div className="sticky top-0 z-20 -mx-1 px-1 py-2 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md flex items-center gap-0.5 flex-wrap">
      {button('heading', ko ? '소제목' : 'Heading', () => onPrefix('heading'))}
      {button('quote', ko ? '인용·성구' : 'Quote', () => onPrefix('quote'))}
      {button('callout', ko ? '강조상자' : 'Callout', () => onPrefix('callout'))}

      <span className="w-px h-8 bg-border-light dark:bg-white/[0.1] mx-1.5"></span>

      {button('bullet', ko ? '목록' : 'List', () => onPrefix('bullet'), false, ko ? '목록' : 'Bullet list')}
      {button('ordered', ko ? '번호목록' : 'Numbers', () => onPrefix('ordered'), false, ko ? '번호 목록' : 'Numbered list')}
      {button('divider', ko ? '구분선' : 'Divider', onDivider)}

      <span className="w-px h-8 bg-border-light dark:bg-white/[0.1] mx-1.5"></span>

      {button('image', ko ? '사진' : 'Photo', onImage, uploading, ko ? '사진 넣기' : 'Insert photo')}

      {/* 하이라이트는 팝오버를 달고 있어 감싸는 relative 가 필요하다 */}
      <div className="relative">
        {button(
          'highlight',
          ko ? '형광펜' : 'Highlight',
          onHighlight,
          false,
          ko ? '형광펜 (⌘H)' : 'Highlight (⌘H)',
        )}
        {highlightSlot}
      </div>
    </div>
  )
}

export default ColumnToolbar
