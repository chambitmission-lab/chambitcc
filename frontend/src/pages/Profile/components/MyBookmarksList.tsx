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
    return <div className="text-center text-[13px] text-gray-500 dark:text-white/55 py-8">{t('bookmarksLoading')}</div>
  }

  if (error) {
    return <div className="text-center text-[13px] text-red-500 py-8">{t('bookmarksLoadError')}</div>
  }

  const items = data?.items ?? []

  return (
    <div className="space-y-3">
      {/* 필터 칩 — NewHome SortTabs와 동일 pill 패턴 */}
      <div className="flex gap-1.5 pb-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`text-[12px] font-medium px-3 py-1 rounded-full transition-all duration-150 ${
              filter === f.value
                ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300'
                : 'text-gray-400 dark:text-white/45 hover:text-gray-600 dark:hover:text-white/70'
            }`}
          >
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <span className="material-icons-outlined text-4xl text-gray-300 dark:text-white/25 block mb-2">
            auto_stories
          </span>
          <p className="text-[13px] text-gray-500 dark:text-white/55">
            {t('bookmarksEmpty')}
          </p>
          <p className="text-[12px] text-gray-400 dark:text-white/35 mt-1">
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
      className="
        relative overflow-hidden rounded-2xl p-4
        bg-white/80 dark:bg-card-dark
        border border-gray-200/70 dark:border-white/[0.08]
        shadow-sm
        dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_24px_rgba(168,85,247,0.08)]
      "
      style={bg ? { borderLeft: `4px solid ${bg}` } : undefined}
    >
      <div className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />
      {bg && (
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{ background: bg }}
          aria-hidden
        />
      )}

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-bold text-purple-700 dark:text-purple-300 tracking-[-0.01em]">
            {item.book_name_ko} {item.chapter}:{item.verse}
          </span>
          {item.is_favorite && (
            <span className="material-icons-round text-[16px] text-pink-500">favorite</span>
          )}
        </div>

        <p className="text-[14px] text-gray-800 dark:text-white/85 leading-[1.7] mb-2">
          {item.text}
        </p>

        {item.note && (
          <div className="mt-3 pt-3 border-t border-dashed border-gray-300/70 dark:border-white/[0.08]">
            <p className="text-[12.5px] text-gray-600 dark:text-white/70 italic leading-relaxed whitespace-pre-wrap flex items-start gap-1.5">
              <span className="material-icons-round text-[14px] text-purple-500 dark:text-purple-300 mt-0.5 shrink-0">
                edit_note
              </span>
              <span>{item.note}</span>
            </p>
          </div>
        )}

        <div className="text-[11px] text-gray-400 dark:text-white/40 mt-2">
          {new Date(item.updated_at).toLocaleDateString('ko-KR')}
        </div>
      </div>
    </div>
  )
}

export default MyBookmarksList
