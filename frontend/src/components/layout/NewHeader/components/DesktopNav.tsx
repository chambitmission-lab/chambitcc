import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useLanguage } from '../../../../contexts/LanguageContext'
import type { Translation } from '../../../../locales'
import { preloadMenuRoutes, preloadRoute } from '../../../../utils/routePreload'
import { NAV_ICONS, Svg } from './NavIcons'
import { navEntries, navEntry, navEntryMatches, type NavEntry } from '../../navCatalog'

// PC(lg+) 전용 헤더 메뉴 — 교회 안내 페이지를 4축(교회 · 예배·말씀 · 함께 · 소식)으로 묶고,
// 각 축은 호버/클릭 시 "아이콘 + 이름 + 한 줄 설명" 드롭다운을 연다 (Stripe·Linear 문법).
// 평평한 8개 텍스트 + 별도 '전체 메뉴' 버튼보다 위계가 생기고, 메뉴 자체가 교회를 설명한다.
// 좌측 레일(개인 활동: 성경·기도·모임…)과 축을 나눠 여기엔 교회 안내·콘텐츠만 담는다.
// 활성 축 pill은 framer-motion layoutId 로 축 사이를 미끄러진다 (토스 세그먼트 문법).

type LabelKey = keyof Translation

type Group = {
  id: string
  labelKey: LabelKey
  items: NavEntry[]
}

// 항목의 이름·설명·아이콘은 layout/navCatalog.ts 한 곳 — 여기선 축과 순서만 고른다
const GROUPS: Group[] = [
  {
    id: 'church',
    labelKey: 'navTopChurch',
    items: navEntries(['/about', '/greeting', '/visit', '/history', '/people', '/organization']),
  },
  {
    id: 'word',
    labelKey: 'navTopWord',
    items: navEntries(['/worship', '/education', '/sermon', '/ministry', '/news?tab=bulletin']),
  },
  {
    id: 'together',
    labelKey: 'navTopTogether',
    items: navEntries(['/events', '/seats', '/mission', '/culture', '/survey', '/news?tab=new-family']),
  },
]

// 단독 링크 — 드롭다운 없이 바로 이동
const NEWS = navEntry('/news')

// NAV_ICONS 에 없는 항목(카탈로그 icon: null)용 라인 아이콘 (같은 1.6 스트로크 문법)
const FALLBACK_ICONS: Record<string, ReactElement> = {
  '/news?tab=bulletin': (
    <Svg className="w-[20px] h-[20px]">
      <path d="M6 3.5h9l3.5 3.5v13.5H6z" />
      <path d="M15 3.5V7h3.5M9 11h6M9 14.5h6M9 18h4" />
    </Svg>
  ),
  '/news?tab=new-family': (
    <Svg className="w-[20px] h-[20px]">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5M17 8v6M14 11h6" />
    </Svg>
  ),
}

const HOVER_CLOSE_DELAY = 120

// 활성 축 pill — 컴포넌트 안에서 선언하면 렌더마다 새 타입이 돼 React 가 pill 을 리마운트하고
// layoutId 투영·스프링이 매번 다시 시작한다. 모듈 최상위에 고정한다.
const ActivePill = () => (
  <motion.span
    layoutId="header-nav-pill"
    className="absolute inset-0 rounded-full bg-[var(--brand-soft-strong)]"
    transition={{ type: 'spring', bounce: 0.18, duration: 0.45 }}
    aria-hidden
  />
)

const DesktopNav = () => {
  const { t } = useLanguage()
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState<string | null>(null)
  const closeTimer = useRef<number | null>(null)
  const navRef = useRef<HTMLElement>(null)

  const cancelClose = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }
  const scheduleClose = () => {
    cancelClose()
    closeTimer.current = window.setTimeout(() => setOpen(null), HOVER_CLOSE_DELAY)
  }
  const openNow = (id: string) => {
    cancelClose()
    setOpen(id)
  }
  const closeNow = () => {
    cancelClose()
    setOpen(null)
  }

  // 라우트가 바뀌면(소식 같은 단독 링크·뒤로가기 포함) 열려 있던 패널을 닫는다
  useEffect(() => {
    closeNow()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search])

  // 바깥 클릭·ESC·라우트 이동 시 닫기
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setOpen(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  useEffect(() => () => cancelClose(), [])

  const go = useCallback((to: string) => {
    setOpen(null)
    navigate(to)
  }, [navigate])

  // 현재 페이지가 속한 축 (뉴스 탭 딥링크는 해당 축으로 귀속, 단순 /news 는 소식)
  const activeGroupId =
    GROUPS.find((g) => g.items.some((it) => navEntryMatches(it, pathname, search)))?.id ??
    (navEntryMatches(NEWS, pathname, search) ? 'news' : null)

  // 내비 라벨은 전부 semibold 이상 — medium 회색은 "그냥 놓인 글자"로 읽힌다 (토스 문법)
  const topClass = (active: boolean, isOpen: boolean) =>
    `relative flex items-center gap-1 h-10 px-3.5 rounded-full text-[length:calc(16px*var(--hn,1))] whitespace-nowrap transition-colors duration-150 ${
      active
        ? 'text-brand font-bold'
        : isOpen
          ? 'text-ink-strong font-semibold bg-black/[0.04] dark:bg-white/[0.06]'
          : 'text-gray-600 dark:text-white/70 font-semibold hover:text-ink-strong hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
    }`

  return (
    <nav
      ref={navRef}
      className="desktop-nav hidden lg:flex items-center gap-0.5"
      aria-label="주요 페이지"
      // 메뉴에 마우스가 올라온 순간 = 곧 이동한다는 신호 → lazy 청크 프리로드
      // (청크를 다 받은 뒤엔 즉시 돌아온다 — 데이터 선요청은 항목 호버 때 그 경로만)
      onMouseEnter={() => void preloadMenuRoutes()}
    >
      {GROUPS.map((group) => {
        const isOpen = open === group.id
        const active = activeGroupId === group.id
        return (
          <div
            key={group.id}
            className="relative"
            onMouseEnter={() => openNow(group.id)}
            onMouseLeave={scheduleClose}
          >
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={isOpen}
              onClick={() => (isOpen ? setOpen(null) : openNow(group.id))}
              onFocus={() => openNow(group.id)}
              className={topClass(active, isOpen)}
            >
              {active && <ActivePill />}
              <span className="relative z-10">{t(group.labelKey)}</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`relative z-10 w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                aria-hidden
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  role="menu"
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                  // 트리거와 패널 사이 8px 틈은 padding-top 으로 메워 호버가 끊기지 않게 한다
                  className="absolute left-0 top-full pt-2 z-[70]"
                  onMouseEnter={cancelClose}
                  onMouseLeave={scheduleClose}
                >
                  <div className="w-[calc(340px*var(--hd,1))] rounded-2xl p-2 bg-white dark:bg-[#1c1c1e] ring-1 ring-black/[0.06] dark:ring-white/[0.08] shadow-[0_18px_40px_-16px_rgba(0,0,0,0.35)]">
                    {group.items.map((item) => {
                      const Icon = item.icon ? NAV_ICONS[item.icon] : null
                      const here = navEntryMatches(item, pathname, search)
                      return (
                        <button
                          key={item.path}
                          type="button"
                          role="menuitem"
                          onClick={() => go(item.path)}
                          // 항목에 머무는 순간 그 화면의 청크·데이터만 데운다
                          onMouseEnter={() => void preloadRoute(item.path)}
                          className={`w-full flex items-center gap-3.5 rounded-xl px-3 py-3 text-left transition-colors duration-120 ${
                            here ? 'bg-[var(--brand-soft)]' : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                          }`}
                        >
                          <span className={`w-[calc(40px*var(--hd,1))] h-[calc(40px*var(--hd,1))] rounded-xl flex items-center justify-center shrink-0 ${
                            here ? 'bg-[var(--brand-soft-strong)] text-brand' : 'bg-black/[0.04] dark:bg-white/[0.07] text-ink'
                          }`}>
                            {Icon ? <Icon className="w-[20px] h-[20px]" /> : FALLBACK_ICONS[item.path] ?? null}
                          </span>
                          <span className="min-w-0">
                            <span className={`block text-[length:calc(15.5px*var(--hd,1))] leading-tight ${here ? 'text-brand font-bold' : 'text-ink-strong font-semibold'}`}>
                              {t(item.labelKey)}
                            </span>
                            <span className="block mt-1 text-[length:calc(13.5px*var(--hd,1))] leading-snug text-ink-muted truncate">
                              {t(item.descKey)}
                            </span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}

      {/* 소식 — 단독 링크 */}
      <NavLink
        to={NEWS.path}
        end
        className={({ isActive }) => topClass(isActive, false)}
        // 드롭다운이 없는 항목이므로 호버·포커스·클릭 모두 열린 패널을 즉시 닫는다
        // (cancelClose 만 하면 "함께"에서 넘어올 때 예약된 닫기가 취소돼 패널이 남는다)
        onMouseEnter={closeNow}
        onFocus={closeNow}
        onClick={closeNow}
      >
        {({ isActive }) => (
          <>
            {isActive && <ActivePill />}
            <span className="relative z-10">{t(NEWS.labelKey)}</span>
          </>
        )}
      </NavLink>
    </nav>
  )
}

export default DesktopNav
