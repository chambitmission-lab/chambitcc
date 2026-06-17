import { Link } from 'react-router-dom'
import { useBibleFigureDetail } from '../../../../hooks/useBibleFigure'
import { useModalBackButton } from '../../../../hooks/useModalBackButton'
import type { BibleFigureSummary } from '../../../../types/bibleFigure'

interface FigureDetailPanelProps {
  slug: string | null
  onSelect: (slug: string) => void
  onClose: () => void
  /** 'card' (기본): 우측 사이드 카드 / 'sheet': 모바일 슬라이드업 시트 */
  variant?: 'card' | 'sheet'
}

export const FigureDetailPanel = ({
  slug,
  onSelect,
  onClose,
  variant = 'card',
}: FigureDetailPanelProps) => {
  const { data, isLoading, error } = useBibleFigureDetail(slug)

  // 모바일 시트로 열린 경우만 뒤로가기 → 시트 닫기 (데스크탑 사이드 카드는 제외)
  useModalBackButton(onClose, variant === 'sheet' && !!slug)

  const shellBase =
    'relative rounded-2xl border bg-white dark:bg-[#1c1c26] border-gray-200 dark:border-white/[0.08] overflow-hidden'
  const shellShadow =
    variant === 'card'
      ? 'shadow-[0_4px_24px_-8px_rgba(168,85,247,0.08)] dark:shadow-[0_10px_40px_-12px_rgba(168,85,247,0.2)]'
      : ''

  if (!slug) {
    return (
      <div className={`${shellBase} ${shellShadow} p-6`}>
        <div className="absolute inset-0 opacity-0 dark:opacity-100 pointer-events-none bg-gradient-to-br from-white/[0.05] via-transparent to-white/[0.02]" />
        <div className="relative text-center text-gray-500 dark:text-white/55 text-[13px] py-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/15 to-pink-500/15 mb-3">
            <span className="material-icons-round text-purple-500 dark:text-purple-300" style={{ fontSize: 22 }}>
              touch_app
            </span>
          </div>
          <p>가계도에서 인물을 선택하면</p>
          <p>이야기와 대표 구절을 볼 수 있어요.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={`${shellBase} ${shellShadow} p-6 animate-pulse`}>
        <div className="absolute inset-0 opacity-0 dark:opacity-100 pointer-events-none bg-gradient-to-br from-white/[0.05] via-transparent to-white/[0.02]" />
        <div className="relative space-y-3">
          <div className="h-6 w-1/3 bg-gray-100 dark:bg-white/[0.06] rounded-lg" />
          <div className="h-4 w-2/3 bg-gray-100 dark:bg-white/[0.06] rounded" />
          <div className="h-4 w-full bg-gray-100 dark:bg-white/[0.06] rounded" />
          <div className="h-4 w-5/6 bg-gray-100 dark:bg-white/[0.06] rounded" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-5 text-[14px] text-red-700 dark:text-red-300">
        인물 정보를 불러오지 못했습니다.
      </div>
    )
  }

  const renderRelations = (label: string, list: BibleFigureSummary[]) => {
    if (list.length === 0) return null
    return (
      <div className="mb-4">
        <div className="text-[11px] font-bold tracking-[0.12em] uppercase text-gray-400 dark:text-white/40 mb-2">
          {label}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {list.map((p) => {
            const isMessianic = p.is_messianic_line
            return (
              <button
                key={p.slug}
                type="button"
                onClick={() => onSelect(p.slug)}
                className={[
                  'inline-flex items-center gap-1 px-2.5 h-7 rounded-full text-[12px] font-semibold transition-all',
                  isMessianic
                    ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 hover:bg-purple-100 dark:hover:bg-purple-500/25'
                    : 'bg-gray-100 dark:bg-white/[0.05] text-gray-700 dark:text-white/80 border border-transparent hover:bg-gray-200 dark:hover:bg-white/[0.10]',
                ].join(' ')}
              >
                {isMessianic && (
                  <span className="w-1 h-1 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                )}
                {p.name_ko}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className={`${shellBase} ${shellShadow}`}>
      <div className="absolute inset-0 opacity-0 dark:opacity-100 pointer-events-none bg-gradient-to-br from-white/[0.05] via-transparent to-white/[0.02]" />

      {/* 헤더 */}
      <div className="relative px-5 pt-5 pb-4 border-b border-gray-100 dark:border-white/[0.05]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[20px] font-bold tracking-[-0.015em] leading-[1.3] text-gray-900 dark:text-white">
                {data.name_ko}
              </h2>
              {data.is_messianic_line && (
                <span
                  className="inline-flex items-center gap-1 px-2 h-6 rounded-full text-[11px] font-bold bg-gradient-to-r from-purple-500/15 to-pink-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30"
                  title="메시아 직계 라인"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                  메시아 라인
                </span>
              )}
            </div>
            {(data.name_en || data.name_hebrew) && (
              <div className="text-[12px] text-gray-500 dark:text-white/50 mt-1">
                {[data.name_en, data.name_hebrew].filter(Boolean).join(' · ')}
              </div>
            )}
            {(data.era || data.role) && (
              <div className="text-[12.5px] text-gray-600 dark:text-white/65 mt-0.5 font-medium">
                {[data.era, data.role].filter(Boolean).join(' · ')}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 dark:text-white/45 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-500/15 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <div
        className={`relative p-5 overflow-y-auto ${
          variant === 'card' ? 'max-h-[68vh]' : 'max-h-[70vh]'
        }`}
      >
        {data.reading_progress !== null && (
          <div className="mb-5">
            <div className="flex justify-between items-baseline text-[12px] mb-1.5">
              <span className="text-gray-500 dark:text-white/55 font-medium">
                키 구절 통독 진도
              </span>
              <span className="font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                {Math.round((data.reading_progress || 0) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                style={{
                  width: `${Math.max(
                    (data.reading_progress || 0) > 0 ? 3 : 0,
                    (data.reading_progress || 0) * 100,
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        {data.description_long && (
          <p className="text-[14px] leading-[1.75] text-gray-700 dark:text-white/80 mb-6 whitespace-pre-line">
            {data.description_long}
          </p>
        )}

        {renderRelations('부모', data.parents)}
        {renderRelations('배우자', data.spouses)}
        {renderRelations('자녀', data.children)}

        {data.key_verses && data.key_verses.length > 0 && (
          <div className="mt-5">
            <div className="text-[11px] font-bold tracking-[0.12em] uppercase text-gray-400 dark:text-white/40 mb-2.5">
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
                    className={[
                      'relative rounded-xl border p-3.5 transition-all overflow-hidden',
                      kv.is_read
                        ? 'border-purple-200 dark:border-purple-500/30 bg-purple-50/60 dark:bg-purple-500/10'
                        : 'border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.03]',
                    ].join(' ')}
                  >
                    {kv.is_read && (
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-pink-500"
                        aria-hidden
                      />
                    )}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <Link
                        to={linkTo}
                        className="inline-flex items-center gap-1 text-[12.5px] font-bold text-purple-700 dark:text-purple-300 hover:underline"
                      >
                        {ref}
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </Link>
                      {kv.is_read && (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-purple-600 dark:text-purple-300">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          읽음
                        </span>
                      )}
                    </div>
                    {kv.label && (
                      <div className="text-[11.5px] text-gray-500 dark:text-white/55 mb-1 font-medium">
                        {kv.label}
                      </div>
                    )}
                    {kv.text && (
                      <div className="text-[13.5px] text-gray-700 dark:text-white/80 leading-[1.65]">
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
