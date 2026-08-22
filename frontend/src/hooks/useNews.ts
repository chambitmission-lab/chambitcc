// 교회소식 게시판 훅 (Single Responsibility: 소식 목록/상세 조회 캐시)
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchNewsCategories, fetchNewsDetail, fetchNewsList } from '../api/news'
import type { NewsDetail, NewsItem, NewsListResponse } from '../types/news'

export const newsKeys = {
  all: ['church-news'] as const,
  list: (category?: string, search?: string) =>
    ['church-news', 'list', category ?? '', search ?? ''] as const,
  categories: ['church-news', 'categories'] as const,
  detail: (id: number) => ['church-news', 'detail', id] as const,
}

export const useNewsList = (
  options: { category?: string; search?: string; limit?: number } = {},
) => {
  const { category, search, limit = 10 } = options

  const query = useInfiniteQuery<NewsListResponse>({
    queryKey: newsKeys.list(category, search),
    queryFn: ({ pageParam = 1 }) =>
      fetchNewsList(pageParam as number, limit, { category, search }),
    getNextPageParam: (lastPage) => {
      const { page, limit: pageLimit, items } = lastPage.data
      return items.length === pageLimit ? page + 1 : undefined
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 2, // 2분
    // 전역 refetchOnMount:false + 영속 캐시의 예외 —
    // 관리자 등록은 react-query 밖(raw fetch)이라 이 캐시를 안 건드린다.
    // 진입할 때마다 최신 목록을 받아 새 소식이 바로 뜨게 한다.
    refetchOnMount: 'always',
  })

  const items: NewsItem[] = query.data?.pages.flatMap((p) => p.data.items) ?? []
  const total = query.data?.pages[0]?.data.total ?? 0

  return { ...query, items, total }
}

export const useNewsCategories = () =>
  useQuery({
    queryKey: newsKeys.categories,
    queryFn: fetchNewsCategories,
    staleTime: 1000 * 60 * 10,
  })

/** 상세 — 열 때마다 조회수가 오르므로 캐시를 짧게 두고 재요청은 아끼지 않는다 */
export const useNewsDetail = (newsId: number | null) =>
  useQuery<NewsDetail>({
    queryKey: newsKeys.detail(newsId ?? 0),
    queryFn: () => fetchNewsDetail(newsId as number),
    enabled: newsId !== null,
    staleTime: 1000 * 60,
  })

/** 등록·수정·삭제 후 목록/분류를 한 번에 새로고침 */
export const useInvalidateNews = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: newsKeys.all })
}
