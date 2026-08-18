import { NavLink } from 'react-router-dom'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { preloadMenuRoutes } from '../../../../utils/routePreload'

// PC(lg+) 전용 헤더 인라인 메뉴 — 자주 가는 페이지만 평면 노출하고
// 전체 메뉴(교회 안내·액티비티·관리자·설정)는 기존 햄버거 드롭다운에 남긴다.
// 활성 표시는 SortTabs·레일과 같은 토스식 pill(브랜드 틴트) 문법.
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
      className="hidden lg:flex items-center gap-0.5"
      aria-label="주요 페이지"
      // 메뉴에 마우스가 올라온 순간 = 곧 이동한다는 신호 → lazy 청크 프리로드
      onMouseEnter={() => void preloadMenuRoutes()}
    >
      {NAV_ITEMS.map(({ path, key }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `px-3 py-1.5 rounded-full text-[14px] whitespace-nowrap transition-colors duration-150 ${
              isActive
                ? 'bg-[var(--brand-soft-strong)] text-brand font-bold'
                : 'text-gray-600 dark:text-white/70 font-medium hover:text-brand hover:bg-[var(--brand-soft)]'
            }`
          }
        >
          {t(key)}
        </NavLink>
      ))}
    </nav>
  )
}

export default DesktopNav
