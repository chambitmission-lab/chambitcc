import { useLanguage } from '../../contexts/LanguageContext'
import LangFlag from './LangFlag'

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage()

  return (
    <button
      onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      title={language === 'ko' ? 'Switch to English' : '한국어로 전환'}
    >
      <LangFlag code={language === 'ko' ? 'us' : 'kr'} className="text-base rounded-[2px]" />
      <span>{language === 'ko' ? 'EN' : '한글'}</span>
    </button>
  )
}

export default LanguageSwitcher
