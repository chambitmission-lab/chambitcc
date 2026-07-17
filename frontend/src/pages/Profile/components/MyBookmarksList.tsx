import { useMemo, useState, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMyBookmarks, useDeleteBookmark } from '../../../hooks/useBibleBookmark'
import { useLanguage } from '../../../contexts/LanguageContext'
import type { BookmarkDeleteTarget, VerseBookmarkWithVerse } from '../../../api/bibleBookmark'
import { HIGHLIGHT_COLOR_BG } from '../../Bible/components/VerseBookmarkModal'
import ExpandableText from './ExpandableText'

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
    // 최초 로딩(캐시 없음)에는 실제 카드와 비슷한 높이의 스켈레톤을 깔아
    // 로딩 → 데이터 전환 시 페이지 높이가 급변하며 화면이 튀는 것을 막는다
    return (
      <div className="space-y-3">
        <div className="flex gap-1.5 pb-2">
          {FILTERS.map((f) => (
            <div key={f.value} className="h-[26px] w-16 rounded-full bg-gray-200/70 dark:bg-white/[0.06] animate-pulse" />
          ))}
        </div>
        {[0, 1, 2].map((i) => (
          <BookmarkCardSkeleton key={i} />
        ))}
      </div>
    )
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
                ? 'bg-[var(--brand-soft-strong)] text-brand'
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
        items.map((item) => (
          <BookmarkCard
            key={item.id}
            item={item}
            // 탭별 삭제 범위: 묵상 노트 탭 → 노트만, 즐겨찾기 탭 → 즐겨찾기만,
            // 전체 탭 → 통째 삭제(기존 피드백대로, 2026-07-17)
            deleteTarget={filter === 'notes' ? 'note' : filter === 'favorites' ? 'favorite' : undefined}
          />
        ))
      )}
    </div>
  )
}

const BookmarkCardSkeleton = () => (
  <div
    className="
      relative overflow-hidden rounded-2xl p-4
      bg-white/80 dark:bg-card-dark
      border border-gray-200/70 dark:border-white/[0.08]
      shadow-sm animate-pulse
    "
  >
    <div className="h-[14px] w-24 rounded bg-gray-200/80 dark:bg-white/[0.08] mb-3" />
    <div className="space-y-2 mb-3">
      <div className="h-[13px] w-full rounded bg-gray-200/70 dark:bg-white/[0.06]" />
      <div className="h-[13px] w-4/5 rounded bg-gray-200/70 dark:bg-white/[0.06]" />
    </div>
    <div className="h-[11px] w-16 rounded bg-gray-200/60 dark:bg-white/[0.05]" />
  </div>
)

const BookmarkCard = ({
  item,
  deleteTarget,
}: {
  item: VerseBookmarkWithVerse
  deleteTarget?: BookmarkDeleteTarget
}) => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [removed, setRemoved] = useState(false)
  const removeBookmark = useDeleteBookmark(item.verse_id)
  const bg = item.highlight_color ? HIGHLIGHT_COLOR_BG[item.highlight_color] : null

  // 카드를 탭하면 성경 읽기 화면의 해당 절로 이동(스크롤+하이라이트)
  const goToVerse = () => {
    navigate(`/bible/${item.book_number}/${item.chapter}?verse=${item.verse}`)
  }

  // X 탭 = 현재 탭 범위만 삭제. deleteTarget 미지정(전체 탭)이면 통째 삭제 —
  // 필드만 지우면 전체 필터에 빈 형광펜 카드가 남아 삭제가 안 된 것처럼
  // 보인다는 피드백 반영(2026-07-17). 노트/즐겨찾기 탭에서는 해당 필드만 지우고,
  // 남은 표시가 없으면 서버가 행을 정리한다.
  // 목록 정리는 훅의 invalidate가 처리하고, 그 사이에는 removed로 미리 숨긴다.
  const remove = (e: MouseEvent) => {
    e.stopPropagation()
    if (removeBookmark.isPending || removed) return
    setRemoved(true)
    removeBookmark.mutate(deleteTarget, { onError: () => setRemoved(false) })
  }

  if (removed) return null

  return (
    <div
      onClick={goToVerse}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          goToVerse()
        }
      }}
      aria-label={`${item.book_name_ko} ${item.chapter}장 ${item.verse}절로 이동`}
      className="
        relative overflow-hidden rounded-2xl p-4
        bg-white/80 dark:bg-card-dark
        border border-gray-200/70 dark:border-white/[0.08]
        shadow-sm
        dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_24px_var(--brand-soft)]
        cursor-pointer transition-colors
        hover:border-[var(--brand-glow)]
        active:bg-[var(--brand-soft)]
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
          <span className="text-[12px] font-bold text-brand tracking-[-0.01em]">
            {item.book_name_ko} {item.chapter}:{item.verse}
          </span>
          <div className="flex items-center gap-1">
            {item.is_favorite && (
              <span className="material-icons-round text-[16px] text-pink-500">favorite</span>
            )}
            <button
              type="button"
              onClick={remove}
              onKeyDown={(e) => e.stopPropagation()}
              disabled={removeBookmark.isPending}
              aria-label={t('bookmarkDelete')}
              title={t('bookmarkDelete')}
              className="
                -my-1 -mr-1.5 grid h-7 w-7 place-items-center rounded-full
                text-gray-400 dark:text-white/40
                hover:text-gray-600 dark:hover:text-white/70
                hover:bg-black/[0.04] dark:hover:bg-white/[0.06]
                transition-colors
              "
            >
              <span className="material-icons-round text-[16px]">close</span>
            </button>
          </div>
        </div>

        <ExpandableText
          text={item.text}
          lines={3}
          className="mb-2"
          textClassName="text-[14px] text-gray-800 dark:text-white/85 leading-[1.7]"
        />

        {item.note && (
          <div className="mt-3 pt-3 border-t border-dashed border-gray-300/70 dark:border-white/[0.08]">
            <div className="flex items-start gap-1.5">
              <span className="material-icons-round text-[14px] text-brand mt-0.5 shrink-0">
                edit_note
              </span>
              <ExpandableText
                text={item.note}
                lines={3}
                className="min-w-0 flex-1"
                textClassName="text-[12.5px] text-gray-600 dark:text-white/70 italic leading-relaxed whitespace-pre-wrap"
              />
            </div>
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
