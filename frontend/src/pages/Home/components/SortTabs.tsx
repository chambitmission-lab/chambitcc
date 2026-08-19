import { useLanguage } from '../../../contexts/LanguageContext'
import type { SortType } from '../../../types/prayer'

interface SortTabsProps {
  currentSort: SortType
  onSortChange: (sort: SortType) => void
}

const SortTabs = ({ currentSort, onSortChange }: SortTabsProps) => {
  const { t } = useLanguage()
  
  // z-30: 그룹 필터 드롭다운의 딤막(z-40)보다 아래에 있어야 한다.
  // 동률이면 DOM 순서상 이 흰 sticky 바가 딤막 위로 올라와 흰 줄처럼 비친다.
  // lg+ top-14: 고정 헤더(56px) 아래에 붙도록 오프셋 — top-0이면 반투명 헤더 뒤로 파고든다.
  return (
    <section className="bg-[var(--app-canvas)] py-2 px-4 flex items-center sticky top-0 lg:top-14 z-30">
      {/* 메인 탭(GroupFilter, 굵은 언더라인)과 시각적으로 명확히 구분되도록
          정렬은 작은 pill 칩 스타일로 처리 — 위계상 보조 컨트롤임을 드러냄. */}
      <div className="flex gap-1.5">
        <button
          onClick={() => onSortChange('popular')}
          className={`text-[12px] font-medium px-3 py-1 rounded-full transition-all duration-150 ${
            currentSort === 'popular'
              ? 'bg-[var(--brand-soft-strong)] text-brand'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          {t('popular')}
        </button>
        <button
          onClick={() => onSortChange('latest')}
          className={`text-[12px] font-medium px-3 py-1 rounded-full transition-all duration-150 ${
            currentSort === 'latest'
              ? 'bg-[var(--brand-soft-strong)] text-brand'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          {t('latest')}
        </button>
      </div>
    </section>
  )
}

export default SortTabs
