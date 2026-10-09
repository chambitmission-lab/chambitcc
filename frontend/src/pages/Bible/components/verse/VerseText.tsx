import { Fragment, type ReactNode } from 'react'
import type { GlossaryEntry, GlossaryMatch } from '../../data/bibleGlossary'
import { rangesOverlap, type NoteSegment, type TextRange, type WordToken } from './verseTextSegments'

interface VerseTextProps {
  text: string
  /** 절별 보기에선 남는 폭을 차지하고, 이어읽기에선 인라인으로 흐른다 */
  isFlow: boolean
  isHighlighted: boolean
  /** 음성 낭독 중 — 노래방 하이라이트 (색칠 경계는 원본 텍스트 인덱스) */
  isReading: boolean
  karaokeSplitIndex: number
  /** 단어 선택 모드 — 본문을 단어 단위 탭 타깃으로 렌더링 */
  wordSelectMode: boolean
  wordTokens: WordToken[]
  noteSegments: NoteSegment[]
  glossarySegments: GlossaryMatch[]
  /** 예수님 말씀 구간 — 글자색만 바꾼다 (밑줄·칩 장식과 겹쳐도 함께 칠한다) */
  jesusRanges: TextRange[]
  onTokenTap: (token: WordToken) => void
  onNoteTap: (seg: NoteSegment) => void
  onGlossaryTap: (entry: GlossaryEntry) => void
}

/**
 * 절 본문. 세 가지 모드를 우선순위대로 그린다:
 * 낭독(노래방) → 단어 선택(토큰 칩) → 일반(단어장 밑줄 + 사전 점선 칩 합성).
 */
const VerseText = ({
  text,
  isFlow,
  isHighlighted,
  isReading,
  karaokeSplitIndex,
  wordSelectMode,
  wordTokens,
  noteSegments,
  glossarySegments,
  jesusRanges,
  onTokenTap,
  onNoteTap,
  onGlossaryTap,
}: VerseTextProps) => {
  // 절 전체가 말씀이면 바깥 span 색만 바꾸고, 일부면 글자 구간을 쪼개 칠한다
  const jesusWhole = jesusRanges.length === 1 && jesusRanges[0].start === 0 && jesusRanges[0].end >= text.length
  const jesusPartial = jesusWhole ? [] : jesusRanges

  /** text[start, end) 를 예수님 말씀 경계에서 쪼개 그린다 */
  const paint = (start: number, end: number, key: string): ReactNode => {
    if (!jesusPartial.length) return text.slice(start, end)
    const parts: ReactNode[] = []
    let cursor = start
    for (const r of jesusPartial) {
      const s = Math.max(r.start, start)
      const e = Math.min(r.end, end)
      if (s >= e) continue
      if (s > cursor) parts.push(<Fragment key={`${key}-p${cursor}`}>{text.slice(cursor, s)}</Fragment>)
      parts.push(<span key={`${key}-j${s}`} className="verse-jesus-words">{text.slice(s, e)}</span>)
      cursor = e
    }
    if (cursor < end) parts.push(<Fragment key={`${key}-p${cursor}`}>{text.slice(cursor, end)}</Fragment>)
    return parts
  }

  const renderKaraoke = () => (
    <>
      <span
        style={{
          color: 'var(--brand)',
          // 읽은 부분도 본문과 동일한 굵기(400) 유지 — bold면 경계가 전진할 때마다
          // 폭이 바뀌어 줄바꿈이 재계산된다(출렁임).
          textShadow: '0 0 8px var(--brand-glow)',
        }}
      >
        {text.slice(0, karaokeSplitIndex)}
      </span>
      <span style={{ color: 'var(--ig-primary-text)' }}>{text.slice(karaokeSplitIndex)}</span>
    </>
  )

  const renderSelectable = () => {
    const parts: ReactNode[] = []
    let cursor = 0
    wordTokens.forEach((token, i) => {
      if (token.start > cursor) {
        parts.push(<Fragment key={`gap-${i}`}>{text.slice(cursor, token.start)}</Fragment>)
      }
      const isMarked = noteSegments.some((s) => rangesOverlap(s, token))
      parts.push(
        <span
          key={`tok-${i}`}
          role="button"
          onClick={(e) => {
            e.stopPropagation()
            onTokenTap(token)
          }}
          style={{
            background: isMarked ? 'var(--brand-soft-strong)' : 'var(--brand-soft)',
            borderRadius: '0.25rem',
            boxShadow: '0 0 0 1px var(--brand-soft-strong)',
            cursor: 'pointer',
          }}
        >
          {token.text}
        </span>
      )
      cursor = token.end
    })
    if (cursor < text.length) {
      parts.push(<Fragment key="tail">{text.slice(cursor)}</Fragment>)
    }
    return parts
  }

  // 저장된 단어(형광펜+실선)와 사전 칩(옅은 점선)을 위치순으로 합성한다.
  // 두 장식은 훅 단계에서 겹침을 제거했으므로 여기선 정렬만 하면 된다.
  const renderDecorated = () => {
    if (!noteSegments.length && !glossarySegments.length) return paint(0, text.length, 'all')
    const decorations = [
      ...noteSegments.map((seg) => ({ kind: 'note' as const, seg })),
      ...glossarySegments.map((seg) => ({ kind: 'chip' as const, seg })),
    ].sort((a, b) => a.seg.start - b.seg.start)

    const parts: ReactNode[] = []
    let cursor = 0
    decorations.forEach((deco, i) => {
      const { seg } = deco
      if (seg.start > cursor) {
        parts.push(<Fragment key={`plain-${i}`}>{paint(cursor, seg.start, `plain-${i}`)}</Fragment>)
      }
      if (deco.kind === 'chip') {
        parts.push(
          <span
            key={`chip-${i}`}
            role="button"
            onClick={(e) => {
              e.stopPropagation()
              onGlossaryTap(deco.seg.entry)
            }}
            style={{
              // 단어장(실선+형광펜)과 구별되는, 은은한 점선 — 읽기를 방해하지 않는 힌트
              textDecoration: 'underline dotted',
              textDecorationColor: 'color-mix(in srgb, var(--brand) 55%, transparent)',
              textDecorationThickness: '1.5px',
              textUnderlineOffset: '0.24em',
              cursor: 'pointer',
            }}
          >
            {paint(seg.start, seg.end, `chip-${i}`)}
          </span>
        )
      } else {
        parts.push(
          <span
            key={`note-${deco.seg.note.id}`}
            role="button"
            title={deco.seg.note.note || deco.seg.note.word}
            onClick={(e) => {
              e.stopPropagation()
              onNoteTap(deco.seg)
            }}
            style={{
              // 형광펜: 글자 아래쪽 40%에 브랜드 틴트를 깔아 다크 배경에서도 확 띈다
              background:
                'linear-gradient(to top, color-mix(in srgb, var(--brand) 34%, transparent) 0 40%, transparent 40%)',
              WebkitBoxDecorationBreak: 'clone',
              boxDecorationBreak: 'clone',
              borderRadius: '3px',
              padding: '0 1px',
              textDecoration: 'underline solid var(--brand) 2px',
              textUnderlineOffset: '0.22em',
              cursor: 'pointer',
            }}
          >
            {paint(seg.start, seg.end, `note-${i}`)}
          </span>
        )
      }
      cursor = seg.end
    })
    if (cursor < text.length) {
      parts.push(<Fragment key="tail">{paint(cursor, text.length, 'tail')}</Fragment>)
    }
    return parts
  }

  return (
    <span
      className={`bible-verse-text ${isHighlighted ? 'is-highlighted' : ''} ${jesusWhole && !isReading ? 'verse-jesus-words' : ''}`}
      style={isFlow ? undefined : { flex: 1, minWidth: 0 }}
    >
      {!text
        ? '(구절 내용 없음)'
        : isReading
          ? renderKaraoke()
          : wordSelectMode
            ? renderSelectable()
            : renderDecorated()}
    </span>
  )
}

export default VerseText
