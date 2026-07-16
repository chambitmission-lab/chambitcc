import { useLanguage } from '../../../../contexts/LanguageContext'

const CategoryBadge = () => {
  const { t } = useLanguage()
  
  return (
    <div className="mb-4">
      <span className="inline-flex items-center gap-1.5 bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] text-brand text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
        <span className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse"></span>
        {t('prayerComposerCategory')}
      </span>
    </div>
  )
}

export default CategoryBadge
