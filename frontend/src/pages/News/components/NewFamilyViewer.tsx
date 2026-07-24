// 새가족 사진 풀스크린 뷰어 (Single Responsibility: 사진 크게 보기)
import { useEffect, useRef, useState } from 'react'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import type { NewFamilyPost } from '../../../types/newFamily'

interface NewFamilyViewerProps {
  post: NewFamilyPost
  initialIndex?: number
  onClose: () => void
}

const NewFamilyViewer = ({ post, initialIndex = 0, onClose }: NewFamilyViewerProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(initialIndex)

  useModalBackButton(onClose)

  // 탭한 사진에서 열리도록 첫 렌더에 위치를 맞춘다 (애니메이션 없이 즉시)
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = initialIndex * el.clientWidth
  }, [initialIndex])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el || el.clientWidth === 0) return
    const next = Math.round(el.scrollLeft / el.clientWidth)
    if (next !== index) setIndex(next)
  }

  return (
    <div className="fixed inset-0 z-[130] bg-black flex flex-col">
      {/* 헤더 */}
      <div className="shrink-0 flex items-center gap-3 px-3 py-3 bg-gradient-to-b from-black/80 to-transparent">
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="w-10 h-10 rounded-full flex items-center justify-center text-white/85 hover:bg-white/10 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="min-w-0">
          <p className="text-white text-[14.5px] font-bold truncate">{post.member_name}</p>
          {post.group_name && (
            <p className="text-white/55 text-[11.5px] truncate">{post.group_name}</p>
          )}
        </div>
        {post.photos.length > 1 && (
          <span className="ml-auto text-white/70 text-[12px] font-bold tabular-nums">
            {index + 1} / {post.photos.length}
          </span>
        )}
      </div>

      {/* 사진 */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
      >
        {post.photos.map((photo) => (
          <div
            key={photo.id}
            className="flex-shrink-0 w-full h-full snap-center flex items-center justify-center"
          >
            <img
              src={photo.image_url}
              alt={post.member_name}
              draggable={false}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ))}
      </div>

      {/* 인사말 */}
      {post.greeting && (
        <div className="shrink-0 px-5 py-4 bg-gradient-to-t from-black/85 to-transparent">
          <p className="text-white/85 text-[13px] leading-[1.6] whitespace-pre-wrap max-h-24 overflow-y-auto">
            {post.greeting}
          </p>
        </div>
      )}
    </div>
  )
}

export default NewFamilyViewer
