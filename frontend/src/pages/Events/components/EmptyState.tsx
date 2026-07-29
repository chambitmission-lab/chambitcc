import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../contexts/LanguageContext'
import { translations } from '../../../locales'
import { isAdmin } from '../../../utils/auth'
import type { EventCategory } from '../../../types/event'
import { CATEGORY_VISUAL } from '../utils/categoryConfig'

interface EmptyStateProps {
  // 선택된 카테고리 칩에 맞춰 문구·이모지가 반응한다 (undefined = 전체)
  category?: EventCategory
}

const EmptyState = ({ category }: EmptyStateProps) => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const t = translations[language]
  const admin = isAdmin()
  const visual = category ? CATEGORY_VISUAL[category] : null
  const label = category ? t.categories[category] : null

  return (
    <div className="mx-4 my-2 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] shadow-sm dark:shadow-none py-10 px-6 text-center">
      <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--brand-soft-strong)] mb-4">
        <span className="text-3xl">{visual ? visual.emoji : '☕'}</span>
        <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/10" />
      </div>
      <p className="text-ink-strong text-[15px] font-bold mb-1">
        {label ? t.emptyTitleCategory.replace('{label}', label) : t.emptyTitleAll}
      </p>
      <p className="text-gray-500 dark:text-white/55 text-[13px] leading-[1.5]">
        {label ? t.emptyDescCategory : t.emptyDescAll}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {admin && (
          <button
            type="button"
            onClick={() => navigate('/admin/events')}
            className="inline-flex items-center gap-1.5 px-4 h-10 rounded-full bg-brand text-white text-[13px] font-bold shadow-[0_4px_14px_-4px_var(--brand-glow)] hover:opacity-90 transition-opacity"
          >
            ➕ {t.emptyCreateEvent}
          </button>
        )}
        <button
          type="button"
          onClick={() => navigate('/groups')}
          className="inline-flex items-center gap-1.5 px-4 h-10 rounded-full bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] text-brand text-[13px] font-bold hover:bg-[var(--brand-soft-strong)] transition-colors"
        >
          💬 {t.emptyBrowseGroups}
        </button>
      </div>
    </div>
  )
}

export default EmptyState
