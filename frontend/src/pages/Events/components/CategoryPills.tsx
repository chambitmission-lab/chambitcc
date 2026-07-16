import type { EventCategory } from '../../../types/event'
import { ALL_CATEGORIES, CATEGORY_VISUAL } from '../utils/categoryConfig'
import { useLanguage } from '../../../contexts/LanguageContext'
import { translations } from '../../../locales'

interface CategoryPillsProps {
  value: EventCategory | undefined
  onChange: (next: EventCategory | undefined) => void
}

const CategoryPills = ({ value, onChange }: CategoryPillsProps) => {
  const { language } = useLanguage()
  const t = translations[language]

  return (
    <div className="px-4 pt-1 pb-3 overflow-x-auto scrollbar-hide">
      <div className="flex gap-2 min-w-min">
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className={[
            'shrink-0 px-3.5 h-9 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all',
            value === undefined
              ? 'bg-brand text-white shadow-[0_4px_14px_-4px_var(--brand-glow)]'
              : 'bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-white/70 border border-gray-200 dark:border-white/[0.08] hover:bg-gray-200 dark:hover:bg-white/[0.08] hover:text-gray-900 dark:hover:text-white',
          ].join(' ')}
        >
          {t.categories.all}
        </button>
        {ALL_CATEGORIES.map(cat => {
          const v = CATEGORY_VISUAL[cat]
          const active = value === cat
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onChange(cat)}
              className={[
                'shrink-0 px-3.5 h-9 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all flex items-center gap-1.5',
                active
                  ? `bg-gradient-to-r ${v.gradient} text-white shadow-[0_4px_14px_-4px_var(--brand-glow)]`
                  : 'bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-white/70 border border-gray-200 dark:border-white/[0.08] hover:bg-gray-200 dark:hover:bg-white/[0.08] hover:text-gray-900 dark:hover:text-white',
              ].join(' ')}
            >
              <span className="text-[14px]">{v.emoji}</span>
              <span>{t.categories[cat]}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default CategoryPills
