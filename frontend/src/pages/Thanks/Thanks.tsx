import { useEffect, useMemo, useRef, useState } from 'react'
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
import type { CreateThanksRequest, Thanks as ThanksItem } from '../../types/thanks'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import ThanksCard from '../Home/components/ThanksThread/ThanksCard'
import ThanksComposer from '../Home/components/ThanksThread/ThanksComposer'
import ThanksAvatar from '../Home/components/ThanksThread/ThanksAvatar'
import gratitudeHero from '../../assets/hero/gratitude.jpg'
import '../Home/components/ThanksThread/thanks.css'
import { confirmDialog } from '../../utils/confirmDialog'

/* 히어로에 하루 하나씩 도는 감사 말씀 */
const THANKS_VERSES = [
  { ko: '범사에 감사하라', en: 'Give thanks in all circumstances', ref: '살전 5:18', refEn: '1 Thess 5:18' },
  { ko: '감사함으로 그의 문에 들어가며', en: 'Enter his gates with thanksgiving', ref: '시 100:4', refEn: 'Psalm 100:4' },
  { ko: '여호와께 감사하라 그는 선하시며', en: 'Give thanks to the Lord, for he is good', ref: '시 107:1', refEn: 'Psalm 107:1' },
  { ko: '항상 기뻐하라 쉬지 말고 기도하라', en: 'Rejoice always, pray continually', ref: '살전 5:16-17', refEn: '1 Thess 5:16-17' },
  { ko: '온갖 좋은 은사는 위로부터 내려오나니', en: 'Every good gift is from above', ref: '약 1:17', refEn: 'James 1:17' },
  { ko: '내 영혼아 여호와를 송축하라', en: 'Praise the Lord, my soul', ref: '시 103:1', refEn: 'Psalm 103:1' },
  { ko: '이 날은 여호와께서 정하신 것이라', en: 'This is the day the Lord has made', ref: '시 118:24', refEn: 'Psalm 118:24' },
]

/* 하루 단위로 도는 말씀 — 렌더 중 시각을 읽지 않도록 모듈 로드 시 한 번 고른다 */
const TODAYS_VERSE =
  THANKS_VERSES[Math.floor(Date.now() / 86_400_000) % THANKS_VERSES.length]

/** 히어로 아바타 스택에 얼굴을 띄우는 최대 인원 — 넘으면 "+N"으로 접는다 */
const MAX_HERO_AVATARS = 4

/** created_at은 KST 벽시계 문자열(예: 2026-07-30T22:10:00) — 날짜 부분만 그대로 쓴다 */
const dateKeyOf = (iso: string) => (iso || '').slice(0, 10)

const kstDateKey = (offsetDays = 0) => {
  const now = new Date()
  now.setDate(now.getDate() + offsetDays)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(now)
}

const Thanks = () => {
  const { language } = useLanguage()
  const ko = language === 'ko'
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
      return {
        items: data.items,
        total: data.total,
        page: pageParam,
        authorCount: data.author_count ?? 0,
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.items.length, 0)
      return loaded < lastPage.total ? lastPage.page + 1 : undefined
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
  })

  const items = useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  )
  const total = query.data?.pages[0]?.total ?? 0

  // 날짜별 묶음 — 오늘 / 어제 / 그 이전
  const groups = useMemo(() => {
    const today = kstDateKey()
    const yesterday = kstDateKey(-1)
    const buckets: { key: string; label: string; items: ThanksItem[] }[] = []

    items.forEach((item) => {
      const key = dateKeyOf(item.created_at) || 'unknown'
      let label: string
      if (key === today) label = ko ? '오늘' : 'Today'
      else if (key === yesterday) label = ko ? '어제' : 'Yesterday'
      else if (key === 'unknown') label = ko ? '지난 감사' : 'Earlier'
      else {
        const [, m, d] = key.split('-')
        label = ko ? `${Number(m)}월 ${Number(d)}일` : `${m}/${d}`
      }

      const last = buckets[buckets.length - 1]
      if (last && last.key === key) last.items.push(item)
      else buckets.push({ key, label, items: [item] })
    })

    return buckets
  }, [items, ko])

  // 최근 감사를 나눈 사람들 (히어로 아바타 스택) — 같은 사람은 한 번만
  const recentAuthors = useMemo(() => {
    const seen = new Map<number, ThanksItem>()
    for (const item of items) {
      if (!seen.has(item.user_id)) seen.set(item.user_id, item)
      if (seen.size >= MAX_HERO_AVATARS) break
    }
    return [...seen.values()]
  }, [items])

  // 아바타에 담기지 못한 나머지 인원 → "+N" 칩.
  // 서버 집계(authorCount)를 쓰되, 방금 쓴 새 작성자가 아직 반영 안 됐을 수 있어
  // 로드된 목록의 고유 작성자 수와 큰 쪽을 택한다.
  const loadedAuthorCount = useMemo(
    () => new Set(items.map((item) => item.user_id)).size,
    [items],
  )
  const hiddenAuthorCount = Math.max(
    0,
    Math.max(query.data?.pages[0]?.authorCount ?? 0, loadedAuthorCount) -
      recentAuthors.length,
  )

  const verse = TODAYS_VERSE

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
      showToast(ko ? '실패했습니다' : 'Failed', 'error')
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
      showToast(ko ? '삭제되었습니다' : 'Deleted', 'success')
    },
    onError: (_e, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
      showToast(ko ? '실패했습니다' : 'Failed', 'error')
    },
  })

  const handleAdd = async (payload: CreateThanksRequest) => {
    await addMutation.mutateAsync(payload)
  }

  const handleAmen = (id: number) => {
    requireAuth(() => amenMutation.mutate(id))
  }

  const handleDelete = async (id: number) => {
    const ok = await confirmDialog({
      title: ko ? '감사 삭제' : 'Delete thanks',
      message: ko ? '이 감사를 삭제할까요?' : 'Delete this thanks?',
      description: ko ? '삭제된 내용은 복구할 수 없습니다.' : 'This cannot be undone.',
      confirmText: ko ? '삭제' : 'Delete',
      icon: 'delete_outline',
    })
    if (!ok) return
    removeMutation.mutate(id)
  }

  const handleOpenComposer = () => requireAuth(() => setShowComposer(true))
  const showSpinner = query.isLoading || query.isFetchingNextPage
  const isEmpty = items.length === 0 && !query.isLoading

  // lg 에서 이 페이지만 스스로 스크롤하는 상자로 만든다 — #root 의 overflow-y 탓에
  // sticky 가 전역으로 죽어 있어, 이 상자를 만들어야 우측 레일 sticky 가 산다.
  // 같은 이유로 셸에 lg:overflow-hidden 을 주면 안 된다(셸이 sticky 의 스크롤 조상이 된다).
  return (
    <div className="min-h-screen bg-[var(--surface)] page-stage lg:h-[calc(100vh-56px)] lg:min-h-0 lg:overflow-y-auto">
      <div className="max-w-md mx-auto min-h-screen bg-[var(--surface)] border-x border-[var(--card-border)] lg:max-w-[1100px] lg:mt-2 lg:mb-12 lg:rounded-3xl lg:border lg:min-h-0">
        {/* Sticky 헤더 — lg+에선 셸의 overflow-hidden 때문에 sticky 기준이 셸이 되어
            top-14만큼 아래로 밀려 콘텐츠를 덮으므로(고정도 안 됨) 일반 흐름으로 되돌린다 */}
        <div
          className="sticky top-14 lg:static lg:rounded-t-3xl z-10 backdrop-blur-xl border-b border-[var(--card-border)]"
          style={{ background: 'var(--glass-bg)' }}
        >
          <div className="px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 -ml-1 flex items-center justify-center rounded-full text-ink hover:text-brand hover:bg-[var(--brand-soft)] transition-colors"
              aria-label={ko ? '뒤로' : 'Back'}
            >
              <span className="material-icons-outlined text-[22px]">arrow_back</span>
            </button>
            <h1 className="text-[15px] font-bold tracking-[-0.01em] text-ink-strong">
              {ko ? '오늘의 감사' : 'Today’s Thanks'}
            </h1>
            <span className="w-9 h-9" aria-hidden />
          </div>
        </div>

        {/* PC(lg+) 2단 — 좌: 감사 피드 / 우: 히어로(오늘의 말씀·집계·참여자) + 쓰기 버튼이 sticky.
            래퍼 3개는 lg 미만에서 display:contents 라 모바일 흐름은 기존과 완전히 동일하다. */}
        <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6 lg:items-start lg:px-5 lg:pt-4">
          <div className="contents lg:block lg:col-start-2 lg:row-start-1 lg:sticky lg:top-3">
            {/* Hero — 추수의 들녘 사진 + 오늘의 감사 말씀 */}
            <section className="px-4 pt-4 lg:p-0">
              <article
                className="relative overflow-hidden rounded-[22px] px-5 py-5 min-h-[232px] flex flex-col justify-end text-white"
                style={{
                  background: 'var(--brand)',
                  boxShadow: '0 12px 30px var(--brand-glow)',
                }}
              >
                {/* 사진 — 해 뜨는 밀밭(추수의 감사) */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: `url(${gratitudeHero})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center 62%',
                  }}
                  aria-hidden
                />
                {/* 브랜드 블루 워시 — 왼쪽(글씨 자리)은 진하게, 오른쪽 해는 살려둔다 */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(100deg, rgba(21,68,158,0.92) 0%, rgba(30,96,206,0.62) 44%, rgba(49,130,246,0.10) 100%)',
                  }}
                  aria-hidden
                />
                {/* 하단 가독성 스크림 */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(6,22,55,0) 38%, rgba(6,22,55,0.42) 74%, rgba(6,22,55,0.78) 100%)',
                  }}
                  aria-hidden
                />

                <div
                  className="relative"
                  style={{ textShadow: '0 1px 14px rgba(4,16,44,0.45)' }}
                >
                  <div className="flex items-center gap-1.5 mb-3 text-[11px] font-bold tracking-[0.1em] opacity-90">
                    <span className="material-icons-round text-[15px]">volunteer_activism</span>
                    GRATITUDE
                  </div>

                  <p
                    className="text-[19px] font-extrabold leading-[1.4] tracking-[-0.02em]"
                    style={{
                      // 한글은 어절 단위로만 줄바꿈(‘내려오나 / 니’ 방지) + 두 줄일 때 길이 균형
                      wordBreak: 'keep-all',
                      overflowWrap: 'break-word',
                      textWrap: 'balance',
                    }}
                  >
                    “{ko ? verse.ko : verse.en}”
                  </p>
                  <p className="mt-1 text-[12px] font-semibold opacity-85">
                    {ko ? verse.ref : verse.refEn}
                  </p>

                  <div className="mt-4 pt-3.5 border-t border-white/25 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold">
                        {ko ? `지금까지 ${total}개의 감사` : `${total} thanks so far`}
                      </p>
                      <p className="text-[11.5px] opacity-80 mt-0.5">
                        {ko
                          ? '한 줄이 모여 우리 교회의 하루가 돼요'
                          : 'One line at a time, our church’s day'}
                      </p>
                    </div>

                    {recentAuthors.length > 0 && (
                      <div
                        className="flex -space-x-2 shrink-0"
                        role="img"
                        aria-label={
                          ko
                            ? `${recentAuthors.length + hiddenAuthorCount}명이 감사를 나눴어요`
                            : `${recentAuthors.length + hiddenAuthorCount} people shared thanks`
                        }
                      >
                        {recentAuthors.map((author) => (
                          <ThanksAvatar
                            key={author.user_id}
                            name={author.display_name}
                            avatarUrl={author.avatar_url}
                            size={28}
                            tone="onBrand"
                          />
                        ))}
                        {hiddenAuthorCount > 0 && (
                          <span
                            className="shrink-0 rounded-full flex items-center justify-center font-bold text-white"
                            style={{
                              width: 28,
                              height: 28,
                              fontSize: 11,
                              letterSpacing: '-0.02em',
                              background: 'rgba(255,255,255,0.22)',
                              backdropFilter: 'blur(2px)',
                              boxShadow: '0 0 0 1px rgba(255,255,255,0.35)',
                            }}
                            aria-hidden
                          >
                            +{hiddenAuthorCount}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            </section>

            {/* PC 전용 쓰기 버튼 — lg 에선 FAB 를 감추고 레일에서 늘 보이게 한다 */}
            <button
              onClick={handleOpenComposer}
              className="hidden lg:flex mt-3 w-full items-center justify-center gap-2 h-12 rounded-2xl bg-brand text-[var(--on-brand)] text-[14.5px] font-extrabold tracking-[-0.01em] shadow-[0_10px_26px_var(--brand-glow)] hover:bg-brand-dim active:scale-[0.98] transition-all"
            >
              <span className="material-icons-round text-[19px]">edit</span>
              {ko ? '감사 남기기' : 'Share thanks'}
            </button>
          </div>

          <div className="contents lg:block lg:col-start-1 lg:row-start-1 lg:min-w-0">
            {/* List */}
            <div className="px-4 pt-5 pb-28 lg:px-0 lg:pt-0 lg:pb-8">
              {isEmpty ? (
                <button
                  onClick={handleOpenComposer}
                  className="w-full p-7 rounded-2xl border border-dashed border-[var(--card-border)] hover:border-brand transition-colors flex flex-col items-center gap-2 text-center"
                  style={{ background: 'var(--brand-soft)' }}
                >
                  <span className="text-[34px] thanks-nudge leading-none">🫙</span>
                  <span className="text-[15px] font-bold text-ink-strong">
                    {ko ? '감사 항아리가 비어 있어요' : 'The gratitude jar is empty'}
                  </span>
                  <span className="text-[13px] text-ink-muted leading-relaxed">
                    {ko
                      ? '첫 한 조각을 넣어주세요.\n정말 사소한 것도 괜찮아요'
                      : 'Drop in the first piece.\nEven the tiniest one counts'}
                  </span>
                </button>
              ) : (
                groups.map((group) => (
                  <section key={group.key} className="mb-5 last:mb-0">
                    {/* 날짜 라벨 */}
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <span className="text-[12px] font-bold tracking-[-0.01em] text-ink-muted">
                        {group.label}
                      </span>
                      <span className="flex-1 h-px bg-[var(--card-border)]" />
                    </div>

                    <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-3 lg:items-start">
                      {group.items.map((t, i) => (
                        <ThanksCard
                          key={t.id}
                          thanks={t}
                          canDelete={t.is_mine || admin}
                          onAmen={handleAmen}
                          onDelete={handleDelete}
                          variant="list"
                          enterDelay={Math.min(i * 40, 240)}
                        />
                      ))}
                    </div>
                  </section>
                ))
              )}

              {showSpinner && (
                <div className="flex items-center justify-center py-6">
                  <div
                    className="w-8 h-8 rounded-full animate-spin"
                    style={{
                      border: '2px solid var(--brand-soft-strong)',
                      borderTopColor: 'var(--brand)',
                    }}
                  />
                </div>
              )}

              {!query.hasNextPage && items.length > 0 && !showSpinner && (
                <p className="pt-4 text-center text-[12px] text-ink-muted">
                  {ko ? '여기까지가 우리의 감사예요 🙏' : 'That’s all our thanks 🙏'}
                </p>
              )}

              {/* infinite scroll sentinel */}
              <div ref={sentinelRef} className="h-1" />
            </div>
          </div>
        </div>

        {/* 감사 남기기 — 눈에 띄는 알약 버튼 */}
        <button
          onClick={handleOpenComposer}
          className="fixed z-30 lg:hidden bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 flex items-center gap-2 pl-4 pr-5 h-12 rounded-full bg-brand text-[var(--on-brand)] text-[14.5px] font-extrabold tracking-[-0.01em] shadow-[0_10px_26px_var(--brand-glow)] hover:bg-brand-dim active:scale-95 transition-all"
        >
          <span className="material-icons-round text-[19px]">edit</span>
          {ko ? '감사 남기기' : 'Share thanks'}
        </button>

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
