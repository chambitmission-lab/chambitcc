import { useLanguage } from '../../../contexts/LanguageContext'
import type { SortType } from '../../../types/prayer'

interface SortTabsProps {
  currentSort: SortType
  onSortChange: (sort: SortType) => void
}

const SortTabs = ({ currentSort, onSortChange }: SortTabsProps) => {
  const { t } = useLanguage()
  
  return (
    <section className="bg-background-light dark:bg-background-dark py-2 px-4 flex items-center sticky top-0 z-40">
      {/* 메인 탭(GroupFilter, 굵은 언더라인)과 시각적으로 명확히 구분되도록
          정렬은 작은 pill 칩 스타일로 처리 — 위계상 보조 컨트롤임을 드러냄. */}
      <div className="flex gap-1.5">
        <button
          onClick={() => onSortChange('popular')}
          className={`text-[12px] font-medium px-3 py-1 rounded-full transition-all duration-150 ${
            currentSort === 'popular'
              ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          {t('popular')}
        </button>
        <button
          onClick={() => onSortChange('latest')}
          className={`text-[12px] font-medium px-3 py-1 rounded-full transition-all duration-150 ${
            currentSort === 'latest'
              ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          {t('latest')}
        </button>
      </div>
    </section>
  )
}

export default SortTabs
