// 다국어 지원 메인 파일
import { ko } from './ko'
import { en } from './en'

export type Language = 'ko' | 'en'

export const translations = {
  ko,
  en,
} as const

// 브라우저 언어 감지
export const detectLanguage = (): Language => {
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith('ko')) return 'ko'
  return 'en'
}

// 로컬 스토리지에서 언어 가져오기
export const getStoredLanguage = (): Language => {
  const stored = localStorage.getItem('language') as Language
  return stored || detectLanguage()
}

// 로컬 스토리지에 언어 저장
export const setStoredLanguage = (lang: Language): void => {
  localStorage.setItem('language', lang)
}
