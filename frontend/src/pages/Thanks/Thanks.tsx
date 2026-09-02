import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  createThanks,
  deleteThanks,
  getThanksList,
  getThanksWeeklyTop,
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
import { HandHeartIcon } from '../../components/icons/ActionIcons'
import { ThanksIcon } from '../../components/icons/ThanksIcons'
import gratitudeHero from '../../assets/hero/gratitude.jpg'
import '../Home/components/ThanksThread/thanks.css'
import './Thanks.css'
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
  // TOP 목록에서 펼쳐 둔 항목 / 피드에서 강조 중인 카드
  const [expandedTopId, setExpandedTopId] = useState<number | null>(null)
  const [highlightId, setHighlightId] = useState<number | null>(null)

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

  // 이번 주 TOP 감사 + 이번 주 감사 수 (감사 카드)
  const weeklyKey = [...thanksKeys.all, 'weekly-top'] as const
  const weeklyQuery = useQuery({
    queryKey: [...weeklyKey, 3],
    queryFn: () => getThanksWeeklyTop(3),
    staleTime: 1000 * 60 * 2,
  })
  const weeklyTop = weeklyQuery.data?.items ?? []
  const weekCount = weeklyQuery.data?.week_count ?? 0
  const refreshWeekly = () => queryClient.invalidateQueries({ queryKey: weeklyKey })

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
      refreshWeekly()
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
      refreshWeekly()
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
    refreshWeekly()
  }

  // TOP 항목 → 타임라인의 해당 카드로 스크롤 + 잠깐 강조.
  // 아직 안 불러온 페이지에 있으면 몇 페이지 더 당겨 보고, 그래도 없으면 안내.
  const revealInFeed = async (id: number) => {
    const findEl = () => document.getElementById(`thanks-${id}`)
    let el = findEl()
    let tries = 0
    while (!el && query.hasNextPage && tries < 5) {
      await query.fetchNextPage()
      await new Promise((r) => setTimeout(r, 60))
      el = findEl()
      tries += 1
    }
    if (!el) {
      showToast(ko ? '목록에서 찾지 못했어요' : 'Not found in the feed', 'error')
      return
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setHighlightId(id)
    window.setTimeout(() => setHighlightId((cur) => (cur === id ? null : cur)), 1800)
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

  const authorTotal = recentAuthors.length + hiddenAuthorCount

  const avatarStack = recentAuthors.length > 0 && (
    <div
      className="flex -space-x-2 shrink-0 items-center"
      role="img"
      aria-label={ko ? `${authorTotal}명이 감사를 나눴어요` : `${authorTotal} people shared thanks`}
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
        <span className="thanks-side-more" aria-hidden>
          +{hiddenAuthorCount}
        </span>
      )}
    </div>
  )

  // 감사 카드: 이번 주 숫자 + 참여자 + TOP 3 (PC 우측 레일 / 모바일 히어로 아래)
  const sideCard = (
    <section className="thanks-side-card" aria-label={ko ? '감사 카드' : 'Thanks card'}>
      <div className="thanks-side-label">
        <span className="material-icons-round text-[16px]">auto_awesome</span>
        {ko ? '감사 카드' : 'Thanks card'}
      </div>
      <div className="flex items-end justify-between gap-3 mt-2">
        <div className="flex items-baseline gap-1.5">
          <span className="thanks-side-count">{weekCount}</span>
          <span className="text-[13px] font-semibold opacity-90">
            {ko ? '개의 감사' : 'thanks'}
          </span>
        </div>
        {avatarStack}
      </div>
      <p className="text-[12px] opacity-80 mt-1">
        {ko ? `이번 주 우리 교회가 나눈 감사 · 전체 ${total}개` : `Shared this week · ${total} in total`}
      </p>

      <h3 className="text-[13.5px] font-bold mt-4 mb-2">
        {ko ? '이번 주 TOP 감사' : 'This week’s top thanks'}
      </h3>
      <ol className="thanks-side-top">
        {weeklyTop.length === 0 ? (
          <li className="thanks-side-top-empty">
            {weeklyQuery.isLoading
              ? '…'
              : ko
                ? '이번 주 첫 감사를 남겨보세요'
                : 'Be the first to give thanks this week'}
          </li>
        ) : (
          weeklyTop.map((t, i) => {
            const open = expandedTopId === t.id
            return (
              <li key={t.id} className={open ? 'is-open' : ''}>
                <button
                  type="button"
                  className="thanks-side-top-row"
                  onClick={() => setExpandedTopId(open ? null : t.id)}
                  aria-expanded={open}
                >
                  <span className="thanks-side-rank">{i + 1}</span>
                  <span className="thanks-side-top-text">{t.content}</span>
                  <span className="thanks-side-top-amen">
                    <HandHeartIcon size={13} filled />
                    {t.amen_count}
                  </span>
                </button>
                {open && (
                  <div className="thanks-side-top-detail">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <ThanksAvatar name={t.display_name} avatarUrl={t.avatar_url} size={20} />
                      <span className="truncate text-[12px] font-semibold text-ink">{t.display_name}</span>
                      <span className="text-[12px] text-ink-muted opacity-60">·</span>
                      <span className="whitespace-nowrap text-[12px] text-ink-muted">{t.time_ago}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAmen(t.id)}
                        className="thanks-side-top-amen-btn"
                        style={
                          t.is_amened
                            ? {
                                background: 'var(--brand-soft-strong)',
                                color: 'var(--brand)',
                                borderColor: 'color-mix(in srgb, var(--brand) 45%, transparent)',
                              }
                            : undefined
                        }
                        aria-label={ko ? '함께 감사해요' : 'Give thanks together'}
                      >
                        <HandHeartIcon size={14} filled={t.is_amened} />
                        {ko ? '함께 감사' : 'Amen'}
                      </button>
                      <button
                        type="button"
                        onClick={() => revealInFeed(t.id)}
                        className="thanks-side-top-goto"
                      >
                        {ko ? '피드에서 보기' : 'View in feed'}
                        <span className="material-icons-round text-[15px]">arrow_downward</span>
                      </button>
                    </div>
                  </div>
                )}
              </li>
            )
          })
        )}
      </ol>
    </section>
  )

  // lg 에서 이 페이지만 스스로 스크롤하는 상자로 만든다 — #root 의 overflow-y 탓에
  // sticky 가 전역으로 죽어 있어, 이 상자를 만들어야 우측 레일 sticky 가 산다.
  return (
    <div className="min-h-screen bg-[var(--app-canvas)] page-stage lg:h-[calc(100vh-56px)] lg:min-h-0 lg:overflow-y-auto">
      <div className="max-w-md mx-auto min-h-screen bg-[var(--app-canvas)] lg:max-w-[1100px] lg:mt-2 lg:mb-12 lg:rounded-3xl lg:border lg:border-[var(--card-border)] lg:min-h-0">
        {/* 헤더 — 제목 + 한 줄 부제 */}
        <div
          className="sticky top-14 lg:static lg:rounded-t-3xl z-10 backdrop-blur-xl border-b border-[var(--card-border)]"
          style={{ background: 'var(--glass-bg)' }}
        >
          <div className="px-4 py-3 flex items-center gap-2 lg:px-6 lg:py-4">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 -ml-1 shrink-0 flex items-center justify-center rounded-full text-ink hover:text-brand hover:bg-[var(--brand-soft)] transition-colors"
              aria-label={ko ? '뒤로' : 'Back'}
            >
              <span className="material-icons-outlined text-[22px]">arrow_back</span>
            </button>
            <div className="min-w-0">
              <h1 className="text-[17px] lg:text-[20px] font-bold tracking-[-0.01em] text-ink-strong leading-tight">
                {ko ? '오늘의 감사' : 'Today’s Thanks'}
              </h1>
              <p className="text-[12px] text-ink-muted mt-0.5">
                {ko ? '작은 감사가 삶을 변화시킵니다' : 'Small thanks change a life'}
              </p>
            </div>
          </div>
        </div>

        {/* PC(lg+) 2단 — 좌: 히어로 말씀 + 타임라인 / 우: 감사 카드 + 남기기 (sticky) */}
        <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6 lg:items-start lg:px-6 lg:pt-5">
          <div className="contents lg:block lg:col-start-1 lg:row-start-1 lg:min-w-0">
            {/* Hero — 오늘의 말씀 (garden 히어로와 같은 그라데이션+사진 기법) */}
            <section className="px-4 pt-4 lg:p-0">
              <article
                className="thanks-hero"
                style={{ ['--thanks-hero-image' as string]: `url(${gratitudeHero})` }}
              >
                <div className="thanks-hero-body">
                  <span className="thanks-hero-label">TODAY’S BIBLE</span>
                  <p className="thanks-hero-verse">“{ko ? verse.ko : verse.en}”</p>
                  <p className="thanks-hero-ref">{ko ? verse.ref : verse.refEn}</p>
                </div>
              </article>
            </section>

            {/* 모바일: 감사 카드는 히어로 바로 아래 */}
            <div className="px-4 pt-3 lg:hidden">{sideCard}</div>

            {/* 타임라인 */}
            <div className="px-4 pt-5 pb-28 lg:px-0 lg:pt-5 lg:pb-8">
              {isEmpty ? (
                <button
                  onClick={handleOpenComposer}
                  className="w-full p-7 rounded-2xl border border-dashed border-[var(--card-border)] hover:border-brand transition-colors flex flex-col items-center gap-2 text-center"
                  style={{ background: 'var(--brand-soft)' }}
                >
                  <span className="thanks-empty-emblem thanks-nudge" aria-hidden>
                    <ThanksIcon name="jar" size={30} />
                  </span>
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
                <div className="thanks-timeline">
                  {groups.map((group) => (
                    <section key={group.key} className="thanks-tl-group">
                      <div className="thanks-tl-date">
                        <span className="thanks-tl-dot" aria-hidden />
                        <span>{group.label}</span>
                      </div>
                      <div className="space-y-3">
                        {group.items.map((t, i) => (
                          <ThanksCard
                            key={t.id}
                            thanks={t}
                            canDelete={t.is_mine || admin}
                            onAmen={handleAmen}
                            onDelete={handleDelete}
                            variant="timeline"
                            enterDelay={Math.min(i * 40, 240)}
                            highlighted={highlightId === t.id}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
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
                  {ko ? '여기까지가 우리의 감사예요' : 'That’s all our thanks'}
                </p>
              )}

              <div ref={sentinelRef} className="h-1" />
            </div>
          </div>

          {/* 우측 레일 (PC) */}
          <aside className="hidden lg:block lg:col-start-2 lg:row-start-1 lg:sticky lg:top-3 space-y-4">
            {sideCard}

            <section className="thanks-write-card">
              <div className="flex items-center gap-2.5">
                <span className="thanks-write-icon material-icons-round" aria-hidden>edit</span>
                <div>
                  <h3 className="text-[14.5px] font-bold text-ink-strong leading-tight">
                    {ko ? '감사 남기기' : 'Share thanks'}
                  </h3>
                  <p className="text-[12px] text-ink-muted mt-0.5">
                    {ko ? '작은 감사가 큰 은혜가 됩니다' : 'Small thanks become great grace'}
                  </p>
                </div>
              </div>
              <button onClick={handleOpenComposer} className="thanks-write-input">
                {ko ? '오늘 무엇에 감사하셨나요?' : 'What are you thankful for today?'}
              </button>
              <button
                onClick={handleOpenComposer}
                className="mt-2.5 w-full h-11 rounded-xl brand-gradient text-[var(--on-brand)] text-[14px] font-extrabold tracking-[-0.01em] shadow-[0_8px_22px_var(--brand-glow)] flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                {ko ? '감사 남기기' : 'Share thanks'}
                <span className="material-icons-round text-[17px]">send</span>
              </button>
            </section>
          </aside>
        </div>

        {/* 모바일 FAB */}
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
