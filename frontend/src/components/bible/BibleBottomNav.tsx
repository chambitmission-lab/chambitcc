import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'

export type BibleNavKey = 'read' | 'search' | 'plans' | 'wordbook' | 'genealogy'

interface BibleBottomNavProps {
  active: BibleNavKey
  /**
   * BibleStudy 안에서는 읽기/검색이 페이지 이동 없이 탭 전환된다.
   * 없으면(플랜/가계도 페이지 등) /bible 로 라우팅해서 해당 탭을 연다.
   */
  onSelectTab?: (tab: 'read' | 'search') => void
}

/**
 * 성경 섹션 전용 하단 네비게이션 (읽기 | 검색 | 플랜 | 단어장 | 가계도).
 * - 홈 BottomNavigation과 동일한 글래스 독(떠 있는 라운드 카드) 형태로 통일
 * - PWA 홈 인디케이터 영역은 safe-area 패딩으로 확보
 * - 검색 등에서 모바일 키보드가 올라오면 바를 숨긴다
 *   (Android에서 키보드 바로 위에 바가 떠서 화면을 잡아먹는 것 방지)
 * - 컨테이너는 본문과 동일한 max-w-md 중앙 정렬
 */
const BibleBottomNav = ({ active, onSelectTab }: BibleBottomNavProps) => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const [keyboardOpen, setKeyboardOpen] = useState(false)

  // 네비 목적지(읽기·플랜·가계도) lazy 청크 prefetch — 홈 BottomNavigation과 동일 패턴.
  // 특히 Genealogy는 87KB라 첫 탭에서 받기 시작하면 전환이 눈에 띄게 늦다.
  useEffect(() => {
    const prefetch = () => {
      import('../../pages/Bible/BibleStudy')
      import('../../pages/Bible/Plans/PlanList')
      import('../../pages/Bible/Genealogy/Genealogy')
    }
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(prefetch, { timeout: 3000 })
      return () => window.cancelIdleCallback(id)
    }
    const id = window.setTimeout(prefetch, 1500)
    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const handleResize = () => {
      // 키보드가 차지한 높이가 충분히 크면(오탐 방지 150px) 키보드로 간주
      setKeyboardOpen(window.innerHeight - vv.height > 150)
    }
    vv.addEventListener('resize', handleResize)
    return () => vv.removeEventListener('resize', handleResize)
  }, [])

  const labels =
    language === 'ko'
      ? { read: '읽기', search: '검색', plans: '플랜', wordbook: '단어장', genealogy: '가계도' }
      : { read: 'Read', search: 'Search', plans: 'Plans', wordbook: 'Words', genealogy: 'Genealogy' }

  const items: { key: BibleNavKey; icon: string; label: string }[] = [
    { key: 'read', icon: 'menu_book', label: labels.read },
    { key: 'search', icon: 'search', label: labels.search },
    { key: 'plans', icon: 'event_available', label: labels.plans },
    { key: 'wordbook', icon: 'spellcheck', label: labels.wordbook },
    { key: 'genealogy', icon: 'account_tree', label: labels.genealogy },
  ]

  const handleSelect = (key: BibleNavKey) => {
    if (key === active) return
    if (key === 'read' || key === 'search') {
      if (onSelectTab) {
        onSelectTab(key)
      } else {
        navigate(key === 'search' ? '/bible?tab=search' : '/bible')
      }
      return
    }
    const paths: Record<'plans' | 'wordbook' | 'genealogy', string> = {
      plans: '/bible/plans',
      wordbook: '/bible/wordbook',
      genealogy: '/bible/genealogy',
    }
    navigate(paths[key])
  }

  if (keyboardOpen) {
    return null
  }

  return (
    // lg+에선 좌측 레일 + 콘텐츠 상단 BibleSectionTabs가 대신한다 — 도크는 모바일 전용
    <nav className="fixed inset-x-0 bottom-0 z-40 lg:hidden" aria-label="성경 메뉴">
      <div className="mx-auto max-w-md px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
        {/* Glass dock — 홈 BottomNavigation과 동일한 표면(블러 + 상단 빛줄 + soft shadow) */}
        <div className="relative backdrop-blur-xl bg-white/80 dark:bg-[#201f1f]/90 border border-black/[0.04] dark:border-white/[0.08] rounded-2xl px-5 py-2 flex items-center justify-between shadow-[0_4px_16px_rgba(0,0,0,0.08),0_8px_24px_var(--brand-soft)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.5),0_12px_28px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.06)]">
          {/* 다크모드 카드 표면 그라데이션 — 카드 시스템과 동일 */}
          <div className="hidden dark:block absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />
          {items.map(({ key, icon, label }) => {
            const isActive = key === active
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelect(key)}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-xl transition-[color,background-color,transform] duration-150 active:scale-90 ${
                  isActive
                    ? 'text-brand bg-[var(--brand-soft)]'
                    : 'text-gray-500 dark:text-white/70 hover:text-brand hover:bg-[var(--brand-soft)] active:text-brand active:bg-[var(--brand-soft)]'
                }`}
              >
                <span className="material-icons-outlined text-[26px] leading-none">
                  {icon}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export default BibleBottomNav
