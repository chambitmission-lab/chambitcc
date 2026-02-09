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
    <div className="px-4 pb-2">
      <button
        onClick={onVersesClick}
        className="w-full text-left text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex items-center gap-1.5 py-1"
      >
        <span className="material-icons-outlined text-[14px]">
          auto_stories
        </span>
        <span>
          {language === 'ko' 
            ? `함께 묵상해볼 수 있는 말씀 ${remainingCount}개` 
            : `${remainingCount} verses to meditate on`}
        </span>
      </button>
    </div>
  )
}

export default PrayerVersePreview
