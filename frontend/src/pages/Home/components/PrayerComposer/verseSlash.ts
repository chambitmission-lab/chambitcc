// 기도 본문 "/말씀" 넣기 — 본문에 `/창 1:1` 처럼 치면 구절을 찾아 미리 보여주고,
// Enter·탭으로 `“본문” (창세기 1:1)` 글자로 바꿔 넣는다. 저장은 평범한 텍스트라 백엔드 변경 없음.
// 조회는 장 단위(useBibleChapter, /bible 화면과 같은 캐시) → 범위(1:1-3)도 요청 한 번.
import { useMemo } from 'react'
import { useBibleChapter } from '../../../../hooks/useBible'
import {
  formatReference,
  matchBibleBooks,
  parseBibleReference,
  type ParsedReference,
} from '../../../Sermon/utils/sermonMeta'

/* 한 번에 넣을 수 있는 절 수 — 기도 본문(1000자)을 말씀이 다 덮지 않게 */
export const MAX_SLASH_VERSES = 5

/* 슬래시 뒤 글자가 "성구처럼 생겼을 때만" 말씀 찾기로 본다.
 * `/창 1:1 그리고`처럼 이어서 문장을 쓰기 시작하면 모양이 깨져 자연스럽게 닫힌다.
 * 책 이름엔 '요한1서'처럼 숫자가 낄 수 있다. */
const SLASH_QUERY_RE =
  /^[^\s\d:/~\-–]{0,8}(?:[123]서)?(?:\s?\d{1,3}(?:\s?(?:장|편|:)\s?(?:\d{1,3}(?:\s?[-~–]\s?\d{0,3})?)?\s?절?)?)?$/

export interface SlashMatch {
  /** '/' 가 있는 위치 */
  start: number
  /** '/' 다음부터 커서까지 */
  query: string
}

/** 커서 앞에서 진행 중인 `/성구` 를 찾는다. 줄 맨 앞이나 공백 뒤의 '/' 만 — "1/2" 같은 입력은 무시 */
export const findSlashMatch = (text: string, caret: number): SlashMatch | null => {
  const before = text.slice(0, caret)
  const m = before.match(/(^|\s)\/([^\n/]{0,24})$/)
  if (!m) return null
  const query = m[2]
  if (!SLASH_QUERY_RE.test(query)) return null
  return { start: caret - query.length - 1, query }
}

export type SlashState =
  | { kind: 'hint'; books: string[] }
  | { kind: 'unknown-book'; book: string }
  | { kind: 'need-verse'; ref: ParsedReference }
  | { kind: 'loading'; ref: ParsedReference }
  | { kind: 'not-found'; ref: ParsedReference }
  | { kind: 'ready'; ref: ParsedReference; label: string; text: string; insert: string; clipped: boolean }

export const useVerseSlash = (query: string | null): SlashState | null => {
  // 시편은 "23편"으로 많이 쓴다 — 파서는 '장'만 알아서 바꿔 넘긴다
  const ref = useMemo(() => (query ? parseBibleReference(query.replace(/(\d)\s?편/, '$1장')) : null), [query])
  const bookNumber = ref?.bookNumber ?? 0
  const chapterNo = ref?.chapter ?? 0
  const { data: chapter, isLoading, isError } = useBibleChapter(
    bookNumber,
    chapterNo,
    query != null && bookNumber > 0 && ref?.verse != null,
  )

  return useMemo<SlashState | null>(() => {
    if (query == null) return null
    if (!ref) {
      const books = query.trim() ? matchBibleBooks(query, 3).map((b) => b.book) : []
      return { kind: 'hint', books }
    }
    if (ref.bookNumber == null) return { kind: 'unknown-book', book: ref.book }
    if (ref.verse == null) return { kind: 'need-verse', ref }
    if (isLoading) return { kind: 'loading', ref }
    if (isError || !chapter) return { kind: 'not-found', ref }

    const from = ref.verse
    const wantEnd = ref.verseEnd != null && ref.verseEnd > from ? ref.verseEnd : from
    const end = Math.min(wantEnd, from + MAX_SLASH_VERSES - 1)
    // 개역 병합 구간의 자리표시자 행(merged_into)은 본문이 비어 있으니 건너뛴다
    const picked = chapter.verses.filter((v) => v.verse >= from && v.verse <= end && v.merged_into == null)
    if (picked.length === 0) return { kind: 'not-found', ref }

    const text = picked.map((v) => v.text.trim()).join(' ')
    const lastVerse = picked[picked.length - 1].verse
    const shown: ParsedReference = { ...ref, verseEnd: lastVerse > from ? lastVerse : null }
    const label = formatReference(shown)
    return {
      kind: 'ready',
      ref: shown,
      label,
      text,
      insert: `“${text}” (${label})`,
      clipped: wantEnd > end,
    }
  }, [query, ref, chapter, isLoading, isError])
}
