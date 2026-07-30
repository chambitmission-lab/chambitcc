import { useState } from 'react'
import { Markdown } from '../../utils/markdown'
import {
  parseCommentary,
  stripLeadingHeading,
  titleEchoesScripture,
} from './commentaryContent'
import type { BibleCommentary } from '../../types/bibleCommentary'

interface BibleCommentaryItemProps {
  commentary: BibleCommentary
  isAdmin: boolean
  /** 이 해석이 다루는 실제 성경 본문. 없으면 해석 본문에서 뽑아낸 인용으로 대신한다 */
  scriptureText?: string | null
  onEdit?: (commentary: BibleCommentary) => void
  onDelete?: (commentary: BibleCommentary) => void
}

const formatDate = (iso: string) => {
  try {
    const d = new Date(iso)
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  } catch {
    return ''
  }
}

const formatRange = (c: BibleCommentary) =>
  c.verse_start === c.verse_end
    ? `${c.verse_start}절`
    : `${c.verse_start}-${c.verse_end}절`

const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥']

/** 이보다 길면 접어두고 펼치게 한다 — 요약 해석은 본문이 열 절을 넘기도 한다 */
const SCRIPTURE_CLAMP = 180

const ScriptureBlock = ({ text }: { text: string }) => {
  const [expanded, setExpanded] = useState(false)
  const long = text.length > SCRIPTURE_CLAMP

  return (
    <div className="mt-3 pl-3.5 border-l-[3px]" style={{ borderColor: 'var(--genre)' }}>
      <p
        className={`commentary-scripture text-[15.5px] leading-[1.8] text-ink-strong ${
          long && !expanded ? 'line-clamp-4' : ''
        }`}
      >
        {text}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-[12.5px] font-bold"
          style={{ color: 'var(--genre)' }}
        >
          {expanded ? '본문 접기' : '본문 전체 보기'}
        </button>
      )}
    </div>
  )
}

/**
 * 말씀 해석 한 건.
 *
 * 카드가 아니라 한 편의 지면으로 그린다 — 테두리 대신 여백으로 나누고, 색은 책 장르
 * 액센트 하나만 쓴다. 저장된 본문은 같은 말을 여러 번 되풀이하는 정형문이라
 * parseCommentary가 성경 본문·요지·관찰·적용으로 나눠준 뒤에야 읽을 만해진다.
 * 강조는 emphasis="plain" — 금빛 글로우는 문장 단위로 칠해지면 오히려 눈을 지치게 한다.
 */
const BibleCommentaryItem = ({
  commentary,
  isAdmin,
  scriptureText,
  onEdit,
  onDelete,
}: BibleCommentaryItemProps) => {
  const parsed = parseCommentary(commentary.content, !!commentary.title)
  const scripture = scriptureText?.trim() || parsed.scripture
  // 절별 해석은 제목이 성경 본문 전문이라, 본문 블록과 나란히 두면 같은 문장이 두 번 보인다
  const title =
    commentary.title &&
    !titleEchoesScripture(commentary.title, scripture, commentary.scope)
      ? commentary.title
      : null

  const prose = (source: string, extraClass: string) => (
    <div className={`book-intro-prose text-[15px] leading-[1.85] text-ink ${extraClass}`}>
      <Markdown
        source={commentary.title ? stripLeadingHeading(source) : source}
        emphasis="plain"
      />
    </div>
  )

  return (
    <article className="py-5 first:pt-1">
      <div className="flex items-baseline gap-2">
        <span
          className="text-[11.5px] font-bold tracking-[0.1em] shrink-0"
          style={{ color: 'var(--genre)' }}
        >
          {formatRange(commentary)}
        </span>
        {commentary.category && (
          <span className="text-[11.5px] font-semibold text-ink-muted">
            {commentary.category}
          </span>
        )}
        {isAdmin && (
          <span className="ml-auto text-[11px] text-ink-muted tabular-nums shrink-0">
            {formatDate(commentary.updated_at)}
          </span>
        )}
      </div>

      {title && (
        <h4 className="mt-1.5 text-[17px] font-bold tracking-[-0.02em] leading-[1.35] text-ink-strong">
          {title}
        </h4>
      )}

      {scripture && <ScriptureBlock text={scripture} />}

      {parsed.lead && (
        <p className="mt-3.5 text-[15px] leading-[1.7] font-semibold text-ink-strong">
          {parsed.lead}
        </p>
      )}

      {parsed.preface && prose(parsed.preface, parsed.lead ? 'mt-3' : 'mt-3.5')}

      {/* 800자 통짜 문단을 "첫째/둘째"에서 갈라 만든 관찰 블록 */}
      {parsed.observations.map((obs, i) => (
        <section key={`obs-${i}`} className="mt-4">
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-[14px] font-bold shrink-0 leading-[1.5]"
              style={{ color: 'var(--genre)' }}
            >
              {CIRCLED[i] ?? '·'}
            </span>
            {obs.heading && (
              <h5 className="text-[14px] font-bold tracking-[-0.01em] text-ink-strong leading-[1.5]">
                {obs.heading}
              </h5>
            )}
          </div>
          <div className="book-intro-prose mt-1 pl-[1.35rem] text-[15px] leading-[1.85] text-ink">
            <Markdown source={obs.text} emphasis="plain" />
          </div>
        </section>
      ))}

      {parsed.body && prose(parsed.body, 'mt-4')}

      {parsed.closing && (
        <p
          className="mt-4 pl-3 border-l-2 text-[15px] leading-[1.75] font-semibold text-ink-strong"
          style={{ borderColor: 'var(--genre-line)' }}
        >
          {parsed.closing}
        </p>
      )}

      {parsed.application && (
        <section
          className="mt-4 rounded-2xl px-4 py-3.5"
          style={{ background: 'var(--genre-soft)' }}
        >
          <p
            className="flex items-center gap-1.5 text-[11.5px] font-bold tracking-[0.06em] mb-1"
            style={{ color: 'var(--genre)' }}
          >
            <span className="material-icons-round text-[15px]">wb_twilight</span>
            오늘의 적용
          </p>
          <p className="text-[14.5px] leading-[1.7] text-ink">{parsed.application}</p>
        </section>
      )}

      {isAdmin && (
        <div className="flex gap-1.5 justify-end mt-4">
          {onEdit && (
            <button
              onClick={() => onEdit(commentary)}
              className="inline-flex items-center gap-1 px-3 h-8 rounded-full text-[12px] font-bold bg-[var(--brand-soft)] text-brand border border-[var(--brand-soft-strong)] hover:bg-[var(--brand-soft-strong)] transition-colors"
            >
              <span className="material-icons-round text-[15px]">edit</span>
              수정
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(commentary)}
              className="inline-flex items-center gap-1 px-3 h-8 rounded-full text-[12px] font-bold bg-red-500/8 dark:bg-red-500/10 text-red-600 dark:text-red-300 border border-red-500/20 dark:border-red-400/30 hover:bg-red-500/15 dark:hover:bg-red-500/20 transition-colors"
            >
              <span className="material-icons-round text-[15px]">delete_outline</span>
              삭제
            </button>
          )}
        </div>
      )}
    </article>
  )
}

export default BibleCommentaryItem
