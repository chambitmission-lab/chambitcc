import { useRef, useEffect, useMemo } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
import PrayerArticle from './PrayerArticle'
import { calendarDateKey, kstDateKey, kstNow } from '../../../utils/kstTime'
import type { Prayer } from '../../../types/prayer'

// 시간순 피드의 스캔성 — 카드가 쌓여도 "언제의 기도인지"가 한눈에 보이게
// 오늘 / 어제 / 이번 주 / M월 네 단계로만 끊는다 (더 잘게 쪼개면 헤더가 소음이 된다)
const sectionLabel = (createdAt: string, lang: string): string => {
  // kstNow()는 이미 서울 필드를 담은 캘린더 Date — kstDateKey에 다시 넣으면 9시간이 두 번 더해진다
  const today = kstNow()
  const key = kstDateKey(createdAt)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 6)

  if (key === calendarDateKey(today)) return lang === 'ko' ? '오늘' : 'Today'
  if (key === calendarDateKey(yesterday)) return lang === 'ko' ? '어제' : 'Yesterday'
  if (key >= calendarDateKey(weekAgo)) return lang === 'ko' ? '이번 주' : 'This week'
  const month = Number(key.slice(5, 7))
  return lang === 'ko'
    ? `${month}월`
    : new Date(2000, month - 1, 1).toLocaleDateString('en-US', { month: 'long' })
}

interface PrayerFeedProps {
  prayers: Prayer[]
  loading: boolean
  hasMore: boolean
  isFetchingMore: boolean
  onLoadMore: () => void
  onPrayerToggle: (prayerId: number) => void | Promise<void>
  onAnswerToggle?: (prayerId: number) => void
  onEditAnswer?: (prayerId: number) => void
  onCancelAnswer?: (prayerId: number) => void
  onPrayerClick: (prayerId: number, shouldOpenReplies?: boolean) => void
  /** 그룹 방 안 피드 — 카드마다 반복되는 그룹명을 숨긴다 */
  showGroupName?: boolean
  /** 시간순 피드에 날짜 구간 헤더를 붙인다 (최신순일 때만 의미 있음) */
  groupByDate?: boolean
}

const PrayerFeed = ({
  prayers,
  loading,
  hasMore,
  isFetchingMore,
  onLoadMore,
  onPrayerToggle,
  onAnswerToggle,
  onEditAnswer,
  onCancelAnswer,
  onPrayerClick,
  showGroupName = true,
  groupByDate = false
}: PrayerFeedProps) => {
  const { t, language } = useLanguage()
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // 각 카드 앞에 붙일 구간 라벨 (이전 카드와 라벨이 달라질 때만)
  const labels = useMemo(() => {
    if (!groupByDate) return []
    let prev = ''
    return prayers.map((p) => {
      const label = sectionLabel(p.created_at, language)
      if (label === prev) return null
      prev = label
      return label
    })
  }, [groupByDate, prayers, language])

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current || loading || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingMore) {
          onLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [loading, hasMore, isFetchingMore, onLoadMore])

  return (
    <div className="flex flex-col px-4 pt-3">
      {prayers.map((prayer, i) => (
        <div key={prayer.id} className="contents">
          {labels[i] && (
            <div className="flex items-center gap-2.5 mb-3 first:mt-0 mt-1">
              <span className="text-[11.5px] font-bold tracking-[0.02em] text-gray-400 dark:text-white/40">
                {labels[i]}
              </span>
              <span className="flex-1 h-px bg-gray-200/70 dark:bg-white/[0.07]" />
            </div>
          )}
          <PrayerArticle
            prayer={prayer}
            onPrayerToggle={onPrayerToggle}
            onAnswerToggle={onAnswerToggle}
            onEditAnswer={onEditAnswer}
            onCancelAnswer={onCancelAnswer}
            onPrayerClick={onPrayerClick}
            showGroupName={showGroupName}
          />
        </div>
      ))}

      {/* Loading State */}
      {loading && (
        <div className="py-8 text-center">
          <div className="inline-block w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('loadingPrayers')}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && prayers.length === 0 && (
        <div className="py-12 text-center">
          <span className="text-6xl mb-4 block">🙏</span>
          <p className="text-gray-500 dark:text-gray-400">{t('noPrayersYet')}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('firstPrayerRequest')}</p>
        </div>
      )}

      {/* Infinite Scroll Trigger */}
      {hasMore && <div ref={loadMoreRef} className="h-10" />}

      {/* Loading More State */}
      {isFetchingMore && (
        <div className="py-4 text-center">
          <div className="inline-block w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  )
}

export default PrayerFeed
