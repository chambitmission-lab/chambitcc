import { useMemo, useState } from 'react'
import BibleCommentaryItem, { CommentaryAdminActions } from './BibleCommentaryItem'
import { parseSummaryNotes, type ParsedSummary } from './summaryNotes'
import type { BibleCommentary } from '../../types/bibleCommentary'

export interface ScriptureVerse {
  verse: number
  text: string
}

interface CommentarySummaryFlowProps {
  summaries: BibleCommentary[]
  /** 펼쳐진 요약 해석 id. null 이면 전부 접힘 */
  openId: number | null
  onToggle: (id: number) => void
  isAdmin: boolean
  /** 해석이 덮는 절들의 실제 본문 */
  versesFor: (c: BibleCommentary) => ScriptureVerse[]
  onEdit?: (commentary: BibleCommentary) => void
  onDelete?: (commentary: BibleCommentary) => void
}

const formatRange = (c: BibleCommentary) =>
  c.verse_start === c.verse_end ? `${c.verse_start}절` : `${c.verse_start}-${c.verse_end}절`

/** 이보다 길면 접어 둔다 — 요약 해석은 본문이 열 절을 넘기도 한다 */
const SCRIPTURE_CLAMP = 110

/** 읽는 말씀 — 절 번호를 붙여 옅은 판에 담는다. 풀이가 주인공이라 기본은 접힘 */
const ScriptureBox = ({ verses }: { verses: ScriptureVerse[] }) => {
  const [expanded, setExpanded] = useState(false)
  const long = verses.reduce((n, v) => n + v.text.length, 0) > SCRIPTURE_CLAMP

  return (
    <div className="rounded-[14px] px-4 pt-3 pb-3" style={{ background: 'var(--genre-soft)' }}>
      <p className="cmt-meta text-[11.5px] font-bold tracking-[0.06em]" style={{ color: 'var(--genre)' }}>
        본문
      </p>
      <p
        className={`commentary-scripture cmt-prose mt-1.5 text-[14.5px] leading-[1.8] text-ink ${
          long && !expanded ? 'line-clamp-3' : ''
        }`}
      >
        {verses.map((v) => (
          <span key={v.verse}>
            <sup
              className="mr-[3px] text-[0.68em] font-bold tabular-nums"
              style={{ color: 'var(--genre)' }}
            >
              {v.verse}
            </sup>
            {v.text}{' '}
          </span>
        ))}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="cmt-expand -mb-2 inline-flex items-center gap-0.5 min-h-[40px] text-[12.5px] font-bold"
          style={{ color: 'var(--genre)' }}
        >
          {expanded ? '본문 접기' : '본문 전체 보기'}
          <span className="material-icons-round text-[17px]" aria-hidden="true">
            {expanded ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      )}
    </div>
  )
}

/** 절 따라 읽기 — 절 범위(+핵심) 아래에 인용 → 풀이 → 참조 구절 */
const SummaryNotes = ({ parsed }: { parsed: ParsedSummary }) => (
  <>
    <div className="space-y-6">
      {parsed.notes.map((note, i) => (
        <div key={i}>
          <div className="flex items-center gap-1.5 mb-1.5">
            {note.range && (
              <span
                className="cmt-meta text-[12.5px] font-bold tabular-nums"
                style={{ color: 'var(--genre)' }}
              >
                {note.range}
              </span>
            )}
            {note.key && (
              <span
                className="cmt-key rounded-[5px] px-1.5 py-px text-[11.5px] font-bold leading-[1.4]"
                style={{ background: 'var(--genre)' }}
              >
                핵심
              </span>
            )}
          </div>
          <div>
            <p className="cmt-prose cmt-quote text-[14.5px] leading-[1.7] text-ink-muted">{note.quote}</p>
            <ul className="mt-2.5 space-y-2">
              {note.points.map((point, j) => (
                <li key={j} className="flex gap-2.5">
                  <span
                    aria-hidden="true"
                    className="cmt-dot mt-[0.72em] w-[5px] h-[5px] rounded-full shrink-0"
                    style={{ background: 'var(--genre)' }}
                  />
                  <span
                    className={`cmt-prose text-[15px] leading-[1.75] ${
                      note.key ? 'text-ink-strong' : 'text-ink'
                    }`}
                  >
                    {point}
                  </span>
                </li>
              ))}
            </ul>
            {note.refs.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="참조 구절">
                {note.refs.map((ref) => (
                  <li
                    key={ref}
                    className="cmt-ref inline-flex items-center h-7 px-2.5 rounded-full border border-[var(--card-border)] text-[11.5px] font-semibold text-ink-muted tabular-nums"
                  >
                    {ref}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </div>

    {parsed.application && (
      <section className="mt-5 rounded-2xl px-4 py-3.5" style={{ background: 'var(--genre-soft)' }}>
        <p
          className="cmt-meta flex items-center gap-1.5 text-[11.5px] font-bold tracking-[0.06em] mb-1"
          style={{ color: 'var(--genre)' }}
        >
          <span className="material-icons-round text-[15px]">wb_twilight</span>
          오늘의 적용
        </p>
        <p className="cmt-prose text-[14.5px] leading-[1.7] text-ink">{parsed.application}</p>
      </section>
    )}
  </>
)

/**
 * 요약 해석 — 장의 흐름을 번호 달린 목차로 먼저 보여 주고, 누른 한 장면만 펼친다.
 *
 * 요약 해석은 한 장에 대여섯 건이고 한 건이 화면 두세 장 분량이라, 죽 이어 붙이면 "이 장이
 * 몇 장면인지"가 끝까지 내려가야 보인다. 제목을 한 화면에 모으는 것이 '한눈에'의 전부다.
 * 펼친 안쪽은 절 범위별 노트(SummaryNotes)이고, 그 형식으로 쓰이지 않은 해석은 예전 지면
 * (BibleCommentaryItem)을 그대로 넣는다.
 */
const CommentarySummaryFlow = ({
  summaries,
  openId,
  onToggle,
  isAdmin,
  versesFor,
  onEdit,
  onDelete,
}: CommentarySummaryFlowProps) => {
  const parsedById = useMemo(
    () => new Map(summaries.map((c) => [c.id, parseSummaryNotes(c.content, c.book_number)])),
    [summaries],
  )
  // 한 건뿐이면(절을 눌러 연 경우) 목차가 아니라 그 해석 자체가 화면이다
  const single = summaries.length === 1

  return (
    <ol className="cmt-flow">
      {summaries.map((c, i) => {
        const open = single || openId === c.id
        const parsed = parsedById.get(c.id) ?? null
        const verses = open ? versesFor(c) : []
        const panelId = `cmt-flow-panel-${c.id}`
        const last = i + 1 === summaries.length

        return (
          <li
            key={c.id}
            data-commentary-id={c.id}
            className={single ? '' : 'grid grid-cols-[28px_minmax(0,1fr)] gap-x-3'}
          >
            {!single && (
              <div className="flex flex-col items-center" aria-hidden="true">
                <span
                  className={`cmt-step mt-3.5 w-7 h-7 rounded-full flex items-center justify-center text-[12.5px] font-bold tabular-nums shrink-0 ${
                    open ? 'cmt-step--on' : ''
                  }`}
                >
                  {i + 1}
                </span>
                {!last && <span className="cmt-step-line mt-1 w-px flex-1" />}
              </div>
            )}

            <div className={last ? '' : 'border-b border-[var(--card-border)]'}>
              {single ? (
                <div className="pt-4 pb-3">
                  <p
                    className="cmt-meta text-[12.5px] font-bold tabular-nums"
                    style={{ color: 'var(--genre)' }}
                  >
                    {formatRange(c)}
                  </p>
                  {c.title && (
                    <h4 className="cmt-item-title mt-0.5 text-[17px] font-bold tracking-[-0.02em] leading-[1.35] text-ink-strong">
                      {c.title}
                    </h4>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onToggle(c.id)}
                  aria-expanded={open}
                  aria-controls={panelId}
                  className="w-full min-h-[58px] py-2.5 flex items-center justify-between gap-2.5 text-left"
                >
                  <span className="min-w-0">
                    <span
                      className="cmt-meta block text-[12.5px] font-bold tabular-nums"
                      style={{ color: 'var(--genre)' }}
                    >
                      {formatRange(c)}
                    </span>
                    <span className="cmt-obs-head block mt-0.5 text-[15px] font-bold tracking-[-0.02em] leading-[1.4] text-ink-strong">
                      {c.title || '요약 해석'}
                    </span>
                  </span>
                  <span
                    className="material-icons-round text-[20px] text-ink-muted shrink-0"
                    aria-hidden="true"
                  >
                    {open ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
              )}

              {open && (
                <div id={panelId} className="pb-5 pt-0.5">
                  {parsed ? (
                    <>
                      {verses.length > 0 && (
                        <div className="mb-4">
                          <ScriptureBox verses={verses} />
                        </div>
                      )}
                      <SummaryNotes parsed={parsed} />
                      {isAdmin && (
                        <CommentaryAdminActions commentary={c} onEdit={onEdit} onDelete={onDelete} />
                      )}
                    </>
                  ) : (
                    <BibleCommentaryItem
                      commentary={c}
                      isAdmin={isAdmin}
                      bare
                      scriptureText={verses.map((v) => v.text).join(' ') || null}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  )}
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export default CommentarySummaryFlow
