import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { preloadMenuRoutes } from '../../../../utils/routePreload'

// PC(lg+) 전용 헤더 인라인 메뉴 — 자주 가는 페이지만 평면 노출하고
// 전체 메뉴(교회 안내·액티비티·관리자·설정)는 기존 햄버거 드롭다운에 남긴다.
// 링크들이 맨 배경에 떠 보이지 않도록 캡슐 트랙(Apple.com·Linear 문법)으로 감싸고,
// 활성 pill은 framer-motion layoutId로 항목 사이를 미끄러진다 (토스 세그먼트 문법).
const NAV_ITEMS = [
  { path: '/worship', key: 'worship' },
  { path: '/sermon', key: 'sermon' },
  { path: '/bible', key: 'bible' },
  { path: '/events', key: 'events' },
  { path: '/culture', key: 'culture' },
  { path: '/ministry', key: 'ministry' },
  { path: '/news', key: 'news' },
] as const

const DesktopNav = () => {
  const { t } = useLanguage()

  return (
    <nav
      className="hidden lg:flex items-center gap-0.5 rounded-full p-1 bg-black/[0.04] dark:bg-white/[0.05] ring-1 ring-inset ring-black/[0.03] dark:ring-white/[0.05]"
      aria-label="주요 페이지"
      // 메뉴에 마우스가 올라온 순간 = 곧 이동한다는 신호 → lazy 청크 프리로드
      onMouseEnter={() => void preloadMenuRoutes()}
    >
      {NAV_ITEMS.map(({ path, key }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `relative px-3.5 py-1.5 rounded-full text-[13.5px] whitespace-nowrap transition-colors duration-150 ${
              isActive
                ? 'text-brand font-bold'
                : 'text-gray-600 dark:text-white/70 font-medium hover:text-brand hover:bg-[var(--brand-soft)]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {/* 활성 배경 pill — 단 하나만 렌더되므로 라우트가 바뀌면
                  layoutId 매칭으로 이전 위치에서 새 위치로 스프링 이동한다 */}
              {isActive && (
                <motion.span
                  layoutId="header-nav-pill"
                  className="absolute inset-0 rounded-full bg-[var(--brand-soft-strong)]"
                  transition={{ type: 'spring', bounce: 0.18, duration: 0.45 }}
                  aria-hidden
                />
              )}
              <span className="relative z-10">{t(key)}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

export default DesktopNav
