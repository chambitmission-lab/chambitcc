import BibleVersesModal from '../BibleVersesModal'
import PrayerComposerHeader from './PrayerComposerHeader'
import UserInfoSection from './UserInfoSection'
import GroupSelector from './GroupSelector'
import EmotionSelector from './EmotionSelector'
import ContentCard from './ContentCard'
import ErrorMessage from './ErrorMessage'
import PrivacyNotice from './PrivacyNotice'
import { usePrayerComposer } from './usePrayerComposer'
import { useLanguage } from '../../../../contexts/LanguageContext'
import type { PrayerComposerProps } from './types'

const PrayerComposer = ({ onClose, onSuccess, sort = 'popular', groupId }: PrayerComposerProps) => {
  const { t } = useLanguage()
  const {
    title,
    content,
    isAnonymous,
    selectedGroupId,
    emotion,
    error,
    recommendedVerses,
    showVersesModal,
    isCreating,
    isLoggedIn,
    displayName,
    avatarUrl,
    setTitle,
    setContent,
    setIsAnonymous,
    setSelectedGroupId,
    setEmotion,
    handleSubmit,
    handleVersesModalClose,
  } = usePrayerComposer({ onClose, onSuccess, sort, groupId })  // ✅ groupId 전달

  // 제목은 선택 — 내용만 있으면 저장 가능
  const canSubmit = !!content.trim()

  return (
    <>
      {/* 성경 구절 모달 */}
      {showVersesModal && recommendedVerses && (
        <BibleVersesModal
          verses={recommendedVerses}
          onClose={handleVersesModalClose}
        />
      )}

      {/* 기도 작성 모달 — 토스 블루 플랫 테마 (theme.css 브랜드 토큰, card-dark 솔리드 + 그라데이션 한 겹 + 1px 상단 빛줄) */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center sm:p-4 overflow-hidden"
        onClick={onClose}
      >
        <div
          className="relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] bg-background-light dark:bg-card-dark rounded-t-3xl sm:rounded-3xl overflow-y-auto overflow-x-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_8px_28px_var(--brand-glow),inset_0_1px_0_rgba(255,255,255,0.05)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 다크모드 카드 표면 그라데이션 — 평평한 회색 박스 방지 */}
          <div className="hidden dark:block sticky top-0 left-0 right-0 -z-0 pointer-events-none">
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.05] to-transparent" />
          </div>

          {/* 블루 글로우 — 카드 시스템과 동일 액센트 */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400/15 to-sky-400/10 dark:from-blue-500/15 dark:to-sky-500/8 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-sky-400/10 to-blue-400/10 dark:from-sky-500/10 dark:to-blue-500/8 rounded-full blur-3xl pointer-events-none" />

          <PrayerComposerHeader onClose={onClose} />

          <form onSubmit={handleSubmit} className="relative z-10 p-4 overflow-x-hidden">
            <UserInfoSection
              displayName={displayName}
              avatarUrl={avatarUrl}
              isLoggedIn={isLoggedIn}
              isAnonymous={isAnonymous}
              onAnonymousChange={setIsAnonymous}
            />

            <GroupSelector
              selectedGroupId={selectedGroupId}
              onGroupChange={setSelectedGroupId}
            />

            <EmotionSelector
              selected={emotion}
              onChange={setEmotion}
              disabled={isCreating}
            />

            <ContentCard
              title={title}
              content={content}
              onTitleChange={setTitle}
              onContentChange={setContent}
            />

            <ErrorMessage error={error} />

            <PrivacyNotice isAnonymous={isAnonymous} />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isCreating || !canSubmit}
                className="px-4 py-2 bg-brand text-white font-bold text-sm rounded-full shadow-[0_8px_24px_-8px_var(--brand-glow)] hover:shadow-[0_10px_28px_-6px_var(--brand-glow)] transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isCreating ? t('prayerComposerSubmitting') : t('prayerComposerSubmit')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default PrayerComposer
