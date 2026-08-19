import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import type { BibleNavKey } from './BibleBottomNav'

interface BibleSectionTabsProps {
  active: BibleNavKey
  /** BibleStudy 안에서는 읽기/검색이 페이지 이동 없이 탭 전환된다 (BibleBottomNav와 동일 규약) */
  onSelectTab?: (tab: 'read' | 'search') => void
}

/**
 * PC 전용(lg+) 성경 섹션 탭 — 모바일 하단 도크(BibleBottomNav)의 데스크톱 대응물.
 * 도크는 lg에서 숨고, 대신 콘텐츠 상단에 인라인 세그먼트 탭으로 같은 5개 목적지를 담는다.
 * (PC에서 하단 도크가 좌측 레일과 이중 내비가 되고, 뷰포트 중앙 고정이라
 *  레일 오프셋된 본문과 정렬이 어긋나던 문제의 해결책)
 */
const BibleSectionTabs = ({ active, onSelectTab }: BibleSectionTabsProps) => {
  const navigate = useNavigate()
  const { language } = useLanguage()

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

  return (
    <nav className="hidden lg:flex justify-center pt-5 pb-1 px-6" aria-label="성경 메뉴">
      <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-white/70 dark:bg-white/[0.05] border border-black/[0.05] dark:border-white/[0.08] backdrop-blur-sm">
        {items.map(({ key, icon, label }) => {
          const isActive = key === active
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleSelect(key)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[14px] font-bold transition-[color,background-color,box-shadow] duration-150 ${
                isActive
                  ? 'text-brand bg-white dark:bg-[rgba(49,130,246,0.22)] shadow-[0_1px_3px_rgba(0,0,0,0.12)] dark:shadow-[inset_0_0_0_1px_rgba(49,130,246,0.35)]'
                  : 'text-gray-500 dark:text-white/65 hover:text-brand hover:bg-[var(--brand-soft)]'
              }`}
            >
              <span className="material-icons-outlined text-[19px] leading-none">{icon}</span>
              {label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default BibleSectionTabs
