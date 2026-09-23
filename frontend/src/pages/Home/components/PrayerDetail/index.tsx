// 기도 요청 상세 페이지 - 메인 컨테이너
import { useState, useEffect, useRef } from 'react'
import { usePrayerDetail } from '../../../../hooks/usePrayersQuery'
import { useReplies, useCreateReply, useUpdateReply, useDeleteReply } from '../../../../hooks/useReplies'
import { usePrayerDelete } from '../../../../hooks/usePrayerDelete'
import { useModalBackButton } from '../../../../hooks/useModalBackButton'
import { useMediaQuery } from '../../../../hooks/useMediaQuery'
import type { Prayer } from '../../../../types/prayer'
import { useTranslation } from './useTranslation'
import PrayerDetailModal from './PrayerDetailModal'
import PrayerDetailHeader from './PrayerDetailHeader'
import LoadingState from './LoadingState'
import ErrorState from './ErrorState'
import PrayerAuthorInfo from './PrayerAuthorInfo'
import PrayerContent from './PrayerContent'
import PrayerActions from './PrayerActions'
import PrayerStats from './PrayerStats'
import RepliesSection from './RepliesSection'
import DeleteConfirmModal from './DeleteConfirmModal'
import { toastFeedback, showToast } from '../../../../utils/toast'
import { confirmDialog } from '../../../../utils/confirmDialog'
import { usePrayerVisibility } from '../../../../hooks/usePrayerVisibility'
import { PastorIcon } from '../EmotionIcons'
import { prayerToastFeedback } from '../../../../components/prayer/prayerFeedback'
import { can } from '../../../../utils/access'
import { useLanguage } from '../../../../contexts/LanguageContext'

interface PrayerDetailProps {
  prayerId: number
  initialData?: Prayer
  onClose: () => void
  onDelete?: () => void
  /** 나만 보기 기도를 전체 공개로 전환 */
  onMakePublic?: (prayerId: number) => void
  initialOpenReplies?: boolean
}

const PrayerDetail = ({ prayerId, initialData, onClose, onDelete, onMakePublic, initialOpenReplies = false }: PrayerDetailProps) => {
  const { t } = useLanguage()
  const { prayer, loading, error, handlePrayerToggle, isToggling } = usePrayerDetail(prayerId, initialData, prayerToastFeedback)
  const repliesSectionRef = useRef<HTMLDivElement>(null)

  // 댓글 작성 중 여부 — 작성 중엔 하단 기도 바를 접어 "댓글 작성"과
  // "함께 기도했어요"가 같은 하단 영역에 파란 버튼으로 공존하며 생기는 오탭을 막는다
  const [isComposing, setIsComposing] = useState(false)
  // PC 2단(본문·댓글 나란히) 여부 — 작성 중 기도 바 접기를 모바일에만 적용하려고 쓴다
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  // 브라우저/안드로이드 뒤로가기: 모달을 닫는다 (댓글은 항상 펼쳐져 있어 별도 단계 없음)
  useModalBackButton(onClose)

  // 댓글 섹션으로 스크롤 (약간의 딜레이를 주어 렌더링 완료 후 스크롤)
  const scrollToReplies = () => {
    setTimeout(() => {
      repliesSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 100)
  }

  // 피드에서 댓글 아이콘으로 진입한 경우 댓글 위치로 바로 이동
  useEffect(() => {
    if (initialOpenReplies) {
      scrollToReplies()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 번역 관련
  const {
    toggleTranslation,
    hasTranslation,
    showTranslation,
    displayTitle,
    displayContent,
    nextLanguage,
  } = useTranslation(prayer || null)

  // 삭제 관련
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { deletePrayer, isDeleting } = usePrayerDelete({
    onSuccess: () => {
      setShowDeleteConfirm(false)
      onClose()
      onDelete?.()
    },
    feedback: toastFeedback<{ message?: string }, number>({
      success: (data) => data.message || '기도 요청이 삭제되었습니다.',
      error: '기도 요청 삭제에 실패했습니다.',
    }),
  })

  const handleDelete = () => {
    deletePrayer(prayerId)
  }

  // 댓글 관련
  const {
    replies,
    isLoading: repliesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useReplies({ prayerId })

  const { createReply, isCreating } = useCreateReply({ prayerId, feedback: toastFeedback<{ message?: string }>({ success: (response) => response.message, error: '댓글 등록에 실패했습니다' }) })

  const { updateReply, isUpdating } = useUpdateReply({ prayerId, feedback: toastFeedback<{ message?: string }>({ success: (response) => response.message, error: '댓글 수정에 실패했습니다' }) })
  const { deleteReply } = useDeleteReply({ prayerId, feedback: toastFeedback<{ message?: string }>({ success: (response) => response.message, error: '댓글 삭제에 실패했습니다' }) })

  const handleReplySubmit = (content: string, displayName: string) => {
    createReply({ content, display_name: displayName })
  }

  const handleReplyUpdate = (replyId: number, content: string) => {
    updateReply({ replyId, content })
  }

  const handleReplyDelete = (replyId: number) => {
    deleteReply(replyId)
  }

  // 나만 보기 ↔ 목사님과 함께 — 둘 다 성도 피드에는 없는 글이라 이 화면 안에서 끝난다
  // (전체 공개 전환은 피드 갱신이 걸려 있어 호출부의 onMakePublic 이 맡는다)
  const { setVisibility, isUpdating: isSwitchingVisibility } = usePrayerVisibility({
    onError: (err) => showToast(err.message, 'error'),
  })
  const handleShareWithPastor = async () => {
    const ok = await confirmDialog({
      title: t('sharePrayerWithPastorTitle'),
      message: t('sharePrayerWithPastorMessage'),
      description: t('sharePrayerWithPastorDescription'),
      confirmText: t('sharePrayerWithPastorConfirm'),
      cancelText: t('cancel'),
    })
    if (!ok) return
    try {
      await setVisibility(prayerId, true, true)
      showToast(t('prayerSharedWithPastor'), 'success')
    } catch {
      // onError 토스트
    }
  }
  const handleUnshareWithPastor = async () => {
    try {
      await setVisibility(prayerId, true, false)
      showToast(t('prayerUnsharedWithPastor'), 'success')
    } catch {
      // onError 토스트
    }
  }

  // 로딩 상태
  if (loading) {
    return <LoadingState />
  }

  // 에러 상태
  if (error || !prayer) {
    return <ErrorState error={error || '기도 요청을 찾을 수 없습니다'} onClose={onClose} />
  }

  // 관리자는 부적절한 글을 즉시 정리할 수 있도록 남의 글에도 삭제 버튼 노출 (백엔드도 is_admin 허용)
  const isOwner = prayer.is_owner || false
  const isAdminDelete = !isOwner && can('community:moderate')
  // 목사님과 함께 — 작성자와 목회자 둘만의 자리. 기도·답글이 오간다
  const sharedWithPastor = !!prayer.shared_with_pastor
  // 나만 보는 기도 — 함께 기도·댓글 없이 조용한 일기장처럼
  const isPrivate = !!prayer.is_private && !sharedWithPastor
  // 목양 기도를 작성자 본인이 볼 때 — 자기 기도에 '기도했어요'를 누를 일은 없다
  const ownPastoral = sharedWithPastor && isOwner

  // PC(lg+) 넓은 화면 — 본문(좌)과 댓글(우)을 나란히. 댓글이 없는 나만 보기 기도는 기존 중앙 모달.
  // DOM 은 하나만 그린다(댓글 쿼리·작성 상태가 둘로 갈리지 않게): 모바일은 스크롤 래퍼 안에
  // 본문→댓글이 세로로 흐르고, lg 에선 스크롤 래퍼를 display:contents 로 풀어 세 조각
  // (본문·댓글·기도 바)을 바깥 그리드 칸에 직접 앉힌다.
  const split = !isPrivate
  // lg 에선 댓글이 옆 칸이라 작성 중에도 기도 바를 접을 이유가 없다(오탭 방지는 모바일 한정)
  const hideActionBar = isComposing && !isDesktop

  return (
    <>
      <PrayerDetailModal wide={split}>
        <PrayerDetailHeader
          canDelete={isOwner || isAdminDelete}
          onClose={onClose}
          onDeleteClick={() => setShowDeleteConfirm(true)}
        />

        <div
          className={`flex-1 min-h-0 flex flex-col ${
            split ? 'lg:grid lg:grid-cols-[minmax(0,1.3fr)_minmax(400px,1fr)] lg:grid-rows-[minmax(0,1fr)_auto]' : ''
          }`}
        >
        <div className={`flex-1 overflow-y-auto p-5 lg:p-0 ${split ? 'lg:contents' : ''}`}>
          {/* 본문 칸 — 한 줄이 너무 길면 다음 줄을 놓치므로 읽기 폭(680px)으로 가운데 모은다 */}
          <div className="lg:col-start-1 lg:row-start-1 lg:min-h-0 lg:overflow-y-auto lg:px-12 lg:pt-10 lg:pb-8">
          <div className="lg:max-w-[680px] lg:mx-auto">
          <PrayerAuthorInfo
            prayerId={prayer.id}
            displayName={prayer.display_name}
            avatarUrl={prayer.avatar_url ?? null}
            timeAgo={prayer.time_ago}
            isOwner={isOwner}
            isPrivate={isPrivate}
            sharedWithPastor={sharedWithPastor}
            hasTranslation={hasTranslation}
            showTranslation={showTranslation}
            nextLanguage={nextLanguage}
            onTranslationToggle={toggleTranslation}
          />

          <PrayerContent title={displayTitle} content={displayContent} />

          {isPrivate ? (
            <div className="mt-2 rounded-2xl border border-[var(--card-border)] bg-[var(--surface-inset)] p-4">
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-[var(--brand-soft-strong)] text-[var(--brand)]">
                  <span className="material-icons-outlined text-[18px]">lock</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] lg:text-[length:calc(15.5px*var(--fs,1))] font-bold text-ink-strong">{t('privatePrayerStatus')}</p>
                  <p className="mt-1 text-[12.5px] lg:text-[length:calc(14.5px*var(--fs,1))] leading-snug lg:leading-normal text-gray-600 dark:text-gray-400">
                    {t('privatePrayerDetailNotice')}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {onMakePublic && (
                      <button
                        type="button"
                        onClick={() => onMakePublic(prayer.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-brand text-[var(--on-brand)] text-[12.5px] lg:text-[length:calc(14.5px*var(--fs,1))] lg:px-4 lg:py-2.5 font-bold shadow-[0_4px_12px_var(--brand-glow)] hover:bg-brand-dim active:scale-95 transition-all"
                      >
                        <span className="material-icons-outlined text-[15px]">public</span>
                        {t('makePrayerPublic')}
                      </button>
                    )}
                    {isOwner && (
                      <button
                        type="button"
                        onClick={handleShareWithPastor}
                        disabled={isSwitchingVisibility}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[var(--card-border)] bg-[var(--surface-container)] text-[12.5px] lg:text-[length:calc(14.5px*var(--fs,1))] lg:px-4 lg:py-2.5 font-bold text-brand hover:bg-[var(--brand-soft)] active:scale-95 transition-all disabled:opacity-50"
                      >
                        <PastorIcon size={15} />
                        {t('sharePrayerWithPastor')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : ownPastoral ? (
            <div className="mt-2 mb-1 rounded-2xl border border-[var(--card-border)] bg-[var(--surface-inset)] p-4">
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-[var(--brand-soft-strong)] text-[var(--brand)]">
                  <PastorIcon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] lg:text-[length:calc(15.5px*var(--fs,1))] font-bold text-ink-strong">
                    {prayer.prayer_count > 0 ? t('pastorPrayed') : t('pastorPrayerStatus')}
                  </p>
                  <p className="mt-1 text-[12.5px] lg:text-[length:calc(14.5px*var(--fs,1))] leading-snug lg:leading-normal text-gray-600 dark:text-gray-400">
                    {t('pastorPrayerDetailNotice')}
                  </p>
                  <button
                    type="button"
                    onClick={handleUnshareWithPastor}
                    disabled={isSwitchingVisibility}
                    className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[var(--card-border)] bg-[var(--surface-container)] text-[12.5px] lg:text-[length:calc(14.5px*var(--fs,1))] lg:px-4 lg:py-2.5 font-bold text-ink-muted hover:text-brand active:scale-95 transition-all disabled:opacity-50"
                  >
                    <span className="material-icons-outlined text-[15px]">lock</span>
                    {t('unsharePrayerWithPastor')}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <PrayerStats prayerCount={prayer.prayer_count} />
          )}
          </div>
          </div>{/* /본문 칸 */}

          {/* 댓글은 토글 없이 항상 인라인 — 짧은 글일 때 하단이 텅 비지 않고
              댓글·입력창이 자연스럽게 이어져 화면을 채운다.
              lg: 오른쪽 칸 전체 높이(기도 바 줄까지)를 차지하고 안에서 따로 스크롤한다 */}
          {split && (
          <div
            ref={repliesSectionRef}
            className="scroll-mt-2 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:min-h-0 lg:flex lg:flex-col lg:border-l lg:border-[var(--card-border)] lg:bg-[var(--surface-inset)]"
          >
            {/* 목회자에게 — 이 자리의 답글은 피드 댓글과 달리 작성자 한 사람에게만 간다 */}
            {sharedWithPastor && !isOwner && (
              <p className="mb-1 px-1 lg:mb-0 lg:px-8 lg:pt-6 text-[12px] lg:text-[length:calc(14px*var(--fs,1))] font-medium text-brand">{t('pastorReplySectionHint')}</p>
            )}
            <RepliesSection
              replyCount={prayer.reply_count}
              replies={replies}
              isLoading={repliesLoading}
              isCreating={isCreating}
              isUpdating={isUpdating}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onReplySubmit={handleReplySubmit}
              onReplyUpdate={handleReplyUpdate}
              onReplyDelete={handleReplyDelete}
              onLoadMore={fetchNextPage}
              onComposerExpandedChange={setIsComposing}
            />
          </div>
          )}
        </div>{/* /스크롤 래퍼 */}

        {/* 하단 고정 액션 바 — 짧은 글에서도 버튼이 어중간한 높이에 뜨지 않고
            항상 엄지 존에 머문다. 설치형 PWA 홈 인디케이터 영역만큼 safe-area 패딩.
            댓글 작성 중에는 접어둔다(모바일) — "댓글 작성"을 누르려다 이 큰 파란 버튼을
            잘못 누르는 오탭 방지. 작성 완료/취소 시 다시 올라온다.
            lg: 본문 칸 바닥에 붙고, 버튼은 본문과 같은 읽기 폭으로 모은다 */}
        {!isPrivate && !ownPastoral && (
        <div
          aria-hidden={hideActionBar}
          className={`shrink-0 overflow-hidden transition-all duration-300 ease-out lg:col-start-1 lg:row-start-2 ${
            hideActionBar ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-32 opacity-100'
          }`}
        >
          <div className="px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:px-12 lg:py-5 border-t border-black/[0.06] dark:border-white/[0.08] bg-background-light dark:bg-background-dark">
            <div className="lg:max-w-[680px] lg:mx-auto">
            <PrayerActions
              isPrayed={prayer.is_prayed}
              isToggling={isToggling}
              replyCount={prayer.reply_count}
              onPrayerToggle={handlePrayerToggle}
              onCommentClick={scrollToReplies}
            />
            </div>
          </div>
        </div>
        )}
        </div>{/* /본문·댓글 그리드 */}
      </PrayerDetailModal>

      {showDeleteConfirm && (
        <DeleteConfirmModal
          isAdminDelete={isAdminDelete}
          isDeleting={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  )
}

export default PrayerDetail
