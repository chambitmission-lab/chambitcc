import { useLanguage } from '../../../../contexts/LanguageContext'
import type { RecommendedVerses } from '../../../../types/prayer'

interface PrayerVersePreviewProps {
  verses: RecommendedVerses
  onVersesClick: (e: React.MouseEvent) => void
}

const PrayerVersePreview = ({ verses, onVersesClick }: PrayerVersePreviewProps) => {
  const { language } = useLanguage()
  const firstVerse = verses.verses[0]
  const remainingCount = verses.verses.length - 1

  return (
    <div className="px-4 pb-3">
      <button
        onClick={onVersesClick}
        className="w-full bg-gradient-to-r from-purple-50/80 to-pink-50/80 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-3 border border-purple-200/50 dark:border-purple-500/30 hover:border-purple-300 dark:hover:border-purple-400 transition-colors text-left"
      >
        <div className="flex items-start gap-2">
          <span className="material-icons-outlined text-purple-500 dark:text-purple-400 text-sm mt-0.5 flex-shrink-0">
            auto_stories
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-purple-700 dark:text-purple-300 mb-1">
              {firstVerse.reference}
            </p>
            <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-2">
              "{firstVerse.text}"
            </p>
            {remainingCount > 0 && (
              <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-1 font-semibold">
                +{remainingCount}{language === 'ko' ? '개 더보기' : ' more'}
              </p>
            )}
          </div>
        </div>
      </button>
    </div>
  )
}

export default PrayerVersePreview
