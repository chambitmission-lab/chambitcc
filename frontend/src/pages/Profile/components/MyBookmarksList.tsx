import { useMemo, useState, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMyBookmarks, useDeleteBookmark } from '../../../hooks/useBibleBookmark'
import { useLanguage } from '../../../contexts/LanguageContext'
import type { BookmarkDeleteTarget, VerseBookmarkWithVerse } from '../../../api/bibleBookmark'
import { HIGHLIGHT_COLOR_BG } from '../../Bible/components/VerseBookmarkModal'
import ExpandableText from './ExpandableText'
import {
  Doodle,
  NotebookCard,
  NotebookEmpty,
  NotebookSkeleton,
} from './PrayerNotebook'
import { RULED_TEXT, RULED_TOGGLE } from './notebookLook'

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
      <div>
        <div className="flex gap-1.5 pb-4">
          {FILTERS.map((f) => (
            <div key={f.value} className="nb-skel-bar h-[28px] w-16 rounded-full" />
          ))}
        </div>
        <div className="nb-grid">
          {[0, 1, 2].map((i) => (
            <NotebookSkeleton key={i} index={i} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="text-center text-[13px] text-red-500 py-8">{t('bookmarksLoadError')}</div>
  }

  const items = data?.items ?? []

  return (
    <div>
      {/* 필터 칩 — 수첩 머리말 칩의 작은 판 */}
      <div className="flex gap-1.5 pb-4" role="tablist">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            role="tab"
            aria-selected={filter === f.value}
            onClick={() => setFilter(f.value)}
            className="nb-chip nb-chip--sm"
          >
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <NotebookEmpty doodle="book" text={t('bookmarksEmpty')} hint={t('bookmarksEmptyHint')} />
      ) : (
        <div className="nb-grid">
          {items.map((item, index) => (
            <BookmarkCard
              key={item.id}
              item={item}
              index={index}
              // 탭별 삭제 범위: 묵상 노트 탭 → 노트만, 즐겨찾기 탭 → 즐겨찾기만,
              // 전체 탭 → 통째 삭제(기존 피드백대로, 2026-07-17)
              deleteTarget={filter === 'notes' ? 'note' : filter === 'favorites' ? 'favorite' : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const BookmarkCard = ({
  item,
  index,
  deleteTarget,
}: {
  item: VerseBookmarkWithVerse
  index: number
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

  // 형광펜 색은 마스킹테이프로 옮긴다 — 종이는 무지(형광 면을 깔면 다크에서 뜬다)
  return (
    <NotebookCard
      index={index}
      tone="plain"
      washi={bg ?? undefined}
      onOpen={goToVerse}
      ariaLabel={`${item.book_name_ko} ${item.chapter}장 ${item.verse}절로 이동`}
    >
      <button
        type="button"
        onClick={remove}
        onKeyDown={(e) => e.stopPropagation()}
        disabled={removeBookmark.isPending}
        aria-label={t('bookmarkDelete')}
        title={t('bookmarkDelete')}
        className="nb-icon-btn"
      >
        <span className="material-icons-round text-[16px]">close</span>
      </button>

      <div className="nb-date pr-8">
        {item.book_name_ko} {item.chapter}:{item.verse}
        {item.is_favorite && (
          <span className="material-icons-round ml-1 align-[-2px] text-[15px] text-[var(--nb-rose-tape)]">favorite</span>
        )}
      </div>

      <ExpandableText
        text={item.text}
        lines={3}
        className="mt-1.5"
        textClassName={RULED_TEXT}
        toggleClassName={RULED_TOGGLE}
      />

      {item.note && (
        <div className="nb-note">
          <ExpandableText
            text={item.note}
            lines={3}
            textClassName={`${RULED_TEXT} nb-ruled--hand whitespace-pre-wrap`}
            toggleClassName={RULED_TOGGLE}
          />
        </div>
      )}

      <div className="nb-foot">
        <div className="nb-meta">{new Date(item.updated_at).toLocaleDateString('ko-KR')}</div>
        <Doodle name={item.note ? 'pencil' : 'book'} />
      </div>
    </NotebookCard>
  )
}

export default MyBookmarksList
