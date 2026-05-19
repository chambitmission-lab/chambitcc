import { useLanguage } from '../../../../contexts/LanguageContext'

interface PrivacyNoticeProps {
  isAnonymous: boolean
}

const PrivacyNotice = ({ isAnonymous }: PrivacyNoticeProps) => {
  const { t } = useLanguage()
  
  return (
    <div className="mt-4 mb-4 bg-purple-500/[0.04] dark:bg-purple-500/[0.08] rounded-xl p-3.5 border border-purple-500/10 dark:border-purple-500/15">
      <div className="flex items-start gap-2.5">
        <span className="material-icons-outlined text-purple-600 dark:text-purple-300 text-[20px] mt-px">
          {isAnonymous ? 'lock' : 'visibility'}
        </span>
        <p className="text-[12px] text-gray-600 dark:text-gray-300 leading-[1.6] flex-1">
          {isAnonymous ? t('anonymousNotice') : t('realNameNotice')}
        </p>
      </div>
    </div>
  )
}

export default PrivacyNotice
