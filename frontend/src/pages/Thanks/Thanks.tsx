import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import {
  createThanks,
  deleteThanks,
  getThanksList,
  toggleThanksAmen,
} from '../../api/thanks'
import { useLanguage } from '../../contexts/LanguageContext'
import { useAuth } from '../../hooks/useAuth'
import {
  THANKS_PAGE_SIZE,
  thanksKeys,
  type ThanksInfiniteData,
  type ThanksPage,
} from '../Home/components/ThanksThread/useThanks'
import type { CreateThanksRequest } from '../../types/thanks'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import ThanksCard from '../Home/components/ThanksThread/ThanksCard'
import ThanksComposer from '../Home/components/ThanksThread/ThanksComposer'

const Thanks = () => {
  const { language } = useLanguage()
  const { requireAuth } = useAuth()
  const navigate = useNavigate()
  const admin = isAdmin()
  const queryClient = useQueryClient()

  const sentinelRef = useRef<HTMLDivElement>(null)
  const [showComposer, setShowComposer] = useState(false)

  // ticker(useThanks)와 동일한 키 → 캐시 공유
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

  const items = query.data?.pages.flatMap((p) => p.items) ?? []
  const total = query.data?.pages[0]?.total ?? 0

  const updatePages = (
    updater: (page: ThanksPage, index: number) => ThanksPage,
  ) => {
    queryClient.setQueryData<ThanksInfiniteData>(queryKey, (prev) => {
      if (!prev) return prev
      return { ...prev, pages: prev.pages.map(updater) }
    })
  }

  // 무한 스크롤
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          query.hasNextPage &&
          !query.isFetchingNextPage
        ) {
          query.fetchNextPage()
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [query])

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
      showToast(language === 'ko' ? '실패했습니다' : 'Failed', 'error')
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
    onSuccess: () => {
      showToast(language === 'ko' ? '삭제되었습니다' : 'Deleted', 'success')
    },
    onError: (_e, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
      showToast(language === 'ko' ? '실패했습니다' : 'Failed', 'error')
    },
  })

  const handleAdd = async (payload: CreateThanksRequest) => {
    await addMutation.mutateAsync(payload)
  }

  const handleAmen = (id: number) => {
    requireAuth(() => amenMutation.mutate(id))
  }

  const handleDelete = async (id: number) => {
    const ok = window.confirm(
      language === 'ko' ? '이 감사를 삭제할까요?' : 'Delete this thanks?',
    )
    if (!ok) return
    removeMutation.mutate(id)
  }

  const handleOpenComposer = () => requireAuth(() => setShowComposer(true))
  const showSpinner = query.isLoading || query.isFetchingNextPage

  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen">
        {/* Header */}
        <div className="sticky top-14 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark">
          <div className="px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="p-1 -ml-1 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
              aria-label={language === 'ko' ? '뒤로' : 'Back'}
            >
              <span className="material-icons-outlined">arrow_back</span>
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center justify-center gap-1.5">
                <span>🙏</span>
                <span>{language === 'ko' ? '오늘의 감사' : 'Today’s Thanks'}</span>
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {language === 'ko'
                  ? '일상 속 작은 감사를 함께 나눕니다'
                  : 'Share the little joys of daily life'}
                {total > 0 && ` · ${total}`}
              </p>
            </div>
            <button
              onClick={handleOpenComposer}
              className="p-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-sm"
              aria-label={language === 'ko' ? '감사 나누기' : 'Share thanks'}
            >
              <span className="material-icons-outlined text-base">add</span>
            </button>
          </div>
        </div>

        {/* List */}
        <div className="p-4 space-y-3">
          {items.length === 0 && !query.isLoading ? (
            <button
              onClick={handleOpenComposer}
              className="w-full text-left p-6 rounded-2xl border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10 text-sm text-amber-800 dark:text-amber-200 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
            >
              {language === 'ko'
                ? '☕ 오늘 첫 감사를 나눠주세요'
                : '☕ Be the first to share thanks today'}
            </button>
          ) : (
            items.map((t) => (
              <ThanksCard
                key={t.id}
                thanks={t}
                canDelete={t.is_mine || admin}
                onAmen={handleAmen}
                onDelete={handleDelete}
                variant="list"
              />
            ))
          )}

          {showSpinner && (
            <div className="flex items-center justify-center py-6">
              <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-1" />
        </div>

        {showComposer && (
          <ThanksComposer
            onClose={() => setShowComposer(false)}
            onSubmit={handleAdd}
          />
        )}
      </div>
    </div>
  )
}

export default Thanks
