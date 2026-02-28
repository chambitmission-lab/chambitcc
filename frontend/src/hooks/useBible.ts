import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { getBibleBooks, getBibleChapter, getBibleVerse, searchBible, getBibleChapterPaginated } from '../api/bible'

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
    retry: 1,
  })
}

// 무한 스크롤 장 조회
export const useBibleChapterInfinite = (bookNumber: number, chapter: number, enabled: boolean = true) => {
  return useInfiniteQuery({
    queryKey: ['bible', 'chapter', 'infinite', bookNumber, chapter],
    queryFn: ({ pageParam = 1 }) => getBibleChapterPaginated(bookNumber, chapter, pageParam, 20),
    enabled: enabled && bookNumber > 0 && chapter > 0,
    getNextPageParam: (lastPage) => {
      return lastPage.has_more ? lastPage.current_page + 1 : undefined
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 60, // 1시간
  })
}
