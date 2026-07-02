import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSituationCategories, useSituationVerses } from '../../hooks/useSituation'
import type { SituationCategory, SituationVerse } from '../../types/situation'
import './SituationBible.css'

const SituationBible = () => {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<SituationCategory | null>(null)

  const { data: categories = [], isLoading } = useSituationCategories()
  const { data: detail, isLoading: versesLoading } = useSituationVerses(
    selected?.id ?? 0,
    !!selected,
  )

  const handleVerseClick = (v: SituationVerse) => {
    navigate(`/bible/${v.book_number}/${v.chapter}`)
  }

  return (
    <div className="situation-bible bg-gray-50 dark:bg-background-dark min-h-screen">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen">

        {/* Header */}
        <div className="situation-header sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark">
          <div className="flex items-center gap-3 px-4 h-14">
            {selected && (
              <button
                onClick={() => setSelected(null)}
                className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 rounded-full transition-colors"
              >
                <span className="material-icons-round text-[22px]">arrow_back</span>
              </button>
            )}
            <div>
              <h1 className="text-[17px] font-bold text-gray-900 dark:text-gray-50">
                {selected ? selected.name : '상황별 성구'}
              </h1>
              {!selected && (
                <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-0.5">
                  지금 내 마음에 맞는 말씀을 찾아보세요
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 카테고리 그리드 */}
        {!selected && (
          <div className="p-4">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-gray-200 dark:border-gray-700 border-t-purple-500 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="situation-grid">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelected(cat)}
                    className="situation-card group"
                    style={{ '--card-color': cat.color } as React.CSSProperties}
                  >
                    <div className="situation-card__icon-wrap">
                      <span className="material-icons-round situation-card__icon">
                        {cat.icon}
                      </span>
                    </div>
                    <span className="situation-card__name">{cat.name}</span>
                    {cat.verse_count > 0 && (
                      <span className="situation-card__count">{cat.verse_count}절</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 구절 목록 */}
        {selected && (
          <div className="pb-8">
            {versesLoading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-gray-200 dark:border-gray-700 border-t-purple-500 rounded-full animate-spin" />
              </div>
            ) : !detail || detail.verses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <span className="material-icons-outlined text-[48px] text-gray-300 dark:text-gray-600 mb-3">
                  menu_book
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  아직 등록된 구절이 없습니다
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {detail.verses.map((v, idx) => (
                  <li key={v.id}>
                    <button
                      onClick={() => handleVerseClick(v)}
                      className="w-full text-left px-5 py-5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group"
                    >
                      {/* 참조 배지 */}
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="situation-verse__badge"
                          style={{ '--badge-color': selected.color } as React.CSSProperties}
                        >
                          {v.book_name_ko} {v.chapter}:{v.verse}
                        </span>
                        <span className="text-[11px] text-gray-300 dark:text-gray-600 tabular-nums">
                          {idx + 1}/{detail.verses.length}
                        </span>
                      </div>

                      {/* 구절 텍스트 */}
                      <p className="text-[15px] leading-relaxed text-gray-800 dark:text-gray-200 break-words">
                        {v.text}
                      </p>

                      {/* 성경 바로가기 */}
                      <div className="flex items-center gap-1 mt-3 text-[12px] font-medium text-gray-400 dark:text-gray-500 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors">
                        <span>본문 보기</span>
                        <span className="material-icons-outlined text-[14px]">chevron_right</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SituationBible
