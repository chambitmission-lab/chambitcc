// 단어장 화면의 순수 가공 로직 — 정렬·묶기·뜻 정리·본문 강조 위치.
// 화면(WordbookPage)은 이 결과를 그리기만 한다.
import type { WordNoteWithVerse } from '../../../api/bibleWordNote'

export type WordbookSort = 'book' | 'alpha' | 'recent'

export interface WordGroup {
  key: string
  /** 묶음 제목 — 최근 순은 묶지 않아 null */
  label: string | null
  bookNumber: number | null
  items: WordNoteWithVerse[]
}

/** 뜻·메모 정리 — AI 해설·사전 붙여넣기에서 따라온 마크다운 기호(**, #, * 목록)를
 * 걷어 낸다. 줄바꿈은 살린다(화면은 pre-line). */
export const cleanNote = (raw: string | null | undefined): string => {
  if (!raw) return ''
  return raw
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) =>
      line
        .replace(/^\s{0,3}#{1,6}\s+/, '')
        .replace(/^(\s*)[*-]\s+/, '$1• ')
        .replace(/\*+/g, '')
        .replace(/__/g, '')
        .replace(/`/g, ''),
    )
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** 목록 행에 쓰는 한 줄 요약 — 정리한 뜻을 한 줄로 이어 붙인다(말줄임은 CSS) */
export const noteSummary = (raw: string | null | undefined): string =>
  cleanNote(raw).replace(/\s*\n+\s*/g, ' ').trim()

const CHOSEONG = ['ㄱ', 'ㄱ', 'ㄴ', 'ㄷ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅂ', 'ㅅ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']

/** 첫 글자의 초성 — 쌍자음은 사전처럼 홑자음 묶음에 넣는다. 한글이 아니면 '#' */
export const initialOf = (word: string): string => {
  const ch = word.trim().charCodeAt(0)
  if (ch >= 0xac00 && ch <= 0xd7a3) return CHOSEONG[Math.floor((ch - 0xac00) / 588)]
  return '#'
}

const byCanon = (a: WordNoteWithVerse, b: WordNoteWithVerse) =>
  a.book_number - b.book_number || a.chapter - b.chapter || a.verse - b.verse ||
  (a.char_start ?? 0) - (b.char_start ?? 0) || a.id - b.id

/** 정렬·묶기. recent 는 서버 순서(최신순)를 그대로 한 묶음으로 */
export const groupWords = (items: WordNoteWithVerse[], sort: WordbookSort): WordGroup[] => {
  if (sort === 'recent') {
    return items.length ? [{ key: 'recent', label: null, bookNumber: null, items }] : []
  }
  const sorted =
    sort === 'book'
      ? [...items].sort(byCanon)
      : [...items].sort((a, b) => a.word.localeCompare(b.word, 'ko') || byCanon(a, b))
  const groups: WordGroup[] = []
  for (const it of sorted) {
    const key = sort === 'book' ? `b${it.book_number}` : `i${initialOf(it.word)}`
    const last = groups[groups.length - 1]
    if (last && last.key === key) {
      last.items.push(it)
    } else {
      groups.push({
        key,
        label: sort === 'book' ? it.book_name_ko : initialOf(it.word),
        bookNumber: sort === 'book' ? it.book_number : null,
        items: [it],
      })
    }
  }
  return groups
}

/** 권별 단어 수 (66권 막대용) */
export const countByBook = (items: WordNoteWithVerse[]): Map<number, number> => {
  const map = new Map<number, number>()
  for (const it of items) map.set(it.book_number, (map.get(it.book_number) ?? 0) + 1)
  return map
}

/** 본문에서 저장한 단어 자리 [start, end).
 * 저장된 위치(char 범위)가 본문과 맞으면 그 자리를, 아니면 단어 검색으로 fallback —
 * 같은 단어가 절에 두 번 나올 때 indexOf만 쓰면 엉뚱한 쪽이 칠해진다. 못 찾으면 null */
export const highlightRange = (
  item: Pick<WordNoteWithVerse, 'text' | 'word' | 'char_start' | 'char_end'>,
): [number, number] | null => {
  const { text, word, char_start, char_end } = item
  if (
    char_start != null &&
    char_end != null &&
    char_start >= 0 &&
    char_end > char_start &&
    char_end <= text.length
  ) {
    const slice = text.slice(char_start, char_end)
    if (slice.includes(word) || word.includes(slice)) return [char_start, char_end]
  }
  const idx = text.indexOf(word)
  return idx < 0 ? null : [idx, idx + word.length]
}
