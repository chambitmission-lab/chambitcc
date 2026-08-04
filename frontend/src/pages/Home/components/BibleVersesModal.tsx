import { useEffect, useMemo, useRef, useState } from 'react'
import type { BibleVerse, RecommendedVerses } from '../../../types/prayer'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { showToast } from '../../../utils/toast'
import './BibleVersesModal.css'

interface BibleVersesModalProps {
  verses: RecommendedVerses
  onClose: () => void
  /** 기도 작성자 이름 — 있으면 마무리 축복 문장에 이름을 호명한다 */
  authorName?: string
}

type Page =
  | { kind: 'intro' }
  | { kind: 'verse'; verse: BibleVerse; index: number }
  | { kind: 'closing' }

const AMBIENT_CYCLE = ['bvm-amb-0', 'bvm-amb-1', 'bvm-amb-2']
const KO_COUNT = ['', '한', '두', '세', '네']
const EN_COUNT = ['', 'one', 'two', 'three', 'four']

const BibleVersesModal = ({ verses, onClose, authorName }: BibleVersesModalProps) => {
  const { t, language } = useLanguage()
  const isEn = language === 'en'
  const [isVisible, setIsVisible] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [shareMenuOpen, setShareMenuOpen] = useState(false)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  // 헤더 스와이프 다운으로 닫기 (Bottom Sheet 제스처)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartYRef = useRef<number | null>(null)

  const scrollerRef = useRef<HTMLDivElement>(null)

  const total = verses.verses.length
  const pages = useMemo<Page[]>(
    () => [
      { kind: 'intro' },
      ...verses.verses.map((verse, index) => ({ kind: 'verse' as const, verse, index })),
      { kind: 'closing' },
    ],
    [verses],
  )
  const pageCount = pages.length

  // 등장 애니메이션
  useEffect(() => {
    const id = window.setTimeout(() => setIsVisible(true), 30)
    return () => window.clearTimeout(id)
  }, [])

  // 브라우저 뒤로가기 → 모달만 닫기
  useModalBackButton(onClose)

  const scrollToIndex = (idx: number) => {
    const el = scrollerRef.current
    if (!el) return
    const clamped = Math.max(0, Math.min(pageCount - 1, idx))
    el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' })
  }

  // ESC 닫기 + 방향키 이동
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') scrollToIndex(activeIndex + 1)
      if (e.key === 'ArrowLeft') scrollToIndex(activeIndex - 1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, activeIndex, pageCount])

  const heroTitle = useMemo(() => {
    if (isEn) return `${total} verses for you`
    return `당신을 위한 ${total}개의 말씀`
  }, [isEn, total])

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
    const verseIdx = Math.max(0, Math.min(total - 1, activeIndex - 1))
    const verse = verses.verses[verseIdx]
    if (!verse) return
    const body =
      `📖 ${verse.reference}\n\n"${verse.text}"\n\n💡 ${verse.message}\n\n` +
      `— 참빛교회 함께 묵상 (${verseIdx + 1}/${total})\n${verses.summary}`
    await shareText(verse.reference, body, '말씀을 복사했어요')
  }

  const handleShareAll = async () => {
    setShareMenuOpen(false)
    const lines = verses.verses
      .map((v, i) => `${i + 1}. ${v.reference}\n"${v.text}"\n💡 ${v.message}`)
      .join('\n\n')
    const body = `📖 ${heroTitle}\n\n${verses.summary}\n\n${lines}\n\n— 참빛교회 함께 묵상`
    await shareText(heroTitle, body, '말씀 묶음을 복사했어요')
  }

  // 캐러셀 스크롤 → 현재 페이지 추적
  const handleCarouselScroll = () => {
    const el = scrollerRef.current
    if (!el) return
    const idx = Math.round(el.scrollLeft / el.clientWidth)
    setActiveIndex(Math.max(0, Math.min(pageCount - 1, idx)))
  }

  // 좌우 가장자리 탭으로 페이지 이동 (스토리 문법)
  const handlePageTap = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a')) return
    const el = scrollerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    if (ratio < 0.28) scrollToIndex(activeIndex - 1)
    else if (ratio > 0.72) scrollToIndex(activeIndex + 1)
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

  const introTitle = isEn
    ? `${(EN_COUNT[total] ?? String(total)).replace(/^./, (c) => c.toUpperCase())} verses,\nchosen for your prayer`
    : `당신의 기도에 닿는\n${KO_COUNT[total] ?? String(total)} 구절을 골랐어요`
  const introSub = isEn
    ? 'Turn each page slowly, like a breath.'
    : '한 장씩, 호흡처럼 천천히 넘겨보세요'
  // 익명 기도('익명' 데이터값)는 이름 호명 대신 일반 축복 문장으로
  const trimmedName = authorName?.trim()
  const name =
    trimmedName && trimmedName !== '익명' && trimmedName.toLowerCase() !== 'anonymous'
      ? trimmedName
      : undefined
  const closingTitle = name
    ? isEn
      ? `May these words rest\nupon ${name}'s prayer`
      : `${name}님의 기도 위에\n이 말씀이 오래 머물기를`
    : isEn
      ? 'May these words\nstay with you today'
      : '이 말씀이 당신의 오늘에\n오래 머물기를'
  const closingSub = isEn
    ? 'Carry with you the verse that stayed.'
    : '마음에 남은 한 구절을 품고 돌아가세요'

  const renderPage = (page: Page, pageIdx: number) => {
    const isActive = pageIdx === activeIndex
    const ambient =
      page.kind === 'intro'
        ? 'bvm-amb-intro'
        : page.kind === 'closing'
          ? 'bvm-amb-closing'
          : AMBIENT_CYCLE[page.index % AMBIENT_CYCLE.length]

    return (
      <div
        key={pageIdx}
        className={`bvm-page relative h-full w-full flex-shrink-0 snap-center snap-always overflow-hidden ${ambient} ${
          isActive ? 'is-active' : ''
        }`}
      >
        <span aria-hidden="true" className="bvm-orb bvm-orb-a" />
        <span aria-hidden="true" className="bvm-orb bvm-orb-b" />

        <div className="relative h-full overflow-y-auto">
          <div className="flex min-h-full flex-col px-8 pt-20 pb-28">
            <div className="m-auto w-full max-w-[360px] text-center">
              {page.kind === 'intro' && (
                <>
                  <span className="bvm-fade bvm-d1 block text-[12px] font-semibold uppercase tracking-[0.22em] text-white/45">
                    {isEn ? 'Meditate together' : '함께 묵상'}
                  </span>
                  <h2
                    className="bvm-serif bvm-fade bvm-d2 mx-auto mt-5 whitespace-pre-line text-[24px] font-semibold leading-[1.6] text-[#f4f6fb]"
                    style={{ wordBreak: 'keep-all' }}
                  >
                    {introTitle}
                  </h2>
                  <p className="bvm-fade bvm-d3 mt-6 text-[13.5px] leading-[1.7] text-white/50">
                    {introSub}
                  </p>
                  <span
                    aria-hidden="true"
                    className="bvm-fade bvm-d4 mt-10 inline-flex items-center gap-1.5 text-white/35"
                  >
                    <span className="text-[12px]">
                      {isEn ? 'swipe' : '옆으로 넘기기'}
                    </span>
                    <span className="material-icons-round text-[15px]">
                      east
                    </span>
                  </span>
                </>
              )}

              {page.kind === 'verse' && (
                <>
                  <span className="bvm-fade bvm-d1 block text-[12.5px] font-semibold tracking-[0.14em] text-white/55">
                    {page.verse.reference}
                  </span>
                  <blockquote className="m-0 mt-6">
                    <p
                      className={`bvm-serif bvm-fade bvm-d2 m-0 font-semibold text-[#f4f6fb] ${
                        page.verse.text.length > 120
                          ? 'text-[18px] leading-[1.9]'
                          : 'text-[20.5px] leading-[1.95]'
                      }`}
                      style={{
                        wordBreak: 'keep-all',
                        textShadow: '0 2px 24px rgba(0,0,0,0.35)',
                      }}
                    >
                      “{page.verse.text}”
                    </p>
                  </blockquote>
                  <span
                    aria-hidden="true"
                    className="bvm-fade bvm-d3 mx-auto mt-8 block h-px w-10 bg-white/20"
                  />
                  <div className="bvm-fade bvm-d3 mt-7">
                    <p
                      className={`m-0 text-[14px] leading-[1.8] text-white/65 ${
                        page.verse.message.length > 130 && !expanded[page.index]
                          ? 'bvm-clamp'
                          : ''
                      }`}
                      style={{ wordBreak: 'keep-all' }}
                    >
                      {page.verse.message}
                    </p>
                    {page.verse.message.length > 130 && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpanded((prev) => ({
                            ...prev,
                            [page.index]: !prev[page.index],
                          }))
                        }
                        className="mt-2.5 text-[12.5px] font-semibold text-white/45 underline decoration-white/25 underline-offset-4 transition-colors hover:text-white/70"
                      >
                        {expanded[page.index]
                          ? isEn
                            ? 'Show less'
                            : '접기'
                          : isEn
                            ? 'Read more'
                            : '더 읽기'}
                      </button>
                    )}
                  </div>
                </>
              )}

              {page.kind === 'closing' && (
                <>
                  <span
                    aria-hidden="true"
                    className="bvm-fade bvm-d1 block text-[18px] text-[#f4d78c]/80"
                  >
                    ✦
                  </span>
                  <h2
                    className="bvm-serif bvm-fade bvm-d2 mx-auto mt-5 whitespace-pre-line text-[23px] font-semibold leading-[1.65] text-[#f4f6fb]"
                    style={{ wordBreak: 'keep-all' }}
                  >
                    {closingTitle}
                  </h2>
                  <p className="bvm-fade bvm-d3 mt-6 text-[13.5px] leading-[1.7] text-white/50">
                    {closingSub}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t('versesToMeditateOn')}
    >
      <div
        className={`bvm-sheet relative flex w-full flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl sm:max-w-md border border-white/[0.08] bg-[#0a0f1c] shadow-[0_24px_80px_rgba(0,0,0,0.5)] ${
          isDragging ? '' : 'transition-all duration-300'
        } ${
          isVisible
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-6 sm:translate-y-0 sm:scale-[0.97]'
        }`}
        style={dragY > 0 ? { transform: `translateY(${dragY}px)` } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 오버레이 — 드래그 핸들 + 스토리 진행바 + 닫기 */}
        <div
          className="absolute inset-x-0 top-0 z-30 touch-none bg-gradient-to-b from-black/45 to-transparent px-4 pt-2.5 pb-6"
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          <div
            aria-hidden="true"
            className="mx-auto mb-2.5 h-1 w-10 rounded-full bg-white/25 sm:hidden"
          />
          <div className="flex items-center gap-2">
            <div
              className="flex flex-1 gap-1"
              role="tablist"
              aria-label={isEn ? 'Meditation pages' : '묵상 페이지 이동'}
            >
              {pages.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  role="tab"
                  aria-selected={idx === activeIndex}
                  aria-label={
                    isEn ? `Page ${idx + 1}` : `${idx + 1}번째 페이지`
                  }
                  onClick={() => scrollToIndex(idx)}
                  className="group flex-1 py-1.5"
                >
                  <span
                    className={`block h-[3px] rounded-full transition-colors duration-300 ${
                      idx <= activeIndex
                        ? 'bg-white/85'
                        : 'bg-white/20 group-hover:bg-white/35'
                    }`}
                  />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-white/55 transition-colors hover:bg-white/10 hover:text-white/90"
              aria-label="닫기"
            >
              <span className="material-icons-round text-[17px]">close</span>
            </button>
          </div>
        </div>

        {/* 페이지 캐러셀 — 한 화면에 한 호흡 */}
        <div
          ref={scrollerRef}
          onScroll={handleCarouselScroll}
          onClick={handlePageTap}
          className="bvm-carousel flex h-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden"
        >
          {pages.map(renderPage)}
        </div>

        {/* 하단 오버레이 — 공유 + 묵상 완료 */}
        <div className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/55 to-transparent px-4 pt-8 pb-[calc(0.875rem+env(safe-area-inset-bottom))]">
          {shareMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShareMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute bottom-full left-4 z-40 mb-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#111a2c] shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
                <button
                  type="button"
                  onClick={handleShareCurrent}
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[13.5px] font-medium text-white/85 transition-colors hover:bg-white/[0.06]"
                >
                  <span className="material-icons-round text-[17px] text-white/50">
                    article
                  </span>
                  {isEn ? 'Share this verse' : '지금 보는 말씀 공유'}
                </button>
                <div className="h-px bg-white/[0.07]" />
                <button
                  type="button"
                  onClick={handleShareAll}
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[13.5px] font-medium text-white/85 transition-colors hover:bg-white/[0.06]"
                >
                  <span className="material-icons-round text-[17px] text-white/50">
                    library_books
                  </span>
                  {isEn ? `Share all ${total}` : `말씀 ${total}개 전체 공유`}
                </button>
              </div>
            </>
          )}

          <div className="relative z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShareMenuOpen((v) => !v)}
              className="inline-flex h-12 items-center gap-1.5 rounded-2xl border border-white/15 bg-white/[0.07] px-4 text-[14px] font-semibold text-white/80 backdrop-blur-sm transition-colors hover:bg-white/[0.12] hover:text-white"
              aria-label="공유 옵션 열기"
              aria-expanded={shareMenuOpen}
            >
              <span className="material-icons-round text-[18px]">
                ios_share
              </span>
              {isEn ? 'Share' : '공유'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-white text-[15px] font-bold text-[#101828] shadow-[0_8px_28px_rgba(0,0,0,0.35)] transition-transform active:scale-[0.98]"
            >
              <span className="material-icons-round text-[18px]">
                check_circle
              </span>
              {isEn ? 'Complete' : '묵상 완료'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BibleVersesModal
