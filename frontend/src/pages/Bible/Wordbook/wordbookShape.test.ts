import { describe, expect, it } from 'vitest'
import type { WordNoteWithVerse } from '../../../api/bibleWordNote'
import { cleanNote, countByBook, groupWords, highlightRange, initialOf, noteSummary } from './wordbookShape'

const w = (over: Partial<WordNoteWithVerse>): WordNoteWithVerse => ({
  id: 1,
  verse_id: 1,
  word: '단어',
  char_start: null,
  char_end: null,
  note: null,
  created_at: '2026-11-01T00:00:00',
  updated_at: '2026-11-01T00:00:00',
  book_number: 1,
  book_name_ko: '창세기',
  chapter: 1,
  verse: 1,
  text: '',
  ...over,
})

describe('cleanNote', () => {
  it('깨진 굵게 기호와 제목·목록 기호를 걷어 낸다', () => {
    expect(cleanNote('*언약궤(言約櫃)**는 궤입니다.')).toBe('언약궤(言約櫃)는 궤입니다.')
    expect(cleanNote('## 뜻\n* 첫째\n- 둘째')).toBe('뜻\n• 첫째\n• 둘째')
  })
  it('빈 줄은 하나까지만 남긴다', () => {
    expect(cleanNote('가\n\n\n\n나')).toBe('가\n\n나')
    expect(cleanNote(null)).toBe('')
  })
  it('요약은 한 줄로 잇는다', () => {
    expect(noteSummary('엔학고레\n\n사사기 15장')).toBe('엔학고레 사사기 15장')
  })
})

describe('initialOf', () => {
  it('초성(쌍자음은 홑자음), 한글 아니면 #', () => {
    expect(initialOf('언약궤')).toBe('ㅇ')
    expect(initialOf('까마귀')).toBe('ㄱ')
    expect(initialOf('Abba')).toBe('#')
  })
})

describe('groupWords', () => {
  const items = [
    w({ id: 1, word: '언약궤', book_number: 11, book_name_ko: '열왕기상', chapter: 8 }),
    w({ id: 2, word: '백 크시타', book_number: 1, book_name_ko: '창세기', chapter: 33 }),
    w({ id: 3, word: '엔학고레', book_number: 7, book_name_ko: '사사기', chapter: 15 }),
    w({ id: 4, word: '속죄소', book_number: 1, book_name_ko: '창세기', chapter: 2 }),
  ]
  it('성경 순서는 권·장 순으로 권마다 묶는다', () => {
    const g = groupWords(items, 'book')
    expect(g.map((x) => x.label)).toEqual(['창세기', '사사기', '열왕기상'])
    expect(g[0].items.map((x) => x.id)).toEqual([4, 2])
  })
  it('가나다는 초성으로 묶는다', () => {
    const g = groupWords(items, 'alpha')
    expect(g.map((x) => x.label)).toEqual(['ㅂ', 'ㅅ', 'ㅇ'])
    expect(g[2].items.map((x) => x.word)).toEqual(['언약궤', '엔학고레'])
  })
  it('최근 순은 서버 순서 그대로 한 묶음', () => {
    const g = groupWords(items, 'recent')
    expect(g).toHaveLength(1)
    expect(g[0].label).toBeNull()
    expect(g[0].items.map((x) => x.id)).toEqual([1, 2, 3, 4])
    expect(groupWords([], 'recent')).toEqual([])
  })
  it('권별 개수', () => {
    expect(countByBook(items).get(1)).toBe(2)
  })
})

describe('highlightRange', () => {
  it('저장 위치가 맞으면 그 자리, 아니면 검색', () => {
    const text = '은혜 위에 은혜러라'
    expect(highlightRange({ text, word: '은혜', char_start: 6, char_end: 8 })).toEqual([6, 8])
    expect(highlightRange({ text, word: '은혜', char_start: 2, char_end: 4 })).toEqual([0, 2])
    expect(highlightRange({ text, word: '없음', char_start: null, char_end: null })).toBeNull()
  })
})
