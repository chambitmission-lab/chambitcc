import { useState, useMemo } from 'react'
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
} from '../../hooks/useNotifications'
import { showToast } from '../../utils/toast'
import { useModalBackButton } from '../../hooks/useModalBackButton'
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

// 2줄을 넘을 것으로 예상되는 컨텐츠 여부 판단
const needsExpand = (content: string) =>
  content.length > 80 || content.includes('\n')

const NotificationModal = ({ isOpen, onClose }: NotificationModalProps) => {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const isLoggedIn = !!localStorage.getItem('access_token')

  const { data, isLoading } = useNotifications()
  const notifications = data?.notifications || []
  const unreadCount = data?.unread_count || 0

  const markAsReadMutation = useMarkAsRead()
  const markAllAsReadMutation = useMarkAllAsRead()

  const grouped = useMemo(() => {
    const groups: Record<DateGroup, Notification[]> = { today: [], week: [], older: [] }
    notifications.forEach((n) => groups[getDateGroup(n.created_at)].push(n))
    return groups
  }, [notifications])

  const groupOrder: DateGroup[] = ['today', 'week', 'older']

  const toggleExpand = async (notification: Notification) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.has(notification.id) ? next.delete(notification.id) : next.add(notification.id)
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
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-50 tracking-tight">
              공지사항
            </h2>
            {unreadCount > 0 && (
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                {unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {isLoggedIn && unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
                className="px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                모두 읽음
              </button>
            )}

            <button
              onClick={onClose}
              aria-label="닫기"
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/60 rounded-md transition-colors"
            >
              <span className="material-icons-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-gray-200 dark:border-gray-700 border-t-purple-500 rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <span className="material-icons-outlined text-[40px] text-gray-300 dark:text-gray-600 mb-3">
                notifications_none
              </span>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                새로운 공지사항이 없습니다
              </p>
            </div>
          ) : (
            <div>
              {groupOrder.map((group) => {
                const items = grouped[group]
                if (items.length === 0) return null

                return (
                  <div key={group}>
                    {/* 날짜 그룹 헤더 */}
                    <div className="sticky top-0 px-5 py-2 bg-gray-50/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800">
                      <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 tracking-wider uppercase">
                        {GROUP_LABELS[group]}
                      </span>
                    </div>

                    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                      {items.map((notification) => {
                        const unread = !notification.is_read
                        const expanded = expandedIds.has(notification.id)
                        const expandable = needsExpand(notification.content)

                        return (
                          <li key={notification.id}>
                            <button
                              type="button"
                              onClick={() => toggleExpand(notification)}
                              className={`group w-full text-left px-5 py-4 transition-colors ${
                                unread
                                  ? 'bg-purple-50/40 dark:bg-purple-500/[0.04] hover:bg-purple-50/70 dark:hover:bg-purple-500/[0.07]'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {/* 읽지 않음 점 */}
                                <span className="flex-shrink-0 w-2 h-2 mt-[7px]" aria-hidden>
                                  {unread && (
                                    <span className="block w-2 h-2 rounded-full bg-purple-500" />
                                  )}
                                </span>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-baseline justify-between gap-3 mb-1">
                                    <h3
                                      className={`text-[15px] leading-snug truncate ${
                                        unread
                                          ? 'font-semibold text-gray-900 dark:text-gray-50'
                                          : 'font-medium text-gray-700 dark:text-gray-300'
                                      }`}
                                    >
                                      {notification.title}
                                    </h3>
                                    <span className="flex-shrink-0 text-[11px] text-gray-400 dark:text-gray-500 tabular-nums">
                                      {formatDate(notification.created_at)}
                                    </span>
                                  </div>

                                  <p
                                    className={`text-[13.5px] text-gray-600 dark:text-gray-400 leading-relaxed break-words ${
                                      expandable && !expanded ? 'content-clamp' : 'whitespace-pre-wrap'
                                    }`}
                                  >
                                    {notification.content}
                                  </p>

                                  {expandable && (
                                    <div className="mt-2 flex items-center gap-0.5 text-[12px] font-medium text-purple-500 dark:text-purple-400">
                                      <span>{expanded ? '접기' : '더 보기'}</span>
                                      <span className="material-icons-outlined text-[14px] leading-none">
                                        {expanded ? 'expand_less' : 'expand_more'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default NotificationModal
