// 기도 상세 화면 — 그리기만 한다(데이터·변경은 index.tsx 컨테이너가 넘겨준다).
// 배치: 감정 그림 띠 → 작성자(+기도 버튼) → 본문 / 곁에 머문 마음(말풍선) → 하단 입력 바. 칸 배치는 prayerDetail.css.
import { useEffect, useRef, useState } from 'react'
import type { Prayer, Reply } from '../../../../types/prayer'
import { useLanguage } from '../../../../contexts/LanguageContext'
import ReplyComposer from '../../../../components/common/ReplyComposer'
import PrayerDetailModal from './PrayerDetailModal'
import PrayerDetailHeader from './PrayerDetailHeader'
import PrayerAuthorInfo from './PrayerAuthorInfo'
import PrayerContent from './PrayerContent'
import PrayerActions from './PrayerActions'
import RepliesSection from './RepliesSection'
import { EmotionGlyph } from '../EmotionGlyph'
import { PastorIcon } from '../EmotionIcons'
import { EMOTION_META } from '../rail/shared'
import { prayerArtVars } from './prayerArt'

/** 한 번 눌러 남기는 말 — 글을 쓰지 않아도 마음을 남길 수 있게 */
const QUICK_REPLIES = ['아멘', '함께 기도할게요', '힘내세요']

export interface PrayerDetailViewProps {
  prayer: Prayer
  displayTitle?: string | null
  displayContent: string
  hasTranslation: boolean
  showTranslation: boolean
  nextLanguage: string
  onTranslationToggle: () => void

  canDelete: boolean
  onClose: () => void
  onDeleteClick: () => void

  isToggling: boolean
  onPrayerToggle: () => void

  replies: Reply[]
  repliesLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onReplySubmit: (content: string, displayName: string) => void
  onReplyUpdate: (replyId: number, content: string) => void
  onReplyDelete: (replyId: number) => void
  onLoadMore: () => void

  /** 나만 보기 기도를 전체 공개로 전환 */
  onMakePublic?: (prayerId: number) => void
  onShareWithPastor: () => void
  onUnshareWithPastor: () => void
  isSwitchingVisibility: boolean

  initialOpenReplies?: boolean
}

const PrayerDetailView = ({
  prayer,
  displayTitle,
  displayContent,
  hasTranslation,
  showTranslation,
  nextLanguage,
  onTranslationToggle,
  canDelete,
  onClose,
  onDeleteClick,
  isToggling,
  onPrayerToggle,
  replies,
  repliesLoading,
  isCreating,
  isUpdating,
  hasNextPage,
  isFetchingNextPage,
  onReplySubmit,
  onReplyUpdate,
  onReplyDelete,
  onLoadMore,
  onMakePublic,
  onShareWithPastor,
  onUnshareWithPastor,
  isSwitchingVisibility,
  initialOpenReplies = false,
}: PrayerDetailViewProps) => {
  const { t, language } = useLanguage()
  const repliesSectionRef = useRef<HTMLDivElement>(null)
  // 댓글 작성 중 여부 — 작성 중엔 하단 바의 기도 버튼을 접어 "댓글 작성"과 나란히 놓여 생기는 오탭을 막는다(모바일)
  const [isComposing, setIsComposing] = useState(false)

  // 피드에서 댓글 아이콘으로 진입한 경우 댓글 위치로 바로 이동 (렌더링 완료 뒤)
  useEffect(() => {
    if (!initialOpenReplies) return
    const timer = setTimeout(() => {
      repliesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isOwner = prayer.is_owner || false
  // 목사님과 함께 — 작성자와 목회자 둘만의 자리. 기도·답글이 오간다
  const sharedWithPastor = !!prayer.shared_with_pastor
  // 나만 보는 기도 — 함께 기도·댓글 없이 조용한 일기장처럼
  const isPrivate = !!prayer.is_private && !sharedWithPastor
  // 목양 기도를 작성자 본인이 볼 때 — 자기 기도에 '기도했어요'를 누를 일은 없다
  const ownPastoral = sharedWithPastor && isOwner
  // 댓글이 없는 나만 보기 기도는 기존 중앙 모달(한 칸), 그 밖엔 PC 에서 본문·대화 2단
  const split = !isPrivate
  const showPray = !isPrivate && !ownPastoral

  const emotionMeta = prayer.emotion ? EMOTION_META[prayer.emotion] : undefined

  return (
    <PrayerDetailModal wide={split}>
      <PrayerDetailHeader canDelete={canDelete} onClose={onClose} onDeleteClick={onDeleteClick} />

      <div className={`pd-grid ${split ? 'pd-grid--split' : ''}`}>
        <div className="pd-scroll">
          <div className="pd-art" style={prayerArtVars(prayer.emotion)}>
            {prayer.emotion && emotionMeta && (
              <span className="pd-art__tag">
                <EmotionGlyph emotion={prayer.emotion} fallback={emotionMeta.emoji} size={16} />
                {language === 'en' ? emotionMeta.labelEn : emotionMeta.label}
              </span>
            )}
          </div>

          <div className="pd-author">
            <div className="pd-measure flex items-center gap-3">
              <div className="flex-1 min-w-0">
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
                  onTranslationToggle={onTranslationToggle}
                />
              </div>
              {/* PC: 기도 버튼은 작성자 줄에 늘 보인다(본문만 따로 스크롤). 모바일은 하단 입력 바에 */}
              {showPray && (
                <div className="hidden lg:block mb-6">
                  <PrayerActions isPrayed={prayer.is_prayed} isToggling={isToggling} onPrayerToggle={onPrayerToggle} />
                </div>
              )}
            </div>
          </div>

          <div className="pd-body">
            <div className="pd-measure">
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
                            onClick={onShareWithPastor}
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
                        onClick={onUnshareWithPastor}
                        disabled={isSwitchingVisibility}
                        className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[var(--card-border)] bg-[var(--surface-container)] text-[12.5px] lg:text-[length:calc(14.5px*var(--fs,1))] lg:px-4 lg:py-2.5 font-bold text-ink-muted hover:text-brand active:scale-95 transition-all disabled:opacity-50"
                      >
                        <span className="material-icons-outlined text-[15px]">lock</span>
                        {t('unsharePrayerWithPastor')}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* 대화는 토글 없이 항상 인라인 — 모바일은 본문 아래로 이어지고, lg 는 오른쪽 칸에서 따로 스크롤한다 */}
          {split && (
            <div ref={repliesSectionRef} className="pd-replies">
              {/* 목회자에게 — 이 자리의 답글은 피드 댓글과 달리 작성자 한 사람에게만 간다 */}
              {sharedWithPastor && !isOwner && (
                <p className="mb-3 text-[12px] lg:text-[length:calc(14px*var(--fs,1))] font-medium text-brand">{t('pastorReplySectionHint')}</p>
              )}
              <RepliesSection
                prayerCount={sharedWithPastor ? null : prayer.prayer_count}
                replyCount={prayer.reply_count}
                replies={replies}
                isLoading={repliesLoading}
                isUpdating={isUpdating}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                onReplyUpdate={onReplyUpdate}
                onReplyDelete={onReplyDelete}
                onLoadMore={onLoadMore}
              />
            </div>
          )}
        </div>

        {/* 하단 입력 바 — 한 번 눌러 남기는 칩 + 입력창이 늘 엄지 존에 머문다.
            모바일은 왼쪽에 둥근 기도 버튼을 함께 두고, 작성 중엔 접는다(오탭 방지) */}
        {split && (
          <div className="pd-dock">
            <div className="flex items-end gap-2.5">
              {showPray && !isComposing && (
                <div className="lg:hidden">
                  <PrayerActions isPrayed={prayer.is_prayed} isToggling={isToggling} onPrayerToggle={onPrayerToggle} round />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <ReplyComposer
                  onSubmit={onReplySubmit}
                  isSubmitting={isCreating}
                  onExpandedChange={setIsComposing}
                  quickReplies={QUICK_REPLIES}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </PrayerDetailModal>
  )
}

export default PrayerDetailView
