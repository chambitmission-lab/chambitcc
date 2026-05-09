import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { useAuth } from '../../../../hooks/useAuth'
import { isAdmin } from '../../../../utils/auth'
import { showToast } from '../../../../utils/toast'
import ThanksCard from './ThanksCard'
import ThanksComposer from './ThanksComposer'
import { useThanks } from './useThanks'

const ThanksThread = () => {
  const { language } = useLanguage()
  const { requireAuth } = useAuth()
  const navigate = useNavigate()
  const admin = isAdmin()
  const { items, loading, total, add, remove, amen } = useThanks({ limit: 10 })
  const [showComposer, setShowComposer] = useState(false)

  const handleOpenComposer = () => {
    requireAuth(() => setShowComposer(true))
  }

  const handleAmen = (id: number) => {
    requireAuth(async () => {
      try {
        await amen(id)
      } catch (e) {
        showToast(e instanceof Error ? e.message : 'Failed', 'error')
      }
    })
  }

  const handleDelete = async (id: number) => {
    const ok = window.confirm(language === 'ko' ? '이 감사를 삭제할까요?' : 'Delete this thanks?')
    if (!ok) return
    try {
      await remove(id)
      showToast(language === 'ko' ? '삭제되었습니다' : 'Deleted', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed', 'error')
    }
  }

  return (
    <section className="px-4 pt-3 pb-2">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
            <span>🙏</span>
            <span>{language === 'ko' ? '오늘의 감사' : 'Today’s Thanks'}</span>
          </h2>
          {total > 0 && (
            <span className="text-xs text-gray-400 dark:text-gray-500">{total}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {total > items.length && (
            <button
              onClick={() => navigate('/thanks')}
              className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
            >
              {language === 'ko' ? '더보기' : 'See all'}
            </button>
          )}
          <button
            onClick={handleOpenComposer}
            className="ml-1 p-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-sm hover:shadow-md transition-shadow"
            aria-label={language === 'ko' ? '감사 나누기' : 'Share thanks'}
            title={language === 'ko' ? '감사 나누기' : 'Share thanks'}
          >
            <span className="material-icons-outlined text-base">add</span>
          </button>
        </div>
      </div>

      {/* 가로 스크롤 카드 */}
      {loading && items.length === 0 ? (
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-64 h-32 flex-shrink-0 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <button
          onClick={handleOpenComposer}
          className="w-full text-left p-4 rounded-2xl border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10 text-sm text-amber-800 dark:text-amber-200 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
        >
          {language === 'ko'
            ? '☕ 오늘 첫 감사를 나눠주세요'
            : '☕ Be the first to share thanks today'}
        </button>
      ) : (
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
          {items.map((t) => (
            <ThanksCard
              key={t.id}
              thanks={t}
              canDelete={t.is_mine || admin}
              onAmen={handleAmen}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* 작성 모달 */}
      {showComposer && (
        <ThanksComposer onClose={() => setShowComposer(false)} onSubmit={add} />
      )}
    </section>
  )
}

export default ThanksThread
