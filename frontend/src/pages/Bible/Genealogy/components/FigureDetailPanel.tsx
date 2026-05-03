import { Link } from 'react-router-dom'
import { useBibleFigureDetail } from '../../../../hooks/useBibleFigure'
import type { BibleFigureSummary } from '../../../../types/bibleFigure'

interface FigureDetailPanelProps {
  slug: string | null
  onSelect: (slug: string) => void
  onClose: () => void
}

export const FigureDetailPanel = ({
  slug,
  onSelect,
  onClose,
}: FigureDetailPanelProps) => {
  const { data, isLoading, error } = useBibleFigureDetail(slug)

  if (!slug) {
    return (
      <div className="rounded-lg border border-border-light dark:border-border-dark p-6 bg-white dark:bg-surface-dark text-gray-500 dark:text-gray-400">
        <p className="text-center text-sm">
          가계도에서 인물을 선택하면 상세 정보와 관련 구절이 표시됩니다.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border-light dark:border-border-dark p-6 bg-white dark:bg-surface-dark animate-pulse">
        <div className="h-6 w-1/3 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
        <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-300 p-6 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
        인물 정보를 불러오지 못했습니다.
      </div>
    )
  }

  const renderRelations = (label: string, list: BibleFigureSummary[]) => {
    if (list.length === 0) return null
    return (
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
          {label}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {list.map((p) => (
            <button
              key={p.slug}
              onClick={() => onSelect(p.slug)}
              className="px-2.5 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-primary hover:text-white text-gray-700 dark:text-gray-200 transition-colors"
            >
              {p.name_ko}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark overflow-hidden">
      {/* 헤더 */}
      <div className="px-5 py-4 border-b border-border-light dark:border-border-dark flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {data.name_ko}
            </h2>
            {data.is_messianic_line && (
              <span className="text-amber-500 text-sm" title="메시아 직계 라인">
                ●
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {[data.name_en, data.name_hebrew].filter(Boolean).join(' · ')}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {[data.era, data.role].filter(Boolean).join(' · ')}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="닫기"
          className="text-gray-400 hover:text-gray-700 dark:hover:text-white text-xl leading-none"
        >
          ×
        </button>
      </div>

      <div className="p-5 max-h-[60vh] overflow-y-auto">
        {data.reading_progress !== null && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>키 구절 통독 진도</span>
              <span>{Math.round((data.reading_progress || 0) * 100)}%</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all"
                style={{ width: `${(data.reading_progress || 0) * 100}%` }}
              />
            </div>
          </div>
        )}

        {data.description_long && (
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-200 mb-5 whitespace-pre-line">
            {data.description_long}
          </p>
        )}

        {renderRelations('부모', data.parents)}
        {renderRelations('배우자', data.spouses)}
        {renderRelations('자녀', data.children)}

        {data.key_verses && data.key_verses.length > 0 && (
          <div className="mt-5">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
              대표 구절
            </div>
            <div className="space-y-2">
              {data.key_verses.map((kv, idx) => {
                const ref = kv.book_name_ko
                  ? `${kv.book_name_ko} ${kv.chapter}${kv.verse ? `:${kv.verse}` : '장'}`
                  : `${kv.chapter}${kv.verse ? `:${kv.verse}` : '장'}`
                const linkTo = kv.book_number
                  ? `/bible/${kv.book_number}/${kv.chapter}`
                  : '#'
                return (
                  <div
                    key={idx}
                    className={`rounded-md border p-3 transition-colors ${
                      kv.is_read
                        ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Link
                        to={linkTo}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        {ref}
                      </Link>
                      {kv.is_read && (
                        <span className="text-[10px] text-amber-700 dark:text-amber-300">
                          ✓ 읽음
                        </span>
                      )}
                    </div>
                    {kv.label && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {kv.label}
                      </div>
                    )}
                    {kv.text && (
                      <div className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                        {kv.text}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FigureDetailPanel
