import { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { Language } from '../locales'
import { translations, getStoredLanguage, setStoredLanguage } from '../locales'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: keyof typeof translations.ko) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // 지연 초기화 — localStorage 읽기를 첫 렌더 한 번만 수행
  const [language, setLanguageState] = useState<Language>(() => getStoredLanguage())

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    setStoredLanguage(lang)
  }, [])

  const t = useCallback(
    (key: keyof typeof translations.ko): string => {
      const value = translations[language][key] || translations.ko[key] || key
      return typeof value === 'string' ? value : String(key)
    },
    [language],
  )

  useEffect(() => {
    // HTML lang 속성 업데이트
    document.documentElement.lang = language
  }, [language])

  // value 객체를 language 변경 시에만 재생성 — 소비자 불필요 재렌더 방지
  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t])

  return (
    <LanguageContext.Provider value={value}>
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
