import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { getBibleBooks, getBibleChapter, getBibleVerse, searchBible, getBibleChapterPaginated, getBibleChapterAudio } from '../api/bible'
import type { BibleTTSVoice } from '../types/bible'

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

// 성경 검색
export const useBibleSearch = (keyword: string, page: number = 1) => {
  return useQuery({
    queryKey: ['bible', 'search', keyword, page],
    queryFn: () => searchBible(keyword, page),
    enabled: keyword.length > 0,
    staleTime: 1000 * 60 * 60 * 24, // 24시간
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7일
    retry: 1,
  })
}

// 장 오디오북(TTS) URL 조회
// enabled=false 로 두었다가, 사용자가 재생을 누른 시점에만 활성화한다
// (모든 장을 열 때마다 TTS를 생성하지 않도록 지연 로딩).
export const useBibleChapterAudio = (
  bookNumber: number,
  chapter: number,
  voice: BibleTTSVoice = 'female',
  enabled: boolean = false
) => {
  return useQuery({
    queryKey: ['bible', 'tts', bookNumber, chapter, voice],
    queryFn: () => getBibleChapterAudio(bookNumber, chapter, voice),
    enabled: enabled && bookNumber > 0 && chapter > 0,
    staleTime: Infinity, // 본문 불변 → 한 번 받은 URL은 영구 재사용
    gcTime: 1000 * 60 * 60 * 24, // 24시간
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
    staleTime: 1000 * 60 * 60 * 24, // 24시간
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7일
  })
}
