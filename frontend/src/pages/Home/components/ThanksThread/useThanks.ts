import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import {
  createThanks,
  deleteThanks,
  getThanksList,
  toggleThanksAmen,
} from '../../../../api/thanks'
import type { CreateThanksRequest, Thanks } from '../../../../types/thanks'

// /thanks 페이지의 무한스크롤과 ticker가 같은 캐시를 공유한다.
export const THANKS_PAGE_SIZE = 20

interface UseThanksOptions {
  /** 표시할 최대 개수 (ticker/thread용 슬라이스) */
  limit?: number
}

export interface ThanksPage {
  items: Thanks[]
  total: number
  page: number
}

export type ThanksInfiniteData = InfiniteData<ThanksPage, number>

export const thanksKeys = {
  all: ['thanks'] as const,
  lists: () => [...thanksKeys.all, 'list'] as const,
  /** ticker / Thanks 페이지 공통 키 */
  infinite: (pageSize: number) =>
    [...thanksKeys.lists(), 'infinite', pageSize] as const,
  /** @deprecated infinite로 통합됨. 외부 호출자 호환용 */
  firstPage: (pageSize: number) => thanksKeys.infinite(pageSize),
}

export const useThanks = ({ limit = THANKS_PAGE_SIZE }: UseThanksOptions = {}) => {
  const queryClient = useQueryClient()
  const queryKey = thanksKeys.infinite(THANKS_PAGE_SIZE)

  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 1 }): Promise<ThanksPage> => {
      const data = await getThanksList(pageParam, THANKS_PAGE_SIZE)
      return { items: data.items, total: data.total, page: pageParam }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.items.length, 0)
      return loaded < lastPage.total ? lastPage.page + 1 : undefined
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
  })

  const firstPageItems = query.data?.pages[0]?.items ?? []
  const items = firstPageItems.slice(0, limit)
  const total = query.data?.pages[0]?.total ?? 0

  const updatePages = (
    updater: (page: ThanksPage, index: number) => ThanksPage,
  ) => {
    queryClient.setQueryData<ThanksInfiniteData>(queryKey, (prev) => {
      if (!prev) return prev
      return { ...prev, pages: prev.pages.map(updater) }
    })
  }

  const addMutation = useMutation({
    mutationFn: (payload: CreateThanksRequest) => createThanks(payload),
    onSuccess: (created) => {
      updatePages((page, idx) =>
        idx === 0
          ? { ...page, items: [created, ...page.items], total: page.total + 1 }
          : { ...page, total: page.total + 1 },
      )
    },
  })

  const removeMutation = useMutation({
    mutationFn: (id: number) => deleteThanks(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<ThanksInfiniteData>(queryKey)
      updatePages((page) => ({
        ...page,
        items: page.items.filter((t) => t.id !== id),
        total: Math.max(0, page.total - 1),
      }))
      return { previous }
    },
    onError: (_e, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
    },
  })

  const amenMutation = useMutation({
    mutationFn: (id: number) => toggleThanksAmen(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<ThanksInfiniteData>(queryKey)
      updatePages((page) => ({
        ...page,
        items: page.items.map((t) =>
          t.id === id
            ? {
                ...t,
                is_amened: !t.is_amened,
                amen_count: t.is_amened
                  ? Math.max(0, t.amen_count - 1)
                  : t.amen_count + 1,
              }
            : t,
        ),
      }))
      return { previous }
    },
    onSuccess: (res, id) => {
      updatePages((page) => ({
        ...page,
        items: page.items.map((t) =>
          t.id === id
            ? { ...t, is_amened: res.is_amened, amen_count: res.amen_count }
            : t,
        ),
      }))
    },
    onError: (_e, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
    },
  })

  return {
    items,
    loading: query.isLoading,
    error: query.error as Error | null,
    total,
    add: (payload: CreateThanksRequest) =>
      addMutation.mutateAsync(payload).then(() => undefined),
    remove: (id: number) => removeMutation.mutateAsync(id).then(() => undefined),
    amen: (id: number) => amenMutation.mutateAsync(id).then(() => undefined),
  }
}
