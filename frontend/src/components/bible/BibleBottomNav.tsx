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
 * 성경 섹션 전용 하단 네비게이션 (읽기 | 검색 | 플랜 | 가계도).
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
    <nav className="fixed inset-x-0 bottom-0 z-40" aria-label="성경 메뉴">
      <div className="mx-auto max-w-md border-t border-black/[0.06] bg-background-light/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md dark:border-white/[0.08] dark:bg-background-dark/95">
        <div className="flex">
          {items.map(({ key, icon, label }) => {
            const isActive = key === active
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelect(key)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex flex-1 flex-col items-center gap-0.5 pb-1.5 pt-2.5 transition-[color,transform] duration-150 active:scale-90 ${
                  isActive
                    ? 'text-brand'
                    : 'text-gray-400 dark:text-white/45 active:text-brand'
                }`}
              >
                {/* 활성 인디케이터 — 브랜드 블루 바 */}
                {isActive && (
                  <span className="absolute top-0 h-[3px] w-9 rounded-b-full bg-brand shadow-[0_2px_6px_var(--brand-glow)]" />
                )}
                {/* 활성 아이콘 — 미세 확대 + 브랜드 채색으로 현재 위치를 직관적으로 표시 */}
                <span
                  className={`material-icons-round text-[22px] leading-none transition-transform duration-200 ${
                    isActive
                      ? 'scale-110 text-brand drop-shadow-[0_2px_8px_var(--brand-glow)]'
                      : ''
                  }`}
                >
                  {icon}
                </span>
                <span className={`text-[10.5px] leading-none ${isActive ? 'font-bold' : 'font-semibold'}`}>
                  {label}
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
