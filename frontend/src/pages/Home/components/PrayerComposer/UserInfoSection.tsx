import { useLanguage } from '../../../../contexts/LanguageContext'

interface UserInfoSectionProps {
  displayName: string
  isLoggedIn: boolean
  isAnonymous: boolean
  onAnonymousChange: (checked: boolean) => void
}

const UserInfoSection = ({
  displayName,
  isLoggedIn,
  isAnonymous,
  onAnonymousChange,
}: UserInfoSectionProps) => {
  const { t } = useLanguage()

  return (
    <div className="mb-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="relative">
          {/* 보랏빛 글로우 한 겹 — 카드/도크와 동일 액센트 */}
          <div className="absolute inset-0 rounded-full bg-purple-500/30 dark:bg-purple-500/25 blur-md" />

          {/* 아바타 본체 — purple→pink 그라데이션 */}
          <div className="relative z-10 w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow-[0_4px_12px_rgba(168,85,247,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="flex-1">
          <span className="text-[15px] font-bold tracking-[-0.015em] text-gray-900 dark:text-white">
            {displayName}
          </span>
        </div>
      </div>

      {/* Anonymous Toggle */}
      {isLoggedIn && (
        <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/[0.06] dark:bg-purple-500/10 cursor-pointer hover:bg-purple-500/[0.10] dark:hover:bg-purple-500/15 transition-colors">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => onAnonymousChange(e.target.checked)}
            className="w-4 h-4 accent-purple-500 cursor-pointer"
          />
          <span className="text-[12px] font-medium text-purple-700 dark:text-purple-300">
            {t('prayerComposerAnonymous')}
          </span>
        </label>
      )}
    </div>
  )
}

export default UserInfoSection
