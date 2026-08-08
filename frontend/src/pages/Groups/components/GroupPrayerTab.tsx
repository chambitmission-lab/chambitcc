// 그룹 기도 탭 — 홈으로 튕기지 않고 방 안에서 바로 기도 피드를 보고 쓴다
// '은혜의 기록' 토글로 응답된 기도만 모아 그룹의 응답 역사를 돌아볼 수 있다
import { useState, useCallback, useEffect, useRef } from 'react'
import PrayerFeed from '../../Home/components/PrayerFeed'
import PrayerDetail from '../../Home/components/PrayerDetail'
import PrayerComposer from '../../Home/components/PrayerComposer'
import AnswerModal from '../../../components/prayer/AnswerModal'
import { PenLineIcon, SparklesIcon } from '../../../components/icons/ActionIcons'
import { usePrayersInfinite } from '../../../hooks/usePrayersQuery'
import { useAuth } from '../../../hooks/useAuth'
import { showToast } from '../../../utils/toast'
import type { SortType, Prayer } from '../../../types/prayer'
import { confirmDialog } from '../../../utils/confirmDialog'

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
    const ok = await confirmDialog({
      title: '응답 등록 취소',
      message: '응답 등록을 취소하시겠습니까?',
      description: '등록한 간증이 함께 삭제됩니다.',
      confirmText: '취소하기',
      cancelText: '닫기',
      icon: 'undo',
    })
    if (!ok) return
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

  const openComposer = () => requireAuth(() => setShowComposer(true))

  // 피드가 아직 얕을 때(1~2개)만 꼬리 초대 — 카드가 쌓이면 사라진다
  const showTailInvite =
    !graceMode &&
    !prayerHook.loading &&
    prayerHook.prayers.length > 0 &&
    prayerHook.prayers.length < 3 &&
    !prayerHook.hasMore

  return (
    <div>
      {/* 컴포저 프롬프트 — 솔리드 CTA 블록은 피드보다 시끄러웠다.
          "쓰러 가는 입구"처럼 낮은 위계로 두고 주인공 자리는 기도 카드에 준다 */}
      <div className="px-4 pt-3">
        <button
          type="button"
          onClick={openComposer}
          className="w-full h-11 rounded-full flex items-center gap-2.5 pl-4 pr-1.5 bg-[var(--surface-inset)] border border-[var(--card-border)] text-left transition-transform active:scale-[0.99]"
        >
          <PenLineIcon size={15} className="shrink-0 text-brand" />
          <span className="flex-1 min-w-0 truncate text-[13px] text-gray-500 dark:text-white/45">
            우리 방에 기도제목을 나눠주세요
          </span>
          <span className="shrink-0 h-8 px-3.5 rounded-full bg-brand text-white text-[12px] font-bold inline-flex items-center">
            나누기
          </span>
        </button>
      </div>

      {/* 필터·정렬 — 칩 4개가 흩어져 있던 자리를 세그먼트 1 + 조용한 토글 1로 */}
      <div className="px-4 pt-3 pb-0.5 flex items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="기도 보기 방식"
          className="relative flex w-[206px] shrink-0 p-[3px] rounded-full bg-gray-100 dark:bg-white/[0.05]"
        >
          {/* 슬라이딩 인디케이터 — 두 모드가 같은 트랙 위를 오가는 하나의 컨트롤로 읽히게 */}
          <span
            aria-hidden
            className="absolute top-[3px] bottom-[3px] left-[3px] w-[calc(50%-3px)] rounded-full transition-[transform,background-color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{
              transform: graceMode ? 'translateX(100%)' : 'translateX(0)',
              backgroundColor: graceMode ? 'var(--amber-soft)' : 'var(--brand-soft)',
            }}
          />
          <button
            type="button"
            role="tab"
            aria-selected={!graceMode}
            onClick={() => setGraceMode(false)}
            className={`relative z-10 flex-1 h-7 rounded-full text-[12px] transition-colors ${
              !graceMode ? 'font-bold text-brand' : 'font-medium text-gray-500 dark:text-white/45'
            }`}
          >
            함께 기도
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={graceMode}
            onClick={() => setGraceMode(true)}
            className={`relative z-10 flex-1 h-7 rounded-full text-[12px] inline-flex items-center justify-center gap-1 transition-colors ${
              graceMode
                ? 'font-bold text-[var(--amber)]'
                : 'font-medium text-gray-500 dark:text-white/45'
            }`}
          >
            <SparklesIcon size={12} />
            은혜의 기록
          </button>
        </div>

        {/* 정렬은 두 값뿐 — 탭하면 순환하는 한 개의 조용한 텍스트 컨트롤 */}
        <button
          type="button"
          onClick={() => setSort((s) => (s === 'latest' ? 'popular' : 'latest'))}
          aria-label={`정렬: ${sort === 'latest' ? '최신순' : '인기순'} (탭하면 바뀜)`}
          className="shrink-0 inline-flex items-center gap-1 text-[11.5px] font-semibold text-gray-400 dark:text-white/40 hover:text-brand transition-colors"
        >
          {sort === 'latest' ? '최신순' : '인기순'}
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m7 15 5 5 5-5" />
            <path d="m7 9 5-5 5 5" />
          </svg>
        </button>
      </div>

      {/* 모드 설명 — 기본 상태에서 빈 줄을 남기지 않도록 높이를 접었다 편다 */}
      <div
        className={`px-4 flex items-center overflow-hidden transition-[height] duration-300 ${
          graceMode ? 'h-[22px]' : 'h-0'
        }`}
      >
        <p className="text-[11.5px] text-[var(--amber)] leading-none whitespace-nowrap">
          응답으로 마무리된 기도만 모아 봤어요
        </p>
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
          showGroupName={false}
          groupByDate={sort === 'latest'}
        />
      ) : (
        <div className="px-4 pt-6 pb-12">
          <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/[0.09] px-5 py-9 text-center">
            <span className="text-4xl mb-3 block">{graceMode ? '🌱' : '🙏'}</span>
            <p className="text-[13.5px] font-bold text-ink-strong/85 mb-1">
              {graceMode ? '아직 응답 기록이 없어요' : '아직 올라온 기도제목이 없어요'}
            </p>
            <p className="text-[12px] text-gray-500 dark:text-white/50 leading-[1.6]">
              {graceMode
                ? '기도가 응답되면 이곳에 은혜의 기록이 쌓여가요'
                : '첫 기도제목을 나누면 멤버들이 함께 기도할 수 있어요'}
            </p>
            {!graceMode && (
              <button
                type="button"
                onClick={openComposer}
                className="mt-4 h-9 px-4 rounded-full bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] text-brand text-[12.5px] font-bold"
              >
                첫 기도제목 나누기
              </button>
            )}
          </div>
        </div>
      )}

      {/* 카드 한두 개뿐일 때 남는 빈 화면 — 그냥 비워두지 않고 다음 행동으로 잇는다 */}
      {showTailInvite && (
        <div className="px-4 pb-10 -mt-1">
          <button
            type="button"
            onClick={openComposer}
            className="w-full rounded-2xl border border-dashed border-gray-200 dark:border-white/[0.09] px-5 py-6 text-center transition-colors hover:border-[var(--brand-soft-strong)]"
          >
            <p className="text-[12.5px] font-bold text-ink-strong/80">
              이 방의 기도는 아직 {prayerHook.prayers.length}개예요
            </p>
            <p className="mt-1 text-[11.5px] text-gray-500 dark:text-white/45 leading-[1.6]">
              당신의 기도제목도 나누면 멤버들이 함께 품어줘요
            </p>
          </button>
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
