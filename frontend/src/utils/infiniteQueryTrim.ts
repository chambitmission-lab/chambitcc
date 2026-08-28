import type { InfiniteData, QueryClient, QueryKey } from '@tanstack/react-query'

/** 무한 쿼리는 refetch 할 때 지금까지 받은 페이지를 "전부 순차로" 다시 요청한다.
 *  10페이지를 내려간 피드는 탭 복귀 한 번에 10번 왕복이 된다. 그래서 다시 받기 전에
 *  앞쪽 몇 페이지만 남기고 잘라 낸다 — 남은 페이지는 사용자가 다시 내려가면 자연히 채워진다.
 *  (`maxPages` 옵션은 getPreviousPageParam 없이는 스크롤 중 위쪽 페이지가 사라져 쓰지 않는다) */
export const trimInfiniteQuery = (
  queryClient: QueryClient,
  queryKey: QueryKey,
  keepPages = 1,
): void => {
  queryClient.setQueriesData<InfiniteData<unknown>>({ queryKey }, (prev) => {
    if (!prev || !Array.isArray(prev.pages) || prev.pages.length <= keepPages) return prev
    return {
      pages: prev.pages.slice(0, keepPages),
      pageParams: prev.pageParams.slice(0, keepPages),
    }
  })
}

/** 페이지 수가 적을 때만 자동 refetch 를 허용하는 판정 — refetchOnMount/refetchOnWindowFocus 에 넘긴다 */
export const refetchIfFewPages =
  (maxPages = 2) =>
  (query: { state: { data?: unknown } }): boolean => {
    const data = query.state.data as InfiniteData<unknown> | undefined
    return !data || !Array.isArray(data.pages) || data.pages.length <= maxPages
  }
