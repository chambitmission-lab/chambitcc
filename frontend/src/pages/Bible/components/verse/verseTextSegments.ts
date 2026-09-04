import { useMemo } from 'react'
import type { WordNote } from '../../../../api/bibleWordNote'
import type { GlossaryMatch } from '../../data/bibleGlossary'

/** 본문 안의 한 구간 — 단어장 밑줄·사전 칩·선택용 토큰이 모두 이 모양을 공유한다 */
export interface TextRange {
  start: number
  end: number
}

export interface NoteSegment extends TextRange {
  note: WordNote
}

export interface WordToken extends TextRange {
  text: string
}

/** 토큰 앞뒤의 문장부호를 떼고 단어만 남긴다 ("긍휼히," → "긍휼히") */
export const cleanWord = (token: string) =>
  token.replace(/^[^0-9A-Za-z가-힣]+|[^0-9A-Za-z가-힣]+$/g, '')

export const rangesOverlap = (a: TextRange, b: TextRange) => a.start < b.end && a.end > b.start

/**
 * 단어 노트의 밑줄 범위를 확정한다. 저장된 위치가 현재 본문과 맞으면 그대로,
 * 본문이 수정돼 어긋났으면 단어 검색으로 fallback, 그래도 없으면 null(밑줄 생략).
 */
export const resolveNoteRange = (note: WordNote, text: string): [number, number] | null => {
  if (
    note.char_start != null &&
    note.char_end != null &&
    note.char_start >= 0 &&
    note.char_start < note.char_end &&
    note.char_end <= text.length
  ) {
    const slice = text.slice(note.char_start, note.char_end)
    // 토큰(조사 포함)에서 단어를 다듬어 저장하므로 포함 관계면 유효한 위치로 본다
    if (slice.includes(note.word) || note.word.includes(slice)) {
      return [note.char_start, note.char_end]
    }
  }
  const idx = text.indexOf(note.word)
  return idx >= 0 ? [idx, idx + note.word.length] : null
}

/** 저장된 단어 노트의 밑줄 구간 (위치순 정렬, 겹치는 건 앞선 것만) */
export const useNoteSegments = (wordNotes: WordNote[] | undefined, text: string): NoteSegment[] =>
  useMemo(() => {
    if (!wordNotes?.length || !text) return []
    const resolved = wordNotes
      .map((n) => ({ note: n, range: resolveNoteRange(n, text) }))
      .filter((r): r is { note: WordNote; range: [number, number] } => r.range !== null)
      .sort((a, b) => a.range[0] - b.range[0])
    const out: NoteSegment[] = []
    let lastEnd = 0
    for (const { note, range } of resolved) {
      if (range[0] < lastEnd) continue
      out.push({ note, start: range[0], end: range[1] })
      lastEnd = range[1]
    }
    return out
  }, [wordNotes, text])

/** 단어장 밑줄과 겹치는 사전 칩은 버린다 — 사용자 기록(단어장)이 우선 */
export const useGlossarySegments = (matches: GlossaryMatch[], noteSegments: NoteSegment[]) =>
  useMemo(
    () => matches.filter((g) => !noteSegments.some((n) => rangesOverlap(n, g))),
    [matches, noteSegments]
  )

/** 단어 선택 모드용 토큰 (원본 텍스트 내 위치 보존 — 공백/줄바꿈 그대로 복원) */
export const useWordTokens = (text: string): WordToken[] =>
  useMemo(() => {
    if (!text) return []
    const out: WordToken[] = []
    const re = /\S+/g
    let m: RegExpExecArray | null
    while ((m = re.exec(text))) {
      out.push({ text: m[0], start: m.index, end: m.index + m[0].length })
    }
    return out
  }, [text])
