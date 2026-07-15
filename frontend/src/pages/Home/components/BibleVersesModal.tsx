import { useEffect, useMemo, useRef, useState } from 'react'
import type { BibleVerse, RecommendedVerses } from '../../../types/prayer'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { showToast } from '../../../utils/toast'
import './BibleVersesModal.css'

interface BibleVersesModalProps {
  verses: RecommendedVerses
  onClose: () => void
}

interface VerseCardProps {
  verse: BibleVerse
  index: number
  total: number
}

const CAROUSEL_GAP = 12 // gap-3, 인덱스 계산에 사용

const VerseCard = ({ verse, index, total }: VerseCardProps) => {
  return (
    <article className="feed-card relative h-full overflow-hidden rounded-2xl">
      <div className="relative flex h-full flex-col p-5">
        {/* head: index + reference */}
        <div className="mb-3.5 flex items-center gap-2.5">
          <div className="brand-gradient flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl shadow-[0_4px_14px_var(--brand-glow)]">
            <span className="text-[13px] font-bold tabular-nums">
              {index + 1}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[10.5px] font-bold uppercase tracking-[0.08em] text-[var(--brand)]">
              SCRIPTURE · {index + 1}/{total}
            </span>
            <h3 className="m-0 text-[17px] font-bold leading-[1.3] tracking-[-0.015em] text-[var(--text-strong)]">
              {verse.reference}
            </h3>
          </div>
        </div>

        {/* serif blockquote — 말씀이 주인공 */}
        <blockquote className="relative mb-3.5 pl-4 pr-2">
          <span
            className="pointer-events-none absolute -top-1 -left-1 select-none text-[40px] leading-none text-[var(--brand)] opacity-35"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            aria-hidden="true"
          >
            “
          </span>
          <p
            className="m-0 text-[17.5px] font-semibold leading-[1.8] tracking-[-0.005em] text-[var(--text-strong)]"
            style={{
              fontFamily:
                'Georgia, "Noto Serif KR", "Times New Roman", serif',
              wordBreak: 'keep-all',
            }}
          >
            {verse.text}
          </p>
        </blockquote>

        {/* insight message — 톤다운된 보조 가이드 */}
        <div className="bvm-insight mt-auto rounded-xl px-3.5 py-3">
          <div className="flex items-start gap-2">
            <span className="material-icons-round flex-shrink-0 text-[16px] text-[var(--brand)] opacity-70">
              auto_awesome
            </span>
            <p className="m-0 text-[13px] leading-[1.65] text-[var(--text-muted)]">
              {verse.message}
            </p>
          </div>
        </div>
      </div>
    </article>
  )
}

const BibleVersesModal = ({ verses, onClose }: BibleVersesModalProps) => {
  const { t, language } = useLanguage()
  const [isVisible, setIsVisible] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [shareMenuOpen, setShareMenuOpen] = useState(false)

  // 헤더 스와이프 다운으로 닫기 (Bottom Sheet 제스처)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartYRef = useRef<number | null>(null)

  const scrollerRef = useRef<HTMLDivElement>(null)

  const total = verses.verses.length

  // 등장 애니메이션
  useEffect(() => {
    const id = window.setTimeout(() => setIsVisible(true), 30)
    return () => window.clearTimeout(id)
  }, [])

  // 브라우저 뒤로가기 → 모달만 닫기
  useModalBackButton(onClose)

  // ESC 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const heroTitle = useMemo(() => {
    if (language === 'en') {
      return `${total} verses for you`
    }
    return `당신을 위한 ${total}개의 말씀`
  }, [language, total])

  const shareText = async (title: string, body: string, copiedMsg: string) => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text: body })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(body)
        showToast(copiedMsg, 'success')
      } else {
        showToast('이 브라우저는 공유를 지원하지 않아요', 'info')
      }
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return
      showToast('공유 중 문제가 발생했어요', 'error')
    }
  }

  const handleShareCurrent = async () => {
    setShareMenuOpen(false)
    const verse = verses.verses[activeIndex]
    if (!verse) return
    const body =
      `📖 ${verse.reference}\n\n"${verse.text}"\n\n💡 ${verse.message}\n\n` +
      `— 참빛교회 함께 묵상 (${activeIndex + 1}/${total})\n${verses.summary}`
    await shareText(verse.reference, body, '말씀을 복사했어요')
  }

  const handleShareAll = async () => {
    setShareMenuOpen(false)
    const lines = verses.verses
      .map(
        (v, i) =>
          `${i + 1}. ${v.reference}\n"${v.text}"\n💡 ${v.message}`,
      )
      .join('\n\n')
    const body = `📖 ${heroTitle}\n\n${verses.summary}\n\n${lines}\n\n— 참빛교회 함께 묵상`
    await shareText(heroTitle, body, '말씀 묶음을 복사했어요')
  }

  // 캐러셀 스크롤 → 현재 인덱스 추적
  const handleCarouselScroll = () => {
    const el = scrollerRef.current
    if (!el) return
    const idx = Math.round(el.scrollLeft / (el.clientWidth + CAROUSEL_GAP))
    setActiveIndex(Math.max(0, Math.min(total - 1, idx)))
  }

  const scrollToIndex = (idx: number) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollTo({
      left: idx * (el.clientWidth + CAROUSEL_GAP),
      behavior: 'smooth',
    })
  }

  // 스와이프 다운 닫기 제스처 (헤더/핸들 영역에서만)
  const handleDragStart = (e: React.TouchEvent) => {
    dragStartYRef.current = e.touches[0].clientY
    setIsDragging(true)
  }

  const handleDragMove = (e: React.TouchEvent) => {
    if (dragStartYRef.current === null) return
    const delta = e.touches[0].clientY - dragStartYRef.current
    setDragY(delta > 0 ? delta : 0)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    dragStartYRef.current = null
    if (dragY > 90) {
      onClose()
    } else {
      setDragY(0)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t('versesToMeditateOn')}
    >
      <div
        className={`relative flex w-full flex-col sm:max-w-lg max-h-[calc(100dvh-env(safe-area-inset-top,0px)-1.25rem)] sm:max-h-[92vh] overflow-hidden rounded-t-3xl sm:rounded-3xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-card-dark shadow-[0_-16px_60px_var(--brand-glow)] sm:shadow-[0_24px_60px_var(--brand-glow)] ${
          isDragging ? '' : 'transition-all duration-300'
        } ${
          isVisible
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-6 sm:translate-y-0 sm:scale-[0.97]'
        }`}
        style={dragY > 0 ? { transform: `translateY(${dragY}px)` } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — 스와이프 다운으로 닫기 */}
        <div
          className="relative z-20 flex flex-shrink-0 touch-none items-center justify-between border-b border-gray-100 dark:border-white/[0.05] bg-white/95 dark:bg-card-dark/95 px-4 pt-5 pb-3 backdrop-blur-sm"
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          {/* drag handle (mobile) */}
          <div
            aria-hidden="true"
            className="absolute top-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-gray-300/60 dark:bg-white/15 sm:hidden"
          />
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-[var(--brand)]">
            <span className="material-icons-round text-[14px]">
              auto_stories
            </span>
            함께 묵상
          </span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-400 dark:text-white/35 transition-all hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-600 dark:hover:text-white/70"
            aria-label="닫기"
          >
            <span className="material-icons-round text-[17px]">close</span>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-4">
          {/* Hero card */}
          <section className="bvm-hero relative mb-4 overflow-hidden rounded-2xl p-5">
            <span aria-hidden="true" className="bvm-hero-accent-line" />

            <div className="relative flex items-start gap-3">
              <div className="bvm-hero-emblem flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full">
                <span className="material-icons-round text-[22px]">
                  auto_stories
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="bvm-hero-label inline-block rounded-full px-2 py-0.5 text-[10.5px] font-bold tracking-[0.08em]">
                  TODAY · 함께 묵상
                </span>
                <h2
                  className="bvm-hero-title mt-1.5 text-[20px] font-bold leading-[1.3] tracking-[-0.015em]"
                  style={{ wordBreak: 'keep-all' }}
                >
                  {heroTitle}
                </h2>
              </div>
            </div>

            {verses.summary && (
              <p
                className="bvm-hero-summary relative mt-3.5 mb-0 text-[14px] leading-[1.7]"
                style={{ wordBreak: 'keep-all' }}
              >
                {verses.summary}
              </p>
            )}
          </section>

          {/* Verse carousel — 한 번에 한 구절씩 */}
          <div
            ref={scrollerRef}
            onScroll={handleCarouselScroll}
            className="bvm-carousel flex snap-x snap-mandatory gap-3 overflow-x-auto"
          >
            {verses.verses.map((verse, index) => (
              <div
                key={index}
                className="w-full flex-shrink-0 snap-center snap-always"
              >
                <VerseCard verse={verse} index={index} total={total} />
              </div>
            ))}
          </div>

          {/* Dots + hint */}
          {total > 1 && (
            <div
              className="mt-4 flex items-center justify-center gap-2"
              role="tablist"
              aria-label="말씀 카드 이동"
            >
              {verses.verses.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  role="tab"
                  aria-selected={idx === activeIndex}
                  aria-label={`${idx + 1}번째 말씀`}
                  onClick={() => scrollToIndex(idx)}
                  className={`rounded-full transition-all duration-300 ${
                    idx === activeIndex
                      ? 'h-2 w-6 bg-[var(--brand)]'
                      : 'h-2 w-2 bg-gray-300 dark:bg-white/20 hover:bg-[var(--brand-soft-strong)]'
                  }`}
                />
              ))}
            </div>
          )}

          <p className="mt-3 mb-0 text-center text-[11.5px] text-gray-400 dark:text-white/40">
            옆으로 넘기며 한 절씩 천천히 묵상해보세요.
          </p>
        </div>

        {/* Bottom action bar — 한 손 조작 영역 */}
        <div className="relative z-20 flex flex-shrink-0 items-center gap-2 border-t border-gray-100 dark:border-white/[0.05] bg-white/95 dark:bg-card-dark/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-sm">
          {/* 공유 메뉴 팝오버 */}
          {shareMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShareMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute bottom-full left-4 z-40 mb-2 w-56 overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-card-dark shadow-[0_12px_32px_rgba(0,0,0,0.25)]">
                <button
                  type="button"
                  onClick={handleShareCurrent}
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[13.5px] font-medium text-gray-800 dark:text-white/85 transition-colors hover:bg-[var(--brand-soft)]"
                >
                  <span className="material-icons-round text-[17px] text-[var(--brand)]">
                    article
                  </span>
                  지금 보는 말씀 공유
                </button>
                <div className="h-px bg-gray-100 dark:bg-white/[0.06]" />
                <button
                  type="button"
                  onClick={handleShareAll}
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[13.5px] font-medium text-gray-800 dark:text-white/85 transition-colors hover:bg-[var(--brand-soft)]"
                >
                  <span className="material-icons-round text-[17px] text-[var(--brand)]">
                    library_books
                  </span>
                  말씀 {total}개 전체 공유
                </button>
              </div>
            </>
          )}

          <button
            type="button"
            onClick={() => setShareMenuOpen((v) => !v)}
            className="inline-flex h-12 items-center gap-1.5 rounded-2xl border border-gray-200 dark:border-white/[0.1] bg-gray-50 dark:bg-white/[0.04] px-4 text-[14px] font-semibold text-gray-700 dark:text-white/80 transition-all hover:border-[var(--brand-soft-strong)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]"
            aria-label="공유 옵션 열기"
            aria-expanded={shareMenuOpen}
          >
            <span className="material-icons-round text-[18px]">ios_share</span>
            공유
          </button>
          <button
            type="button"
            onClick={onClose}
            className="brand-gradient inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-2xl text-[15px] font-bold shadow-[0_8px_24px_-8px_var(--brand-glow)] transition-transform active:scale-[0.98]"
          >
            <span className="material-icons-round text-[18px]">
              check_circle
            </span>
            묵상 완료
          </button>
        </div>
      </div>
    </div>
  )
}

export default BibleVersesModal
