import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { AdminPageHeader } from '../../Admin/components/StatCards'
import TextScaleToggle from './TextScaleToggle'
import { warmPastorSections } from '../prefetch'
import { pastorScaleProps, usePastorTextScale } from './textScale'

// 목회자 영역 공용 껍데기 — 관리자 화면과 같은 와이드 셸 + 목회자 섹션 내비.
// 준비 중인 섹션도 자리를 보여 둔다: 목양 → 심방 → AI 비서로 이어지는 로드맵이 한눈에 보이게.
interface Section {
  path: string
  icon: string
  label: string
  ready: boolean
}

const SECTIONS: Section[] = [
  { path: '/pastor', icon: 'dashboard', label: '목양 브리핑', ready: true },
  { path: '/pastor/care', icon: 'volunteer_activism', label: '돌봄 레이더', ready: true },
  { path: '/pastor/members', icon: 'groups', label: '성도 명부', ready: true },
  { path: '/pastor/visits', icon: 'edit_note', label: '심방 기록', ready: true },
  { path: '/pastor/schedule', icon: 'event', label: '목회 일정', ready: true },
  { path: '/pastor/sermon', icon: 'menu_book', label: '설교 준비', ready: true },
  { path: '/pastor/report', icon: 'insights', label: '주간 리포트', ready: true },
  { path: '/pastor/assistant', icon: 'tips_and_updates', label: '목회 비서', ready: true },
]

const isActive = (path: string, pathname: string) =>
  path === '/pastor' ? pathname === path : pathname.startsWith(path)

// 섹션마다 셸이 새로 마운트돼 칩 줄이 맨 앞(scrollLeft 0)으로 튀던 것 — 직전 위치를 기억해 두고
// 거기서부터 활성 칩을 가운데로 부드럽게 옮긴다
let lastNavScrollLeft = 0

// body 가 실제 스크롤러라 window.scrollTo 만으로는 안 된다 (DesktopNavRail 과 같은 방식)
const resetPageScroll = () => {
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
  const root = document.getElementById('root')
  if (root) root.scrollTop = 0
}

/** 모바일 전체 메뉴 — 가로로 밀어 찾지 않고 8개 섹션을 한 번에 보고 고른다 */
const SectionSheet = ({ pathname, onClose }: { pathname: string; onClose: () => void }) => {
  useModalBackButton(onClose)
  const navigate = useNavigate()
  const scale = usePastorTextScale()
  const go = (path: string) => {
    if (path === pathname) return onClose()
    resetPageScroll()
    // replace — 시트가 쌓아 둔 히스토리 엔트리를 새 화면으로 덮어, 뒤로가기 한 번에 이전 화면으로
    navigate(path, { replace: true })
  }
  return createPortal(
    <div
      {...pastorScaleProps(scale)}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-background-light dark:bg-[#1c1c26] rounded-t-3xl border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.4)] px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="목회자 메뉴"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-300 dark:bg-white/20" />
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-ink-strong text-[16px] font-bold">목회자 메뉴</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 dark:text-white/65 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
            aria-label="닫기"
          >
            <span className="material-icons-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {SECTIONS.filter(s => s.ready).map(s => {
            const active = isActive(s.path, pathname)
            return (
              <button
                key={s.path}
                type="button"
                onClick={() => go(s.path)}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-1.5 rounded-2xl py-3 px-1 border transition-colors ${
                  active
                    ? 'bg-brand/10 border-brand text-brand'
                    : 'border-gray-200 dark:border-white/[0.1] text-gray-700 dark:text-white/80 active:bg-gray-100 dark:active:bg-white/[0.06]'
                }`}
              >
                <span className="material-icons-outlined text-[24px]">{s.icon}</span>
                <span className="text-[12.5px] font-semibold leading-tight text-center">{s.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>,
    document.body,
  )
}

/** 목회자 섹션 내비 — PastorShell 밖(돌봄 레이더처럼 관리자 화면을 재사용하는 곳)에서도 같은 줄을 쓴다 */
export const PastorSectionNav = () => {
  const { pathname } = useLocation()
  const navRef = useRef<HTMLElement>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // 다른 섹션 청크·데이터를 유휴 시간에 미리 받아 둔다 — 칩을 누르는 순간 바로 그려지게 (세션당 한 번)
  useEffect(() => warmPastorSections(), [])

  useLayoutEffect(() => {
    const nav = navRef.current
    if (!nav) return
    nav.scrollLeft = lastNavScrollLeft
    const chip = nav.querySelector<HTMLElement>('[aria-current="page"]')
    if (!chip) return
    // scrollIntoView 는 세로까지 끌고 가므로 가로만 직접 계산
    const target = chip.offsetLeft - (nav.clientWidth - chip.offsetWidth) / 2
    const max = nav.scrollWidth - nav.clientWidth
    nav.scrollTo({ left: Math.max(0, Math.min(max, target)), behavior: 'smooth' })
  }, [pathname])

  return (
    <div className="px-4 pt-3 flex items-center gap-2">
      <div className="relative flex-1 min-w-0">
        <nav
          ref={navRef}
          onScroll={e => (lastNavScrollLeft = e.currentTarget.scrollLeft)}
          className="flex gap-1.5 overflow-x-auto no-scrollbar lg:[mask-image:none] [mask-image:linear-gradient(to_right,#000_calc(100%-24px),transparent)]"
          aria-label="목회자 메뉴"
        >
      {SECTIONS.map(s => {
        const active = isActive(s.path, pathname)
        const base =
          'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12.5px] font-semibold transition-colors'
        if (!s.ready) {
          return (
            <span
              key={s.path}
              className={`${base} border-dashed border-gray-200 dark:border-white/[0.1] text-gray-500 dark:text-white/50 cursor-default`}
              title="준비 중입니다"
            >
              <span className="material-icons-outlined text-[16px]">{s.icon}</span>
              {s.label}
              <span className="text-[12px] font-bold">준비 중</span>
            </span>
          )
        }
        return (
          <Link
            key={s.path}
            to={s.path}
            onClick={() => {
              if (!active) resetPageScroll()
            }}
            aria-current={active ? 'page' : undefined}
            className={`${base} ${
              active
                ? 'bg-brand border-brand text-white'
                : 'border-gray-200 dark:border-white/[0.1] text-gray-600 dark:text-white/70 hover:border-brand hover:text-brand'
            }`}
          >
            <span className="material-icons-outlined text-[16px]">{s.icon}</span>
            {s.label}
          </Link>
        )
      })}
        </nav>
      </div>
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="lg:hidden shrink-0 w-9 h-9 rounded-full border border-gray-200 dark:border-white/[0.1] flex items-center justify-center text-gray-600 dark:text-white/70 active:bg-gray-100 dark:active:bg-white/[0.06]"
        aria-label="목회자 메뉴 전체 보기"
        aria-expanded={sheetOpen}
      >
        <span className="material-icons-outlined text-[20px]">apps</span>
      </button>
      {sheetOpen && <SectionSheet pathname={pathname} onClose={() => setSheetOpen(false)} />}
    </div>
  )
}

const PastorShell = ({ children }: { children: ReactNode }) => {
  const scale = usePastorTextScale()
  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <div {...pastorScaleProps(scale)} className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen pb-10 lg:max-w-[1180px] lg:mt-2 lg:mb-10 lg:min-h-0 lg:pb-8 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark">
        <AdminPageHeader title="목회자 홈" badge="PASTOR" trailing={<TextScaleToggle />} />

        <PastorSectionNav />

        {children}
      </div>
    </div>
  )
}

export default PastorShell
