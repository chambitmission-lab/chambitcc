import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getThanksList } from '../../api/thanks'
import { useLanguage } from '../../contexts/LanguageContext'
import { useAuth } from '../../hooks/useAuth'
import {
  createThanks,
  deleteThanks,
  toggleThanksAmen,
} from '../../api/thanks'
import type { CreateThanksRequest, Thanks as ThanksType } from '../../types/thanks'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import ThanksCard from '../Home/components/ThanksThread/ThanksCard'
import ThanksComposer from '../Home/components/ThanksThread/ThanksComposer'

const PAGE_SIZE = 20

const Thanks = () => {
  const { language } = useLanguage()
  const { requireAuth } = useAuth()
  const navigate = useNavigate()
  const admin = isAdmin()

  const [items, setItems] = useState<ThanksType[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showComposer, setShowComposer] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadPage = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const data = await getThanksList(p, PAGE_SIZE)
      setItems((prev) => (p === 1 ? data.items : [...prev, ...data.items]))
      setTotal(data.total)
      setPage(p)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to load', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPage(1)
  }, [loadPage])

  // 무한 스크롤
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading && items.length < total) {
          loadPage(page + 1)
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loading, items.length, total, page, loadPage])

  const handleAdd = async (payload: CreateThanksRequest) => {
    const created = await createThanks(payload)
    setItems((prev) => [created, ...prev])
    setTotal((t) => t + 1)
  }

  const handleAmen = (id: number) => {
    requireAuth(async () => {
      const target = items.find((t) => t.id === id)
      if (!target) return
      // 낙관적
      setItems((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                is_amened: !t.is_amened,
                amen_count: t.is_amened ? Math.max(0, t.amen_count - 1) : t.amen_count + 1,
              }
            : t
        )
      )
      try {
        const res = await toggleThanksAmen(id)
        setItems((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, is_amened: res.is_amened, amen_count: res.amen_count } : t
          )
        )
      } catch (e) {
        // 롤백
        setItems((prev) =>
          prev.map((t) =>
            t.id === id
              ? {
                  ...t,
                  is_amened: !t.is_amened,
                  amen_count: t.is_amened ? Math.max(0, t.amen_count - 1) : t.amen_count + 1,
                }
              : t
          )
        )
        showToast(e instanceof Error ? e.message : 'Failed', 'error')
      }
    })
  }

  const handleDelete = async (id: number) => {
    const ok = window.confirm(language === 'ko' ? '이 감사를 삭제할까요?' : 'Delete this thanks?')
    if (!ok) return
    try {
      await deleteThanks(id)
      setItems((prev) => prev.filter((t) => t.id !== id))
      setTotal((t) => Math.max(0, t - 1))
      showToast(language === 'ko' ? '삭제되었습니다' : 'Deleted', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed', 'error')
    }
  }

  const handleOpenComposer = () => requireAuth(() => setShowComposer(true))

  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen">
        {/* Header */}
        <div className="sticky top-14 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark">
          <div className="px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="p-1 -ml-1 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
              aria-label={language === 'ko' ? '뒤로' : 'Back'}
            >
              <span className="material-icons-outlined">arrow_back</span>
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center justify-center gap-1.5">
                <span>🙏</span>
                <span>{language === 'ko' ? '오늘의 감사' : 'Today’s Thanks'}</span>
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {language === 'ko' ? '일상 속 작은 감사를 함께 나눕니다' : 'Share the little joys of daily life'}
              </p>
            </div>
            <button
              onClick={handleOpenComposer}
              className="p-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-sm"
              aria-label={language === 'ko' ? '감사 나누기' : 'Share thanks'}
            >
              <span className="material-icons-outlined text-base">add</span>
            </button>
          </div>
        </div>

        {/* List */}
        <div className="p-4 space-y-3">
          {items.length === 0 && !loading ? (
            <button
              onClick={handleOpenComposer}
              className="w-full text-left p-6 rounded-2xl border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10 text-sm text-amber-800 dark:text-amber-200 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
            >
              {language === 'ko'
                ? '☕ 오늘 첫 감사를 나눠주세요'
                : '☕ Be the first to share thanks today'}
            </button>
          ) : (
            items.map((t) => (
              <ThanksCard
                key={t.id}
                thanks={t}
                canDelete={t.is_mine || admin}
                onAmen={handleAmen}
                onDelete={handleDelete}
                variant="list"
              />
            ))
          )}

          {loading && (
            <div className="flex items-center justify-center py-6">
              <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-1" />
        </div>

        {showComposer && (
          <ThanksComposer onClose={() => setShowComposer(false)} onSubmit={handleAdd} />
        )}
      </div>
    </div>
  )
}

export default Thanks
