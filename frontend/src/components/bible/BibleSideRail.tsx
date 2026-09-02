import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import type { BibleNavKey } from './BibleBottomNav'

interface BibleSideRailProps {
  active: BibleNavKey
  /** BibleStudy 안에서는 읽기/검색이 페이지 이동 없이 탭 전환된다 (BibleBottomNav와 동일 규약) */
  onSelectTab?: (tab: 'read' | 'search') => void
  /** 레일 아래쪽 내용 — 읽기 화면의 장 개요(ChapterOutlineRail). 없으면 내비만 있는 좁은 레일 */
  children?: ReactNode
}

const COLLAPSED_KEY = 'bible-rail-collapsed'

const readCollapsed = (): boolean => {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * PC 전용(lg+) 성경 섹션 좌측 레일 — 모바일 하단 도크(BibleBottomNav)의 데스크톱 대응물.
 * 위에는 읽기·검색·플랜·단어장·가계도 세로 내비, 아래에는 화면별 내용(읽기 화면의 장 개요)이 붙는다.
 * 예전엔 같은 5개 목적지를 헤더 아래 가로 탭(BibleSectionTabs)으로 두었는데, 전역 헤더 밑에
 * 메뉴가 한 층 더 생겨 어색했고 본문 위 스택도 한 층 늘어나 레일로 옮겼다.
 *
 * - 접기: 아이콘 5개만 남는 활동 바(56px)로 줄어든다. 기기별 저장.
 * - 이 앱은 #root/body overflow 구조 탓에 position: sticky가 먹지 않는다.
 *   폭만 차지하는 슬롯을 flex에 두고, 실제 레일은 fixed로 띄워 슬롯의 left를 따라간다.
 * - 1024px 미만에선 layout.css가 통째로 숨긴다(도크가 담당).
 */
const BibleSideRail = ({ active, onSelectTab, children }: BibleSideRailProps) => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const slotRef = useRef<HTMLDivElement>(null)
  const [slotLeft, setSlotLeft] = useState<number | null>(null)

  const labels =
    language === 'ko'
      ? { read: '읽기', search: '검색', plans: '플랜', wordbook: '단어장', genealogy: '가계도', menu: '성경' }
      : { read: 'Read', search: 'Search', plans: 'Plans', wordbook: 'Words', genealogy: 'Genealogy', menu: 'Bible' }

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

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0')
      } catch {
        /* noop */
      }
      return next
    })
  }

  // 슬롯의 화면상 left를 따라간다 — 전역 레일 폭(lg/xl)·창 크기·접힘에 따라 바뀐다
  const measure = useCallback(() => {
    const rect = slotRef.current?.getBoundingClientRect()
    if (rect) setSlotLeft((prev) => (prev === rect.left ? prev : rect.left))
  }, [])

  useEffect(() => {
    let raf = 0
    const onChange = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        measure()
      })
    }
    onChange()
    document.addEventListener('scroll', onChange, { capture: true, passive: true })
    window.addEventListener('resize', onChange)
    return () => {
      document.removeEventListener('scroll', onChange, { capture: true })
      window.removeEventListener('resize', onChange)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [measure])

  // 접힘/펼침·내용 유무로 슬롯 폭이 바뀌면 다음 프레임에 다시 잰다
  const hasBody = !!children
  useEffect(() => {
    const raf = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(raf)
  }, [collapsed, hasBody, measure])

  const variant = collapsed ? 'corl--collapsed' : hasBody ? '' : 'corl--nav'
  const slotVariant = collapsed ? 'corl-slot--collapsed' : hasBody ? '' : 'corl-slot--nav'

  return (
    <div className={`corl-slot ${slotVariant}`} ref={slotRef}>
      <nav
        className={`corl ${variant}`}
        aria-label="성경 메뉴"
        style={slotLeft != null ? { left: slotLeft } : undefined}
      >
        <div className="corl-nav-head">
          {!collapsed && <span className="corl-label corl-nav-label">{labels.menu}</span>}
          <button
            type="button"
            className="corl-collapse"
            onClick={toggleCollapsed}
            aria-label={collapsed ? '메뉴 펼치기' : '메뉴 접기'}
            title={collapsed ? '메뉴 펼치기' : '메뉴 접기'}
          >
            <span className="material-icons-round">{collapsed ? 'chevron_right' : 'chevron_left'}</span>
          </button>
        </div>

        <ul className="corl-nav">
          {items.map(({ key, icon, label }) => {
            const isActive = key === active
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => handleSelect(key)}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={label}
                  title={collapsed ? label : undefined}
                  className={`corl-nav-item${isActive ? ' active' : ''}`}
                >
                  <span className="material-icons-outlined">{icon}</span>
                  {!collapsed && <span className="corl-nav-text">{label}</span>}
                </button>
              </li>
            )
          })}
        </ul>

        {/* 화면별 내용(장 개요) — 접힌 상태에선 아이콘 바만 남긴다 */}
        {children && !collapsed && <div className="corl-body">{children}</div>}
      </nav>
    </div>
  )
}

export default BibleSideRail
