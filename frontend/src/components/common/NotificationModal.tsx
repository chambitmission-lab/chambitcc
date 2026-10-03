import { useState, useMemo, useEffect, useRef, useTransition, type CSSProperties } from 'react'
import { formatLongDate, timeAgo } from '../../utils/dateUtils'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
} from '../../hooks/useNotifications'
import { tokenStore } from '../../utils/tokenStore'
import { prefetchCapsule } from '../../hooks/useTimeCapsule'
import { showToast } from '../../utils/toast'
import { preloadRoute } from '../../utils/routePreload'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import NoticeContent, { NoticeInline } from './NoticeContent'
import './NotificationModal.css'
import {
  BellIcon,
  resolveNotificationVisual,
  stripLeadingEmoji,
} from '../icons/NotificationIcons'
import { noticePreviewText } from '../../utils/noticeMarkup'
import type { Notification } from '../../types/notification'

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
}

type DateGroup = 'today' | 'week' | 'older'

const GROUP_LABELS: Record<DateGroup, string> = {
  today: '오늘',
  week: '이번 주',
  older: '이전',
}

/** 노출 기간이 남아 있는 팝업 공지 하나 — 히어로 카드로 올린다 (시각 비교라 훅 밖에서 계산) */
const pickHeroNotice = (list: Notification[]): Notification | null => {
  const now = Date.now()
  return (
    list.find(
      (n) =>
        isNotice(n) && n.is_popup && (!n.popup_until || new Date(n.popup_until).getTime() > now),
    ) ?? null
  )
}

/** 게시 마감 표기 — 'D-n · 9월 19일까지 게시'. 하루 미만 남으면 D-0, 30일 넘게 남으면 D-day 생략 */
const heroDeadline = (hero: Notification | null) => {
  if (!hero?.popup_until) return null
  const until = new Date(hero.popup_until)
  if (Number.isNaN(until.getTime())) return null
  const dday = Math.max(0, Math.ceil((until.getTime() - Date.now()) / 86_400_000))
  return {
    dday: dday <= 30 ? dday : null,
    label: `${until.getMonth() + 1}월 ${until.getDate()}일`,
  }
}

// 일주일 안은 '3일 전', 그 뒤로는 올해면 연도를 뗀다 — '2026년 9월 21일'은 한 줄에서 너무 길다
const formatDate = (iso: string) =>
  timeAgo(iso, {
    maxDays: 7,
    beyond: (d) =>
      d.getFullYear() === new Date().getFullYear()
        ? `${d.getMonth() + 1}월 ${d.getDate()}일`
        : formatLongDate(d.toISOString()),
  })

// 공지/내 알림을 항목마다 칩으로 다는 대신 위에서 한 번에 거른다 (인스타 활동 탭의 필터 칩)
type KindFilter = 'all' | 'notice' | 'mine'

const FILTERS: Array<{ key: KindFilter; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'notice', label: '공지' },
  { key: 'mine', label: '내 알림' },
]

const EMPTY_LABELS: Record<KindFilter, string> = {
  all: '새로운 알림이 없습니다',
  notice: '받은 공지가 없습니다',
  mine: '받은 알림이 없습니다',
}

const getDateGroup = (iso: string): DateGroup => {
  const now = new Date()
  const date = new Date(iso)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000)

  if (date >= todayStart) return 'today'
  if (date >= weekAgo) return 'week'
  return 'older'
}

// 아이콘 타일 색 — 전체 공지만 솔리드로 튀게, 나머지는 브랜드 tint.
// amber는 앱 전체에서 '응답됨' 시맨틱이라 기도 응답·축하 알림에만 쓴다.
const TILE_TONE: Record<'brand' | 'soft' | 'accent', string> = {
  brand: 'bg-brand text-brand-on',
  soft: 'bg-[var(--brand-soft-strong)] text-brand',
  accent: 'bg-[var(--amber-soft)] text-[var(--amber)]',
}

// 알림함은 교회 전체 공지와 개인 알림(댓글·기도 응답 등)이 한 목록에 섞인다.
// target_user_id 가 없으면 전체 공지 — 배지로 갈라 줘야 어느 쪽인지 한눈에 읽힌다.
const isNotice = (n: Notification) => n.target_user_id == null

// 서식이 쓰였으면 접힌 줄에서는 카드·정보 박스가 눕혀지므로 항상 펼칠 수 있어야 한다
const needsExpand = (content: string) => {
  const plain = noticePreviewText(content)
  return plain.length > 80 || content.includes('\n') || plain !== content.trim()
}

/**
 * 알림 링크 → 실제 이동 대상.
 * /prayers/:id 는 전용 페이지가 아니라 홈의 기도 상세 모달이라 state로 넘겨야 한다.
 * (그대로 navigate 하면 매칭되는 라우트가 없어 catch-all로 홈에 튕기기만 하고 기도는 안 열린다)
 */
const resolveTarget = (
  linkUrl: string,
): { path: string; state?: Record<string, unknown> } => {
  const prayer = linkUrl.match(/^\/prayers\/(\d+)$/)
  if (prayer) return { path: '/', state: { openPrayerId: Number(prayer[1]) } }
  return { path: linkUrl }
}

const NotificationModal = ({ isOpen, onClose }: NotificationModalProps) => {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [filter, setFilter] = useState<KindFilter>('all')
  // 목록이 스크롤되면 헤더 아래에 얇은 선을 띄워 경계를 준다 (맨 위에선 선 없이 한 면처럼)
  const [scrolled, setScrolled] = useState(false)
  // 목적지가 준비될 때까지 모달이 떠 있으므로, 어느 바로가기를 눌렀는지 표시해준다
  const [isNavigating, startNavTransition] = useTransition()
  const [pendingLinkId, setPendingLinkId] = useState<number | null>(null)
  const isLoggedIn = !!tokenStore.getAccess()
  const sentinelRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotifications()

  // 전 페이지 notifications 합산
  const notifications = useMemo(
    () => data?.pages.flatMap((p) => p.notifications) ?? [],
    [data],
  )
  const unreadCount = data?.pages[0]?.unread_count ?? 0

  const markAsReadMutation = useMarkAsRead()
  const markAllAsReadMutation = useMarkAllAsRead()

  // 스크롤 끝 감지 → 다음 페이지 로드
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // 바로가기 대상의 청크와 데이터를 목록이 뜨는 동안 미리 받아둔다.
  // 탭한 뒤에 받기 시작하면 도착할 때까지 전환이 지연되고, 그 사이 이전 화면이 남는다.
  // 단, 열리는 순간 바로 돌리면 여러 청크 import 가 모달 진입 애니메이션·목록 첫 페인트와
  // 메인 스레드·대역폭을 다툰다 — 진입 애니메이션(0.18s)이 끝난 뒤 유휴 시간에 시작한다.
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    let idleId: number | null = null
    const run = () => {
      if (cancelled) return
      notifications.forEach((n) => {
        if (!n.link_url) return
        void preloadRoute(n.link_url)

        const capsuleId = n.link_url.match(/^\/capsule\/(\d+)$/)?.[1]
        if (capsuleId && isLoggedIn) void prefetchCapsule(queryClient, Number(capsuleId))
      })
    }
    const timer = window.setTimeout(() => {
      if (cancelled) return
      if (typeof window.requestIdleCallback === 'function') {
        idleId = window.requestIdleCallback(run, { timeout: 1500 })
      } else {
        run()
      }
    }, 250)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      if (idleId !== null && typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idleId)
    }
  }, [isOpen, notifications, isLoggedIn, queryClient])

  // 홈 전면 팝업으로 띄우는 '중요 공지'는 목록에 섞이면 묻힌다.
  // 노출 기간이 남아 있는 것만 맨 위 히어로 카드로 올리고, 아래 목록에서는 뺀다.
  const pinned = useMemo(() => pickHeroNotice(notifications), [notifications])
  const hero = filter === 'mine' ? null : pinned

  const visible = useMemo(
    () =>
      filter === 'all'
        ? notifications
        : notifications.filter((n) => isNotice(n) === (filter === 'notice')),
    [notifications, filter],
  )

  const grouped = useMemo(() => {
    const groups: Record<DateGroup, Notification[]> = { today: [], week: [], older: [] }
    visible
      .filter((n) => n.id !== hero?.id)
      .forEach((n) => groups[getDateGroup(n.created_at)].push(n))
    return groups
  }, [visible, hero])

  const groupOrder: DateGroup[] = ['today', 'week', 'older']
  // 공지는 전용 상세 페이지가 없다 — 링크가 없으면 히어로 카드 안에서 펼쳐 읽는다
  const heroExpanded = !!hero && expandedIds.has(hero.id)
  const heroUntil = useMemo(() => heroDeadline(hero), [hero])

  const toggleExpand = async (notification: Notification) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(notification.id)) next.delete(notification.id)
      else next.add(notification.id)
      return next
    })

    if (isLoggedIn && !notification.is_read) {
      try {
        await markAsReadMutation.mutateAsync(notification.id)
      } catch {
        // 읽음 처리 실패는 조용히 무시
      }
    }
  }

  // 개인 알림(기도응답 등)의 바로가기 — 이동이 먼저, 읽음 처리는 뒤따라간다.
  // 읽음 API를 await 하면 모바일 지연(수백 ms)만큼 탭이 먹통처럼 느껴지고,
  // 그 사이 모달만 닫힌 홈 화면이 먼저 보여서 화면이 두 번 바뀐 것처럼 읽힌다.
  const goToLink = (notification: Notification) => {
    if (isLoggedIn && !notification.is_read) {
      // 읽음 처리 실패는 조용히 무시 (이동을 막지 않는다)
      markAsReadMutation.mutate(notification.id, { onError: () => {} })
    }
    if (!notification.link_url) {
      onClose()
      return
    }

    const target = resolveTarget(notification.link_url)
    setPendingLinkId(notification.id)
    // 모달 닫기와 화면 이동을 같은 transition에 묶는다. 따로 두면 닫기는 urgent라
    // 먼저 커밋돼 뒤에 있던 홈이 한 프레임 그려지고, 라우터 전환(내부적으로 transition)이
    // 그 다음에 커밋되면서 "홈이 보였다가 확 바뀌는" 두 번의 페인트가 된다.
    // 한 transition으로 묶으면 목적지가 준비될 때까지 모달이 떠 있다가 한 번에 교체된다.
    startNavTransition(() => {
      onClose()
      // replace — 모달이 뒤로가기용으로 쌓아둔 히스토리 엔트리(주소는 현재 화면 그대로)를
      // 재사용한다. push 하면 그 엔트리가 사이에 남아 상세에서 뒤로가기를 두 번 눌러야 한다.
      navigate(target.path, { state: target.state, replace: true })
    })
  }

  // 항목 전체가 클릭 대상(Clickable Card).
  // 링크가 있으면 곧장 이동, 없으면 종전처럼 본문 펼치기/읽음 처리.
  const handleItemClick = (notification: Notification) => {
    if (notification.link_url) {
      goToLink(notification)
      return
    }
    void toggleExpand(notification)
  }

  const handleMarkAllAsRead = async () => {
    if (!isLoggedIn) return
    try {
      await markAllAsReadMutation.mutateAsync()
      showToast('모든 알림을 읽음 처리했습니다', 'success')
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : '읽음 처리에 실패했습니다',
        'error',
      )
    }
  }

  useModalBackButton(onClose, isOpen)

  if (!isOpen) return null

  return (
    <>
      <div
        className="notif-backdrop fixed inset-0 bg-black/40 z-[999]"
        onClick={onClose}
      />

      <div className="notif-modal notif-panel fixed top-[60px] right-5 w-[400px] max-w-[calc(100vw-40px)] max-h-[calc(100vh-100px)] z-[1000] flex flex-col rounded-[22px] overflow-hidden bg-white dark:bg-gray-900 ring-1 ring-black/[0.06] dark:ring-white/[0.08] shadow-[0_24px_60px_-12px_rgba(15,23,42,0.28)] dark:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.7)]">
        {/* Header — 제목 + 안 읽은 수, 그 아래 종류 필터 칩 */}
        <div
          className={`relative z-20 px-5 pt-4 pb-3 lg:px-7 lg:pt-6 lg:pb-4 transition-shadow ${
            scrolled ? 'shadow-[0_1px_0_rgba(0,0,0,0.06)] dark:shadow-[0_1px_0_rgba(255,255,255,0.06)]' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 lg:gap-2.5">
              <h2 className="text-[19px] lg:text-[24px] font-extrabold text-ink-strong tracking-[-0.03em]">
                알림
              </h2>
              {unreadCount > 0 && (
                <span
                  className="min-w-[20px] h-5 lg:min-w-[26px] lg:h-[26px] px-1.5 lg:px-2 rounded-full bg-brand text-brand-on text-[11.5px] lg:text-[14px] font-bold tabular-nums flex items-center justify-center"
                  aria-label={`안 읽은 알림 ${unreadCount}개`}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-0.5 lg:gap-1">
              {isLoggedIn && unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={markAllAsReadMutation.isPending}
                  className="h-9 lg:h-11 px-2.5 lg:px-3.5 rounded-full text-[13px] lg:text-[15.5px] font-semibold text-brand hover:bg-[var(--brand-soft)] active:bg-[var(--brand-soft-strong)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  모두 읽음
                </button>
              )}

              <button
                onClick={onClose}
                aria-label="닫기"
                className="w-11 h-11 lg:w-12 lg:h-12 -mr-2 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/[0.06] active:bg-gray-200 dark:active:bg-white/[0.1] rounded-full transition-colors"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  className="lg:w-[26px] lg:h-[26px]"
                  strokeLinecap="round"
                  aria-hidden
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {notifications.length > 0 && (
            <div className="mt-2.5 lg:mt-3.5 flex gap-1.5 lg:gap-2" role="tablist" aria-label="알림 종류">
              {FILTERS.map((f) => {
                const active = filter === f.key
                return (
                  <button
                    key={f.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFilter(f.key)}
                    className={`h-8 lg:h-10 px-3.5 lg:px-[18px] rounded-full text-[13px] lg:text-[15.5px] font-semibold transition-colors ${
                      active
                        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80 dark:bg-white/[0.07] dark:text-gray-300 dark:hover:bg-white/[0.12]'
                    }`}
                  >
                    {f.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Content */}
        <div
          className="flex-1 overflow-y-auto no-scrollbar overscroll-contain"
          onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 2)}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-gray-200 dark:border-gray-700 border-t-brand rounded-full animate-spin" />
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <span className="mb-3 w-16 h-16 rounded-full flex items-center justify-center bg-gray-100 dark:bg-white/[0.05] text-gray-400 dark:text-gray-500">
                <BellIcon size={28} strokeWidth={1.6} />
              </span>
              <p className="text-[15px] lg:text-[17px] font-semibold text-ink-strong">
                {EMPTY_LABELS[filter]}
              </p>
              <p className="mt-1 text-[13px] lg:text-[15px] text-gray-500 dark:text-gray-400">
                새 소식이 오면 여기에서 알려드릴게요
              </p>
            </div>
          ) : (
            <div className="pb-2">
              {hero && (
                <div className="px-3 pt-1 pb-1 lg:px-5">
                  <button
                    type="button"
                    onClick={() => handleItemClick(hero)}
                    aria-expanded={hero.link_url ? undefined : heroExpanded}
                    className="notif-hero"
                  >
                    <div className="notif-hero__top">
                      <span className="notif-hero__chip">
                        <span className="notif-hero__pulse" aria-hidden />
                        중요 공지
                      </span>
                      {heroUntil?.dday != null && (
                        <span className="notif-hero__dday">D-{heroUntil.dday}</span>
                      )}
                      <span className="notif-hero__time">{formatDate(hero.created_at)}</span>
                    </div>

                    <div className="notif-hero__body">
                      {hero.image_url && !heroExpanded && (
                        <img
                          src={hero.image_url}
                          alt=""
                          loading="lazy"
                          className="notif-hero__img"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="notif-hero__title">{stripLeadingEmoji(hero.title)}</h3>
                        {!heroExpanded && (
                          <p className="notif-hero__preview content-clamp">
                            <NoticeInline source={hero.content} />
                          </p>
                        )}
                      </div>
                    </div>

                    {heroExpanded && (
                      <div className="notif-hero__expanded">
                        <NoticeContent source={hero.content} compact />
                        {hero.image_url && (
                          <img
                            src={hero.image_url}
                            alt=""
                            loading="lazy"
                            className="notif-hero__expanded-img"
                          />
                        )}
                      </div>
                    )}

                    <div className="notif-hero__foot">
                      {heroUntil && (
                        <span className="notif-hero__until">{heroUntil.label}까지 게시</span>
                      )}
                      <span
                        className={`notif-hero__action ${
                          !hero.link_url && heroExpanded ? 'notif-hero__action--open' : ''
                        }`}
                      >
                        {isNavigating && pendingLinkId === hero.id ? (
                          <span className="block w-3.5 h-3.5 border-[1.5px] border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            {hero.link_url ? '자세히 보기' : heroExpanded ? '접기' : '펼쳐 읽기'}
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden
                            >
                              <path d={hero.link_url ? 'M9 18l6-6-6-6' : 'M6 9l6 6 6-6'} />
                            </svg>
                          </>
                        )}
                      </span>
                    </div>
                  </button>
                </div>
              )}

              {groupOrder.map((group) => {
                const items = grouped[group]
                if (items.length === 0) return null

                return (
                  <section key={group}>
                    <h4 className="sticky top-0 z-10 px-5 pt-4 pb-1.5 lg:px-7 lg:pt-5 lg:pb-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md text-[14px] lg:text-[17px] font-bold text-ink-strong tracking-tight">
                      {GROUP_LABELS[group]}
                    </h4>

                    <ul className="px-2 lg:px-3">
                      {items.map((notification, idx) => {
                        const unread = !notification.is_read
                        const expanded = expandedIds.has(notification.id)
                        // 이미지가 있으면 펼쳐야 크게 볼 수 있으므로 항상 확장 가능
                        const expandable =
                          needsExpand(notification.content) || !!notification.image_url
                        const navigating = isNavigating && pendingLinkId === notification.id
                        const hasLink = !!notification.link_url
                        const notice = isNotice(notification)
                        const visual = resolveNotificationVisual(notification)

                        return (
                          <li
                            key={notification.id}
                            className="notif-row-in"
                            style={{ '--i': idx } as CSSProperties}
                          >
                            <button
                              type="button"
                              onClick={() => handleItemClick(notification)}
                              aria-busy={navigating}
                              aria-expanded={!hasLink && expandable ? expanded : undefined}
                              className={`group w-full text-left flex items-start gap-3 lg:gap-4 px-3 py-3 lg:px-4 lg:py-4 rounded-2xl transition-colors ${
                                unread
                                  ? 'bg-[var(--brand-soft)] hover:bg-[var(--brand-soft-strong)] active:bg-[var(--brand-glow)]'
                                  : 'hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-white/[0.04] dark:active:bg-white/[0.07]'
                              }`}
                            >
                              {/* 아바타 — 제목 앞 이모지 대신 같은 뜻의 라인 아이콘. 공지만 솔리드 */}
                              <span
                                className={`flex-shrink-0 w-11 h-11 lg:w-[52px] lg:h-[52px] lg:[&_svg]:w-6 lg:[&_svg]:h-6 rounded-full flex items-center justify-center ${TILE_TONE[visual.tone]}`}
                                aria-hidden
                              >
                                {visual.icon}
                              </span>

                              <div className="flex-1 min-w-0 pt-0.5">
                                <h3
                                  className={`text-[15px] lg:text-[17.5px] leading-snug tracking-[-0.01em] ${
                                    expanded ? '' : 'line-clamp-1'
                                  } ${
                                    unread
                                      ? 'font-bold text-ink-strong'
                                      : 'font-semibold text-gray-800 dark:text-gray-200'
                                  }`}
                                >
                                  {stripLeadingEmoji(notification.title)}
                                </h3>

                                {/* 접힌 상태는 line-clamp가 걸린 인라인이어야 해서 블록(카드·정보 박스)은 눕히고 강조만 살린다 */}
                                <div className="mt-0.5 lg:mt-1">
                                  {expandable && !expanded ? (
                                    <p className="content-clamp text-[13.5px] lg:text-[16px] text-gray-600 dark:text-gray-400 leading-relaxed lg:leading-[1.65] break-words">
                                      <NoticeInline source={notification.content} />
                                    </p>
                                  ) : (
                                    <NoticeContent source={notification.content} compact />
                                  )}
                                </div>

                                {notification.image_url && expanded && (
                                  <img
                                    src={notification.image_url}
                                    alt=""
                                    loading="lazy"
                                    className="mt-2.5 lg:mt-3.5 w-full max-h-64 lg:max-h-96 object-contain rounded-xl bg-gray-50 dark:bg-gray-800/50"
                                  />
                                )}

                                {/* 메타 줄 — 종류·시각을 본문 아래로 내려 제목이 폭을 다 쓰게 한다 */}
                                <div className="mt-1 lg:mt-1.5 flex items-center gap-1.5 text-[12px] lg:text-[14px] text-gray-500 dark:text-gray-400 tabular-nums">
                                  {notice && (
                                    <>
                                      <span className="font-bold text-brand">공지</span>
                                      <span aria-hidden>·</span>
                                    </>
                                  )}
                                  <span>{formatDate(notification.created_at)}</span>
                                  {expandable && (
                                    <>
                                      <span aria-hidden>·</span>
                                      <span
                                        role="button"
                                        tabIndex={0}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          void toggleExpand(notification)
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            void toggleExpand(notification)
                                          }
                                        }}
                                        aria-expanded={expanded}
                                        className="font-semibold text-gray-600 dark:text-gray-300 hover:text-brand"
                                      >
                                        {expanded ? '접기' : '더 보기'}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* 오른쪽 — 사진 썸네일(인스타 활동 탭처럼) + 안 읽음 점 / 이동 중 스피너 */}
                              <span className="flex-shrink-0 self-center flex items-center gap-2 lg:gap-2.5">
                                {navigating ? (
                                  <span className="block w-4 h-4 border-[1.5px] border-brand border-t-transparent rounded-full animate-spin" aria-hidden />
                                ) : (
                                  unread && (
                                    <span
                                      className="w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full bg-brand"
                                      aria-label="안 읽음"
                                    />
                                  )
                                )}
                                {notification.image_url && !expanded && (
                                  <img
                                    src={notification.image_url}
                                    alt=""
                                    loading="lazy"
                                    className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl object-cover bg-gray-100 dark:bg-white/[0.06]"
                                  />
                                )}
                              </span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                )
              })}

              {/* 무한 스크롤 sentinel */}
              <div ref={sentinelRef} className="py-1">
                {isFetchingNextPage && (
                  <div className="flex justify-center py-3">
                    <div className="w-5 h-5 border-2 border-gray-200 dark:border-gray-700 border-t-brand rounded-full animate-spin" />
                  </div>
                )}
                {!hasNextPage && visible.length > 0 && (
                  <p className="flex flex-col items-center gap-1.5 py-6 lg:py-8 text-[12px] lg:text-[14px] text-gray-400 dark:text-gray-500">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <circle cx="12" cy="12" r="9" />
                      <path d="m8.5 12.2 2.4 2.3 4.6-4.8" />
                    </svg>
                    모든 알림을 확인했어요
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default NotificationModal
