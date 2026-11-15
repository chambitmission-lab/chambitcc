import { useLocation } from 'react-router-dom'
import { useLanguage } from '../../../../contexts/LanguageContext'
import {
  NAV_TOP_GROUPS,
  NAV_TOP_NEWS,
  NAV_TOP_PILL_CLASS,
  NAV_TOP_ROOT_CLASS,
  activeNavTopGroupId,
  navTopClass,
} from './desktopNavGroups'

/** 윗줄 버튼의 ▾ — DesktopNav 와 자리 잡이가 같은 크기로 그린다 */
export const NavChevron = ({ open = false }: { open?: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`relative z-10 w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    aria-hidden
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
)

// DesktopNav 청크(framer-motion 포함)가 도착하기 전까지 그 자리를 지키는 정적 메뉴.
// 전엔 fallback 이 null 이라 헤더가 "검색창만 가운데" 로 먼저 그려졌다가, 청크가 오는 순간
// 메뉴 4개가 끼어들며 검색창이 180px 옆으로 밀렸다(새로고침 때 헤더가 흔들려 보이던 원인).
// 진짜 메뉴와 같은 클래스·같은 글자로 그려 폭이 똑같다 — 드롭다운·호버만 아직 없다.
// 수백 ms 안에 교체되므로 포커스·스크린리더에는 잡히지 않게 한다(aria-hidden, 버튼이 아닌 span).
const DesktopNavFallback = () => {
  const { t } = useLanguage()
  const { pathname, search } = useLocation()
  const activeGroupId = activeNavTopGroupId(pathname, search)
  // 진짜 메뉴의 소식은 NavLink(end) — 탭 쿼리와 무관하게 경로가 /news 면 활성이다
  const newsActive = pathname === NAV_TOP_NEWS.path

  const cell = (label: string, active: boolean) => (
    <span className={navTopClass(active, false)}>
      {active && <span className={NAV_TOP_PILL_CLASS} aria-hidden />}
      <span className="relative z-10">{label}</span>
      <NavChevron />
    </span>
  )

  return (
    <div className={NAV_TOP_ROOT_CLASS} aria-hidden>
      {NAV_TOP_GROUPS.map((group) => (
        <div key={group.id} className="relative">
          {cell(t(group.labelKey), activeGroupId === group.id)}
        </div>
      ))}
      <div>{cell(t(NAV_TOP_NEWS.labelKey), newsActive)}</div>
    </div>
  )
}

export default DesktopNavFallback
