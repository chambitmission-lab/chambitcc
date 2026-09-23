import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AdminPageHeader } from '../../Admin/components/StatCards'

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
  { path: '/pastor/assistant', icon: 'tips_and_updates', label: '목회 비서', ready: true },
]

/** 목회자 섹션 내비 — PastorShell 밖(돌봄 레이더처럼 관리자 화면을 재사용하는 곳)에서도 같은 줄을 쓴다 */
export const PastorSectionNav = () => {
  const { pathname } = useLocation()
  return (
    <nav className="px-4 pt-3 flex gap-1.5 overflow-x-auto no-scrollbar" aria-label="목회자 메뉴">
      {SECTIONS.map(s => {
        const active = s.path === '/pastor' ? pathname === s.path : pathname.startsWith(s.path)
        const base =
          'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12.5px] font-semibold transition-colors'
        if (!s.ready) {
          return (
            <span
              key={s.path}
              className={`${base} border-dashed border-gray-200 dark:border-white/[0.1] text-gray-400 dark:text-white/35 cursor-default`}
              title="준비 중입니다"
            >
              <span className="material-icons-outlined text-[16px]">{s.icon}</span>
              {s.label}
              <span className="text-[10px] font-bold">준비 중</span>
            </span>
          )
        }
        return (
          <Link
            key={s.path}
            to={s.path}
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
  )
}

const PastorShell = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen pb-10 lg:max-w-[1180px] lg:mt-2 lg:mb-10 lg:min-h-0 lg:pb-8 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark">
        <AdminPageHeader title="목회자 홈" badge="PASTOR" />

        <PastorSectionNav />

        {children}
      </div>
    </div>
  )
}

export default PastorShell
