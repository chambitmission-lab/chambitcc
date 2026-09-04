import type { ReactNode, RefObject } from 'react'
import {
  INLINE_MARKERS,
  insertBlock,
  toggleInlineMarker,
  toggleLinePrefix,
  type EditResult,
} from '../../../utils/noticeMarkup'
import './NoticeMarkupToolbar.css'

interface NoticeMarkupToolbarProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>
  value: string
  onChange: (next: string) => void
  disabled?: boolean
}

const svg = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

const Icon = ({ children }: { children: ReactNode }) => (
  <svg width="15" height="15" {...svg}>
    {children}
  </svg>
)

/**
 * 공지 본문 서식 툴바.
 *
 * 문법을 외우게 하지 않는 게 목적이라 버튼이 마커를 대신 넣어 준다.
 * (선택 영역이 있으면 감싸고, 이미 감싸져 있으면 벗긴다)
 */
const NoticeMarkupToolbar = ({
  textareaRef,
  value,
  onChange,
  disabled,
}: NoticeMarkupToolbarProps) => {
  const apply = (fn: (value: string, start: number, end: number) => EditResult) => {
    const el = textareaRef.current
    const start = el?.selectionStart ?? value.length
    const end = el?.selectionEnd ?? value.length
    const result = fn(value, start, end)
    onChange(result.value)
    // setState 반영 뒤에 커서를 되돌려야 한다 — 안 그러면 매번 맨 끝으로 튄다
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(result.start, result.end)
    })
  }

  const inline = (marker: string, placeholder: string) => () =>
    apply((v, s, e) => toggleInlineMarker(v, s, e, marker, placeholder))

  const linePrefix = (prefix: string, numbered = false) => () =>
    apply((v, s, e) => toggleLinePrefix(v, s, e, prefix, { numbered }))

  const block = (snippet: string, cursorOffset?: number) => () =>
    apply((v, s, e) => insertBlock(v, s, e, snippet, { cursorOffset }))

  return (
    <div className="nmt" role="group" aria-label="본문 서식">
      {/* 강조 — 색은 고르는 게 아니라 '의미'로 정해진다 */}
      <div className="nmt-group">
        <Btn
          label="강조"
          title="강조 (브랜드 색 굵게)"
          onClick={inline(INLINE_MARKERS.strong, '강조할 내용')}
          disabled={disabled}
        >
          <Icon>
            <path d="M6.5 4h6.2a4 4 0 0 1 0 8H6.5zM6.5 12h7a4 4 0 0 1 0 8h-7z" />
          </Icon>
        </Btn>
        <Btn
          label="밑줄"
          title="밑줄"
          onClick={inline(INLINE_MARKERS.underline, '밑줄 칠 내용')}
          disabled={disabled}
        >
          <Icon>
            <path d="M6.5 3.5v7a5.5 5.5 0 0 0 11 0v-7M4.5 20.5h15" />
          </Icon>
        </Btn>
        <Btn
          label="형광펜"
          title="형광펜 (배경 강조)"
          onClick={inline(INLINE_MARKERS.mark, '형광펜 칠 내용')}
          disabled={disabled}
        >
          <Icon>
            <path d="M14.5 3.5 20.5 9.5 11 19H5v-6z" />
            <path d="M3 21.5h18" />
          </Icon>
        </Btn>
        <Btn
          label="주의"
          title="주의 (빨간 굵게)"
          tone="warn"
          onClick={inline(INLINE_MARKERS.warn, '주의할 내용')}
          disabled={disabled}
        >
          <Icon>
            <path d="M10.3 3.9 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            <path d="M12 9.5v4M12 17.3h.01" />
          </Icon>
        </Btn>
      </div>

      <span className="nmt-sep" aria-hidden />

      {/* 구조 */}
      <div className="nmt-group">
        <Btn label="소제목" title="소제목" onClick={linePrefix('## ')} disabled={disabled}>
          <Icon>
            <path d="M5 4.5v15M13 4.5v15M5 12h8M17 9.5h2.5v10" />
          </Icon>
        </Btn>
        <Btn label="목록" title="글머리 목록" onClick={linePrefix('- ')} disabled={disabled}>
          <Icon>
            <path d="M9 6.5h11M9 12h11M9 17.5h11M4.2 6.5h.01M4.2 12h.01M4.2 17.5h.01" />
          </Icon>
        </Btn>
        <Btn
          label="번호"
          title="번호 목록"
          onClick={linePrefix('1. ', true)}
          disabled={disabled}
        >
          <Icon>
            <path d="M10 6.5h10M10 12h10M10 17.5h10M4 5.2h1v3.6M3.4 15.5a1.3 1.3 0 1 1 2.2 1L3.4 19h2.4" />
          </Icon>
        </Btn>
        <Btn label="구분선" title="구분선" onClick={block('---')} disabled={disabled}>
          <Icon>
            <path d="M3.5 12h17" />
          </Icon>
        </Btn>
      </div>

      <span className="nmt-sep" aria-hidden />

      {/* 카드 — 여기서 임팩트가 난다 */}
      <div className="nmt-group">
        <Btn
          label="안내"
          title="안내 카드"
          tone="info"
          onClick={block('> [!안내] ')}
          disabled={disabled}
        >
          <Icon>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5M12 7.8h.01" />
          </Icon>
        </Btn>
        <Btn
          label="주의 카드"
          title="주의 카드"
          tone="warn"
          onClick={block('> [!주의] ')}
          disabled={disabled}
        >
          <Icon>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5v5M12 16.3h.01" />
          </Icon>
        </Btn>
        <Btn
          label="축하 카드"
          title="축하 카드"
          tone="celebrate"
          onClick={block('> [!축하] ')}
          disabled={disabled}
        >
          <Icon>
            <path d="M11.5 2.5 13.4 7l4.9.4-3.7 3.2 1.1 4.8-4.2-2.6-4.2 2.6 1.1-4.8L4.7 7.4 9.6 7z" />
          </Icon>
        </Btn>
        <Btn
          label="일시·장소"
          title="일시·장소 정보 넣기"
          onClick={block('일시: \n장소: \n문의: ', 4)}
          disabled={disabled}
        >
          <Icon>
            <rect x="3" y="4.5" width="18" height="16" rx="3" />
            <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
          </Icon>
        </Btn>
      </div>
    </div>
  )
}

interface BtnProps {
  label: string
  title: string
  onClick: () => void
  disabled?: boolean
  tone?: 'info' | 'warn' | 'celebrate'
  children: ReactNode
}

const Btn = ({ label, title, onClick, disabled, tone, children }: BtnProps) => (
  <button
    type="button"
    // 버튼을 눌러도 textarea의 선택 영역이 풀리지 않게 한다
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    disabled={disabled}
    title={title}
    aria-label={title}
    className={`nmt-btn${tone ? ` nmt-btn--${tone}` : ''}`}
  >
    {children}
    <span className="nmt-btn-label">{label}</span>
  </button>
)

export default NoticeMarkupToolbar
