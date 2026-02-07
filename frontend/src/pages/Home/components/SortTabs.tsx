import { useLanguage } from '../../../contexts/LanguageContext'
import type { SortType } from '../../../types/prayer'

interface SortTabsProps {
  currentSort: SortType
  onSortChange: (sort: SortType) => void
}

const SortTabs = ({ currentSort, onSortChange }: SortTabsProps) => {
  const { t } = useLanguage()
  
  return (
    <section className="bg-background-light dark:bg-background-dark py-3 px-4 flex items-center justify-between border-b border-border-light dark:border-border-dark sticky top-0 z-40">
      <div className="flex gap-6">
        <button
          onClick={() => onSortChange('popular')}
          className={`text-sm font-bold pb-1.5 -mb-1.5 ${
            currentSort === 'popular'
              ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          {t('popular')}
        </button>
        <button
          onClick={() => onSortChange('latest')}
          className={`text-sm font-bold pb-1.5 -mb-1.5 ${
            currentSort === 'latest'
              ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white'
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
