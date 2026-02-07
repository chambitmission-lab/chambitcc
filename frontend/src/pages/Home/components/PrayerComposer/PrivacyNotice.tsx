import { useLanguage } from '../../../../contexts/LanguageContext'

interface PrivacyNoticeProps {
  isAnonymous: boolean
}

const PrivacyNotice = ({ isAnonymous }: PrivacyNoticeProps) => {
  const { t } = useLanguage()
  
  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-lg p-3 border border-border-light dark:border-border-dark">
      <div className="flex items-start gap-2">
        <span className="material-icons-outlined text-gray-500 text-lg">
          {isAnonymous ? 'lock' : 'visibility'}
        </span>
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            {isAnonymous ? t('anonymousNotice') : t('realNameNotice')}
          </p>
        </div>
      </div>
    </div>
  )
}

export default PrivacyNotice
