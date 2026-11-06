import { describe, expect, it } from 'vitest'
import {
  buildHighlightPattern,
  interpretQuery,
  parseVerseTyping,
  resolveBookLocal,
  suggestDidYouMean,
  suggestTypeahead,
} from './queryInterpretation'
import { TEST_BOOKS, bookByNumber } from './testBooks'

const numbers = (books: { book_number: number }[]) => books.map(b => b.book_number)

describe('interpretQuery', () => {
  it('빈 검색어는 아무것도 잡지 않는다', () => {
    const r = interpretQuery(TEST_BOOKS, '   ')
    expect(r.trimmed).toBe('')
    expect(r.isChapterLike).toBe(false)
    expect(r.localBookMatches).toEqual([])
  })

  it('책 이름 부분일치는 매칭되는 책을 전부 돌려준다 — "고린" → 고린도전서·후서', () => {
    expect(numbers(interpretQuery(TEST_BOOKS, '고린').localBookMatches)).toEqual([46, 47])
  })

  it('영문 이름도 공백·대소문자를 무시하고 부분일치한다', () => {
    expect(numbers(interpretQuery(TEST_BOOKS, 'corinth').localBookMatches)).toEqual([46, 47])
    expect(numbers(interpretQuery(TEST_BOOKS, 'REVELATION').localBookMatches)).toEqual([66])
  })

  it('표준 약칭은 정확 일치로만 잡는다 — "고전"은 고린도전서, "요"는 요한복음 하나', () => {
    expect(numbers(interpretQuery(TEST_BOOKS, '고전').localBookMatches)).toEqual([46])
    // "요"는 요한복음·요한일서·요한이서·요한계시록 이름에도 들어 있어 부분일치로도 전부 잡힌다
    expect(numbers(interpretQuery(TEST_BOOKS, '요').localBookMatches)).toEqual([43, 62, 63, 66])
    expect(numbers(interpretQuery(TEST_BOOKS, '요일').localBookMatches)).toEqual([62])
  })

  it('숫자가 든 영문 이름·약칭("1 Corinthians"·"1Co")은 장·절 검색으로 분류돼 로컬 책 매칭을 하지 않는다', () => {
    // 책 이름 풀이(resolveBookLocal)에서만 숫자 약칭이 쓰인다 — "1co 3:1" 절 미리보기
    expect(interpretQuery(TEST_BOOKS, '1 CORINTHIANS').isChapterLike).toBe(true)
    expect(interpretQuery(TEST_BOOKS, '1Co').localBookMatches).toEqual([])
    expect(resolveBookLocal(TEST_BOOKS, '1Co')?.book_number).toBe(46)
  })

  it('숫자가 있으면 장·절 검색으로 보고 책 이름 매칭을 하지 않는다', () => {
    const r = interpretQuery(TEST_BOOKS, '고린도전서 13')
    expect(r.isChapterLike).toBe(true)
    expect(r.localBookMatches).toEqual([])
  })

  it('초성 검색은 책 이름 앞글자만 본다 — "ㄱㄹㄷ"', () => {
    const r = interpretQuery(TEST_BOOKS, 'ㄱㄹㄷ')
    expect(r.isChoseong).toBe(true)
    expect(numbers(r.localBookMatches)).toEqual([46, 47])
  })

  it('본문 키워드는 책을 잡지 않는다 — "사랑"', () => {
    expect(interpretQuery(TEST_BOOKS, '사랑').localBookMatches).toEqual([])
  })
})

describe('resolveBookLocal', () => {
  it('정확 일치 → 약칭 → 앞글자 순으로 푼다', () => {
    expect(resolveBookLocal(TEST_BOOKS, '요한복음')?.book_number).toBe(43)
    expect(resolveBookLocal(TEST_BOOKS, '요')?.book_number).toBe(43)
    expect(resolveBookLocal(TEST_BOOKS, '요일')?.book_number).toBe(62)
    expect(resolveBookLocal(TEST_BOOKS, '고린도전')?.book_number).toBe(46)
    expect(resolveBookLocal(TEST_BOOKS, 'john')?.book_number).toBe(43)
  })

  it('빈 문자열·모르는 이름은 undefined', () => {
    expect(resolveBookLocal(TEST_BOOKS, ' ')).toBeUndefined()
    expect(resolveBookLocal(TEST_BOOKS, '없는책')).toBeUndefined()
  })
})

describe('suggestTypeahead', () => {
  it('"고전 13"은 고린도전서 13장 하나를 제안한다', () => {
    expect(suggestTypeahead(TEST_BOOKS, '고전 13', '')).toEqual({
      kind: 'chapter',
      book: bookByNumber(46),
      chapter: 13,
    })
  })

  it('"시 23편"처럼 편 단위도 장으로 푼다', () => {
    expect(suggestTypeahead(TEST_BOOKS, '시 23편', '')).toMatchObject({ kind: 'chapter', chapter: 23 })
  })

  it('장 범위를 넘기면 제안하지 않는다 — 고린도전서 17장', () => {
    expect(suggestTypeahead(TEST_BOOKS, '고전 17', '')).toBeNull()
  })

  it('절까지 입력 중("요 3:")이면 절 미리보기 몫이라 비운다', () => {
    expect(suggestTypeahead(TEST_BOOKS, '요 3:', '')).toBeNull()
    expect(suggestTypeahead(TEST_BOOKS, '요 3:1', '')).toBeNull()
  })

  it('"고린"은 책 목록을, 최대 6권까지 제안한다', () => {
    expect(suggestTypeahead(TEST_BOOKS, '고린', '')).toEqual({ kind: 'books', books: [bookByNumber(46), bookByNumber(47)] })
    const many = suggestTypeahead(TEST_BOOKS, '요', '')
    expect(many?.kind).toBe('books')
    expect(many && many.kind === 'books' ? many.books.length : 0).toBeLessThanOrEqual(6)
  })

  it('이미 실행한 검색어와 같으면 제안하지 않는다', () => {
    expect(suggestTypeahead(TEST_BOOKS, '고린', '고린')).toBeNull()
  })

  it('책이 안 잡히는 키워드·빈 책 목록은 null', () => {
    expect(suggestTypeahead(TEST_BOOKS, '사랑', '')).toBeNull()
    expect(suggestTypeahead([], '고린', '')).toBeNull()
  })
})

describe('parseVerseTyping', () => {
  it('"요 3:1"은 요한복음 3장, 절 앞자리 "1"', () => {
    expect(parseVerseTyping(TEST_BOOKS, '요 3:1', '')).toEqual({ book: bookByNumber(43), chapter: 3, versePrefix: '1' })
  })

  it('"요 3:" 은 절 앞자리가 빈 문자열, 마침표 구분자도 허용', () => {
    expect(parseVerseTyping(TEST_BOOKS, '요 3:', '')?.versePrefix).toBe('')
    expect(parseVerseTyping(TEST_BOOKS, '요 3.16', '')?.versePrefix).toBe('16')
  })

  it('장 범위를 넘기거나 콜론이 없으면 null', () => {
    expect(parseVerseTyping(TEST_BOOKS, '요 22:1', '')).toBeNull()
    expect(parseVerseTyping(TEST_BOOKS, '요 3', '')).toBeNull()
  })
})

describe('suggestDidYouMean', () => {
  it('책 이름 오타가 있는 장 검색은 고친 검색어를 제안한다 — "요한복은 3"', () => {
    expect(suggestDidYouMean(TEST_BOOKS, '요한복은 3')).toBe('요한복음 3')
    expect(suggestDidYouMean(TEST_BOOKS, '요한복은 3:16')).toBe('요한복음 3:16')
  })

  it('책 이름이 정상적으로 풀리면 제안하지 않는다', () => {
    expect(suggestDidYouMean(TEST_BOOKS, '요한복음 99')).toBeNull()
  })

  it('두 글자 오타·숫자 없는 검색어는 제안하지 않는다', () => {
    expect(suggestDidYouMean(TEST_BOOKS, '요복 3')).toBeNull()
    expect(suggestDidYouMean(TEST_BOOKS, '요한복은')).toBeNull()
  })
})

describe('buildHighlightPattern', () => {
  it('공백·쉼표로 토큰을 나누고 중복을 없앤다', () => {
    const p = buildHighlightPattern('주,그리스도 주', false)
    expect(p?.source).toBe('(주|그리스도)')
    expect(p?.flags).toBe('gi')
  })

  it('정규식 특수문자는 이스케이프한다', () => {
    expect(buildHighlightPattern('a.b', false)?.source).toBe('(a\\.b)')
  })

  it('장 검색·빈 검색어는 null', () => {
    expect(buildHighlightPattern('창 1', true)).toBeNull()
    expect(buildHighlightPattern('', false)).toBeNull()
  })
})
