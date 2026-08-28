import { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { Language } from '../locales'
import { translations, getStoredLanguage, setStoredLanguage, loadTranslation, isTranslationLoaded } from '../locales'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: keyof typeof translations.ko) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// 영어 사용자는 첫 렌더와 병렬로 사전을 받기 시작한다 (effect 까지 기다리면 한 박자 늦다)
if (typeof window !== 'undefined' && getStoredLanguage() === 'en') void loadTranslation('en')

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // 지연 초기화 — localStorage 읽기를 첫 렌더 한 번만 수행
  const [language, setLanguageState] = useState<Language>(() => getStoredLanguage())

  // 영어 사전은 지연 로드 — 도착하면 이 카운터를 올려 컨텍스트 소비자를 한 번 재렌더한다
  // (`translations[language]` 를 직접 읽는 컴포넌트도 컨텍스트를 구독하므로 함께 갱신된다)
  const [dictVersion, setDictVersion] = useState(0)

  const ensureLoaded = useCallback((lang: Language) => {
    if (isTranslationLoaded(lang)) return
    void loadTranslation(lang).then(() => {
      if (isTranslationLoaded(lang)) setDictVersion((v) => v + 1)
    })
  }, [])

  useEffect(() => {
    ensureLoaded(language)
  }, [language, ensureLoaded])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    setStoredLanguage(lang)
  }, [])

  const t = useCallback(
    (key: keyof typeof translations.ko): string => {
      const value = translations[language][key] || translations.ko[key] || key
      return typeof value === 'string' ? value : String(key)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dictVersion: 사전 교체 시 재생성
    [language, dictVersion],
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
