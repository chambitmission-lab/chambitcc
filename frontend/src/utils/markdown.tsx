import { Fragment, type ReactNode } from 'react'

/**
 * 가벼운 마크다운 렌더러 — 외부 의존성 없음.
 *
 * 지원 syntax:
 *  - `# 제목` / `## 제목` / `### 제목`
 *  - `**bold**`, `*italic*`
 *  - `- 항목` / `* 항목` (연속 줄은 한 리스트로 묶임)
 *  - `> 인용`
 *  - 빈 줄은 문단 분리
 *  - 수동 줄바꿈은 그대로 보존
 *
 * React가 자동으로 텍스트를 escape 하므로 XSS 안전.
 */

/**
 * `**볼드**`를 어떻게 그릴지.
 *  - 'glow': 금빛 + 글로우. 짧은 묵상/해석처럼 한두 군데만 강조하는 글에 쓴다.
 *  - 'plain': 본문색 그대로 굵게만. 여러 문단을 이어 읽는 글(권 개관 등)에서
 *    강조가 문장마다 튀어 읽기를 끊는 걸 막는다.
 */
export type MarkdownEmphasis = 'glow' | 'plain'

const renderInline = (
  text: string,
  keyPrefix: string,
  emphasis: MarkdownEmphasis,
): ReactNode[] => {
  // **bold** 와 *italic* 처리. 패턴 우선순위: bold > italic.
  // 캡처 그룹 사용해서 split.
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return tokens
    .filter((t) => t !== '')
    .map((token, idx) => {
      const key = `${keyPrefix}-${idx}`
      if (token.startsWith('**') && token.endsWith('**')) {
        if (emphasis === 'plain') {
          return (
            <strong key={key} className="font-bold text-ink-strong">
              {token.slice(2, -2)}
            </strong>
          )
        }
        // 성경 해석의 중요 문구를 신적 영광·빛을 상징하는 금빛 글로우로 강조한다.
        return (
          <strong
            key={key}
            className="font-bold text-[#d4a017] dark:text-[#fbbf24]"
            style={{
              textShadow:
                '0 0 15px rgba(251, 191, 36, 0.7), 0 0 25px rgba(251, 191, 36, 0.45)',
            }}
          >
            {token.slice(2, -2)}
          </strong>
        )
      }
      if (token.startsWith('*') && token.endsWith('*')) {
        return <em key={key}>{token.slice(1, -1)}</em>
      }
      return <Fragment key={key}>{token}</Fragment>
    })
}

interface Block {
  type: 'h1' | 'h2' | 'h3' | 'list' | 'quote' | 'paragraph'
  lines: string[]
}

const buildBlocks = (markdown: string): Block[] => {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let currentList: Block | null = null
  let currentParagraph: Block | null = null

  const flushParagraph = () => {
    if (currentParagraph) {
      blocks.push(currentParagraph)
      currentParagraph = null
    }
  }
  const flushList = () => {
    if (currentList) {
      blocks.push(currentList)
      currentList = null
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    if (line.trim() === '') {
      flushParagraph()
      flushList()
      continue
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/)
    if (headingMatch) {
      flushParagraph()
      flushList()
      const level = headingMatch[1].length as 1 | 2 | 3
      const type = (`h${level}`) as Block['type']
      blocks.push({ type, lines: [headingMatch[2]] })
      continue
    }

    const listMatch = line.match(/^\s*[-*]\s+(.*)$/)
    if (listMatch) {
      flushParagraph()
      if (!currentList) {
        currentList = { type: 'list', lines: [] }
      }
      currentList.lines.push(listMatch[1])
      continue
    }
    flushList()

    const quoteMatch = line.match(/^>\s?(.*)$/)
    if (quoteMatch) {
      flushParagraph()
      const last = blocks[blocks.length - 1]
      if (last && last.type === 'quote') {
        last.lines.push(quoteMatch[1])
      } else {
        blocks.push({ type: 'quote', lines: [quoteMatch[1]] })
      }
      continue
    }

    if (!currentParagraph) {
      currentParagraph = { type: 'paragraph', lines: [] }
    }
    currentParagraph.lines.push(line)
  }

  flushParagraph()
  flushList()
  return blocks
}

interface MarkdownProps {
  source: string
  className?: string
  /** `**볼드**` 렌더 방식. 기본은 기존 금빛 글로우 */
  emphasis?: MarkdownEmphasis
}

export const Markdown = ({ source, className, emphasis = 'glow' }: MarkdownProps) => {
  const blocks = buildBlocks(source)
  const inline = (text: string, key: string) => renderInline(text, key, emphasis)
  return (
    <div className={className}>
      {blocks.map((block, i) => {
        const key = `b${i}`
        if (block.type === 'h1') {
          return (
            <h1 key={key} style={{ fontSize: '1.5rem', fontWeight: 700, margin: '1rem 0 0.5rem' }}>
              {inline(block.lines[0], key)}
            </h1>
          )
        }
        if (block.type === 'h2') {
          return (
            <h2 key={key} style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.875rem 0 0.5rem' }}>
              {inline(block.lines[0], key)}
            </h2>
          )
        }
        if (block.type === 'h3') {
          return (
            <h3 key={key} style={{ fontSize: '1.0625rem', fontWeight: 600, margin: '0.75rem 0 0.375rem' }}>
              {inline(block.lines[0], key)}
            </h3>
          )
        }
        if (block.type === 'list') {
          return (
            <ul key={key} style={{ paddingLeft: '1.25rem', margin: '0.5rem 0', listStyle: 'disc' }}>
              {block.lines.map((item, j) => (
                <li key={`${key}-${j}`} style={{ margin: '0.125rem 0', lineHeight: 1.65 }}>
                  {inline(item, `${key}-${j}`)}
                </li>
              ))}
            </ul>
          )
        }
        if (block.type === 'quote') {
          return (
            <blockquote
              key={key}
              style={{
                margin: '0.75rem 0',
                padding: '0.5rem 0.875rem',
                borderLeft: '3px solid rgba(99, 102, 241, 0.45)',
                background: 'rgba(99, 102, 241, 0.08)',
                color: 'var(--ig-secondary-text)',
                borderRadius: '0 0.375rem 0.375rem 0',
              }}
            >
              {block.lines.map((line, j) => (
                <div key={`${key}-${j}`} style={{ lineHeight: 1.6 }}>
                  {inline(line, `${key}-${j}`)}
                </div>
              ))}
            </blockquote>
          )
        }
        return (
          <p key={key} style={{ margin: '0.5rem 0', lineHeight: 1.7 }}>
            {block.lines.map((line, j) => (
              <Fragment key={`${key}-${j}`}>
                {inline(line, `${key}-${j}`)}
                {j < block.lines.length - 1 && <br />}
              </Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}
