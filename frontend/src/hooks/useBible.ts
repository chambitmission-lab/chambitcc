import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import type { BibleSearchResult } from '../types/bible'
import { getBibleBooks, getBibleChapter, getBibleVerse, searchBible, getBibleChapterPaginated } from '../api/bible'

// 성경 책 목록
export const useBibleBooks = () => {
  return useQuery({
    queryKey: ['bible', 'books'],
    queryFn: getBibleBooks,
    staleTime: 1000 * 60 * 60 * 24, // 24시간
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7일
  })
}

// 특정 장 읽기 - 책 ID 사용
export const useBibleChapter = (bookId: number, chapter: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['bible', 'chapter', bookId, chapter],
    queryFn: () => getBibleChapter(bookId, chapter),
    enabled: enabled && bookId > 0 && chapter > 0,
    staleTime: 1000 * 60 * 60 * 24, // 24시간
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7일
  })
}

// 특정 구절 조회
export const useBibleVerse = (book: string, chapter: number, verse: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['bible', 'verse', book, chapter, verse],
    queryFn: () => getBibleVerse(book, chapter, verse),
    enabled: enabled && !!book && chapter > 0 && verse > 0,
    staleTime: 1000 * 60 * 60 * 24, // 24시간
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7일
  })
}

// 검색 한 페이지 크기 — 스크롤로 이어 받으므로 작게 유지한다
export const BIBLE_SEARCH_PAGE_SIZE = 30

// 성경 검색 (첫 페이지만) — 말씀 고르기 시트처럼 스크롤 페이징이 필요 없는 곳에서 사용
export const useBibleSearch = (keyword: string, limit: number = BIBLE_SEARCH_PAGE_SIZE) => {
  return useQuery({
    queryKey: ['bible', 'search', keyword, limit],
    queryFn: () => searchBible(keyword, { limit }),
    // 백엔드가 2글자 미만을 400으로 막으므로 헛요청을 보내지 않는다
    enabled: keyword.trim().length >= 2,
    staleTime: 1000 * 60 * 60 * 24, // 24시간
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7일
    retry: 1,
  })
}

// 성경 검색 (무한 스크롤) — 키워드 검색만 페이징되고, 책·장 검색은 has_more=false로 한 번에 온다
export const useBibleSearchInfinite = (
  keyword: string,
  testament?: 'OLD' | 'NEW',
  bookNumber?: number
) => {
  return useInfiniteQuery({
    queryKey: ['bible', 'search', 'infinite', keyword, testament ?? 'ALL', bookNumber ?? 0],
    // 구약/신약 범위나 책 칩만 바꿀 때는 키가 바뀌어도 이전 결과를 placeholder로 유지 —
    // 안 그러면 결과 전체가 스피너로 갈렸다가 다시 그려져 깜빡인다.
    // 검색어 자체가 바뀌면 옛 결과를 보여 줄 이유가 없으니(하이라이트도 어긋남) 유지하지 않는다.
    placeholderData: (
      prev: InfiniteData<BibleSearchResult, number> | undefined,
      prevQuery: { queryKey: readonly unknown[] } | undefined
    ) => (prevQuery && prevQuery.queryKey[3] === keyword ? prev : undefined),
    queryFn: ({ pageParam }) =>
      searchBible(keyword, { offset: pageParam, limit: BIBLE_SEARCH_PAGE_SIZE, testament, bookNumber }),
    enabled: keyword.trim().length >= 2,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.has_more) return undefined
      // 다음 offset은 지금까지 받은 절 수 (서버 정렬이 책·장·절 순으로 고정)
      return allPages.reduce((n, p) => n + p.results.length, 0)
    },
    initialPageParam: 0,
    staleTime: 1000 * 60 * 60 * 24, // 24시간
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7일
    retry: 1,
  })
}

// 오디오북(TTS)은 BibleAudioPlayer가 백엔드 스트리밍 엔드포인트를
// `<audio src>` 로 직접 가리켜 재생하므로 별도 훅이 필요 없다.

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
    staleTime: 1000 * 60 * 60 * 24, // 24시간
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7일
  })
}
