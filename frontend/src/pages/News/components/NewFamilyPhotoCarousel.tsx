// 새가족 사진 캐러셀 (Single Responsibility: 가로 스와이프 + 인디케이터)
//
// 제스처 계산 대신 CSS scroll-snap을 쓴다 — 모바일에서 관성 스크롤이 그대로 살아
// 인스타 캐러셀과 같은 감각이 나오고, 코드도 짧다.
import { useRef, useState } from 'react'
import type { NewFamilyPhoto } from '../../../types/newFamily'

interface NewFamilyPhotoCarouselProps {
  photos: NewFamilyPhoto[]
  alt: string
  onPhotoClick?: (index: number) => void
  /** 정사각(피드) 기본, false면 원본 비율 유지 */
  square?: boolean
}

const NewFamilyPhotoCarousel = ({
  photos,
  alt,
  onPhotoClick,
  square = true,
}: NewFamilyPhotoCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el || el.clientWidth === 0) return
    const next = Math.round(el.scrollLeft / el.clientWidth)
    if (next !== index) setIndex(next)
  }

  const scrollTo = (i: number) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }

  if (photos.length === 0) return null

  return (
    <div className="relative bg-gray-100 dark:bg-white/[0.03]">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
      >
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => onPhotoClick?.(i)}
            className={[
              'relative flex-shrink-0 w-full snap-center',
              square ? 'aspect-square' : '',
            ].join(' ')}
            aria-label={`${alt} 사진 ${i + 1}`}
          >
            <img
              src={photo.image_url}
              alt={`${alt} ${i + 1}`}
              loading={i === 0 ? 'eager' : 'lazy'}
              draggable={false}
              className={[
                'w-full',
                square ? 'absolute inset-0 h-full object-cover' : 'h-auto',
              ].join(' ')}
            />
          </button>
        ))}
      </div>

      {photos.length > 1 && (
        <>
          {/* 장수 chip (인스타 우상단) */}
          <span className="absolute top-3 right-3 inline-flex items-center px-2 h-6 rounded-full bg-black/55 backdrop-blur-sm text-white text-[10.5px] font-bold tabular-nums pointer-events-none">
            {index + 1}/{photos.length}
          </span>

          {/* dot 인디케이터 */}
          <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5">
            {photos.map((photo, i) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => scrollTo(i)}
                aria-label={`사진 ${i + 1}로 이동`}
                className={[
                  'rounded-full transition-all duration-200',
                  i === index
                    ? 'w-1.5 h-1.5 bg-white shadow-[0_0_6px_rgba(0,0,0,0.5)]'
                    : 'w-1.5 h-1.5 bg-white/45',
                ].join(' ')}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default NewFamilyPhotoCarousel
