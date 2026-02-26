// 백엔드 API가 준비되기 전 테스트용 Mock 데이터
import type { BibleBook, BibleChapterResponse, BibleSearchResult } from '../types/bible'

// Mock 성경 책 목록
export const mockBibleBooks: BibleBook[] = [
  // 구약
  { id: 1, book_name_ko: '창세기', book_name_en: 'Genesis', testament: 'OLD', book_number: 1, chapter_count: 50 },
  { id: 2, book_name_ko: '출애굽기', book_name_en: 'Exodus', testament: 'OLD', book_number: 2, chapter_count: 40 },
  { id: 3, book_name_ko: '레위기', book_name_en: 'Leviticus', testament: 'OLD', book_number: 3, chapter_count: 27 },
  { id: 4, book_name_ko: '민수기', book_name_en: 'Numbers', testament: 'OLD', book_number: 4, chapter_count: 36 },
  { id: 5, book_name_ko: '신명기', book_name_en: 'Deuteronomy', testament: 'OLD', book_number: 5, chapter_count: 34 },
  { id: 6, book_name_ko: '여호수아', book_name_en: 'Joshua', testament: 'OLD', book_number: 6, chapter_count: 24 },
  { id: 7, book_name_ko: '사사기', book_name_en: 'Judges', testament: 'OLD', book_number: 7, chapter_count: 21 },
  { id: 8, book_name_ko: '룻기', book_name_en: 'Ruth', testament: 'OLD', book_number: 8, chapter_count: 4 },
  { id: 9, book_name_ko: '사무엘상', book_name_en: '1 Samuel', testament: 'OLD', book_number: 9, chapter_count: 31 },
  { id: 10, book_name_ko: '사무엘하', book_name_en: '2 Samuel', testament: 'OLD', book_number: 10, chapter_count: 24 },
  
  // 신약
  { id: 40, book_name_ko: '마태복음', book_name_en: 'Matthew', testament: 'NEW', book_number: 40, chapter_count: 28 },
  { id: 41, book_name_ko: '마가복음', book_name_en: 'Mark', testament: 'NEW', book_number: 41, chapter_count: 16 },
  { id: 42, book_name_ko: '누가복음', book_name_en: 'Luke', testament: 'NEW', book_number: 42, chapter_count: 24 },
  { id: 43, book_name_ko: '요한복음', book_name_en: 'John', testament: 'NEW', book_number: 43, chapter_count: 21 },
  { id: 44, book_name_ko: '사도행전', book_name_en: 'Acts', testament: 'NEW', book_number: 44, chapter_count: 28 },
  { id: 45, book_name_ko: '로마서', book_name_en: 'Romans', testament: 'NEW', book_number: 45, chapter_count: 16 },
  { id: 46, book_name_ko: '고린도전서', book_name_en: '1 Corinthians', testament: 'NEW', book_number: 46, chapter_count: 16 },
  { id: 47, book_name_ko: '고린도후서', book_name_en: '2 Corinthians', testament: 'NEW', book_number: 47, chapter_count: 13 },
  { id: 48, book_name_ko: '갈라디아서', book_name_en: 'Galatians', testament: 'NEW', book_number: 48, chapter_count: 6 },
  { id: 49, book_name_ko: '에베소서', book_name_en: 'Ephesians', testament: 'NEW', book_number: 49, chapter_count: 6 },
]

// Mock 장 데이터
export const mockBibleChapter: BibleChapterResponse = {
  book_name_ko: '요한복음',
  book_name_en: 'John',
  chapter: 3,
  verses: [
    { id: 1, book_id: 43, book_name_ko: '요한복음', chapter: 3, verse: 1, text: '그런데 바리새인 중에 니고데모라 하는 사람이 있으니 유대인의 지도자라' },
    { id: 2, book_id: 43, book_name_ko: '요한복음', chapter: 3, verse: 2, text: '그가 밤에 예수께 와서 이르되 랍비여 우리가 당신은 하나님께로부터 오신 선생인 줄 아나이다 하나님이 함께 하시지 아니하시면 당신이 행하시는 이 표적을 아무도 할 수 없음이니이다' },
    { id: 3, book_id: 43, book_name_ko: '요한복음', chapter: 3, verse: 3, text: '예수께서 대답하여 이르시되 진실로 진실로 네게 이르노니 사람이 거듭나지 아니하면 하나님의 나라를 볼 수 없느니라' },
    { id: 4, book_id: 43, book_name_ko: '요한복음', chapter: 3, verse: 16, text: '하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 그를 믿는 자마다 멸망하지 않고 영생을 얻게 하려 하심이라' },
  ]
}

// Mock 검색 결과
export const mockSearchResults: BibleSearchResult = {
  total: 2,
  results: [
    { id: 1, book_id: 43, book_name_ko: '요한복음', chapter: 3, verse: 16, text: '하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 그를 믿는 자마다 멸망하지 않고 영생을 얻게 하려 하심이라' },
    { id: 2, book_id: 45, book_name_ko: '로마서', chapter: 5, verse: 8, text: '우리가 아직 죄인 되었을 때에 그리스도께서 우리를 위하여 죽으심으로 하나님께서 우리에 대한 자기의 사랑을 확증하셨느니라' },
  ]
}

// Mock API 함수들
export const getMockBibleBooks = async (): Promise<BibleBook[]> => {
  // 실제 API 호출처럼 약간의 지연 추가
  await new Promise(resolve => setTimeout(resolve, 500))
  return mockBibleBooks
}

export const getMockBibleChapter = async (_bookId: number, chapter: number): Promise<BibleChapterResponse> => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return {
    ...mockBibleChapter,
    chapter: chapter,
  }
}

export const getMockBibleSearch = async (_keyword: string): Promise<BibleSearchResult> => {
  await new Promise(resolve => setTimeout(resolve, 400))
  return mockSearchResults
}
