import { useState, useEffect } from 'react'
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../../hooks/useNotifications'
import { showToast } from '../../utils/toast'
import type { Notification } from '../../types/notification'

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
}

const NotificationModal = ({ isOpen, onClose }: NotificationModalProps) => {
  const [readingIds, setReadingIds] = useState<Set<number>>(new Set())
  const isLoggedIn = !!localStorage.getItem('access_token')
  
  // React Query로 알림 목록 조회 (unread_count 포함)
  const { data, isLoading } = useNotifications()
  const notifications = data?.notifications || []
  const unreadCount = data?.unread_count || 0
  
  // React Query mutations
  const markAsReadMutation = useMarkAsRead()
  const markAllAsReadMutation = useMarkAllAsRead()

  const handleNotificationClick = async (notification: Notification) => {
    // 로그인 상태이고 읽지 않은 알림이며, 현재 읽음 처리 중이 아닌 경우에만 처리
    if (isLoggedIn && !notification.is_read && !readingIds.has(notification.id)) {
      try {
        // 읽음 처리 중 표시
        setReadingIds(prev => new Set(prev).add(notification.id))
        
        await markAsReadMutation.mutateAsync(notification.id)
      } catch (error) {
        console.error('읽음 처리 실패:', error)
      } finally {
        setReadingIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(notification.id)
          return newSet
        })
      }
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!isLoggedIn) return
    
    try {
      await markAllAsReadMutation.mutateAsync()
      showToast('모든 알림을 읽음 처리했습니다', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '읽음 처리에 실패했습니다', 'error')
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] animate-[fadeIn_0.3s_ease]"
        onClick={onClose} 
      />

      {/* Modal */}
      <div className="fixed top-[60px] right-5 w-[420px] max-w-[calc(100vw-40px)] max-h-[calc(100vh-100px)] z-[1000] flex flex-col animate-[slideDown_0.4s_cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden rounded-2xl backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border border-white/60 dark:border-gray-700/50 shadow-[0_20px_60px_rgba(168,85,247,0.25),0_0_0_1px_rgba(168,85,247,0.1)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1)]">
        
        {/* Header */}
        <div className="relative flex justify-between items-center px-6 py-4 border-b border-purple-500/20 dark:border-white/20 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 dark:from-purple-500/20 dark:via-pink-500/20 dark:to-purple-500/20">
          {/* 위에서 내려오는 빛 효과 */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[2px] h-6 bg-gradient-to-b from-transparent via-purple-400/40 to-purple-500/60 dark:via-white/30 dark:to-white/50 blur-[1px]"></div>
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[1px] h-6 bg-gradient-to-b from-transparent via-purple-500/60 to-purple-600/80 dark:via-white/50 dark:to-white/70"></div>
          
          {/* 하단 빛 라인 */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 opacity-60"></div>
          
          <h2 className="text-xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 dark:from-purple-400 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(168,85,247,0.5)] dark:drop-shadow-[0_0_12px_rgba(168,85,247,0.7)]">
            공지사항
          </h2>
          
          <div className="flex items-center gap-2">
            {isLoggedIn && unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 text-white font-bold text-sm rounded-full shadow-lg shadow-purple-500/30 dark:shadow-purple-900/30 hover:shadow-xl hover:shadow-purple-500/40 dark:hover:shadow-purple-900/40 transition-all hover:scale-105 active:scale-95"
              >
                모두 읽음
              </button>
            )}
            
            <button
              onClick={onClose}
              className="relative group w-9 h-9 flex items-center justify-center"
            >
              {/* 빛나는 효과 */}
              <div className="absolute inset-0 rounded-full bg-purple-500/20 dark:bg-yellow-400/20 blur-2xl scale-150 group-hover:scale-[2] animate-pulse transition-transform duration-500"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400/50 via-pink-400/50 to-purple-500/50 dark:from-yellow-300/50 dark:via-orange-300/50 dark:to-yellow-400/50 blur-xl scale-125 group-hover:scale-150 animate-pulse transition-transform duration-300"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400/70 to-pink-500/70 dark:from-yellow-400/70 dark:to-orange-400/70 blur-lg group-hover:blur-xl animate-pulse"></div>
              <div className="absolute inset-0 rounded-full bg-white/40 dark:bg-white/50 blur-sm animate-ping"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 dark:from-yellow-400 dark:to-orange-400 opacity-80 group-hover:opacity-100 shadow-[0_0_30px_rgba(168,85,247,0.8)] dark:shadow-[0_0_40px_rgba(250,204,21,0.9)] group-hover:shadow-[0_0_50px_rgba(168,85,247,1)] dark:group-hover:shadow-[0_0_60px_rgba(250,204,21,1)] transition-all"></div>
              
              <span className="material-icons-outlined relative z-10 text-white drop-shadow-[0_0_15px_rgba(255,255,255,1)] group-hover:drop-shadow-[0_0_25px_rgba(255,255,255,1)] transition-all group-hover:scale-110 group-hover:rotate-90 duration-300 font-bold">
                close
              </span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/90 dark:bg-gray-950/90 no-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
              <div className="w-10 h-10 border-3 border-purple-500/20 border-t-purple-500 border-r-pink-500 rounded-full animate-spin mb-6"></div>
              <p className="font-medium">로딩 중...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
              <span className="material-icons-outlined text-6xl mb-4 bg-gradient-to-br from-purple-500 to-pink-500 bg-clip-text text-transparent opacity-40">
                notifications_none
              </span>
              <p className="font-medium">공지사항이 없습니다</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`relative p-5 rounded-xl cursor-pointer transition-all duration-300 overflow-hidden backdrop-blur-xl border ${
                    notification.is_read
                      ? 'bg-white/90 dark:bg-gray-800/90 border-gray-200/80 dark:border-gray-700/50 hover:border-purple-500/30 dark:hover:border-purple-500/40'
                      : 'bg-gradient-to-br from-purple-500/20 via-pink-500/15 to-purple-500/20 dark:from-purple-500/30 dark:via-pink-500/25 dark:to-purple-500/30 border-purple-500/30 dark:border-purple-500/40 shadow-[0_2px_8px_rgba(168,85,247,0.15)] bg-white/80 dark:bg-gray-800/80'
                  } hover:translate-x-1 hover:shadow-[0_4px_16px_rgba(168,85,247,0.2)]`}
                >
                  {/* 왼쪽 빛 라인 */}
                  <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-pink-500 ${notification.is_read ? 'opacity-0' : 'opacity-60'} transition-opacity`}></div>
                  
                  {/* 내부 빛 효과 */}
                  {!notification.is_read && (
                    <>
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-gradient-to-b from-purple-300/20 to-transparent dark:from-white/10 dark:to-transparent rounded-full blur-2xl"></div>
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400/15 to-pink-400/15 dark:from-white/8 dark:to-white/5 rounded-full blur-2xl"></div>
                    </>
                  )}
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-2 gap-3">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug drop-shadow-[0_0_6px_rgba(168,85,247,0.3)] dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                        {notification.title}
                      </h3>
                      {!notification.is_read && (
                        <span className="w-2.5 h-2.5 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex-shrink-0 mt-1.5 shadow-[0_0_0_3px_rgba(239,68,68,0.15)] animate-pulse"></span>
                      )}
                    </div>
                    
                    <p className="text-[15px] text-gray-600 dark:text-gray-300 leading-relaxed mb-3 whitespace-pre-wrap break-words">
                      {notification.content}
                    </p>
                    
                    <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 opacity-70 font-medium">
                      <span>📅</span>
                      {new Date(notification.created_at).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default NotificationModal
