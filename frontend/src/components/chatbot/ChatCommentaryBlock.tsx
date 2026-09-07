import { useMemo, useState } from 'react'
import { Markdown } from '../../utils/markdown'
import {
  parseCommentary,
  titleEchoesScripture,
  type CommentaryObservation,
} from '../bible/commentaryContent'
import type { ChatCommentary } from '../../types/chatbot'

const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥']

/**
 * 관찰 블록 옆에 세울 짧은 라벨.
 * 저장된 해석은 소제목을 **볼드**로만 적어두는데, 그마저 없으면 첫 어절을 잘라 쓴다 —
 * 요약 목록에서 번호만 덩그러니 놓이는 것보다는 낫다.
 */
const outlineLabel = (obs: CommentaryObservation): string => {
  if (obs.heading) return obs.heading
  const head = obs.text
    .replace(/\*\*/g, '')
    .split(/\s[—–]\s/)[0]
    .split(/[.!?]\s/)[0]
    .trim()
  return head.length > 26 ? `${head.slice(0, 26)}…` : head
}

/** 첫 문단만 미리 보여줄 때 쓰는 길이 — 말풍선 너비에서 서너 줄 */
const PREVIEW_CHARS = 130

const preview = (source: string): string => {
  const plain = source.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim()
  return plain.length > PREVIEW_CHARS ? `${plain.slice(0, PREVIEW_CHARS)}…` : plain
}

interface Props {
  commentary: ChatCommentary
  /** 위 말풍선에 이미 떠 있는 성경 본문 — 제목이 이걸 되풀이하면 제목을 지운다 */
  scripture?: string | null
}

/**
 * 채팅 말풍선 안의 말씀 해석.
 *
 * 예전에는 마크다운 기호만 걷어낸 800자 통짜 문단을 그대로 흘려보내서, 좁은 말풍선에서는
 * 어디가 요지고 어디가 설명인지 분간이 되지 않았다. /bible 해석 카드가 쓰는
 * parseCommentary 를 그대로 빌려와 요지 → 관찰 목차 → 적용으로 접어 보여주고,
 * 전문은 "해석 자세히 보기"로 펼친다. 채팅에서는 목차까지가 기본값이다.
 */
const ChatCommentaryBlock = ({ commentary, scripture }: Props) => {
  const [open, setOpen] = useState(false)
  const parsed = useMemo(
    () => parseCommentary(commentary.content, !!commentary.title),
    [commentary.content, commentary.title],
  )

  const source = scripture?.trim() || parsed.scripture
  const title =
    commentary.title && !titleEchoesScripture(commentary.title, source, commentary.scope)
      ? commentary.title
      : null
  const scopeLabel = commentary.scope === 'summary' ? '요약 해석' : '절별 해석'
  const outline = parsed.observations
  const rest = [parsed.preface, parsed.body].filter(Boolean).join('\n\n')
  // 접힌 상태에서 보여줄 게 요지 한 줄뿐이면 펼침 버튼이 의미가 없다
  const foldable = outline.length > 0 || rest.length > 0 || !!parsed.closing

  return (
    <div className="cb-cm">
      <p className="cb-cm-head">
        <span className="cb-cm-scope">{scopeLabel}</span>
        {commentary.category && <span className="cb-cm-cat">{commentary.category}</span>}
      </p>

      {title && <p className="cb-cm-title">{title}</p>}
      {parsed.lead && <p className="cb-cm-lead">{parsed.lead}</p>}

      {/* 접힌 상태 — 관찰 소제목만 목차처럼 세운다 */}
      {!open && outline.length > 0 && (
        <ul className="cb-cm-outline">
          {outline.map((obs, i) => (
            <li key={`o-${i}`}>
              <span className="cb-cm-num">{CIRCLED[i] ?? '·'}</span>
              <span className="cb-cm-outline-text">{outlineLabel(obs)}</span>
            </li>
          ))}
        </ul>
      )}
      {!open && outline.length === 0 && rest && <p className="cb-cm-preview">{preview(rest)}</p>}

      {/* 펼친 상태 — /bible 해석 카드와 같은 구조를 말풍선 크기로 */}
      {open && (
        <>
          {parsed.preface && (
            <div className="cb-cm-prose">
              <Markdown source={parsed.preface} emphasis="plain" />
            </div>
          )}
          {outline.map((obs, i) => (
            <section key={`s-${i}`} className="cb-cm-obs">
              <p className="cb-cm-obs-head">
                <span className="cb-cm-num">{CIRCLED[i] ?? '·'}</span>
                <span>{outlineLabel(obs)}</span>
              </p>
              <div className="cb-cm-prose">
                <Markdown source={obs.text} emphasis="plain" />
              </div>
            </section>
          ))}
          {parsed.body && (
            <div className="cb-cm-prose cb-cm-gap">
              <Markdown source={parsed.body} emphasis="plain" />
            </div>
          )}
          {parsed.closing && <p className="cb-cm-closing">{parsed.closing}</p>}
        </>
      )}

      {parsed.application && (
        <div className="cb-cm-apply">
          <p className="cb-cm-apply-head">오늘의 적용</p>
          <p className="cb-cm-apply-text">{parsed.application}</p>
        </div>
      )}

      {foldable && (
        <button type="button" className="cb-cm-more" onClick={() => setOpen((v) => !v)}>
          {open ? '해석 접기' : '해석 자세히 보기'}
        </button>
      )}
    </div>
  )
}

export default ChatCommentaryBlock
