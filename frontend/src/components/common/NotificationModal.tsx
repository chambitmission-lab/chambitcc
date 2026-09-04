import { useState, useMemo, useEffect, useRef, useTransition } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
} from '../../hooks/useNotifications'
import { prefetchCapsule } from '../../hooks/useTimeCapsule'
import { showToast } from '../../utils/toast'
import { preloadRoute } from '../../utils/routePreload'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import NoticeContent, { NoticeInline } from './NoticeContent'
import {
  BellIcon,
  MegaphoneIcon,
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

const formatDate = (iso: string) => {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / (1000 * 60))
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay < 7) return `${diffDay}일 전`

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
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
  // 목적지가 준비될 때까지 모달이 떠 있으므로, 어느 바로가기를 눌렀는지 표시해준다
  const [isNavigating, startNavTransition] = useTransition()
  const [pendingLinkId, setPendingLinkId] = useState<number | null>(null)
  const isLoggedIn = !!localStorage.getItem('access_token')
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
  const total = data?.pages[0]?.total ?? 0

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
  useEffect(() => {
    if (!isOpen) return
    notifications.forEach((n) => {
      if (!n.link_url) return
      void preloadRoute(n.link_url)

      const capsuleId = n.link_url.match(/^\/capsule\/(\d+)$/)?.[1]
      if (capsuleId && isLoggedIn) void prefetchCapsule(queryClient, Number(capsuleId))
    })
  }, [isOpen, notifications, isLoggedIn, queryClient])

  // 홈 전면 팝업으로 띄우는 '중요 공지'는 목록에 섞이면 묻힌다.
  // 노출 기간이 남아 있는 것만 맨 위 히어로 카드로 올리고, 아래 목록에서는 뺀다.
  const hero = useMemo(() => {
    const now = Date.now()
    return (
      notifications.find(
        (n) =>
          isNotice(n) &&
          n.is_popup &&
          (!n.popup_until || new Date(n.popup_until).getTime() > now),
      ) ?? null
    )
  }, [notifications])

  const grouped = useMemo(() => {
    const groups: Record<DateGroup, Notification[]> = { today: [], week: [], older: [] }
    notifications
      .filter((n) => n.id !== hero?.id)
      .forEach((n) => groups[getDateGroup(n.created_at)].push(n))
    return groups
  }, [notifications, hero])

  const groupOrder: DateGroup[] = ['today', 'week', 'older']

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
      <style>{`
        @keyframes notification-backdrop-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes notification-modal-in {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .notification-backdrop {
          animation: notification-backdrop-in 0.15s ease-out;
        }
        .notification-modal {
          animation: notification-modal-in 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          transform-origin: top right;
        }
        .content-clamp {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      <div
        className="notification-backdrop fixed inset-0 bg-black/40 z-[999]"
        onClick={onClose}
      />

      <div className="notification-modal fixed top-[60px] right-5 w-[400px] max-w-[calc(100vw-40px)] max-h-[calc(100vh-100px)] z-[1000] flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-ink-strong tracking-tight">
              알림
            </h2>
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center bg-[var(--brand-soft-strong)] text-brand"
              aria-hidden
            >
              <BellIcon size={14} strokeWidth={2} />
            </span>
            {unreadCount > 0 && (
              <span className="text-xs font-semibold text-brand">
                {unreadCount}
              </span>
            )}
            {total > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                총 {total}건
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {isLoggedIn && unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
                className="px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-brand rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                모두 읽음
              </button>
            )}

            <button
              onClick={onClose}
              aria-label="닫기"
              className="w-11 h-11 -my-1.5 -mr-2 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 active:bg-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/60 dark:active:bg-gray-800 rounded-full transition-colors"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-gray-200 dark:border-gray-700 border-t-brand rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <span className="mb-3 w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-50 dark:bg-white/[0.04] text-gray-300 dark:text-gray-600">
                <BellIcon size={26} strokeWidth={1.6} />
              </span>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                새로운 알림이 없습니다
              </p>
            </div>
          ) : (
            <div>
              {hero && (
                <div className="px-3 pt-3">
                  <button
                    type="button"
                    onClick={() => handleItemClick(hero)}
                    className="group w-full text-left p-3.5 rounded-2xl border border-[var(--brand-glow)] bg-[var(--brand-soft)] hover:bg-[var(--brand-soft-strong)] active:bg-[var(--brand-glow)] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 px-1.5 py-[2px] rounded-md bg-brand text-brand-on text-[10px] font-bold tracking-tight">
                        <MegaphoneIcon size={11} strokeWidth={2.2} />
                        중요 공지
                      </span>
                      <span className="flex-shrink-0 text-[11px] text-gray-500 dark:text-gray-400 tabular-nums">
                        {formatDate(hero.created_at)}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center gap-3">
                      {hero.image_url && (
                        <img
                          src={hero.image_url}
                          alt=""
                          loading="lazy"
                          className="flex-shrink-0 w-14 h-14 rounded-xl object-cover bg-white/60 dark:bg-white/[0.06]"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[15.5px] font-bold text-ink-strong tracking-tight truncate">
                          {stripLeadingEmoji(hero.title)}
                        </h3>
                        <p className="content-clamp mt-1 text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed break-words">
                          <NoticeInline source={hero.content} />
                        </p>
                      </div>
                      <span
                        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-white dark:bg-white/[0.1] text-brand shadow-sm"
                        aria-hidden
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </span>
                    </div>
                  </button>
                </div>
              )}

              {groupOrder.map((group) => {
                const items = grouped[group]
                if (items.length === 0) return null

                return (
                  <div key={group}>
                    <div className="sticky top-0 z-10 px-5 pt-4 pb-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
                      <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 tracking-wider">
                        {GROUP_LABELS[group]}
                        <span className="ml-1.5 font-normal text-gray-500 dark:text-gray-400">
                          {items.length}건
                        </span>
                      </span>
                    </div>

                    <ul className="px-3 pb-1 space-y-2">
                      {items.map((notification) => {
                        const unread = !notification.is_read
                        const expanded = expandedIds.has(notification.id)
                        // 이미지가 있으면 펼쳐야 볼 수 있으므로 항상 확장 가능
                        const expandable =
                          needsExpand(notification.content) || !!notification.image_url
                        const navigating = isNavigating && pendingLinkId === notification.id
                        const hasLink = !!notification.link_url
                        const notice = isNotice(notification)
                        const visual = resolveNotificationVisual(notification)

                        return (
                          <li key={notification.id}>
                            <button
                              type="button"
                              onClick={() => handleItemClick(notification)}
                              aria-busy={navigating}
                              aria-expanded={!hasLink && expandable ? expanded : undefined}
                              className={`group w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                                unread
                                  ? 'border-[var(--brand-glow)] bg-[var(--brand-soft)] hover:bg-[var(--brand-soft-strong)] active:bg-[var(--brand-glow)]'
                                  : 'border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/30 hover:bg-gray-100/70 dark:hover:bg-gray-800/50 active:bg-gray-200/60 dark:active:bg-gray-800/70'
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <span className="flex-shrink-0 w-1.5 mt-[15px]" aria-hidden>
                                  {unread && (
                                    <span className="block w-1.5 h-1.5 rounded-full bg-brand" />
                                  )}
                                </span>

                                {/* 제목 앞 이모지 대신 같은 뜻의 라인 아이콘 타일 */}
                                <span
                                  className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${TILE_TONE[visual.tone]}`}
                                  aria-hidden
                                >
                                  {visual.icon}
                                </span>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-baseline justify-between gap-2.5">
                                    <h3
                                      className={`text-[14.5px] leading-snug truncate ${
                                        unread
                                          ? 'font-bold text-ink-strong'
                                          : 'font-semibold text-gray-700 dark:text-gray-300'
                                      }`}
                                    >
                                      {stripLeadingEmoji(notification.title)}
                                    </h3>
                                    <span className="flex-shrink-0 text-[11px] text-gray-500 dark:text-gray-400 tabular-nums">
                                      {formatDate(notification.created_at)}
                                    </span>
                                  </div>

                                  {/* 종류 칩 + 본문 — 접힌 상태는 line-clamp가 걸린 인라인이어야
                                      해서 블록(카드·정보 박스)은 눕히고 강조만 살린다 */}
                                  <div className="mt-1 flex items-start gap-1.5">
                                    <span
                                      className={`flex-shrink-0 mt-[1px] px-1.5 py-[1px] rounded-md text-[10px] font-bold tracking-tight ${
                                        notice
                                          ? 'bg-[var(--brand-soft-strong)] text-brand'
                                          : 'bg-gray-100 dark:bg-white/[0.07] text-gray-500 dark:text-gray-400'
                                      }`}
                                    >
                                      {notice ? '공지' : '내 알림'}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      {expandable && !expanded ? (
                                        <p className="content-clamp text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed break-words">
                                          <NoticeInline source={notification.content} />
                                        </p>
                                      ) : (
                                        <NoticeContent
                                          source={notification.content}
                                          compact
                                        />
                                      )}
                                    </div>
                                  </div>

                                  {notification.image_url && expanded && (
                                    <img
                                      src={notification.image_url}
                                      alt=""
                                      loading="lazy"
                                      className="mt-2.5 w-full max-h-64 object-contain rounded-xl bg-gray-50 dark:bg-gray-800/50"
                                    />
                                  )}

                                  {/* 링크가 있는 항목은 카드 전체가 '바로가기'라 펼침만 따로 남긴다.
                                      링크가 없으면 카드 탭 자체가 펼침이므로 이 줄이 필요 없다. */}
                                  {hasLink && expandable && (
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
                                      className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium text-gray-500 dark:text-gray-400 hover:text-brand"
                                    >
                                      <span>{expanded ? '접기' : '더 보기'}</span>
                                      <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                                        aria-hidden
                                      >
                                        <path d="M6 9l6 6 6-6" />
                                      </svg>
                                    </span>
                                  )}
                                </div>

                                {/* 우측 끝 꺾쇠 하나 — 항목 전체가 클릭 대상이라 별도 줄의 '바로가기'는 없앴다.
                                    링크가 있으면 이동(>), 없으면 펼침(v) 신호. */}
                                {(hasLink || expandable) && (
                                  <span
                                    className="flex-shrink-0 self-center text-gray-400 dark:text-gray-500 group-hover:text-brand transition-colors"
                                    aria-hidden
                                  >
                                    {navigating ? (
                                      <span className="block w-3.5 h-3.5 border-[1.5px] border-current border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className={
                                          hasLink
                                            ? ''
                                            : `transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`
                                        }
                                      >
                                        <path d={hasLink ? 'M9 18l6-6-6-6' : 'M6 9l6 6 6-6'} />
                                      </svg>
                                    )}
                                  </span>
                                )}
                              </div>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )
              })}

              {/* 무한 스크롤 sentinel */}
              <div ref={sentinelRef} className="py-1">
                {isFetchingNextPage && (
                  <div className="flex justify-center py-3">
                    <div className="w-5 h-5 border-2 border-gray-200 dark:border-gray-700 border-t-brand rounded-full animate-spin" />
                  </div>
                )}
                {!hasNextPage && notifications.length > 0 && (
                  <div className="flex items-center gap-3 px-8 py-4">
                    <span className="flex-1 h-px bg-gray-200/70 dark:bg-gray-800" aria-hidden />
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      모든 알림을 확인했습니다
                    </span>
                    <span className="flex-1 h-px bg-gray-200/70 dark:bg-gray-800" aria-hidden />
                  </div>
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
