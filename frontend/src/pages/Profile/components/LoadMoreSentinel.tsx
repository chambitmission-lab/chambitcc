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
      // 화면 1.5개 앞에서 미리 받는다 — 200px 이던 때는 목록 끝에 닿아 스피너를 본 뒤에야
      // 20개가 한꺼번에 붙어 스크롤 도중 화면이 덜컥 늘어났다 (성경 절 목록과 같은 값)
      { threshold: 0, rootMargin: '0px 0px 150% 0px' },
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
