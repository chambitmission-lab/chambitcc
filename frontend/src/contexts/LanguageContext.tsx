import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { Language } from '../utils/i18n'
import { translations, getStoredLanguage, setStoredLanguage } from '../utils/i18n'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: keyof typeof translations.ko) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(getStoredLanguage())

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    setStoredLanguage(lang)
  }

  const t = (key: keyof typeof translations.ko): string => {
    return translations[language][key] || translations.ko[key] || key
  }

  useEffect(() => {
    // HTML lang 속성 업데이트
    document.documentElement.lang = language
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
