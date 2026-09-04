import { useEffect, useRef, useState } from 'react'
import { SERIF } from './letterFormat'

interface MinistryHeaderProps {
  language: string
  isAdminUser: boolean
  /** 디바운스(300ms)된 검색어 — 비면 검색 아님 */
  onQueryChange: (appliedQuery: string) => void
  onAddNew: () => void
  /** PC 우측 레일이 피처드 카드 윗선에 맞추기 위해 헤더 실측 높이를 받아간다 */
  onHeightChange?: (height: number) => void
}

/**
 * 목양칼럼 헤더 — 제목(세리프)·검색·관리자 추가 버튼.
 * 모바일은 sticky 바(스크롤 시에만 헤어라인), lg+에선 배경·구분선 없는 페이지 타이틀 행.
 * 검색어 입력·디바운스는 여기서 끝내고 부모에는 적용된 검색어만 알린다.
 */
const MinistryHeader = ({ language, isAdminUser, onQueryChange, onAddNew, onHeightChange }: MinistryHeaderProps) => {
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  // 모바일 sticky 헤더: 맨 위에선 구분선 없이, 스크롤로 본문이 밑을 지나갈 때만 헤어라인
  const headerRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)

  // 검색어 변경 시 디바운스 — 적용된 검색어만 부모로
  useEffect(() => {
    const timer = setTimeout(() => onQueryChange(searchQuery.trim()), 300)
    return () => clearTimeout(timer)
    // onQueryChange는 부모가 setState를 그대로 넘기므로 안정적이다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  // 검색창 열릴 때 자동 포커스
  useEffect(() => {
    if (showSearch) searchInputRef.current?.focus()
  }, [showSearch])

  // 스크롤러가 window/#root 어느 쪽일지 환경마다 달라 IntersectionObserver 암묵 root를
  // 믿기 어렵다 — 캡처 단계 scroll 리스너 + rAF로 sentinel 위치를 직접 잰다
  useEffect(() => {
    let raf = 0
    const measure = () => {
      raf = 0
      const sentinel = sentinelRef.current
      const header = headerRef.current
      if (!sentinel || !header) return
      const next = sentinel.getBoundingClientRect().bottom < header.getBoundingClientRect().top
      setStuck((prev) => (prev === next ? prev : next))
    }
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(measure)
    }
    document.addEventListener('scroll', onScroll, { capture: true, passive: true })
    window.addEventListener('resize', onScroll)
    onScroll()
    return () => {
      document.removeEventListener('scroll', onScroll, { capture: true })
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  // 헤더 높이 실측 — 검색창이 펼쳐지면 피처드 카드도 내려가므로 레일도 같이 따라간다
  useEffect(() => {
    const el = headerRef.current
    if (!el || !onHeightChange || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([entry]) => onHeightChange(Math.round(entry.contentRect.height)))
    ro.observe(el)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleSearch = () => {
    // 닫을 때 검색어 초기화
    if (showSearch) setSearchQuery('')
    setShowSearch(!showSearch)
  }

  return (
    <>
      <div ref={sentinelRef} className="h-px -mb-px lg:hidden" aria-hidden="true" />
      <div
        ref={headerRef}
        className={`sticky top-14 lg:static z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b transition-[border-color,box-shadow] duration-200 lg:bg-transparent lg:dark:bg-transparent lg:backdrop-blur-none lg:border-0 lg:shadow-none ${
          stuck
            ? 'border-border-light dark:border-border-dark shadow-[0_6px_16px_-12px_rgba(0,0,0,0.25)]'
            : 'border-transparent shadow-none'
        }`}
      >
        <div className="px-5 py-3.5 lg:px-1 lg:pt-4 lg:pb-5">
          <div className="flex items-center justify-between">
            <h1
              className="text-[21px] lg:text-[26px] font-semibold text-ink-strong tracking-[-0.01em] leading-[1.2]"
              style={{ fontFamily: SERIF }}
            >
              {language === 'ko' ? '목양칼럼' : 'Pastoral Column'}
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSearch}
                className={`p-2 rounded-full transition-colors ${
                  showSearch
                    ? 'bg-[var(--brand-soft-strong)] text-[var(--brand)]'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-[var(--brand-soft)]'
                }`}
                aria-label={language === 'ko' ? '검색' : 'Search'}
                title={language === 'ko' ? '검색' : 'Search'}
              >
                <span className="material-icons-outlined text-xl">{showSearch ? 'close' : 'search'}</span>
              </button>
              {isAdminUser && (
                <button
                  onClick={onAddNew}
                  className="relative px-4 py-2 brand-gradient rounded-full font-semibold text-sm transition-all flex items-center gap-1.5 seal-chip [--seal-drop:0_2px_10px_var(--brand-glow)] hover:[--seal-drop:0_4px_16px_var(--brand-glow)]"
                >
                  <span className="material-icons-outlined text-lg">add</span>
                  <span>{language === 'ko' ? '추가' : 'Add'}</span>
                </button>
              )}
            </div>
          </div>
          {showSearch && (
            <div className="mt-3 relative">
              <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl pointer-events-none">
                search
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'ko' ? '제목 또는 본문에서 검색…' : 'Search title or content…'}
                className="w-full pl-10 pr-10 py-2.5 border border-border-light dark:border-white/[0.08] rounded-full bg-white dark:bg-white/[0.04] text-ink-strong text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-glow)] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label={language === 'ko' ? '검색어 지우기' : 'Clear search'}
                >
                  <span className="material-icons-outlined text-lg">close</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default MinistryHeader
