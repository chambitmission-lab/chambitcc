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
    setTitle,
    setContent,
    setIsAnonymous,
    setSelectedGroupId,
    setEmotion,
    handleSubmit,
    handleVersesModalClose,
  } = usePrayerComposer({ onClose, onSuccess, sort, groupId })  // ✅ groupId 전달

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
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 overflow-hidden"
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
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 text-white font-bold text-sm rounded-full shadow-lg shadow-purple-500/30 dark:shadow-purple-900/30 hover:shadow-xl hover:shadow-purple-500/40 dark:hover:shadow-purple-900/40 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
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
