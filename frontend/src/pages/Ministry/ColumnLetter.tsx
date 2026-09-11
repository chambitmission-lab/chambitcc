// 편지 본문 한 통 — 표지 사진·날짜·제목·본문 블록·서명까지.
// 읽기 모달과 편집기 미리보기가 이 컴포넌트 하나를 공유하므로,
// "미리보기에서 본 그대로 성도에게 보인다"가 구조적으로 보장된다.

import type { ReactNode } from 'react'
import type { Column } from '../../types/column'
import andongProfile from '../../assets/andong.webp'
import { renderHighlightedText } from './highlightMarkup'
import { parseColumnBlocks, type ColumnBlock } from './blockFormat'
import { PEN, SERIF, formatLetterDate, readingLabel } from './letterFormat'

interface ColumnLetterProps {
  language: string
  column: Partial<Column>
  /** 본문 글자 크기(px) — 읽기 화면의 3단계 설정을 그대로 받는다 */
  fontSize: number
  /** 미리보기는 서명까지 보여주되 빈 값이면 자리표시자를 쓴다 */
  placeholder?: boolean
}

/**
 * 문단 안의 줄바꿈(엔터 한 번)을 <br>로 살린다.
 * HTML은 문자열 속 개행을 공백으로 접어 버리므로, 이걸 안 하면 편지에서
 * 엔터를 한 번 친 자리가 통째로 사라진다(엔터 두 번 = 문단 나누기는 그대로).
 * 강조 토큰을 먼저 span으로 바꾼 뒤 남은 문자열만 쪼개야 여러 줄에 걸친 [[강조]]가 깨지지 않는다.
 */
const withLineBreaks = (nodes: ReactNode[]): ReactNode[] => {
  const out: ReactNode[] = []
  nodes.forEach((node, i) => {
    if (typeof node !== 'string') {
      out.push(node)
      return
    }
    node.split('\n').forEach((part, j) => {
      if (j > 0) out.push(<br key={`br-${i}-${j}`} />)
      out.push(part)
    })
  })
  return out
}

/** 블록 하나 → 마크업. 크기는 본문 기준 글자 크기에서 파생시킨다 */
const renderBlock = (block: ColumnBlock, index: number, fontSize: number) => {
  switch (block.kind) {
    case 'heading':
      return (
        <h3
          key={index}
          className="font-semibold text-ink-strong tracking-[-0.02em] leading-[1.5] mt-11 mb-4 first:mt-0"
          style={{ fontFamily: SERIF, fontSize: `${fontSize + 3}px` }}
        >
          {renderHighlightedText(block.text)}
        </h3>
      )

    case 'quote':
      return (
        <blockquote
          key={index}
          className="my-8 border-l-2 pl-5 py-0.5"
          style={{ borderColor: 'var(--brand-muted)' }}
        >
          {block.lines.map((line, i) => (
            <p
              key={i}
              className="text-ink-strong leading-[1.85] tracking-[-0.01em]"
              style={{ fontFamily: SERIF, fontSize: `${fontSize + 0.5}px` }}
            >
              {renderHighlightedText(line)}
            </p>
          ))}
          {block.cite && (
            <cite className="block not-italic text-[12.5px] text-gray-500 dark:text-gray-400 mt-2.5">
              — {block.cite}
            </cite>
          )}
        </blockquote>
      )

    case 'callout':
      return (
        <div
          key={index}
          className="my-8 rounded-2xl bg-[var(--brand-soft)] px-5 py-4 border border-[var(--brand-soft-strong)]"
        >
          {block.lines.map((line, i) => (
            <p
              key={i}
              className="text-ink-strong leading-[1.8] tracking-[-0.01em]"
              style={{ fontFamily: SERIF, fontSize: `${fontSize - 0.5}px` }}
            >
              {renderHighlightedText(line)}
            </p>
          ))}
        </div>
      )

    case 'divider':
      // 편지 호흡을 끊는 장식 구분(딩거스) — 선 하나보다 편지지에 어울린다
      return (
        <div key={index} className="flex justify-center items-center gap-2.5 my-11" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-[3px] h-[3px] rounded-full bg-[var(--brand-muted)] opacity-50"></span>
          ))}
        </div>
      )

    case 'image':
      return (
        <figure key={index} className="my-8 -mx-1">
          <img
            src={block.url}
            alt={block.caption || ''}
            loading="lazy"
            decoding="async"
            className="w-full rounded-2xl object-cover"
          />
          {block.caption && (
            <figcaption className="text-center text-[12.5px] text-gray-500 dark:text-gray-400 mt-2.5 leading-[1.6]">
              {block.caption}
            </figcaption>
          )}
        </figure>
      )

    case 'list':
      return (
        <ul key={index} className="my-7 space-y-2.5 pl-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3">
              <span
                className="flex-shrink-0 text-[var(--brand-muted)] font-semibold"
                style={{ fontFamily: SERIF, fontSize: `${fontSize - 1}px`, lineHeight: 1.95 }}
              >
                {block.ordered ? `${i + 1}.` : '·'}
              </span>
              <span
                className="text-gray-700 dark:text-gray-300 leading-[1.95]"
                style={{ fontFamily: SERIF, fontSize: `${fontSize}px` }}
              >
                {renderHighlightedText(item)}
              </span>
            </li>
          ))}
        </ul>
      )

    case 'paragraph':
      return (
        <p
          key={index}
          className="text-gray-700 dark:text-gray-300 leading-[1.95] mb-7"
          style={{ fontFamily: SERIF, fontSize: `${fontSize}px` }}
        >
          {withLineBreaks(renderHighlightedText(block.text))}
        </p>
      )
  }
}

/** 본문만 필요한 곳(미리보기 본문 영역 등)을 위해 따로 내보낸다 */
export const ColumnBody = ({ content, fontSize }: { content: string; fontSize: number }) => (
  <>{parseColumnBlocks(content).map((block, i) => renderBlock(block, i, fontSize))}</>
)

const ColumnLetter = ({ language, column, fontSize, placeholder = false }: ColumnLetterProps) => {
  const ko = language === 'ko'
  const content = column.content || ''
  const title = column.title || (placeholder ? (ko ? '제목을 입력하세요' : 'Enter a title') : '')
  const author = column.author || (placeholder ? (ko ? '작성자' : 'Author') : '')

  return (
    <>
      {/* 표지 사진 — 있으면 편지 맨 위에서 한 통의 표정을 만든다 */}
      {column.image && (
        <img
          src={column.image}
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full aspect-[16/9] object-cover rounded-2xl mb-7"
        />
      )}

      {/* 오버라인 → 세리프 대제목 → 짧은 악센트 룰 */}
      <div className="text-[12.5px] text-gray-500 dark:text-gray-400">
        {column.date ? formatLetterDate(column.date, language) : ''}
        {content && (
          <>
            <span className="mx-1.5 opacity-60">·</span>
            {readingLabel(content, language, true)}
          </>
        )}
      </div>
      <h2
        className={`text-[24px] font-semibold tracking-[-0.01em] leading-[1.45] mt-3 ${
          column.title ? 'text-ink-strong' : 'text-gray-400 dark:text-gray-600'
        }`}
        style={{ fontFamily: SERIF }}
      >
        {title}
      </h2>
      <div className="w-8 h-[3px] rounded-full bg-[var(--brand-muted)] opacity-50 mt-6 mb-8"></div>

      {content ? (
        <ColumnBody content={content} fontSize={fontSize} />
      ) : (
        placeholder && (
          <p className="text-gray-400 dark:text-gray-600 leading-[1.95]" style={{ fontFamily: SERIF, fontSize: `${fontSize}px` }}>
            {ko
              ? '본문을 쓰기 시작하면 성도님께 보이는 모습 그대로 여기에 나타납니다.'
              : 'Start writing and the letter will appear here exactly as your congregation will see it.'}
          </p>
        )
      )}

      {/* 서명 — 편지의 맺음 */}
      <div className="mt-12 pt-7 border-t border-border-light dark:border-white/[0.06] flex items-center gap-4">
        <img
          src={andongProfile}
          alt={author}
          className="w-12 h-12 rounded-full object-cover ring-1 ring-black/[0.07] dark:ring-white/[0.12] flex-shrink-0"
        />
        <div className="min-w-0">
          {ko ? (
            <div className="text-[26px] leading-none text-ink-strong" style={{ fontFamily: PEN }}>
              {author} 드림
            </div>
          ) : (
            <div className="text-[17px] italic leading-none text-ink-strong" style={{ fontFamily: SERIF }}>
              {author}
            </div>
          )}
          <div className="text-[12px] text-gray-500 dark:text-gray-400 mt-2">{column.role}</div>
        </div>
      </div>
    </>
  )
}

export default ColumnLetter
