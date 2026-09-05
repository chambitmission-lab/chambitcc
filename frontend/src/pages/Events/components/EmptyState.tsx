import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../contexts/LanguageContext'
import { translations } from '../../../locales'
import type { EventCategory } from '../../../types/event'
import { CategoryIcon } from './CategoryIcons'
import { can } from '../../../utils/access'

interface EmptyStateProps {
  // 선택된 카테고리 칩에 맞춰 문구·이모지가 반응한다 (undefined = 전체)
  category?: EventCategory
}

const EmptyState = ({ category }: EmptyStateProps) => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const t = translations[language]
  const admin = can('content:manage')
  const label = category ? t.categories[category] : null

  return (
    <div className="mx-4 my-2 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] shadow-sm dark:shadow-none py-10 px-6 text-center">
      <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--brand-soft-strong)] mb-4">
        <CategoryIcon
          category={category ?? 'meeting'}
          width={30}
          height={30}
          className="text-brand"
        />
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
            <PlusIcon />
            {t.emptyCreateEvent}
          </button>
        )}
        <button
          type="button"
          onClick={() => navigate('/groups')}
          className="inline-flex items-center gap-1.5 px-4 h-10 rounded-full bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] text-brand text-[13px] font-bold hover:bg-[var(--brand-soft-strong)] transition-colors"
        >
          <ChatIcon />
          {t.emptyBrowseGroups}
        </button>
      </div>
    </div>
  )
}

/** 굵은 + — 새 일정 만들기 */
const PlusIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.8"
    strokeLinecap="round"
    aria-hidden="true"
    className="shrink-0"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
)

/** 말풍선 — 내 모임 둘러보기 */
const ChatIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="shrink-0"
  >
    <path d="M20.6 12.4c0 4-3.9 7.2-8.6 7.2-1 0-2-.1-2.9-.4l-4.7 1.5 1.4-3.9c-1.4-1.2-2.2-2.8-2.2-4.4C3.6 8.4 7.4 5.2 12 5.2s8.6 3.2 8.6 7.2z" />
  </svg>
)

export default EmptyState
