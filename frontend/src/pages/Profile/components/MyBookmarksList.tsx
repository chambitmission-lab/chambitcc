import { useMemo, useState } from 'react'
import { useMyBookmarks } from '../../../hooks/useBibleBookmark'
import { useLanguage } from '../../../contexts/LanguageContext'
import type { VerseBookmarkWithVerse } from '../../../api/bibleBookmark'
import { HIGHLIGHT_COLOR_BG } from '../../Bible/components/VerseBookmarkModal'

const FILTERS = [
  { value: 'all', labelKey: 'bookmarksFilterAll' },
  { value: 'notes', labelKey: 'meditationNote' },
  { value: 'favorites', labelKey: 'bookmarksFilterFavorites' },
] as const

type FilterValue = (typeof FILTERS)[number]['value']

const MyBookmarksList = () => {
  const { t } = useLanguage()
  const [filter, setFilter] = useState<FilterValue>('all')

  const queryParams = useMemo(() => {
    if (filter === 'notes') return { notes_only: true, page_size: 30 }
    if (filter === 'favorites') return { favorites_only: true, page_size: 30 }
    return { page_size: 30 }
  }, [filter])

  const { data, isLoading, error } = useMyBookmarks(queryParams)

  if (isLoading) {
    return <div className="text-center text-sm text-gray-500 py-8">{t('bookmarksLoading')}</div>
  }

  if (error) {
    return <div className="text-center text-sm text-red-500 py-8">{t('bookmarksLoadError')}</div>
  }

  const items = data?.items ?? []

  return (
    <div className="space-y-3">
      <div className="flex gap-2 pb-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
              filter === f.value
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <span className="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600">
            auto_stories
          </span>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {t('bookmarksEmpty')}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {t('bookmarksEmptyHint')}
          </p>
        </div>
      ) : (
        items.map((item) => <BookmarkCard key={item.id} item={item} />)
      )}
    </div>
  )
}

const BookmarkCard = ({ item }: { item: VerseBookmarkWithVerse }) => {
  const bg = item.highlight_color ? HIGHLIGHT_COLOR_BG[item.highlight_color] : null

  return (
    <div
      className="p-3 rounded-lg border border-border-light dark:border-border-dark"
      style={bg ? { borderLeft: `4px solid ${bg}`, background: `${bg}1A` } : undefined}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
          {item.book_name_ko} {item.chapter}:{item.verse}
        </span>
        {item.is_favorite && (
          <span className="material-icons-round text-sm text-pink-500">favorite</span>
        )}
      </div>
      <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed mb-2">
        {item.text}
      </p>
      {item.note && (
        <div className="mt-2 pt-2 border-t border-dashed border-gray-300 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400 italic leading-relaxed whitespace-pre-wrap">
            <span className="material-icons-round text-xs align-middle mr-1 text-purple-500">
              edit_note
            </span>
            {item.note}
          </p>
        </div>
      )}
      <div className="text-xs text-gray-400 mt-2">
        {new Date(item.updated_at).toLocaleDateString('ko-KR')}
      </div>
    </div>
  )
}

export default MyBookmarksList
