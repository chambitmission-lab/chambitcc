import { useLanguage } from '../../../../contexts/LanguageContext'
import type { RecommendedVerses } from '../../../../types/prayer'

interface PrayerVersePreviewProps {
  verses: RecommendedVerses
  onVersesClick: (e: React.MouseEvent) => void
}

const PrayerVersePreview = ({ verses, onVersesClick }: PrayerVersePreviewProps) => {
  const { language } = useLanguage()
  const remainingCount = verses.verses.length

  return (
    <button
      onClick={onVersesClick}
      className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[var(--surface-inset)] px-2.5 py-1 text-[11px] font-medium text-gray-600 dark:text-gray-300 hover:text-brand transition-colors"
    >
      <span className="material-icons-outlined text-[13px]">
        auto_stories
      </span>
      <span>
        {language === 'ko'
          ? `말씀 ${remainingCount}`
          : `${remainingCount} verses`}
      </span>
    </button>
  )
}

export default PrayerVersePreview
