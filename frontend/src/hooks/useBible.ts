import { useQuery } from '@tanstack/react-query'
import { getBibleBooks, getBibleChapter, getBibleVerse, searchBible } from '../api/bible'

// 성경 책 목록
export const useBibleBooks = () => {
  return useQuery({
    queryKey: ['bible', 'books'],
    queryFn: getBibleBooks,
    staleTime: 1000 * 60 * 60 * 24, // 24시간
  })
}

// 특정 장 읽기 - 책 ID 사용
export const useBibleChapter = (bookId: number, chapter: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['bible', 'chapter', bookId, chapter],
    queryFn: () => getBibleChapter(bookId, chapter),
    enabled: enabled && bookId > 0 && chapter > 0,
    staleTime: 1000 * 60 * 60, // 1시간
  })
}

// 특정 구절 조회
export const useBibleVerse = (book: string, chapter: number, verse: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['bible', 'verse', book, chapter, verse],
    queryFn: () => getBibleVerse(book, chapter, verse),
    enabled: enabled && !!book && chapter > 0 && verse > 0,
    staleTime: 1000 * 60 * 60, // 1시간
  })
}

// 성경 검색
export const useBibleSearch = (keyword: string, page: number = 1) => {
  return useQuery({
    queryKey: ['bible', 'search', keyword, page],
    queryFn: () => searchBible(keyword, page),
    enabled: keyword.length > 0,
    staleTime: 1000 * 60 * 5, // 5분
  })
}
