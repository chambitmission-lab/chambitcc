import { useEffect, useRef } from 'react'

interface LoadMoreSentinelProps {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
}

// 탭 목록 하단에 두는 무한 스크롤 sentinel (NotificationModal과 동일 패턴)
const LoadMoreSentinel = ({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: LoadMoreSentinelProps) => {
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1, rootMargin: '200px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <div ref={sentinelRef} className="py-1">
      {isFetchingNextPage && (
        <div className="flex justify-center py-3">
          <div className="w-5 h-5 border-2 border-gray-200 dark:border-white/[0.12] border-t-brand rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}

export default LoadMoreSentinel
