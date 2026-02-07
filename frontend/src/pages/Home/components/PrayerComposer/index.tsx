import BibleVersesModal from '../BibleVersesModal'
import PrayerComposerHeader from './PrayerComposerHeader'
import UserInfoSection from './UserInfoSection'
import CategoryBadge from './CategoryBadge'
import ContentCard from './ContentCard'
import ErrorMessage from './ErrorMessage'
import PrivacyNotice from './PrivacyNotice'
import { usePrayerComposer } from './usePrayerComposer'
import type { PrayerComposerProps } from './types'

const PrayerComposer = ({ onClose, onSuccess, sort = 'popular' }: PrayerComposerProps) => {
  const {
    title,
    content,
    isAnonymous,
    error,
    recommendedVerses,
    showVersesModal,
    isCreating,
    isLoggedIn,
    displayName,
    setTitle,
    setContent,
    setIsAnonymous,
    handleSubmit,
    handleVersesModalClose,
  } = usePrayerComposer({ onClose, onSuccess, sort })

  const canSubmit = title.trim() && content.trim()

  return (
    <>
      {/* 성경 구절 모달 */}
      {showVersesModal && recommendedVerses && (
        <BibleVersesModal
          verses={recommendedVerses}
          onClose={handleVersesModalClose}
        />
      )}

      {/* 기도 작성 모달 */}
      <div 
        className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 overflow-hidden"
        onClick={onClose}
      >
        <div 
          className="bg-background-light dark:bg-background-dark rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl overflow-x-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <PrayerComposerHeader onClose={onClose} />

          <form onSubmit={handleSubmit} className="p-4 overflow-x-hidden">
            <UserInfoSection
              displayName={displayName}
              isLoggedIn={isLoggedIn}
              isAnonymous={isAnonymous}
              isCreating={isCreating}
              canSubmit={!!canSubmit}
              onAnonymousChange={setIsAnonymous}
              onSubmit={handleSubmit}
            />

            <CategoryBadge />

            <ContentCard
              title={title}
              content={content}
              onTitleChange={setTitle}
              onContentChange={setContent}
            />

            <ErrorMessage error={error} />

            <PrivacyNotice isAnonymous={isAnonymous} />
          </form>
        </div>
      </div>
    </>
  )
}

export default PrayerComposer
