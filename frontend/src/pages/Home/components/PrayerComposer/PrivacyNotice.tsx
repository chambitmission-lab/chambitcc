import { useLanguage } from '../../../../contexts/LanguageContext'

interface PrivacyNoticeProps {
  isAnonymous: boolean
}

const PrivacyNotice = ({ isAnonymous }: PrivacyNoticeProps) => {
  const { t } = useLanguage()
  
  return (
    <div className="mt-4 mb-4 bg-[var(--brand-soft)] rounded-xl p-3.5 border border-[var(--brand-soft-strong)]">
      <div className="flex items-start gap-2.5">
        <span className="material-icons-outlined text-brand text-[20px] mt-px">
          {isAnonymous ? 'lock' : 'visibility'}
        </span>
        <p className="text-[12px] text-gray-600 dark:text-gray-300 leading-[1.6] flex-1 break-keep">
          {isAnonymous ? t('anonymousNotice') : t('realNameNotice')}
        </p>
      </div>
    </div>
  )
}

export default PrivacyNotice
