import { Fragment, type ReactNode } from 'react'
import {
  CALLOUT_LABELS,
  flattenNoticeMarkup,
  parseInline,
  parseNoticeBlocks,
  type CalloutTone,
  type InfoIcon,
} from '../../utils/noticeMarkup'
import './NoticeContent.css'

/* ------------------------------------------------------------------ */
/* 아이콘                                                              */
/* ------------------------------------------------------------------ */

const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.1,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

const INFO_ICON_PATHS: Record<InfoIcon, ReactNode> = {
  calendar: (
    <>
      <rect x="3" y="4.5" width="18" height="16" rx="3" />
      <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
    </>
  ),
  place: (
    <>
      <path d="M12 21.5s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z" />
      <circle cx="12" cy="10.5" r="2.5" />
    </>
  ),
  people: (
    <>
      <path d="M16.5 20v-1.6a4 4 0 0 0-4-4h-5a4 4 0 0 0-4 4V20" />
      <circle cx="10" cy="7.5" r="3.4" />
      <path d="M21 20v-1.6a4 4 0 0 0-3-3.87M16.5 4.3a4 4 0 0 1 0 7.4" />
    </>
  ),
  kit: (
    <>
      <path d="M20.5 8.5v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-9" />
      <rect x="2" y="4" width="20" height="4.5" rx="1.5" />
      <path d="M10 12.5h4" />
    </>
  ),
  phone: (
    <path d="M21 16.9v2.6a1.8 1.8 0 0 1-2 1.8 17.6 17.6 0 0 1-7.7-2.7 17.3 17.3 0 0 1-5.3-5.3A17.6 17.6 0 0 1 3.3 5.6 1.8 1.8 0 0 1 5.1 3.6h2.6a1.8 1.8 0 0 1 1.8 1.6c.1.9.3 1.7.6 2.5a1.8 1.8 0 0 1-.4 1.9l-1.1 1.1a14 14 0 0 0 5.3 5.3l1.1-1.1a1.8 1.8 0 0 1 1.9-.4c.8.3 1.6.5 2.5.6a1.8 1.8 0 0 1 1.6 1.8z" />
  ),
  won: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M7.6 9.2l1.8 5.6 2.6-4.6 2.6 4.6 1.8-5.6M6.6 11.8h10.8" />
    </>
  ),
  pen: (
    <>
      <path d="M12 20h8" />
      <path d="M16.5 3.9a2.1 2.1 0 0 1 3 3L8.4 18.1l-4 1 1-4z" />
    </>
  ),
}

const CALLOUT_ICON_PATHS: Record<CalloutTone, ReactNode> = {
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 7.8h.01" />
    </>
  ),
  warn: (
    <>
      <path d="M10.3 3.9 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9.5v4M12 17.3h.01" />
    </>
  ),
  celebrate: (
    <>
      <path d="M11.5 2.5 13.4 7l4.9.4-3.7 3.2 1.1 4.8-4.2-2.6-4.2 2.6 1.1-4.8L4.7 7.4 9.6 7z" />
      <path d="M18.5 16.5v4M16.5 18.5h4" />
    </>
  ),
}

/* ------------------------------------------------------------------ */
/* 인라인 렌더                                                         */
/* ------------------------------------------------------------------ */

const renderInline = (text: string, keyPrefix: string): ReactNode[] =>
  parseInline(text).map((token, i) => {
    const key = `${keyPrefix}-${i}`
    switch (token.kind) {
      case 'strong':
        return (
          <strong key={key} className="nm-strong">
            {token.text}
          </strong>
        )
      case 'underline':
        return (
          <span key={key} className="nm-u">
            {token.text}
          </span>
        )
      case 'mark':
        return (
          <mark key={key} className="nm-mark">
            {token.text}
          </mark>
        )
      case 'warn':
        return (
          <strong key={key} className="nm-warn">
            {token.text}
          </strong>
        )
      default:
        return <Fragment key={key}>{token.text}</Fragment>
    }
  })

/** 여러 줄을 <br>로 이어 붙인다 (문단 안의 수동 줄바꿈 보존) */
const renderLines = (lines: string[], keyPrefix: string): ReactNode[] =>
  lines.map((line, i) => (
    <Fragment key={`${keyPrefix}-l${i}`}>
      {renderInline(line, `${keyPrefix}-l${i}`)}
      {i < lines.length - 1 && <br />}
    </Fragment>
  ))

/* ------------------------------------------------------------------ */
/* 공개 컴포넌트                                                       */
/* ------------------------------------------------------------------ */

interface NoticeContentProps {
  source: string
  /** 알림함 리스트처럼 좁은 자리에서 한 단계 작게 */
  compact?: boolean
  className?: string
  style?: React.CSSProperties
}

/** 공지 본문 — 경량 마크업을 카드/정보 박스/콜아웃으로 렌더 */
const NoticeContent = ({ source, compact, className, style }: NoticeContentProps) => {
  const blocks = parseNoticeBlocks(source)

  return (
    <div
      className={`nm${compact ? ' nm--compact' : ''}${className ? ` ${className}` : ''}`}
      style={style}
    >
      {blocks.map((block, i) => {
        const key = `b${i}`
        switch (block.type) {
          case 'heading':
            return block.level === 2 ? (
              <h2 key={key} className="nm-h2">
                {renderInline(block.text, key)}
              </h2>
            ) : (
              <h3 key={key} className="nm-h3">
                {renderInline(block.text, key)}
              </h3>
            )

          case 'paragraph':
            return (
              <p key={key} className="nm-p">
                {renderLines(block.lines, key)}
              </p>
            )

          case 'bullet':
            return (
              <ul key={key} className="nm-list">
                {block.items.map((item, j) => (
                  <li key={`${key}-${j}`} className="nm-li">
                    {renderInline(item, `${key}-${j}`)}
                  </li>
                ))}
              </ul>
            )

          case 'ordered':
            return (
              <ol key={key} className="nm-list">
                {block.items.map((item, j) => (
                  <li
                    key={`${key}-${j}`}
                    className="nm-li nm-li--num"
                    data-num={`${j + 1}.`}
                  >
                    {renderInline(item, `${key}-${j}`)}
                  </li>
                ))}
              </ol>
            )

          case 'quote':
            return (
              <blockquote key={key} className="nm-quote">
                {renderLines(block.lines, key)}
              </blockquote>
            )

          case 'callout':
            return (
              <div key={key} className={`nm-callout nm-callout--${block.tone}`}>
                <svg className="nm-callout-icon" {...svgProps}>
                  {CALLOUT_ICON_PATHS[block.tone]}
                </svg>
                <div className="nm-callout-body">
                  <span className="nm-callout-label">
                    {CALLOUT_LABELS[block.tone]}
                  </span>
                  {renderLines(block.lines, key)}
                </div>
              </div>
            )

          case 'info':
            return (
              <div key={key} className="nm-info">
                {block.rows.map((row, j) => (
                  <div key={`${key}-${j}`} className="nm-info-row">
                    <span className="nm-info-icon">
                      <svg width="14" height="14" {...svgProps}>
                        {INFO_ICON_PATHS[row.icon]}
                      </svg>
                    </span>
                    <span className="nm-info-text">
                      <span className="nm-info-label">{row.label}</span>
                      <span className="nm-info-value">
                        {renderInline(row.value, `${key}-${j}`)}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )

          case 'divider':
            return <hr key={key} className="nm-hr" />

          default:
            return null
        }
      })}
    </div>
  )
}

/**
 * 블록을 평평하게 눕히고 인라인 강조만 살린 한 덩어리.
 * `-webkit-line-clamp`가 걸린 리스트 미리보기처럼 인라인이어야 하는 자리에 쓴다.
 */
export const NoticeInline = ({ source }: { source: string }) => (
  <>{renderInline(flattenNoticeMarkup(source), 'inline')}</>
)

export default NoticeContent
