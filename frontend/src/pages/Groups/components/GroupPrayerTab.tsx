// 그룹 기도 탭 — 홈으로 튕기지 않고 방 안에서 바로 기도 피드를 보고 쓴다
// '은혜의 기록' 토글로 응답된 기도만 모아 그룹의 응답 역사를 돌아볼 수 있다
import { useState, useCallback, useEffect, useRef } from 'react'
import PrayerFeed from '../../Home/components/PrayerFeed'
import PrayerDetail from '../../Home/components/PrayerDetail'
import PrayerComposer from '../../Home/components/PrayerComposer'
import AnswerModal from '../../../components/prayer/AnswerModal'
import { usePrayersInfinite } from '../../../hooks/usePrayersQuery'
import { useAuth } from '../../../hooks/useAuth'
import { showToast } from '../../../utils/toast'
import type { SortType, Prayer } from '../../../types/prayer'

interface GroupPrayerTabProps {
  groupId: number
}

const GroupPrayerTab = ({ groupId }: GroupPrayerTabProps) => {
  const { requireAuth } = useAuth()
  const [sort, setSort] = useState<SortType>('latest')
  // 은혜의 기록 — 응답된 기도만 모아 보는 모드
  const [graceMode, setGraceMode] = useState(false)
  const [showComposer, setShowComposer] = useState(false)
  const [selectedPrayerId, setSelectedPrayerId] = useState<number | null>(null)
  const [openReplies, setOpenReplies] = useState(false)
  const [showAnswerModal, setShowAnswerModal] = useState(false)
  const [selectedPrayerForAnswer, setSelectedPrayerForAnswer] = useState<Prayer | null>(null)

  const prayerHook = usePrayersInfinite(sort, groupId, 'all', graceMode ? true : undefined)
  // 핸들러 안정화 — prayerHook은 매 렌더 새 객체라 useCallback deps에 못 넣는다.
  // 핸들러는 이벤트 시점에만 읽으므로 effect에서 갱신해도 최신값이 보장된다
  const prayerHookRef = useRef(prayerHook)
  useEffect(() => {
    prayerHookRef.current = prayerHook
  })

  const handlePrayerToggle = useCallback(async (prayerId: number) => {
    try {
      await prayerHookRef.current.handlePrayerToggle(prayerId)
    } catch (error) {
      showToast(error instanceof Error ? error.message : '함께 기도에 실패했어요', 'error')
    }
  }, [])

  const handlePrayerClick = useCallback((prayerId: number, shouldOpenReplies = false) => {
    setSelectedPrayerId(prayerId)
    setOpenReplies(shouldOpenReplies)
  }, [])

  const openAnswerModal = useCallback((prayerId: number) => {
    const prayer = prayerHookRef.current.prayers.find((p) => p.id === prayerId)
    if (prayer) {
      setSelectedPrayerForAnswer(prayer)
      setShowAnswerModal(true)
    }
  }, [])

  const handleCancelAnswer = useCallback(async (prayerId: number) => {
    if (!window.confirm('응답 등록을 취소하시겠습니까? 등록한 간증이 삭제됩니다.')) return
    try {
      await prayerHookRef.current.cancelPrayerAnswer(prayerId)
    } catch {
      /* 토스트는 mutation onError에서 처리 */
    }
  }, [])

  const handleAnswerSubmit = async (testimony: string) => {
    if (!selectedPrayerForAnswer) return
    try {
      if (selectedPrayerForAnswer.is_answered) {
        await prayerHook.updatePrayerAnswer(selectedPrayerForAnswer.id, testimony)
      } else {
        await prayerHook.answerPrayer(selectedPrayerForAnswer.id, testimony)
      }
      setShowAnswerModal(false)
      setSelectedPrayerForAnswer(null)
    } catch {
      /* 토스트는 mutation onError에서 처리 */
    }
  }

  return (
    <div>
      {/* 컨트롤 바 — 작성 CTA + 은혜의 기록 토글 + 정렬 */}
      <div className="px-4 pt-3 pb-1 space-y-2.5">
        <button
          type="button"
          onClick={() => requireAuth(() => setShowComposer(true))}
          className="w-full h-11 rounded-xl bg-brand text-white text-[13.5px] font-bold shadow-[0_8px_24px_-8px_var(--brand-glow)] hover:shadow-[0_10px_28px_-6px_var(--brand-glow)] transition-all"
        >
          ✏️ 우리 그룹에 기도제목 나누기
        </button>
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setGraceMode(false)}
              className={
                !graceMode
                  ? 'text-[12px] font-bold px-3 py-1.5 rounded-full bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] text-brand'
                  : 'text-[12px] font-medium px-3 py-1.5 rounded-full bg-gray-100 dark:bg-white/[0.05] border border-transparent text-gray-500 dark:text-white/55'
              }
            >
              함께 기도
            </button>
            <button
              type="button"
              onClick={() => setGraceMode(true)}
              className={
                graceMode
                  ? 'text-[12px] font-bold px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-400/[0.14] border border-amber-300/70 dark:border-amber-300/30 text-amber-700 dark:text-amber-300'
                  : 'text-[12px] font-medium px-3 py-1.5 rounded-full bg-gray-100 dark:bg-white/[0.05] border border-transparent text-gray-500 dark:text-white/55'
              }
            >
              ✨ 은혜의 기록
            </button>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setSort('latest')}
              className={`text-[11.5px] px-2.5 py-1 rounded-full transition-colors ${
                sort === 'latest'
                  ? 'font-bold text-ink-strong bg-gray-100 dark:bg-white/[0.08]'
                  : 'font-medium text-gray-400 dark:text-white/40'
              }`}
            >
              최신순
            </button>
            <button
              type="button"
              onClick={() => setSort('popular')}
              className={`text-[11.5px] px-2.5 py-1 rounded-full transition-colors ${
                sort === 'popular'
                  ? 'font-bold text-ink-strong bg-gray-100 dark:bg-white/[0.08]'
                  : 'font-medium text-gray-400 dark:text-white/40'
              }`}
            >
              인기순
            </button>
          </div>
        </div>
        {graceMode && (
          <p className="text-[11.5px] text-gray-500 dark:text-white/50 leading-[1.5] px-1">
            우리 그룹에 부어진 응답들을 모아 봤어요. 흘러가지 않고 여기에 쌓여요 ✨
          </p>
        )}
      </div>

      {prayerHook.loading || prayerHook.prayers.length > 0 ? (
        <PrayerFeed
          prayers={prayerHook.prayers}
          loading={prayerHook.loading}
          hasMore={prayerHook.hasMore ?? false}
          isFetchingMore={prayerHook.isFetchingMore}
          onLoadMore={prayerHook.loadMore}
          onPrayerToggle={handlePrayerToggle}
          onAnswerToggle={openAnswerModal}
          onEditAnswer={openAnswerModal}
          onCancelAnswer={handleCancelAnswer}
          onPrayerClick={handlePrayerClick}
        />
      ) : (
        <div className="px-4 py-10 text-center">
          <span className="text-4xl mb-3 block">{graceMode ? '🌱' : '🙏'}</span>
          <p className="text-[13.5px] font-bold text-ink-strong/85 mb-1">
            {graceMode ? '아직 응답 기록이 없어요' : '아직 올라온 기도제목이 없어요'}
          </p>
          <p className="text-[12px] text-gray-500 dark:text-white/50 leading-[1.6]">
            {graceMode
              ? '기도가 응답되면 이곳에 은혜의 기록이 쌓여가요'
              : '첫 기도제목을 나누면 멤버들이 함께 기도할 수 있어요'}
          </p>
        </div>
      )}

      {showComposer && (
        <PrayerComposer
          sort={sort}
          groupId={groupId}
          onClose={() => setShowComposer(false)}
          onSuccess={() => {
            /* Optimistic update가 캐시를 갱신한다 */
          }}
        />
      )}

      {selectedPrayerId && (
        <PrayerDetail
          prayerId={selectedPrayerId}
          initialData={prayerHook.prayers.find((p) => p.id === selectedPrayerId)}
          initialOpenReplies={openReplies}
          onClose={() => {
            setSelectedPrayerId(null)
            setOpenReplies(false)
          }}
        />
      )}

      <AnswerModal
        isOpen={showAnswerModal}
        onClose={() => {
          setShowAnswerModal(false)
          setSelectedPrayerForAnswer(null)
        }}
        onSubmit={handleAnswerSubmit}
        prayerTitle={selectedPrayerForAnswer?.title || selectedPrayerForAnswer?.content?.slice(0, 30) || ''}
        initialTestimony={selectedPrayerForAnswer?.testimony}
        isSubmitting={prayerHook.isAnswering}
      />
    </div>
  )
}

export default GroupPrayerTab
