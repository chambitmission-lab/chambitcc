import { memo, useState, useEffect, lazy, Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Prayer, RecommendedVerses } from '../../../../types/prayer'
import { fetchPrayerDetail } from '../../../../api/prayer'
import { prayerKeys } from '../../../../hooks/usePrayersQuery'
import { showToast } from '../../../../utils/toast'
import PrayerHeader from './PrayerHeader'
import PrayerContent from './PrayerContent'
import PrayerActions from './PrayerActions'
// 함께 묵상 모달은 버튼을 눌러야 열린다 — lazy 로 피드 번들에서 제외
const BibleVersesModal = lazy(() => import('../BibleVersesModal'))
import { getGroupColorTheme, getGroupColorCSSVars } from '../../../../utils/groupColors'
import { useLanguage } from '../../../../contexts/LanguageContext'

interface PrayerArticleProps {
  prayer: Prayer
  onPrayerToggle: (prayerId: number) => void | Promise<void>
  onAnswerToggle?: (prayerId: number) => void
  onEditAnswer?: (prayerId: number) => void
  onCancelAnswer?: (prayerId: number) => void
  onMakePublic?: (prayerId: number) => void
  onPrayerClick: (prayerId: number, shouldOpenReplies?: boolean) => void
  /** 그룹 방 안 피드 — 카드마다 같은 그룹명이 반복되면 노이즈라 숨긴다 */
  showGroupName?: boolean
}

const PrayerArticle = ({
  prayer,
  onPrayerToggle,
  onAnswerToggle,
  onEditAnswer,
  onCancelAnswer,
  onMakePublic,
  onPrayerClick,
  showGroupName = true,
}: PrayerArticleProps) => {
  const { language } = useLanguage()
  const [isPraying, setIsPraying] = useState(false)
  const [showVersesModal, setShowVersesModal] = useState(false)
  
  // 그룹 색상 테마 가져오기
  const colorTheme = getGroupColorTheme(prayer.group?.name)
  const cssVars = getGroupColorCSSVars(colorTheme)

  const handlePray = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isPraying) return
    setIsPraying(true)
    try {
      await onPrayerToggle(prayer.id)
    } finally {
      setIsPraying(false)
    }
  }

  const handleAnswer = (e: React.MouseEvent) => {
    e.stopPropagation()
    onAnswerToggle?.(prayer.id)
  }

  const handleEditAnswer = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEditAnswer?.(prayer.id)
  }

  const handleCancelAnswer = (e: React.MouseEvent) => {
    e.stopPropagation()
    onCancelAnswer?.(prayer.id)
  }

  const handleMakePublic = (e: React.MouseEvent) => {
    e.stopPropagation()
    onMakePublic?.(prayer.id)
  }

  const handleVersesClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowVersesModal(true)
  }

  const handleArticleClick = () => onPrayerClick(prayer.id)
  const handleReplyClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onPrayerClick(prayer.id, true)
  }

  // 목록 응답은 구절 전문 없이 개수만 온다(응답 크기 70% 절감). 전문이 실려 온 경우(단건 응답)는 그대로 쓴다.
  const versesCount = prayer.recommended_verses?.verses.length ?? prayer.recommended_verses_count ?? 0

  // 모달을 여는 순간에만 전문을 받는다 — 상세 쿼리와 키를 달리해 목록 항목이 initialData 로
  // 들어간 detail 캐시(구절 없음)를 잘못 재사용하지 않게 한다
  const versesQuery = useQuery<RecommendedVerses | null>({
    queryKey: prayerKeys.verses(prayer.id),
    queryFn: async () => (await fetchPrayerDetail(prayer.id)).recommended_verses ?? null,
    enabled: showVersesModal && !prayer.recommended_verses,
    staleTime: 1000 * 60 * 10,
  })
  const verses = prayer.recommended_verses ?? versesQuery.data ?? null

  useEffect(() => {
    if (showVersesModal && versesQuery.isError) {
      setShowVersesModal(false)
      showToast('말씀을 불러오지 못했어요. 잠시 후 다시 시도해주세요.', 'error')
    }
  }, [showVersesModal, versesQuery.isError])

  const liveStatusText = prayer.is_owner
    ? language === 'ko'
      ? `지금 ${prayer.prayer_count}명이 당신을 위해 기도하고 있어요`
      : `${prayer.prayer_count} praying for you now`
    : language === 'ko'
      ? `지금 ${prayer.prayer_count}명이 함께 기도하고 있어요`
      : `${prayer.prayer_count} praying together now`

  return (
    <article
      className={`prayer-card !bg-transparent !border-0 mb-5 cursor-pointer ${prayer.is_answered ? 'answered-article' : ''}`}
      onClick={handleArticleClick}
      style={cssVars as React.CSSProperties}
    >
      {/* 하나의 카드 = 하나의 서사. 헤더·본문·푸터를 한 표면 안에 묶는다. */}
      <div className="feed-card relative overflow-hidden rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--brand-glow)] hover:shadow-[0_8px_24px_-8px_var(--brand-glow)]">
        {/* 다크모드 표면 그라데이션 — 평평한 회색 박스 느낌을 깨기 위함 */}
        <div className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-transparent pointer-events-none rounded-2xl"></div>

        {/* 응답된 기도 전용 은은한 앰버 빛 (기능적 색상 — 브랜드 블루와 구분) */}
        {prayer.is_answered && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-gradient-to-b from-amber-300/25 to-transparent dark:from-amber-400/15 dark:to-transparent rounded-full blur-2xl pointer-events-none"></div>
        )}

        <div className="relative z-10">
          <PrayerHeader
            prayerId={prayer.id}
            displayName={prayer.display_name}
            avatarUrl={prayer.avatar_url ?? null}
            timeAgo={prayer.time_ago}
            groupName={prayer.group?.name}
            showGroupName={showGroupName}
            colorTheme={colorTheme}
            isPrivate={!!prayer.is_private}
          />

          <PrayerContent
            title={prayer.title}
            content={prayer.content}
            testimony={prayer.testimony}
            isAnswered={prayer.is_answered}
            transitionStyles={{}}
          />

          {/* 통합 액션바 — 흩어졌던 통계·말씀을 아이콘+숫자로 흡수 (스레드형).
              줄 전체를 클릭 차단 지대로: 버튼 사이 빈틈이나 상태 문구를 눌러도
              카드 클릭(상세보기)으로 새지 않는다 (X·Threads 액션바 문법) */}
          <div className="px-5 pt-3 pb-4 cursor-default" onClick={(e) => e.stopPropagation()}>
            <PrayerActions
              isPrayed={prayer.is_prayed}
              isPraying={isPraying}
              onPray={handlePray}
              colorTheme={colorTheme}
              prayerCount={prayer.prayer_count}
              replyCount={prayer.reply_count}
              onReplyClick={handleReplyClick}
              versesCount={versesCount}
              onVersesClick={handleVersesClick}
              isOwner={prayer.is_owner}
              isAnswered={prayer.is_answered}
              isPrivate={!!prayer.is_private}
              onAnswerClick={handleAnswer}
              onEditAnswerClick={handleEditAnswer}
              onCancelAnswerClick={handleCancelAnswer}
              onMakePublicClick={onMakePublic ? handleMakePublic : undefined}
            />

            {/* 살아있는 기도 — 지금 함께 기도하는 사람 수 (따뜻한 문구) */}
            {!prayer.is_private && prayer.prayer_count > 0 && (
              <div className="mt-2.5 text-[12px] text-gray-600 dark:text-gray-400">
                {liveStatusText}
              </div>
            )}
          </div>
        </div>
      </div>

      {showVersesModal && verses && (
        <Suspense fallback={null}>
          <BibleVersesModal
            verses={verses}
            authorName={prayer.display_name}
            prayerId={prayer.is_owner ? prayer.id : undefined}
            onClose={() => setShowVersesModal(false)}
          />
        </Suspense>
      )}
    </article>
  )
}

export default memo(PrayerArticle)
