import { useLanguage } from '../../../../contexts/LanguageContext'

interface UserInfoSectionProps {
  displayName: string
  avatarUrl?: string | null
  isLoggedIn: boolean
  isAnonymous: boolean
  onAnonymousChange: (checked: boolean) => void
}

const UserInfoSection = ({
  displayName,
  avatarUrl = null,
  isLoggedIn,
  isAnonymous,
  onAnonymousChange,
}: UserInfoSectionProps) => {
  const { t } = useLanguage()

  return (
    <div className="mb-5">
      <div className="flex items-center gap-3 mb-3">
        {isAnonymous ? (
          /* 골방 기도자 — 피드 익명 아바타와 동일한 뉴트럴 처리 (마 6:6) */
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center text-gray-400 dark:text-gray-500 shadow-[0_0_0_1.5px_var(--brand-soft-strong)]">
            <span className="material-icons-outlined text-[20px]">person</span>
          </div>
        ) : (
          <div className="relative">
            {/* 브랜드 블루 글로우 한 겹 — 카드/도크와 동일 액센트 */}
            <div className="absolute inset-0 rounded-full bg-[var(--brand-glow)] blur-md" />

            {avatarUrl ? (
              /* 프로필 사진 아바타 */
              <img
                src={avatarUrl}
                alt=""
                className="relative z-10 w-10 h-10 rounded-full object-cover shadow-[0_4px_12px_var(--brand-glow)]"
              />
            ) : (
              /* 사진 미등록 시 이니셜 아바타 — 브랜드 플랫 솔리드 */
              <div className="relative z-10 w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white text-sm font-bold shadow-[0_4px_12px_var(--brand-glow),inset_0_1px_0_rgba(255,255,255,0.25)]">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}
        <div className="flex-1">
          <span
            className={`text-[15px] tracking-[-0.015em] ${
              isAnonymous
                ? 'font-medium text-gray-500 dark:text-gray-400'
                : 'font-bold text-gray-900 dark:text-white'
            }`}
          >
            {isAnonymous ? t('anonymousDisplayName') : displayName}
          </span>
        </div>
      </div>

      {/* Anonymous Toggle */}
      {isLoggedIn && (
        <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--brand-soft)] cursor-pointer hover:bg-[var(--brand-soft-strong)] transition-colors">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => onAnonymousChange(e.target.checked)}
            className="w-4 h-4 accent-[var(--brand)] cursor-pointer"
          />
          <span className="text-[12px] font-medium text-brand">
            {t('prayerComposerAnonymous')}
          </span>
        </label>
      )}
    </div>
  )
}

export default UserInfoSection
