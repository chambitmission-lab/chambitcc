// 행사 사진 풀스크린 뷰어 (Single Responsibility: 사진 크게 보기)
// 검은 액자 대신, 지금 사진의 색이 번진 빛(앰비언트) 위에 둥근 사진을 띄운다.
// 넘길 때 옆 사진은 살짝 작아지고 흐려져, 사진첩을 한 장씩 넘기는 느낌을 준다.
// 이동: 옆으로 쓸기 · ←/→ 키 · 좌우 버튼 · 사진 왼쪽/오른쪽 절반 클릭.
import { useCallback, useEffect, useRef, useState } from 'react'
import { useEscapeKey } from '../../../hooks/useEscapeKey'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { formatEventDate } from './eventAlbumDate'
import type { EventAlbumPost } from '../../../types/eventAlbum'
import { useLanguage } from '../../../contexts/LanguageContext'

interface EventAlbumViewerProps {
  post: EventAlbumPost
  initialIndex?: number
  onClose: () => void
}

/** 점 표시로 보여 줄 최대 장수 — 넘으면 숫자만 */
const MAX_DOTS = 12

const EventAlbumViewer = ({ post, initialIndex = 0, onClose }: EventAlbumViewerProps) => {
  const { t } = useLanguage()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(initialIndex)
  // 키를 연달아 누르면 스크롤이 끝나기 전에 다음 목표가 와야 해서, 목표 장은 ref 로 따로 든다
  const targetRef = useRef(initialIndex)
  // 첫 그림이 뜨면 살며시 떠오르게
  const [entered, setEntered] = useState(false)
  const total = post.photos.length

  useModalBackButton(onClose)
  useEscapeKey(onClose)

  // 탭한 사진에서 열리도록 첫 렌더에 위치를 맞춘다 (애니메이션 없이 즉시)
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = initialIndex * el.clientWidth
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [initialIndex])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el || el.clientWidth === 0) return
    const next = Math.round(el.scrollLeft / el.clientWidth)
    if (next !== index) setIndex(next)
    // 손으로 넘겨 멈춘 자리를 목표로 삼는다 (부드러운 이동 중 중간값은 무시)
    if (Math.abs(el.scrollLeft - next * el.clientWidth) < 2) targetRef.current = next
  }

  const goTo = useCallback(
    (next: number) => {
      const el = scrollRef.current
      if (!el) return
      const clamped = Math.min(total - 1, Math.max(0, next))
      if (clamped === targetRef.current) return
      targetRef.current = clamped
      setIndex(clamped)
      el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' })
    },
    [total],
  )
  const go = useCallback((dir: 1 | -1) => goTo(targetRef.current + dir), [goTo])

  useEffect(() => {
    if (total < 2) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        go(1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        go(-1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, total])

  return (
    <div
      className="fixed inset-0 z-[130] bg-[#0b0b0d] flex flex-col overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={post.title}
    >
      {/* 앰비언트 빛 — 지금 사진을 크게 흐려 깔고, 장이 바뀌면 천천히 갈아 끼운다(앞뒤 장만 싣는다) */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {post.photos.map((photo, i) =>
          Math.abs(i - index) <= 1 ? (
            <img
              key={photo.id}
              src={photo.url}
              alt=""
              draggable={false}
              className="absolute inset-0 w-full h-full object-cover scale-125 blur-[70px] saturate-[1.6] transition-opacity duration-700 ease-out"
              style={{ opacity: i === index ? 0.55 : 0 }}
            />
          ) : null,
        )}
        {/* 가장자리는 어둡게 눌러 사진에 시선이 모이게 */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.15)_0%,rgba(0,0,0,0.7)_100%)]" />
      </div>

      {/* 헤더 — 닫기 · 행사 이름 · 날짜 */}
      <div
        className="relative z-10 shrink-0 flex items-center gap-3 px-4 lg:px-6 pb-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 14px)' }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('newsClose')}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="min-w-0">
          <p className="text-white text-[15px] lg:text-[17px] font-bold tracking-[-0.02em] truncate">{post.title}</p>
          <p className="text-white/60 text-[12px] lg:text-[13px] truncate">
            {formatEventDate(post.event_date, t)} · {post.tag}
          </p>
        </div>
        {total > 1 && (
          <span className="ml-auto shrink-0 px-3 h-8 inline-flex items-center rounded-full bg-white/10 backdrop-blur-md text-white/90 text-[12.5px] font-bold tabular-nums">
            {index + 1} / {total}
          </span>
        )}
      </div>

      {/* 사진 — 왼쪽 절반을 누르면 이전, 오른쪽 절반을 누르면 다음 장 */}
      <div className="relative z-10 flex-1 min-h-0">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onClick={(e) => {
            if (total < 2) return
            const rect = e.currentTarget.getBoundingClientRect()
            go(e.clientX - rect.left < rect.width / 2 ? -1 : 1)
          }}
          className={`absolute inset-0 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide ${total > 1 ? 'cursor-pointer' : ''}`}
        >
          {post.photos.map((photo, i) => {
            const active = i === index
            return (
              <div
                key={photo.id}
                className="flex-shrink-0 w-full h-full snap-center flex items-center justify-center px-4 py-2 lg:px-24 lg:py-4"
              >
                <img
                  src={photo.url}
                  alt={`${post.title} ${i + 1} / ${total}`}
                  draggable={false}
                  loading={Math.abs(i - initialIndex) <= 1 ? 'eager' : 'lazy'}
                  className={[
                    'max-w-full max-h-full object-contain select-none rounded-[14px] lg:rounded-[20px]',
                    'shadow-[0_30px_80px_-20px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.06)]',
                    'transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                    active && entered ? 'scale-100 opacity-100' : 'scale-[0.94] opacity-40',
                  ].join(' ')}
                />
              </div>
            )
          })}
        </div>

        {total > 1 && (
          <>
            <NavButton dir={-1} disabled={index === 0} label={t('newsEaPrevPhoto')} onClick={() => go(-1)} />
            <NavButton dir={1} disabled={index === total - 1} label={t('newsEaNextPhoto')} onClick={() => go(1)} />
          </>
        )}
      </div>

      {/* 아래 — 점 표시(인스타그램식) + 캡션 */}
      <div
        className="relative z-10 shrink-0 px-5 lg:px-6 pt-3"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        {total > 1 && total <= MAX_DOTS && (
          <div className="flex items-center justify-center gap-1.5" role="tablist" aria-label={t('newsEaPhotoCount').replace('{n}', String(total))}>
            {post.photos.map((photo, i) => (
              <button
                key={photo.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`${i + 1} / ${total}`}
                onClick={() => goTo(i)}
                className="p-1"
              >
                <span
                  className={`block h-[6px] rounded-full transition-all duration-300 ${
                    i === index ? 'w-[18px] bg-white' : 'w-[6px] bg-white/35 hover:bg-white/60'
                  }`}
                />
              </button>
            ))}
          </div>
        )}
        {post.caption && (
          <p className="mx-auto mt-3 max-w-[680px] text-center text-white/80 text-[13.5px] lg:text-[15px] leading-[1.7] whitespace-pre-wrap max-h-24 overflow-y-auto">
            {post.caption}
          </p>
        )}
      </div>
    </div>
  )
}

// 좌우 이동 버튼 — 유리 원판, 끝 장에서는 감춘다
const NavButton = ({
  dir,
  disabled,
  label,
  onClick,
}: {
  dir: 1 | -1
  disabled: boolean
  label: string
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className={[
      'absolute top-1/2 -translate-y-1/2 z-10 w-11 h-11 lg:w-12 lg:h-12 rounded-full flex items-center justify-center',
      'bg-white/85 hover:bg-white text-[#191f28] shadow-[0_8px_24px_-6px_rgba(0,0,0,0.5)]',
      'transition-[opacity,transform] duration-200 hover:scale-105 active:scale-95',
      dir === -1 ? 'left-4 lg:left-8' : 'right-4 lg:right-8',
      disabled ? 'opacity-0 pointer-events-none' : 'opacity-100',
      // 모바일은 손으로 넘기므로 버튼을 숨긴다
      'max-lg:hidden',
    ].join(' ')}
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {dir === -1 ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
    </svg>
  </button>
)

export default EventAlbumViewer
