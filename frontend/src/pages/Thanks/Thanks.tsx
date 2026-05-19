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
    <div className="bg-gray-50 dark:bg-background-dark min-h-screen">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen border-x border-black/[0.04] dark:border-white/[0.06]">
        {/* Sticky 헤더 — 컴팩트 네비 */}
        <div className="sticky top-14 z-10 backdrop-blur-xl bg-background-light/85 dark:bg-background-dark/85 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div className="px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 -ml-1 flex items-center justify-center rounded-full text-gray-600 dark:text-white/70 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-500/5 dark:hover:bg-purple-500/10 transition-colors"
              aria-label={language === 'ko' ? '뒤로' : 'Back'}
            >
              <span className="material-icons-outlined text-[22px]">arrow_back</span>
            </button>
            <h1 className="text-[15px] font-bold tracking-[-0.01em] text-gray-900 dark:text-white">
              {language === 'ko' ? '오늘의 감사' : 'Today’s Thanks'}
            </h1>
            <button
              onClick={handleOpenComposer}
              className="w-9 h-9 -mr-1 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/30 hover:shadow-lg hover:shadow-purple-500/40 transition-all"
              aria-label={language === 'ko' ? '감사 나누기' : 'Share thanks'}
            >
              <span className="material-icons-round text-[20px]">add</span>
            </button>
          </div>
        </div>

        {/* Hero 카드 — 보조 페이지 Hero + brand 그라데이션 카운트 */}
        <section className="px-4 pt-4">
          <article className="relative overflow-hidden rounded-2xl border border-black/[0.05] dark:border-white/[0.08] bg-background-light dark:bg-[#1c1c26] shadow-[0_8px_32px_rgba(168,85,247,0.10)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.45),0_8px_28px_rgba(168,85,247,0.18),inset_0_1px_0_rgba(255,255,255,0.05)]">
            {/* 좌측 3px 그라데이션 액센트 라인 */}
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-purple-500 to-pink-500" />
            {/* 보랏빛 글로우 */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-br from-purple-400/15 to-pink-400/10 dark:from-purple-500/15 dark:to-pink-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-10 w-32 h-32 bg-gradient-to-br from-pink-400/10 to-purple-400/10 dark:from-pink-500/10 dark:to-purple-500/8 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 p-5 flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/15 to-pink-500/15 dark:from-purple-500/20 dark:to-pink-500/20 border border-purple-500/20 dark:border-purple-400/20 flex items-center justify-center">
                <span className="material-icons-round text-[24px] bg-gradient-to-br from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  volunteer_activism
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-purple-600 dark:text-purple-300">
                    GRATITUDE
                  </span>
                  {total > 0 && (
                    <span className="text-[11px] font-bold tabular-nums bg-gradient-to-br from-purple-500 to-pink-500 bg-clip-text text-transparent">
                      {total}
                      {language === 'ko' ? '개' : ''}
                    </span>
                  )}
                </div>
                <h2 className="text-[20px] font-bold tracking-[-0.015em] leading-[1.3] text-gray-900 dark:text-white mb-1.5">
                  {language === 'ko' ? '오늘의 감사' : 'Today’s Thanks'}
                </h2>
                <p className="text-[13px] leading-[1.6] text-gray-600 dark:text-white/60">
                  {language === 'ko'
                    ? '일상 속 작은 감사를 함께 나눕니다'
                    : 'Share the little joys of daily life'}
                </p>
              </div>
            </div>
          </article>
        </section>

        {/* List */}
        <div className="px-4 pt-4 pb-24 space-y-3">
          {items.length === 0 && !query.isLoading ? (
            <button
              onClick={handleOpenComposer}
              className="w-full text-left p-6 rounded-2xl border border-dashed border-purple-300/60 dark:border-purple-400/30 bg-purple-50/40 dark:bg-purple-500/[0.06] text-[14px] text-purple-700 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors flex items-center gap-2"
            >
              <span className="material-icons-round text-[18px] text-purple-500 dark:text-purple-300">
                add_circle_outline
              </span>
              <span>
                {language === 'ko'
                  ? '오늘 첫 감사를 나눠주세요'
                  : 'Be the first to share thanks today'}
              </span>
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
              <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 dark:border-purple-400/30 dark:border-t-purple-300 rounded-full animate-spin" />
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
