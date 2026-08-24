import { useCallback, useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useLanguage } from '../../../../contexts/LanguageContext'
import type { Translation } from '../../../../locales'
import { preloadMenuRoutes } from '../../../../utils/routePreload'
import { NAV_ICONS, Svg, type NavIconKey } from './NavIcons'

// PC(lg+) 전용 헤더 메뉴 — 교회 안내 페이지를 4축(교회 · 예배·말씀 · 함께 · 소식)으로 묶고,
// 각 축은 호버/클릭 시 "아이콘 + 이름 + 한 줄 설명" 드롭다운을 연다 (Stripe·Linear 문법).
// 평평한 8개 텍스트 + 별도 '전체 메뉴' 버튼보다 위계가 생기고, 메뉴 자체가 교회를 설명한다.
// 좌측 레일(개인 활동: 성경·기도·모임…)과 축을 나눠 여기엔 교회 안내·콘텐츠만 담는다.
// 활성 축 pill은 framer-motion layoutId 로 축 사이를 미끄러진다 (토스 세그먼트 문법).

type LabelKey = keyof Translation

type Item = {
  to: string // 경로 (+쿼리) — '/news?tab=bulletin' 처럼 탭 딥링크 허용
  labelKey: LabelKey
  descKey: LabelKey
  icon?: NavIconKey
  iconFallback?: 'bulletin' | 'mission' | 'newFamily'
}

type Group = {
  id: string
  labelKey: LabelKey
  items: Item[]
}

const GROUPS: Group[] = [
  {
    id: 'church',
    labelKey: 'navTopChurch',
    items: [
      { to: '/about', labelKey: 'about', descKey: 'navDescAbout', icon: 'about' },
      { to: '/greeting', labelKey: 'greeting', descKey: 'navDescGreeting', icon: 'greeting' },
      { to: '/visit', labelKey: 'visit', descKey: 'navDescVisit', icon: 'visit' },
      { to: '/history', labelKey: 'history', descKey: 'navDescHistory', icon: 'history' },
      { to: '/organization', labelKey: 'organization', descKey: 'navDescOrganization', icon: 'organization' },
    ],
  },
  {
    id: 'word',
    labelKey: 'navTopWord',
    items: [
      { to: '/worship', labelKey: 'worship', descKey: 'navDescWorship', icon: 'worship' },
      { to: '/education', labelKey: 'education', descKey: 'navDescEducation', icon: 'education' },
      { to: '/sermon', labelKey: 'sermon', descKey: 'navDescSermon', icon: 'sermon' },
      { to: '/ministry', labelKey: 'ministry', descKey: 'navDescMinistry', icon: 'ministry' },
      { to: '/news?tab=bulletin', labelKey: 'bulletin', descKey: 'navDescBulletin', iconFallback: 'bulletin' },
    ],
  },
  {
    id: 'together',
    labelKey: 'navTopTogether',
    items: [
      { to: '/events', labelKey: 'events', descKey: 'navDescEvents', icon: 'events' },
      { to: '/mission', labelKey: 'mission', descKey: 'navDescMission', iconFallback: 'mission' },
      { to: '/culture', labelKey: 'culture', descKey: 'navDescCulture', icon: 'culture' },
      { to: '/news?tab=new-family', labelKey: 'navNewFamilyAlbum', descKey: 'navDescNewFamily', iconFallback: 'newFamily' },
    ],
  },
]

// 단독 링크 — 드롭다운 없이 바로 이동
const NEWS: Item = { to: '/news', labelKey: 'news', descKey: 'navDescNews', icon: 'news' }

// NAV_ICONS 에 없는 항목용 라인 아이콘 (같은 1.6 스트로크 문법)
const FALLBACK_ICONS = {
  bulletin: (
    <Svg className="w-[20px] h-[20px]">
      <path d="M6 3.5h9l3.5 3.5v13.5H6z" />
      <path d="M15 3.5V7h3.5M9 11h6M9 14.5h6M9 18h4" />
    </Svg>
  ),
  mission: (
    <Svg className="w-[20px] h-[20px]">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.6 2.6 2.6 14.4 0 17M12 3.5c-2.6 2.6-2.6 14.4 0 17" />
    </Svg>
  ),
  newFamily: (
    <Svg className="w-[20px] h-[20px]">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5M17 8v6M14 11h6" />
    </Svg>
  ),
}

const HOVER_CLOSE_DELAY = 120

// 현재 위치가 이 항목과 일치하는지 — 쿼리 딥링크는 pathname+search 로, 일반 경로는 하위 경로까지 포함
const matches = (item: Item, pathname: string, search: string) => {
  if (item.to.includes('?')) return `${pathname}${search}`.startsWith(item.to)
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

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
    GROUPS.find((g) => g.items.some((it) => matches(it, pathname, search)))?.id ??
    (matches(NEWS, pathname, search) ? 'news' : null)

  // 내비 라벨은 전부 semibold 이상 — medium 회색은 "그냥 놓인 글자"로 읽힌다 (토스 문법)
  const topClass = (active: boolean, isOpen: boolean) =>
    `relative flex items-center gap-1 h-9 px-3 rounded-full text-[14px] whitespace-nowrap transition-colors duration-150 ${
      active
        ? 'text-brand font-bold'
        : isOpen
          ? 'text-ink-strong font-semibold bg-black/[0.04] dark:bg-white/[0.06]'
          : 'text-gray-600 dark:text-white/70 font-semibold hover:text-ink-strong hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
    }`

  const ActivePill = () => (
    <motion.span
      layoutId="header-nav-pill"
      className="absolute inset-0 rounded-full bg-[var(--brand-soft-strong)]"
      transition={{ type: 'spring', bounce: 0.18, duration: 0.45 }}
      aria-hidden
    />
  )

  return (
    <nav
      ref={navRef}
      className="hidden lg:flex items-center gap-0.5"
      aria-label="주요 페이지"
      // 메뉴에 마우스가 올라온 순간 = 곧 이동한다는 신호 → lazy 청크 프리로드
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
                className={`relative z-10 w-3 h-3 opacity-60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
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
                  <div className="w-[300px] rounded-2xl p-2 bg-white dark:bg-[#1c1c1e] ring-1 ring-black/[0.06] dark:ring-white/[0.08] shadow-[0_18px_40px_-16px_rgba(0,0,0,0.35)]">
                    {group.items.map((item) => {
                      const Icon = item.icon ? NAV_ICONS[item.icon] : null
                      const here = matches(item, pathname, search)
                      return (
                        <button
                          key={item.to}
                          type="button"
                          role="menuitem"
                          onClick={() => go(item.to)}
                          className={`w-full flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors duration-120 ${
                            here ? 'bg-[var(--brand-soft)]' : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                          }`}
                        >
                          <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            here ? 'bg-[var(--brand-soft-strong)] text-brand' : 'bg-black/[0.04] dark:bg-white/[0.07] text-ink'
                          }`}>
                            {Icon ? <Icon className="w-[20px] h-[20px]" /> : item.iconFallback ? FALLBACK_ICONS[item.iconFallback] : null}
                          </span>
                          <span className="min-w-0">
                            <span className={`block text-[13.5px] leading-tight ${here ? 'text-brand font-bold' : 'text-ink-strong font-semibold'}`}>
                              {t(item.labelKey)}
                            </span>
                            <span className="block mt-0.5 text-[12px] leading-snug text-ink-muted truncate">
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
        to={NEWS.to}
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
